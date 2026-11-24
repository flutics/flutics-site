import type { PGlite } from '@electric-sql/pglite';
import { USER, schemaName } from './constants';
import type { Manifest } from './manifest';

function pgCast(spec: any, value: unknown) {
  const t = String(spec?.type || spec?.ref || '');
  if (t === 'int' || t === 'integer') return 'integer';
  if (t === 'user' || t === 'ref' || t === 'uuid') return 'uuid';
  if (t.startsWith('numeric') || t === 'number') return 'numeric';
  if (t === 'date') return 'date';
  if (t === 'timestamp') return 'timestamptz';
  if (t === 'bool' || t === 'boolean') return 'boolean';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'numeric';
  return 'text';
}

function bindNamed(sql: string, args: Record<string, unknown>, argSpecs: Record<string, any> = {}) {
  const names: string[] = [];
  const text = sql.replace(/(?<!:):([A-Za-z_][A-Za-z0-9_]*)/g, (_m, name: string) => {
    if (!names.includes(name)) names.push(name);
    const i = names.indexOf(name) + 1;
    const value = name in args ? args[name] : null;
    return `$${i}::${pgCast(argSpecs[name], value)}`;
  });
  return { text, values: names.map((n) => (n in args ? args[n] : null)) };
}

export async function runQuery(db: PGlite, manifest: Manifest, id: string, rawArgs: Record<string, unknown> | undefined) {
  const q = manifest.queries?.find((x) => x.id === id);
  if (!q) {
    const err: any = new Error(`Unknown query ${id}`);
    err.status = 404;
    throw err;
  }
  const args: Record<string, unknown> = { ...(rawArgs || {}) };
  for (const [name, spec] of Object.entries(q.args || {})) {
    if (spec?.source === 'session' && (name === 'user_id' || spec?.type === 'user')) {
      args[name] = USER.id;
    }
    if (args[name] === undefined) args[name] = null;
  }
  const { text, values } = bindNamed(q.sql, args, q.args || {});
  const started = performance.now();
  const schema = schemaName(manifest.slug);
  await db.exec(`set search_path to ${schema}, public`);
  const res = await db.query(text, values);
  const ms = Math.round(performance.now() - started);
  const columns = (res.fields || []).map((f: any) => ({ name: f.name, type: f.dataTypeID }));
  return { columns, rows: res.rows, row_count: res.rows.length, ms };
}

export async function runAction(db: PGlite, manifest: Manifest, id: string, rawArgs: Record<string, unknown> | undefined) {
  const a = manifest.actions?.find((x) => x.id === id);
  if (!a) {
    const err: any = new Error(`Unknown action ${id}`);
    err.status = 404;
    throw err;
  }
  const args: Record<string, unknown> = { ...(rawArgs || {}) };
  const schema = schemaName(manifest.slug);
  await db.exec(`set search_path to ${schema}, public`);
  const started = performance.now();

  if (a.kind === 'sql' && a.sql) {
    const statements = a.sql.split(';').map((s) => s.trim()).filter(Boolean);
    let last: any = { rows: [], row_count: 0 };
    for (const stmt of statements) {
      const { text, values } = bindNamed(stmt, args, a.args || {});
      last = await db.query(text, values);
    }
    return { rows: last.rows || [], row_count: last.rows?.length ?? 0, ms: Math.round(performance.now() - started) };
  }

  if (!a.table) throw new Error(`Action ${id} is missing a table`);
  const table = a.table;
  const keys = Object.keys(args).filter((k) => args[k] !== undefined);

  if (a.kind === 'insert_data') {
    const cols = keys.filter((k) => k !== 'id');
    const id = (args.id as string) || crypto.randomUUID();
    const names = ['id', ...cols];
    const values = [id, ...cols.map((k) => args[k])];
    const placeholders = names.map((_, i) => `$${i + 1}`);
    const res = await db.query(
      `insert into ${schema}."${table}" (${names.map((n) => `"${n}"`).join(',')}) values (${placeholders.join(',')})
       returning *`,
      values,
    );
    return { id, row: res.rows[0], rows: res.rows, row_count: 1, ms: Math.round(performance.now() - started) };
  }

  if (a.kind === 'merge_data') {
    const keyCols = a.key || ['id'];
    const updates = keys.filter((k) => !keyCols.includes(k));
    if (!updates.length) return { rows: [], row_count: 0, ms: 0 };
    const set = updates.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const where = keyCols.map((k, i) => `"${k}" = $${updates.length + i + 1}`).join(' and ');
    const values = [...updates.map((k) => args[k]), ...keyCols.map((k) => args[k])];
    const res = await db.query(
      `update ${schema}."${table}" set ${set}, updated_at = now(), updated_by = public.current_user_id() where ${where} returning *`,
      values,
    );
    return { rows: res.rows, row_count: res.rows.length, ms: Math.round(performance.now() - started) };
  }

  if (a.kind === 'delete_data') {
    const keyCols = a.key || ['id'];
    const where = keyCols.map((k, i) => `"${k}" = $${i + 1}`).join(' and ');
    const values = keyCols.map((k) => args[k]);
    const res = await db.query(
      `update ${schema}."${table}" set deleted_at = now(), deleted_by = public.current_user_id() where ${where} returning id`,
      values,
    );
    return { rows: res.rows, row_count: res.rows.length, ms: Math.round(performance.now() - started) };
  }

  throw new Error(`Action kind ${a.kind} is not available in the demo`);
}
