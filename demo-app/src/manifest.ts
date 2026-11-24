import { parse as parseYaml } from 'yaml';
import type { PGlite } from '@electric-sql/pglite';
import { APPS, schemaName } from './constants';

export type Manifest = {
  name: string;
  slug: string;
  version: string;
  description?: string;
  category?: string;
  color?: string;
  tables?: Record<string, any>;
  queries?: { id: string; sql: string; args?: Record<string, any> }[];
  actions?: { id: string; kind: string; table?: string; key?: string[]; args?: Record<string, any>; sql?: string }[];
  raw: string;
};

const files = import.meta.glob('../apps/*/meadow.yaml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export function loadManifests(): Manifest[] {
  return APPS.map((meta) => {
    const key = Object.keys(files).find((k) => k.includes(`/${meta.slug}/`));
    if (!key) throw new Error(`Missing manifest for ${meta.slug}`);
    const raw = files[key];
    const doc = parseYaml(raw) as Manifest;
    return { ...doc, raw };
  });
}

export function manifestFor(slug: string) {
  const m = loadManifests().find((x) => x.slug === slug);
  if (!m) throw new Error(`Unknown app ${slug}`);
  return m;
}

function sqlType(spec: any): string {
  const t = typeof spec === 'string' ? spec : spec?.type || 'text';
  if (t === 'user' || t === 'ref') return 'uuid';
  if (t === 'enum') return 'text';
  if (t === 'int') return 'integer';
  if (t === 'bool' || t === 'boolean') return 'boolean';
  if (t === 'date') return 'date';
  if (t === 'timestamp') return 'timestamptz';
  return t;
}

function colDefault(spec: any): string {
  const d = typeof spec === 'object' ? spec?.default : undefined;
  if (d === '$user_id') return 'default public.current_user_id()';
  if (d != null && d !== '') return `default ${typeof d === 'string' && !/^[0-9.-]+$/.test(d) ? `'${String(d).replace(/'/g, "''")}'` : d}`;
  return '';
}

export async function applyManifestSchema(db: PGlite, m: Manifest) {
  const schema = schemaName(m.slug);
  await db.exec(`create schema if not exists ${schema}`);
  await db.exec(`create or replace view ${schema}.meadow_users as select id, name, email from public.demo_users`);
  for (const [table, def] of Object.entries(m.tables || {})) {
    const cols: string[] = [
      'id uuid primary key default gen_random_uuid()',
      'created_at timestamptz not null default now()',
      'created_by uuid default public.current_user_id()',
      'updated_at timestamptz not null default now()',
      'updated_by uuid',
      'deleted_at timestamptz',
      'deleted_by uuid',
    ];
    for (const [name, spec] of Object.entries((def as any).columns || {})) {
      const req = typeof spec === 'object' && (spec as any).required ? ' not null' : '';
      cols.push(`"${name}" ${sqlType(spec)}${req} ${colDefault(spec)}`.trim());
    }
    await db.exec(`create table if not exists ${schema}."${table}" (${cols.join(', ')})`);
  }
}
