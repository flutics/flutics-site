import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { settingsPagePath } from './paths.ts';
import {
  _resetSettingsRegistryForTest,
  registerSettingsPage,
  settingsLegacyTabRedirect,
  settingsUnknownPageRedirect,
  type SettingsCtx,
} from './registry.ts';

const path = (seg: string) => `/w/acme/${seg}`;

const wsAdminCtx: SettingsCtx = {
  can: (p) => p === 'workspaces:update',
  me: { user: {}, workspaces: [], prefs: {}, can_create_workspace: false, instance_admin: false, content_url: '', toolchain: '' },
  ws: { id: '1', slug: 'acme', name: 'Acme', org: 'O', members: 1, groups: 0, apps: 0 },
};
const memberCtx: SettingsCtx = {
  ...wsAdminCtx,
  can: () => false,
};
const instanceAdminCtx: SettingsCtx = {
  ...memberCtx,
  me: { ...memberCtx.me, instance_admin: true },
};

describe('settings router redirects', () => {
  it('builds absolute workspace paths', () => {
    assert.equal(settingsPagePath(path, 'workspace/sso'), '/w/acme/settings/workspace/sso');
  });

  it('legacy tab sso via layout redirect helper', () => {
    _resetSettingsRegistryForTest();
    registerSettingsPage({
      section: 'workspace',
      key: 'sso',
      label: 'SSO',
      order: 10,
      visible: () => true,
      element: () => null as any,
      legacy: ['sso'],
    });
    assert.equal(settingsLegacyTabRedirect(wsAdminCtx, 'sso', path), '/w/acme/settings/workspace/sso');
  });

  it('legacy connections tab', () => {
    _resetSettingsRegistryForTest();
    registerSettingsPage({
      section: 'workspace',
      key: 'connections',
      label: 'Connections',
      order: 10,
      visible: () => true,
      element: () => null as any,
      legacy: ['connections'],
    });
    assert.equal(settingsLegacyTabRedirect(wsAdminCtx, 'connections', path), '/w/acme/settings/workspace/connections');
    assert.equal(settingsLegacyTabRedirect(memberCtx, 'connections', path), '/w/acme/settings/account/my-connections');
    assert.equal(settingsLegacyTabRedirect(instanceAdminCtx, 'connections', path), '/w/acme/settings/instance/connections');
  });

  it('unknown workspace page redirects to first allowed settings page', () => {
    _resetSettingsRegistryForTest();
    registerSettingsPage({ section: 'account', key: 'profile', label: 'Profile', order: 10, visible: () => true, element: () => null as any });
    registerSettingsPage({ section: 'workspace', key: 'general', label: 'General', order: 10, visible: () => true, element: () => null as any });
    assert.equal(settingsUnknownPageRedirect(wsAdminCtx, 'workspace', 'nope', path), '/w/acme/settings/account/profile');
  });

  it('forbidden instance page redirects away for workspace admin', () => {
    _resetSettingsRegistryForTest();
    registerSettingsPage({ section: 'account', key: 'profile', label: 'Profile', order: 10, visible: () => true, element: () => null as any });
    registerSettingsPage({ section: 'instance', key: 'secrets', label: 'Secrets', order: 10, visible: () => true, element: () => null as any });
    assert.equal(settingsUnknownPageRedirect(wsAdminCtx, 'instance', 'secrets', path), '/w/acme/settings/account/profile');
  });
});
