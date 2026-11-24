import { registerSettingsPage } from '../registry';
import { DataRetention, OAuthAdmin, SoftwareUpdates, Storage, Telemetry } from '../../pages/settings';
import { InstanceBrandingAdmin } from '../branding-admin';
import { InstanceAdminsAdmin } from '../instance-admins';
import { InstanceIdentityAdmin } from '../instance-identity';
import { SecretsAdmin } from '../secrets';
import { InstanceServiceTokensAdmin } from '../serviceTokens';

registerSettingsPage({
  section: 'instance',
  key: 'admins',
  label: 'Administrators',
  order: 15,
  visible: () => true,
  element: () => <InstanceAdminsAdmin />,
});

registerSettingsPage({
  section: 'instance',
  key: 'single-sign-on',
  label: 'Single sign-on & SCIM',
  order: 18,
  visible: () => true,
  element: () => <InstanceIdentityAdmin />,
});

registerSettingsPage({
  section: 'instance',
  key: 'company-branding',
  label: 'Company & branding',
  order: 10,
  visible: () => true,
  element: () => <InstanceBrandingAdmin />,
});

registerSettingsPage({
  section: 'instance',
  key: 'service-tokens',
  label: 'Service tokens',
  order: 25,
  visible: () => true,
  element: () => <InstanceServiceTokensAdmin />,
});

registerSettingsPage({
  section: 'instance',
  key: 'secrets',
  label: 'Secrets',
  order: 30,
  visible: () => true,
  element: () => <SecretsAdmin scope="instance" />,
});

registerSettingsPage({
  section: 'instance',
  key: 'oauth-clients',
  label: 'OAuth clients',
  order: 40,
  visible: () => true,
  element: () => <OAuthAdmin />,
  legacy: ['oauth'],
});

registerSettingsPage({
  section: 'instance',
  key: 'storage',
  label: 'Storage',
  order: 50,
  visible: () => true,
  element: () => <Storage />,
  legacy: ['storage'],
});

registerSettingsPage({
  section: 'instance',
  key: 'data-retention',
  label: 'Data retention',
  order: 60,
  visible: () => true,
  element: () => <DataRetention />,
  legacy: ['retention'],
});

registerSettingsPage({
  section: 'instance',
  key: 'updates-telemetry',
  label: 'Updates & telemetry',
  order: 70,
  visible: () => true,
  element: () => (
    <>
      <SoftwareUpdates />
      <Telemetry />
    </>
  ),
  legacy: ['telemetry'],
});
