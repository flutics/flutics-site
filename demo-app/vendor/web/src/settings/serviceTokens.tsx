import { TokenManager } from './tokenManager';
import { useShell } from '../shell';

export function ServiceTokensAdmin() {
  const { ws } = useShell();
  return (
    <TokenManager
      listPath={`/workspaces/${ws.slug}/service-tokens`}
      createPath={`/workspaces/${ws.slug}/service-tokens`}
      deletePath={(id) => `/workspaces/${ws.slug}/service-tokens/${id}`}
      blurb="Machine tokens for CI and automation, scoped to this workspace. They carry exactly the scopes you pick and never inherit yours."
      createLabel="Create service token"
      defaultScopes={['apps:read', 'apps:update']}
    />
  );
}

export function InstanceServiceTokensAdmin() {
  return (
    <TokenManager
      listPath="/admin/service-tokens"
      createPath="/admin/service-tokens"
      deletePath={(id) => `/admin/service-tokens/${id}`}
      blurb="Instance service tokens work in every workspace with their stored scopes, so one CI token can plan and apply infra for dev and main. Add instance:admin to let it also apply instance scope (branding)."
      createLabel="Create instance token"
      defaultScopes={['apps:read', 'apps:update', 'workspaces:update', 'instance:admin']}
      withInstanceScopes
    />
  );
}
