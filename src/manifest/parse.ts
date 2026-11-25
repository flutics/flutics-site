import { parse as parseYaml } from 'yaml';
import type { ColumnType, DemoManifest, ManifestAction, ManifestColumn } from './types';

const COLUMN_TYPES = new Set<ColumnType>(['text', 'email', 'number', 'enum']);
const ACTION_KINDS = new Set<ManifestAction['kind']>(['bulk_update', 'export_csv']);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function asString(v: unknown, path: string): string {
  if (typeof v !== 'string' || !v.trim()) throw new Error(`${path}: expected a non-empty string`);
  return v.trim();
}

function parseColumn(raw: unknown, path: string): ManifestColumn {
  if (!isRecord(raw)) throw new Error(`${path}: expected a column object`);
  const key = asString(raw.key, `${path}.key`);
  if (!/^[a-z][a-z0-9_]*$/.test(key)) throw new Error(`${path}.key: use lowercase letters, digits, underscores`);
  const label = asString(raw.label, `${path}.label`);
  const type = asString(raw.type, `${path}.type`) as ColumnType;
  if (!COLUMN_TYPES.has(type)) throw new Error(`${path}.type: must be text, email, number, or enum`);
  const col: ManifestColumn = { key, label, type };
  if (raw.required === true) col.required = true;
  if (type === 'enum') {
    if (!Array.isArray(raw.values) || raw.values.length === 0) {
      throw new Error(`${path}.values: enum columns need at least one value`);
    }
    col.values = raw.values.map((v, i) => asString(v, `${path}.values[${i}]`));
  }
  return col;
}

function parseAction(raw: unknown, path: string): ManifestAction {
  if (!isRecord(raw)) throw new Error(`${path}: expected an action object`);
  const id = asString(raw.id, `${path}.id`);
  const label = asString(raw.label, `${path}.label`);
  const kind = asString(raw.kind, `${path}.kind`) as ManifestAction['kind'];
  if (!ACTION_KINDS.has(kind)) throw new Error(`${path}.kind: must be bulk_update or export_csv`);
  const action: ManifestAction = { id, label, kind };
  if (kind === 'bulk_update') {
    action.field = asString(raw.field, `${path}.field`);
    if (raw.value === undefined || raw.value === null) throw new Error(`${path}.value: required for bulk_update`);
    action.value = typeof raw.value === 'number' ? raw.value : asString(raw.value, `${path}.value`);
    if (isRecord(raw.filter)) {
      action.filter = {
        field: asString(raw.filter.field, `${path}.filter.field`),
        equals: asString(raw.filter.equals, `${path}.filter.equals`),
      };
    }
  }
  return action;
}

export function validateManifestDoc(doc: unknown): DemoManifest {
  if (!isRecord(doc)) throw new Error('Root must be a YAML mapping');
  const manifest = doc.manifest;
  if (manifest !== 1) throw new Error('manifest: must be 1');
  const name = asString(doc.name, 'name');
  const description = doc.description == null ? undefined : asString(doc.description, 'description');
  if (!isRecord(doc.table)) throw new Error('table: expected a mapping');
  const tableId = asString(doc.table.id, 'table.id');
  const tableLabel = asString(doc.table.label, 'table.label');
  if (!Array.isArray(doc.table.columns) || doc.table.columns.length === 0) {
    throw new Error('table.columns: need at least one column');
  }
  const columns = doc.table.columns.map((c, i) => parseColumn(c, `table.columns[${i}]`));
  const keys = new Set<string>();
  for (const c of columns) {
    if (keys.has(c.key)) throw new Error(`table.columns: duplicate key "${c.key}"`);
    keys.add(c.key);
  }
  const actionsRaw = doc.actions;
  const actions = Array.isArray(actionsRaw)
    ? actionsRaw.map((a, i) => parseAction(a, `actions[${i}]`))
    : [];
  return {
    manifest: 1,
    name,
    description,
    table: { id: tableId, label: tableLabel, columns },
    actions,
  };
}

export function parseManifestYaml(text: string):
  | { ok: true; manifest: DemoManifest }
  | { ok: false; error: string } {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: 'Manifest is empty.' };
  try {
    const doc = parseYaml(text);
    return { ok: true, manifest: validateManifestDoc(doc) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}