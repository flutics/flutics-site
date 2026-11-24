import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  _resetSettingsRegistryForTest,
  findSettingsPage,
  registerSettingsPage,
  settingsPages,
  type SettingsCtx,
} from './registry.ts';

const memberCtx: SettingsCtx = {
  can: () => false,
  me: { user: {}, workspaces: [], prefs: {}, can_create_workspace: false, instance_admin: false, content_url: '', toolchain: '' },
  ws: { id: '1', slug: 'w', name: 'W', org: 'O', members: 1, groups: 0, apps: 0 },
};

const wsAdminCtx: SettingsCtx = {
  ...memberCtx,
  can: (p) => p === 'workspaces:update',
};

const instCtx: SettingsCtx = {
  ...wsAdminCtx,
  me: { ...wsAdminCtx.me, instance_admin: true },
};

describe('settings registry', () => {
  it('clears between tests', () => {
    _resetSettingsRegistryForTest();
    registerSettingsPage({
      section: 'account',
      key: 'x',
      label: 'X',
      order: 10,
      visible: () => true,
      element: () => null as any,
    });
    assert.throws(() =>
      registerSettingsPage({
        section: 'account',
        key: 'x',
        label: 'X2',
        order: 20,
        visible: () => true,
        element: () => null as any,
      }),
    );
  });

  it('section visibility by role', () => {
    _resetSettingsRegistryForTest();
    registerSettingsPage({ section: 'account', key: 'a', label: 'A', order: 10, visible: () => true, element: () => null as any });
    registerSettingsPage({ section: 'workspace', key: 'w', label: 'W', order: 10, visible: () => true, element: () => null as any });
    registerSettingsPage({ section: 'instance', key: 'i', label: 'I', order: 10, visible: () => true, element: () => null as any });
    assert.equal(settingsPages(memberCtx).account.length, 1);
    assert.equal(settingsPages(memberCtx).workspace.length, 0);
    assert.equal(settingsPages(wsAdminCtx).workspace.length, 1);
    assert.equal(settingsPages(wsAdminCtx).instance.length, 0);
    assert.equal(settingsPages(instCtx).instance.length, 1);
  });

  it('page visible cannot widen section', () => {
    _resetSettingsRegistryForTest();
    registerSettingsPage({
      section: 'workspace',
      key: 'hidden',
      label: 'Hidden',
      order: 10,
      visible: () => true,
      element: () => null as any,
    });
    registerSettingsPage({
      section: 'instance',
      key: 'sneak',
      label: 'Sneak',
      order: 10,
      visible: () => true,
      element: () => null as any,
    });
    assert.equal(findSettingsPage(wsAdminCtx, 'instance', 'sneak'), undefined);
  });

  it('page modules self-register via settings index glob contract', () => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const indexSrc = readFileSync(join(dir, 'index.ts'), 'utf8');
    assert.match(indexSrc, /import\.meta\.glob\('\.\/pages\/\*\.tsx'/);
    const pages = readdirSync(join(dir, 'pages')).filter((f) => f.endsWith('.tsx'));
    assert.ok(pages.length >= 4, 'expected settings page modules');
    const connectionsSrc = readFileSync(join(dir, 'pages', 'connections.tsx'), 'utf8');
    assert.match(connectionsSrc, /legacy:\s*\['connections'\]/);
    assert.match(connectionsSrc, /registerSettingsPage\(/);
  });
});
