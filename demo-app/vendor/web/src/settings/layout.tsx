import { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Drawer, Grid, Layout, Menu, type MenuProps } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { useShell } from '../shell';
import { PageH } from '../util';
import { findSettingsPage, firstSettingsPath, settingsLegacyTabRedirect, settingsPages, settingsUnknownPageRedirect, type SettingsSection } from './registry';
import { settingsPagePath } from './paths';

const { useBreakpoint } = Grid;

const sectionTitles: Record<SettingsSection, string> = {
  account: 'Account',
  workspace: 'Workspace',
  instance: 'Instance',
};

function useSettingsCtx() {
  const { can, me, ws } = useShell();
  return useMemo(() => ({ can, me, ws }), [can, me, ws]);
}

export function SettingsIndex() {
  const ctx = useSettingsCtx();
  const { path } = useShell();
  const dest = firstSettingsPath(ctx);
  if (!dest) return null;
  return <Navigate to={settingsPagePath(path, dest)} replace />;
}

export function SettingsLegacyTab() {
  const { tab = '' } = useParams();
  const ctx = useSettingsCtx();
  const { path } = useShell();
  const to = settingsLegacyTabRedirect(ctx, tab, path);
  if (!to) return null;
  return <Navigate to={to} replace />;
}

export function SettingsPageRoute() {
  const { section = '', page = '' } = useParams();
  const ctx = useSettingsCtx();
  const { path } = useShell();
  const found = findSettingsPage(ctx, section, page);
  if (!found) {
    const to = settingsUnknownPageRedirect(ctx, section, page, path);
    if (!to) return null;
    return <Navigate to={to} replace />;
  }
  return found.element();
}

export function SettingsLayout() {
  const ctx = useSettingsCtx();
  const { section = '', page = '' } = useParams();
  const grouped = settingsPages(ctx);
  const screens = useBreakpoint();
  const narrow = !screens.md;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const selected = findSettingsPage(ctx, section, page)
    ? `${section}/${page}`
    : firstSettingsPath(ctx) || '';

  const menuItems: MenuProps['items'] = [];
  for (const sec of ['account', 'workspace', 'instance'] as SettingsSection[]) {
    const list = grouped[sec];
    if (!list.length) continue;
    menuItems.push({
      type: 'group',
      label: sectionTitles[sec],
      children: list.map((p) => ({
        key: `${p.section}/${p.key}`,
        label: p.label,
      })),
    });
  }

  const { go } = useShell();

  const menu = (
    <Menu
      mode="inline"
      selectedKeys={selected ? [selected] : []}
      items={menuItems}
      onClick={({ key }) => {
        setDrawerOpen(false);
        go(`settings/${key}`);
      }}
      style={{ borderInlineEnd: 0, background: 'transparent' }}
    />
  );

  return (
    <div className="pg settings-layout">
      <PageH title="Settings" />
      {narrow && (
        <button type="button" className="btn sm settings-menu-btn" onClick={() => setDrawerOpen(true)} aria-label="Settings sections">
          <MenuOutlined /> {sectionTitles[(section as SettingsSection) || 'account'] || 'Menu'}
        </button>
      )}
      <Layout className="settings-shell" hasSider={!narrow}>
        {!narrow && (
          <Layout.Sider width={220} className="settings-sider" theme="light">
            {menu}
          </Layout.Sider>
        )}
        <Layout.Content className="settings-content">{<SettingsPageRoute />}</Layout.Content>
      </Layout>
      <Drawer title="Settings" placement="left" open={narrow && drawerOpen} onClose={() => setDrawerOpen(false)} width={280} className="settings-drawer">
        {menu}
      </Drawer>
    </div>
  );
}
