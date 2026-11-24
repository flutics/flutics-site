import { registerSettingsPage } from '../registry';
import { InstanceConnectionsAdmin, ProfileSnowflake, WorkspaceConnectionsAdmin } from '../../pages/snowflake-connections';

registerSettingsPage({
  section: 'account',
  key: 'my-connections',
  label: 'My connections',
  order: 50,
  visible: () => true,
  element: () => <ProfileSnowflake />,
});

registerSettingsPage({
  section: 'workspace',
  key: 'connections',
  label: 'Connections',
  order: 30,
  visible: () => true,
  element: () => <WorkspaceConnectionsAdmin />,
  legacy: ['connections'],
});

registerSettingsPage({
  section: 'instance',
  key: 'connections',
  label: 'Connections',
  order: 20,
  visible: () => true,
  element: () => <InstanceConnectionsAdmin />,
  legacy: ['instance-connections'],
});
