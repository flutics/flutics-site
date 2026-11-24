import { registerSettingsPage } from '../registry';
import {
  AgentAccessAdmin,
  AllowlistsAdmin,
  EmailAdmin,
  QuotasAdmin,
  SSO,
  WorkspaceGeneralAdmin,
} from '../../pages/settings';
import { SecretsAdmin } from '../secrets';
import { ServiceTokensAdmin } from '../serviceTokens';

registerSettingsPage({
  section: 'workspace',
  key: 'general',
  label: 'General',
  order: 10,
  visible: () => true,
  element: () => <WorkspaceGeneralAdmin />,
  legacy: ['branding'],
});

registerSettingsPage({
  section: 'workspace',
  key: 'sso-scim',
  label: 'Single sign-on & SCIM',
  order: 20,
  visible: () => true,
  element: () => <SSO />,
  legacy: ['sso'],
});

registerSettingsPage({
  section: 'workspace',
  key: 'secrets',
  label: 'Secrets',
  order: 40,
  visible: () => true,
  element: () => <SecretsAdmin scope="workspace" />,
  legacy: ['secrets'],
});

registerSettingsPage({
  section: 'workspace',
  key: 'service-tokens',
  label: 'Service tokens',
  order: 45,
  visible: () => true,
  element: () => <ServiceTokensAdmin />,
});

registerSettingsPage({
  section: 'workspace',
  key: 'email',
  label: 'Email',
  order: 50,
  visible: () => true,
  element: () => <EmailAdmin />,
  legacy: ['email'],
});

registerSettingsPage({
  section: 'workspace',
  key: 'quotas',
  label: 'Quotas',
  order: 60,
  visible: () => true,
  element: () => <QuotasAdmin />,
  legacy: ['quotas'],
});

registerSettingsPage({
  section: 'workspace',
  key: 'agent',
  label: 'Agent access',
  order: 65,
  visible: () => true,
  element: () => <AgentAccessAdmin />,
  legacy: ['agent'],
});

registerSettingsPage({
  section: 'workspace',
  key: 'allowlists',
  label: 'Allowlists',
  order: 70,
  visible: () => true,
  element: () => <AllowlistsAdmin />,
  legacy: ['allowlists'],
});
