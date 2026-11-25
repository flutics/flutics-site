import type { DemoManifest, DemoRow, ManifestAction } from './types';

export function applyBulkUpdate(action: ManifestAction, rows: DemoRow[]): DemoRow[] {
  if (action.kind !== 'bulk_update' || !action.field) return rows;
  const field = action.field;
  const value = action.value ?? '';
  return rows.map((row) => {
    if (action.filter) {
      const current = String(row[action.filter.field] ?? '');
      if (current !== action.filter.equals) return row;
    }
    return { ...row, [field]: value };
  });
}

export function rowsToCsv(manifest: DemoManifest, rows: DemoRow[]): string {
  const cols = manifest.table.columns;
  const header = cols.map((c) => csvCell(c.label)).join(',');
  const body = rows
    .map((row) => cols.map((c) => csvCell(String(row[c.key] ?? ''))).join(','))
    .join('\n');
  return `${header}\n${body}\n`;
}

function csvCell(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function emptyRow(manifest: DemoManifest): DemoRow {
  const row: DemoRow = {};
  for (const col of manifest.table.columns) {
    if (col.type === 'number') row[col.key] = 0;
    else if (col.type === 'enum' && col.values?.length) row[col.key] = col.values[0];
    else row[col.key] = '';
  }
  return row;
}

export function coerceRow(manifest: DemoManifest, draft: DemoRow): DemoRow {
  const out: DemoRow = {};
  for (const col of manifest.table.columns) {
    const raw = draft[col.key];
    if (col.type === 'number') {
      const n = typeof raw === 'number' ? raw : Number(raw);
      out[col.key] = Number.isFinite(n) ? n : 0;
    } else {
      out[col.key] = raw == null ? '' : String(raw);
    }
  }
  return out;
}

export function validateRow(manifest: DemoManifest, row: DemoRow): string | null {
  for (const col of manifest.table.columns) {
    const v = row[col.key];
    if (col.required && (v === '' || v === undefined || v === null)) {
      return `${col.label} is required.`;
    }
    if (col.type === 'enum' && col.values && v !== '' && !col.values.includes(String(v))) {
      return `${col.label} must be one of: ${col.values.join(', ')}`;
    }
  }
  return null;
}