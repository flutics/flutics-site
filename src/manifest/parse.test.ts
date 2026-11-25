import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyBulkUpdate, rowsToCsv, validateRow } from './actions.ts';
import { DEFAULT_MANIFEST_YAML, DEFAULT_SEED_ROWS } from './defaultYaml.ts';
import { parseManifestYaml } from './parse.ts';

describe('parseManifestYaml', () => {
  it('parses the default sample CRM manifest', () => {
    const r = parseManifestYaml(DEFAULT_MANIFEST_YAML);
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.manifest.name, 'Sample CRM');
    assert.equal(r.manifest.table.columns.length, 4);
    assert.equal(r.manifest.actions.length, 2);
  });

  it('surfaces YAML and schema errors', () => {
    const bad = parseManifestYaml('manifest: 2\nname: x\ntable: {}');
    assert.equal(bad.ok, false);
    if (bad.ok) return;
    assert.match(bad.error, /manifest/);
  });
});

describe('manifest-driven UI', () => {
  it('applies bulk_update actions from the manifest', () => {
    const parsed = parseManifestYaml(DEFAULT_MANIFEST_YAML);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    const action = parsed.manifest.actions.find((a) => a.id === 'qualify_leads');
    assert.ok(action);
    const next = applyBulkUpdate(action!, [...DEFAULT_SEED_ROWS]);
    const bright = next.find((r) => r.name === 'Bright Harbor Labs');
    assert.equal(bright?.stage, 'qualified');
    const alder = next.find((r) => r.name === 'Alder Light Co.');
    assert.equal(alder?.stage, 'customer');
  });

  it('renders CSV from manifest columns', () => {
    const parsed = parseManifestYaml(DEFAULT_MANIFEST_YAML);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    const csv = rowsToCsv(parsed.manifest, DEFAULT_SEED_ROWS);
    assert.match(csv, /^Name,Email,Stage/);
    assert.match(csv, /Alder Light Co/);
  });

  it('validates required fields', () => {
    const parsed = parseManifestYaml(DEFAULT_MANIFEST_YAML);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    const err = validateRow(parsed.manifest, { name: '', email: 'a@b.c', stage: 'lead', value: 1 });
    assert.match(err ?? '', /Name is required/);
  });
});