import { registerSettingsPage } from '../registry';
import { Appearance, ConnectedApps, Profile, Tokens } from '../../pages/settings';

registerSettingsPage({
  section: 'account',
  key: 'profile',
  label: 'Profile',
  order: 10,
  visible: () => true,
  element: () => <Profile />,
  legacy: ['profile'],
});

registerSettingsPage({
  section: 'account',
  key: 'appearance',
  label: 'Appearance',
  order: 20,
  visible: () => true,
  element: () => <Appearance />,
  legacy: ['appearance'],
});

registerSettingsPage({
  section: 'account',
  key: 'api-tokens',
  label: 'API tokens',
  order: 30,
  visible: () => true,
  element: () => <Tokens />,
  legacy: ['tokens'],
});

registerSettingsPage({
  section: 'account',
  key: 'connected-apps',
  label: 'Connected apps',
  order: 40,
  visible: () => true,
  element: () => <ConnectedApps />,
  legacy: ['connected'],
});
