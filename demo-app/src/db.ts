import { PGlite } from '@electric-sql/pglite';
import { IDB, SCHEMA_VERSION, USER } from './constants';
import { applyManifestSchema, loadManifests } from './manifest';
import { seedAll } from './seed';

let db: PGlite | null = null;
let ready: Promise<PGlite> | null = null;
const listeners = new Set<() => void>();

export function onDbChange(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notifyDb() {
  for (const fn of listeners) fn();
}

async function bootstrap(client: PGlite) {
  await client.exec(`
    create schema if not exists demo;
    create table if not exists demo.meta (k text primary key, v text);
    create or replace function public.current_user_id() returns uuid
      language sql as $$ select nullif(current_setting('app.user_id', true), '')::uuid $$;
    create schema if not exists meadow_rt;
    create or replace function meadow_rt.current_user_id() returns uuid
      language sql as $$ select public.current_user_id() $$;
    create table if not exists public.demo_users (
      id uuid primary key, name text not null, email text not null, kind text
    );
  `);
  const row = await client.query<{ v: string }>("select v from demo.meta where k = 'schema_version'");
  const v = row.rows[0]?.v;
  if (v !== SCHEMA_VERSION) {
    await resetDb(client);
  }
}

export async function resetDb(client?: PGlite) {
  const c = client ?? (await getDb());
  await c.exec(`
    drop schema if exists sales_crm cascade;
    drop schema if exists inventory cascade;
    drop schema if exists billing cascade;
    drop schema if exists demo cascade;
    create schema demo;
    create table demo.meta (k text primary key, v text);
    delete from public.demo_users;
  `);
  const manifests = await loadManifests();
  for (const m of manifests) {
    await applyManifestSchema(c, m);
  }
  await seedAll(c);
  await c.query("insert into demo.meta(k, v) values ('schema_version', $1)", [SCHEMA_VERSION]);
  notifyDb();
}

export function getDb(): Promise<PGlite> {
  if (db) return Promise.resolve(db);
  if (!ready) {
    ready = (async () => {
      const client = new PGlite(IDB);
      await client.waitReady;
      await bootstrap(client);
      db = client;
      return client;
    })();
  }
  return ready;
}

export async function withUser<T>(fn: (c: PGlite) => Promise<T>, userId = USER.id): Promise<T> {
  const c = await getDb();
  await c.query("select set_config('app.user_id', $1, false)", [userId]);
  return fn(c);
}
