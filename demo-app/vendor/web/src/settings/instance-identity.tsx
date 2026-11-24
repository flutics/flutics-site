import { useCallback, useEffect, useState } from 'react';
import { Alert, Input, Select } from 'antd';
import { del, get, post, put } from '../api';
import { useShell } from '../shell';
import { Cli, Switch, ago, fmtDate, useToast } from '../util';
import { parseSSOEmailDomains } from '../ssoDomains';

type Mapping = { group: string; workspace: string; role: string };

type ScimToken = { id: string; prefix: string; created_at: string; last_used_at?: string; expires_at?: string };

type Oidc = {
  issuer?: string;
  client_id?: string;
  client_secret?: string;
  enabled?: boolean;
  jit?: boolean;
  require_sso?: boolean;
  groups_claim?: string;
  sso_email_domains?: string[];
  has_secret?: boolean;
  global?: boolean;
  instance?: boolean;
};

type IdentityView = {
  oidc: Oidc;
  mappings: Mapping[];
  scim_base_url: string;
  scim_tokens: ScimToken[];
  login_url: string;
  redirect_uri: string;
  migration_warning?: string;
};

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

// One provider, one SCIM endpoint and one rule list for the whole instance:
// every workspace signs in the same way, and group rules decide who gets which
// role in which workspace (MDW-106).
export function InstanceIdentityAdmin() {
  const { me, ws } = useShell();
  const toast = useToast();
  const [view, setView] = useState<IdentityView | null>(null);
  const [oidc, setOidc] = useState<Oidc | null>(null);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [scimToken, setScimToken] = useState<string | null>(null);
  const [scimDays, setScimDays] = useState('');

  const load = useCallback(async () => {
    const v: IdentityView = await get('/admin/identity');
    setView(v);
    setOidc({ ...v.oidc, client_secret: '' });
    setMappings(v.mappings.map((m) => ({ group: m.group, workspace: m.workspace, role: m.role })));
  }, []);
  useEffect(() => {
    load().catch(() => setView(null));
  }, [load]);

  if (!view || !oidc) return null;
  const active = oidc.enabled && oidc.issuer;
  const save = async () => {
    const body: Record<string, unknown> = { mappings };
    const payload: Record<string, unknown> = { ...oidc };
    if (!payload.client_secret) delete payload.client_secret;
    if (view.oidc.global) {
      // The deployment reads the provider from MEADOW_OIDC_*; storing these
      // fields would move the source of truth into the database.
      delete body.oidc;
    } else {
      body.oidc = payload;
    }
    try {
      const r = await put<{ identity: IdentityView }>('/admin/identity', body);
      setView(r.identity);
      setOidc({ ...r.identity.oidc, client_secret: '' });
      setMappings(r.identity.mappings.map((m: Mapping) => ({ group: m.group, workspace: m.workspace, role: m.role })));
      toast('Single sign-on saved');
    } catch (e) {
      toast(message(e), 'error');
    }
  };
  const newScim = async () => {
    const body: Record<string, unknown> = {};
    if (scimDays.trim()) body.expires_in_days = parseInt(scimDays, 10);
    try {
      const r = await post('/admin/identity/scim-tokens', body);
      setScimToken(r.token);
      setScimDays('');
      load();
    } catch (e) {
      toast(message(e), 'error');
    }
  };
  const revokeScim = async (id: string) => {
    try {
      await del(`/admin/identity/scim-tokens/${id}`);
      toast('SCIM token revoked');
      load();
    } catch (e) {
      toast(message(e), 'error');
    }
  };

  return (
    <div className="split">
      {view.migration_warning && (
        <div style={{ flexBasis: '100%' }}>
          <Alert type="warning" showIcon message="Identity providers were not merged automatically" description={view.migration_warning} />
        </div>
      )}
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Single sign-on</h3>
          <span className={'tg' + (active ? ' g' : '')}>{active ? 'Active' : 'Off'}</span>
        </div>
        <p className="ds">
          OpenID Connect for every workspace
          {view.oidc.global ? ' · from server configuration' : ''}
          {view.oidc.instance && !view.oidc.global ? ' · instance-wide' : ''}
        </p>
        {view.oidc.global ? (
          <p className="mini">This deployment reads the provider from MEADOW_OIDC_*. Change those environment variables to update it.</p>
        ) : (
          <>
            <div className="fld" style={{ marginBottom: 10 }}>
              <label>Issuer URL</label>
              <Input placeholder="https://login.microsoftonline.com/<tenant>/v2.0" value={oidc.issuer ?? ''} onChange={(e) => setOidc({ ...oidc, issuer: e.target.value })} />
            </div>
            <div className="fld" style={{ marginBottom: 10 }}>
              <label>Client ID</label>
              <Input value={oidc.client_id ?? ''} onChange={(e) => setOidc({ ...oidc, client_id: e.target.value })} />
            </div>
            <div className="fld" style={{ marginBottom: 10 }}>
              <label>Client secret</label>
              <Input.Password
                placeholder={view.oidc.has_secret ? '•••••••• (stored encrypted)' : ''}
                value={oidc.client_secret ?? ''}
                onChange={(e) => setOidc({ ...oidc, client_secret: e.target.value })}
                autoComplete="new-password"
              />
            </div>
            <div className="srow">
              <div className="l">
                <b>Enabled</b>
                <span>Show single sign-on on the sign-in page</span>
              </div>
              <Switch on={!!oidc.enabled} onChange={(v) => setOidc({ ...oidc, enabled: v })} />
            </div>
            <div className="srow">
              <div className="l">
                <b>Just-in-time provisioning</b>
                <span>Create an account on first sign-in</span>
              </div>
              <Switch on={!!oidc.jit} onChange={(v) => setOidc({ ...oidc, jit: v })} />
            </div>
            <div className="srow">
              <div className="l">
                <b>Require SSO</b>
                <span>Password sign-in disabled for members of every workspace</span>
              </div>
              <Switch on={!!oidc.require_sso} onChange={(v) => setOidc({ ...oidc, require_sso: v })} />
            </div>
            <div className="fld" style={{ marginTop: 12 }}>
              <label>Groups claim</label>
              <Input placeholder="groups" value={oidc.groups_claim || ''} onChange={(e) => setOidc({ ...oidc, groups_claim: e.target.value })} />
              <div className="mini" style={{ marginTop: 4 }}>ID token claim with the directory groups that the rules below match.</div>
            </div>
          </>
        )}
        <dl className="kv" style={{ margin: '12px 0' }}>
          <dt>Redirect URI</dt>
          <dd className="mono">{view.redirect_uri}</dd>
          <dt>Sign-in URL</dt>
          <dd className="mono">{view.login_url}</dd>
        </dl>
        {!view.oidc.global && (
          <div className="fld">
            <label>SSO email domains</label>
            <Input.TextArea
              rows={3}
              placeholder="example.com&#10;subsidiary.example.com"
              value={(oidc.sso_email_domains || []).join('\n')}
              onChange={(e) => setOidc({ ...oidc, sso_email_domains: parseSSOEmailDomains(e.target.value) })}
            />
            <div className="mini" style={{ marginTop: 4 }}>One domain per line. Used on the sign-in page to suggest single sign-on.</div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="btn p" onClick={() => save()}>
            Save
          </button>
        </div>
      </div>

      <div className="panel">
        <h3>Group rules</h3>
        <p className="ds">An IdP group grants a role in a workspace. Only memberships these rules created are revoked; manual grants survive.</p>
        <table className="tbl" style={{ marginBottom: 12 }}>
          <thead>
            <tr>
              <th>IdP group</th>
              <th>Workspace</th>
              <th>Role</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((m, i) => (
              <tr key={i}>
                <td>
                  <Input size="small" value={m.group} placeholder="engineering" onChange={(e) => setMappings(mappings.map((x, j) => (j === i ? { ...x, group: e.target.value } : x)))} />
                </td>
                <td>
                  <Select
                    size="small"
                    style={{ width: 150 }}
                    value={m.workspace}
                    placeholder="Workspace"
                    options={me.workspaces.map((w) => ({ value: w.slug, label: w.name }))}
                    onChange={(v) => setMappings(mappings.map((x, j) => (j === i ? { ...x, workspace: v } : x)))}
                  />
                </td>
                <td>
                  <Input size="small" value={m.role} placeholder="Member" onChange={(e) => setMappings(mappings.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))} />
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn sm gh" style={{ color: 'var(--red)' }} onClick={() => setMappings(mappings.filter((_, j) => j !== i))}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {mappings.length === 0 && (
              <tr className="empty-row">
                <td colSpan={4}>No rules</td>
              </tr>
            )}
          </tbody>
        </table>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn sm" onClick={() => setMappings([...mappings, { group: '', workspace: ws.slug, role: '' }])}>
            Add rule
          </button>
          <button className="btn sm p" onClick={() => save()}>
            Save rules
          </button>
          <button className="btn sm" onClick={() => post<{ granted: number; revoked: number }>('/admin/identity/reconcile').then((r) => { toast(`Re-evaluated: ${r.granted} granted, ${r.revoked} revoked`); load(); }).catch((e) => toast(message(e), 'error'))}>
            Re-evaluate now
          </button>
        </div>
      </div>

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>SCIM provisioning</h3>
          <span className={'tg' + (view.scim_tokens.length ? ' g' : '')}>{view.scim_tokens.length ? 'Configured' : 'Off'}</span>
        </div>
        <p className="ds">Users and groups from your directory (SCIM 2.0), for every workspace</p>
        <dl className="kv" style={{ marginBottom: 12 }}>
          <dt>Endpoint</dt>
          <dd className="mono">{view.scim_base_url}</dd>
          <dt>Rules</dt>
          <dd>Directory groups map to workspace roles above</dd>
          <dt>Deprovisioning</dt>
          <dd>Removes the person from every workspace and revokes their sessions</dd>
        </dl>
        {scimToken && (
          <div style={{ marginBottom: 12 }}>
            <div className="mini" style={{ marginBottom: 4 }}>
              Copy this token now. It will not be shown again.
            </div>
            <Cli text={scimToken} />
          </div>
        )}
        <table className="tbl" style={{ marginBottom: 12 }}>
          <thead>
            <tr>
              <th>Token</th>
              <th>Created</th>
              <th>Last used</th>
              <th>Expires</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {view.scim_tokens.map((t) => (
              <tr key={t.id}>
                <td className="mono">{t.prefix}…</td>
                <td className="sub">{fmtDate(t.created_at)}</td>
                <td className="sub">{t.last_used_at ? ago(t.last_used_at) : 'Never'}</td>
                <td className="sub">{t.expires_at ? fmtDate(t.expires_at) : 'Never'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn sm gh" style={{ color: 'var(--red)' }} onClick={() => revokeScim(t.id)}>
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
            {view.scim_tokens.length === 0 && (
              <tr className="empty-row">
                <td colSpan={4}>No tokens</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="fld" style={{ marginBottom: 12, maxWidth: 200 }}>
          <label>Optional expiry (days)</label>
          <Input placeholder="Never" value={scimDays} onChange={(e) => setScimDays(e.target.value)} />
        </div>
        <button className="btn sm" onClick={newScim}>
          {view.scim_tokens.length ? 'Rotate token' : 'Generate token'}
        </button>
        <div style={{ marginTop: 14, fontSize: 12, color: 'var(--tx3)' }}>
          Works with Microsoft Entra ID, Okta and any SCIM 2.0 directory. `meadow apply` manages the same settings from platform.yaml.
        </div>
      </div>
    </div>
  );
}
