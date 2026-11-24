import type { PGlite } from '@electric-sql/pglite';
import schemaSql from './schema.sql?raw';
import seedSql from './seed.sql?raw';

async function loadPGlite() {
  const mod = await import('@electric-sql/pglite');
  return mod.PGlite;
}

export const SCHEMA_VERSION = '4';
const IDB_NAME = 'idb://flutics-demo';

let dbPromise: Promise<PGlite> | null = null;
const listeners = new Set<() => void>();

export function subscribeDb(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function notifyDb() {
  for (const fn of listeners) fn();
}

async function currentVersion(db: PGlite): Promise<string | null> {
  try {
    const r = await db.query<{ v: string }>(
      "select v from demo.meta where k = 'schema_version'",
    );
    return r.rows[0]?.v ?? null;
  } catch {
    return null;
  }
}

async function migrateAndSeed(db: PGlite) {
  await db.exec(`
    drop schema if exists billing cascade;
    drop schema if exists inventory cascade;
    drop schema if exists sales cascade;
    drop schema if exists demo cascade;
  `);
  await db.exec(schemaSql);
  await db.exec(seedSql);
}

export function getDb(): Promise<PGlite> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const PGlite = await loadPGlite();
      const db = new PGlite(IDB_NAME);
      await db.waitReady;
      const v = await currentVersion(db);
      if (v !== SCHEMA_VERSION) {
        await migrateAndSeed(db);
      }
      return db;
    })();
  }
  return dbPromise;
}

export async function resetDemo(): Promise<void> {
  const db = await getDb();
  await migrateAndSeed(db);
  notifyDb();
}

export type Row = Record<string, unknown>;

export async function query<T extends Row = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  const db = await getDb();
  const r = await db.query<T>(sql, params);
  return r.rows;
}

export async function exec(sql: string, params: unknown[] = []) {
  const db = await getDb();
  return db.query(sql, params);
}
