import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)));

describe('app shell chrome', () => {
  it('AppView does not render the per-app toolbar', () => {
    const src = readFileSync(join(root, 'appview.tsx'), 'utf8');
    assert.equal(src.includes('className="appbar"'), false);
    assert.equal(src.includes('appbar-more'), false);
  });

  it('focus shell omits the desktop top bar class', () => {
    const css = readFileSync(join(root, 'styles.css'), 'utf8');
    assert.match(css, /\.mk\.focus \.top/);
  });

  it('app menu and palette keep pin, manifest, reload, and focus actions', () => {
    const menu = readFileSync(join(root, 'appmenu.tsx'), 'utf8');
    const palette = readFileSync(join(root, 'palette.tsx'), 'utf8');
    for (const k of ['pin', 'manifest', 'reload', 'focus', 'exit-focus']) {
      assert.ok(menu.includes(`'${k}'`), `appmenu missing ${k}`);
    }
    assert.ok(palette.includes('chrome.reload()'));
    assert.ok(palette.includes('chrome.openManifest()'));
    assert.ok(palette.includes('Exit focus mode'));
  });
});
