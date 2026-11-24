import.meta.glob('./pages/*.tsx', { eager: true });

export { SettingsLayout, SettingsIndex, SettingsLegacyTab, SettingsPageRoute } from './layout';
export { settingsPagePath } from './paths';
export {
  firstSettingsPath,
  findSettingsPage,
  resolveLegacyTab,
  registerSettingsPage,
  settingsPages,
  type SettingsCtx,
  type SettingsPage,
  type SettingsSection,
} from './registry';
