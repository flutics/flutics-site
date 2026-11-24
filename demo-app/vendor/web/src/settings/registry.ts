import type { JSX } from 'react';
import type { Me, Workspace } from '../shell';
import { settingsPagePath } from './paths.ts';

export type WorkspacePathFn = (segment: string) => string;

export type SettingsSection = 'account' | 'workspace' | 'instance';

export type SettingsCtx = { can: (perm: string) => boolean; me: Me; ws: Workspace };

export type SettingsPage = {
  section: SettingsSection;
  key: string;
  label: string;
  order: number;
  visible: (c: SettingsCtx) => boolean;
  element: () => JSX.Element;
  legacy?: string[];
};

const pages: SettingsPage[] = [];
const legacyIndex = new Map<string, { section: SettingsSection; key: string }>();

const sectionGate: Record<SettingsSection, (c: SettingsCtx) => boolean> = {
  account: () => true,
  workspace: (c) => c.can('workspaces:update'),
  instance: (c) => !!c.me.instance_admin,
};

export function registerSettingsPage(p: SettingsPage): void {
  const dup = pages.find((x) => x.section === p.section && x.key === p.key);
  if (dup) {
    throw new Error(`duplicate settings page ${p.section}/${p.key}`);
  }
  pages.push(p);
  for (const tab of p.legacy || []) {
    if (legacyIndex.has(tab)) {
      throw new Error(`duplicate legacy settings tab ${tab}`);
    }
    legacyIndex.set(tab, { section: p.section, key: p.key });
  }
}

export function settingsPages(c: SettingsCtx): Record<SettingsSection, SettingsPage[]> {
  const out: Record<SettingsSection, SettingsPage[]> = {
    account: [],
    workspace: [],
    instance: [],
  };
  for (const p of pages) {
    if (!sectionGate[p.section](c)) continue;
    if (!p.visible(c)) continue;
    out[p.section].push(p);
  }
  for (const s of Object.keys(out) as SettingsSection[]) {
    out[s].sort((a, b) => a.order - b.order);
  }
  return out;
}

export function resolveLegacyTab(tab: string): { section: SettingsSection; key: string } | undefined {
  return legacyIndex.get(tab);
}

export function firstSettingsPath(c: SettingsCtx): string | undefined {
  const grouped = settingsPages(c);
  for (const section of ['account', 'workspace', 'instance'] as SettingsSection[]) {
    const first = grouped[section][0];
    if (first) return `${section}/${first.key}`;
  }
  return undefined;
}

export function findSettingsPage(c: SettingsCtx, section: string, key: string): SettingsPage | undefined {
  if (section !== 'account' && section !== 'workspace' && section !== 'instance') return undefined;
  const sec = section as SettingsSection;
  if (!sectionGate[sec](c)) return undefined;
  return settingsPages(c)[sec].find((p) => p.key === key);
}

/** @internal test helper */
export function _resetSettingsRegistryForTest(): void {
  pages.length = 0;
  legacyIndex.clear();
}

/** @internal Pure redirect targets used by settings layout routes. */
export function settingsLegacyTabRedirect(ctx: SettingsCtx, tab: string, path: WorkspacePathFn): string | null {
  if (tab === 'connections') {
    const dest = ctx.can('workspaces:update')
      ? 'workspace/connections'
      : ctx.me.instance_admin
        ? 'instance/connections'
        : 'account/my-connections';
    return settingsPagePath(path, dest);
  }
  const mapped = resolveLegacyTab(tab);
  if (mapped) {
    return settingsPagePath(path, `${mapped.section}/${mapped.key}`);
  }
  const dest = firstSettingsPath(ctx);
  return dest ? settingsPagePath(path, dest) : null;
}

export function settingsUnknownPageRedirect(ctx: SettingsCtx, section: string, page: string, path: WorkspacePathFn): string | null {
  if (findSettingsPage(ctx, section, page)) {
    return null;
  }
  const dest = firstSettingsPath(ctx);
  return dest ? settingsPagePath(path, dest) : null;
}
