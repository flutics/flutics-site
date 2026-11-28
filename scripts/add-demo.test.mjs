import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { addDemo } from './add-demo.mjs';

test('adds the demo without replacing the site page', () => {
  const root = mkdtempSync(join(tmpdir(), 'flutics-'));
  const [demo, www] = [join(root, 'demo'), join(root, 'www')];
  for (const dir of ['assets', 'apps', 'tc']) mkdirSync(join(demo, dir), { recursive: true });
  mkdirSync(www);
  writeFileSync(join(demo, 'index.html'), 'demo');
  writeFileSync(join(www, 'index.html'), 'site');
  addDemo(demo, www);
  assert.equal(readFileSync(join(www, 'demo.html'), 'utf8'), 'demo');
  assert.equal(readFileSync(join(www, 'index.html'), 'utf8'), 'site');
  rmSync(root, { recursive: true });
});

test('demo routes are matched before the site fallback', () => {
  const rules = readFileSync(new URL('../public/_redirects', import.meta.url), 'utf8');
  const demo = rules.indexOf('/w/*');
  assert.ok(demo >= 0 && demo < rules.indexOf('\n/*'));
});
