import { useCallback, useEffect, useState } from 'react';
import { ColorPicker, Input, Modal, Select } from 'antd';
import { api, del, get, patch, post, put } from '../api';
import type { Branding } from '../branding';
import { I } from '../icons';
import { useShell } from '../shell';
import { useDebug } from '../debug';
import { parseSSOEmailDomains } from '../ssoDomains';
import { Cli, Seg, Switch, ago, fmtDate, useToast } from '../util';
import { SettingsLayout } from '../settings/layout';
import { TokenManager } from '../settings/tokenManager';
import '../settings/index';

function QuotasAdmin() {
  const { ws } = useShell();
  const toast = useToast();
  const [usage, setUsage] = useState<{ metric: string; used: number; limit: number }[]>([]);
  const [quotas, setQuotas] = useState<{ scope: string; scope_id: string; metric: string; limit: number }[]>([]);
  const [apps, setApps] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; email: string; name: string }[]>([]);
  const [scope, setScope] = useState<'workspace' | 'app' | 'user'>('workspace');
  const [scopeID, setScopeID] = useState('');
  const [metric, setMetric] = useState('queries_per_minute');
  const [limit, setLimit] = useState('');
  const reload = () =>
    get(`/workspaces/${ws.slug}/quotas`).then((r: any) => {
      setUsage(r.usage || []);
      setQuotas(r.quotas || []);
      setApps(r.apps || []);
      setUsers(r.users || []);
    });
  useEffect(() => {
    reload();
  }, [ws.slug]);
  const save = async () => {
    const n = parseInt(limit, 10);
    if (!metric || Number.isNaN(n)) return;
    const body: Record<string, unknown> = { metric, limit: n, scope };
    if (scope !== 'workspace') body.scope_id = scopeID;
    await put(`/workspaces/${ws.slug}/quotas`, body);
    toast('Quota saved');
    reload();
  };
  const metricOpts = [
    'queries_per_minute',
    'actions_per_minute',
    'upload_count',
    'storage_bytes',
    'rows_per_table',
    'mcp_calls_per_day',
    'apps_per_workspace',
    'users_per_workspace',
  ].map((m) => ({ value: m, label: m }));
  return (
    <div className="panel" style={{ maxWidth: 820 }}>
      <p className="ds" style={{ marginBottom: 12 }}>
        Workspace usage and limits. Set caps at workspace, app, or user scope (most specific wins, capped by parent).
      </p>
      {usage.map((u) => (
        <div key={u.metric} className="srow">
          <div className="l">
            <b>{u.metric}</b>
            <span>{u.limit ? `${u.used} / ${u.limit}` : `${u.used} (no cap)`}</span>
          </div>
          <div style={{ flex: 1, maxWidth: 280, height: 8, background: 'var(--bd)', borderRadius: 4 }}>
            <div
              style={{
                width: u.limit ? `${Math.min(100, (100 * u.used) / u.limit)}%` : '0%',
                height: '100%',
                background: 'var(--pri)',
                borderRadius: 4,
              }}
            />
          </div>
        </div>
      ))}
      {quotas.length > 0 && (
        <table className="tbl" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Scope</th>
              <th>Target</th>
              <th>Metric</th>
              <th>Limit</th>
            </tr>
          </thead>
          <tbody>
            {quotas
              .filter(
                (q) =>
                  (q.scope === 'workspace' && q.scope_id === ws.id) ||
                  (q.scope === 'app' && apps.some((a) => a.id === q.scope_id)) ||
                  (q.scope === 'user' && users.some((u) => u.id === q.scope_id)),
              )
              .map((q, i) => (
                <tr key={i}>
                  <td>{q.scope}</td>
                  <td className="sub mono">{q.scope_id.slice(0, 8)}…</td>
                  <td>{q.metric}</td>
                  <td>{q.limit}</td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
      <div className="srow" style={{ marginTop: 16, flexWrap: 'wrap', gap: 8 }}>
        <Select style={{ width: 130 }} value={scope} onChange={(v) => { setScope(v); setScopeID(''); }} options={[
          { value: 'workspace', label: 'Workspace' },
          { value: 'app', label: 'App' },
          { value: 'user', label: 'User' },
        ]} />
        {scope === 'app' && (
          <Select
            style={{ width: 200 }}
            placeholder="App"
            value={scopeID || undefined}
            onChange={setScopeID}
            options={apps.map((a) => ({ value: a.id, label: a.slug }))}
          />
        )}
        {scope === 'user' && (
          <Select
            style={{ width: 220 }}
            placeholder="User"
            value={scopeID || undefined}
            onChange={setScopeID}
            options={users.map((u) => ({ value: u.id, label: u.email }))}
          />
        )}
        <Select style={{ width: 200 }} value={metric} onChange={setMetric} options={metricOpts} />
        <input className="inp" style={{ width: 100 }} placeholder="Limit" value={limit} onChange={(e) => setLimit(e.target.value)} />
        <button type="button" className="btn p" onClick={save}>Save limit</button>
      </div>
    </div>
  );
}

export function AgentAccessAdmin() {
  const { ws } = useShell();
  const toast = useToast();
  const [s, setS] = useState<any>(null);
  const [apps, setApps] = useState<{ slug: string; name: string }[]>([]);
  useEffect(() => {
    get(`/workspaces/${ws.slug}/agent/settings`).then(setS);
    get(`/workspaces/${ws.slug}/apps`).then((r: any[]) => setApps((r || []).map((a) => ({ slug: a.slug, name: a.name }))));
  }, [ws.slug]);
  if (!s) return null;
  const save = async (next: any) => {
    const r = await put(`/workspaces/${ws.slug}/agent/settings`, next);
    setS(r);
    toast('Agent access updated');
  };
  const appOn = (slug: string) => s.apps?.[slug] !== false;
  const setApp = (slug: string, on: boolean) => save({ ...s, apps: { ...(s.apps || {}), [slug]: on } });
  return (
    <div className="panel" style={{ maxWidth: 720 }}>
      <p className="ds" style={{ marginBottom: 12 }}>
        MCP clients act as the signed-in user. These switches cap what any agent can reach here; the manifest's agent flags still apply.
      </p>
      <div className="srow">
        <div className="l"><b>Agent access</b><span>Allow MCP clients to use apps in this workspace</span></div>
        <Switch on={s.enabled} onChange={(v: boolean) => save({ ...s, enabled: v })} />
      </div>
      <div className="srow">
        <div className="l"><b>Actions</b><span>Allow agent-exposed actions (writes) as well as queries</span></div>
        <Switch on={s.writes} onChange={(v: boolean) => save({ ...s, writes: v })} />
      </div>
      <div className="srow">
        <div className="l"><b>Confirm destructive actions</b><span>Ask before merge, delete, webhook and transaction actions</span></div>
        <Switch on={s.confirm_destructive} onChange={(v: boolean) => save({ ...s, confirm_destructive: v })} />
      </div>
      <div className="srow">
        <div className="l"><b>Hourly budget per token</b><span>Tool calls allowed per token before a retry hint</span></div>
        <Input
          style={{ width: 120 }}
          value={String(s.budget_per_hour ?? 600)}
          onChange={(e) => setS({ ...s, budget_per_hour: Number(e.target.value) || 0 })}
          onBlur={() => save(s)}
        />
      </div>
      {apps.length > 0 && (
        <table className="tbl" style={{ marginTop: 12 }}>
          <thead>
            <tr><th>App</th><th style={{ width: 120 }}>Agents</th></tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.slug}>
                <td><b>{a.name}</b> <span className="sub mono">{a.slug}</span></td>
                <td><Switch on={appOn(a.slug)} onChange={(v: boolean) => setApp(a.slug, v)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Profile() {
  const { me, reloadMe } = useShell();
  const toast = useToast();
  const [name, setName] = useState(me.user.name);
  const [defWs, setDefWs] = useState<string | undefined>(me.prefs.default_workspace);
  const [pw, setPw] = useState({ current: '', next: '' });
  const role = me.workspaces.find((w) => w.permissions?.includes('workspaces:delete')) ? 'Owner' : '';
  const saveName = async () => {
    if (name.trim() === me.user.name) return;
    try {
      await patch('/me', { name });
      await reloadMe();
      toast('Profile updated');
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  const changePw = async () => {
    try {
      await post('/me/password', { current: pw.current, new: pw.next });
      setPw({ current: '', next: '' });
      toast('Password changed');
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  return (
    <div className="panel" style={{ maxWidth: 620 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
        <span className="av" style={{ width: 48, height: 48, fontSize: 16 }}>
          {me.user.name.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase()}
        </span>
        <div>
          <b>{me.user.name}</b>
          <div style={{ color: 'var(--tx3)', fontSize: 12 }}>
            {me.user.email}
            {role ? ` · ${role}` : ''}
          </div>
        </div>
      </div>
      <div className="srow">
        <div className="l">
          <b>Display name</b>
          <span>Shown to other members</span>
        </div>
        <input className="inp" style={{ width: 240 }} value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName} onKeyDown={(e) => e.key === 'Enter' && saveName()} />
      </div>
      <div className="srow">
        <div className="l">
          <b>Email</b>
          <span>{me.user.source === 'local' ? 'Contact an admin to change it' : 'Managed by your identity provider'}</span>
        </div>
        <input className="inp" style={{ width: 240, opacity: 0.6 }} value={me.user.email} disabled />
      </div>
      <div className="srow">
        <div className="l">
          <b>Default workspace</b>
          <span>Opened after sign-in</span>
        </div>
        <Select
          style={{ width: 240 }}
          value={defWs || me.workspaces[0]?.slug}
          options={me.workspaces.map((w) => ({ value: w.slug, label: w.name }))}
          onChange={async (v) => {
            setDefWs(v);
            await put('/me/prefs', { theme: me.prefs.theme, default_workspace: v });
            toast('Default workspace saved');
          }}
        />
      </div>
      {me.user.source === 'local' && (
        <div className="srow" style={{ alignItems: 'flex-start' }}>
          <div className="l">
            <b>Password</b>
            <span>At least 10 characters</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 240 }}>
            <Input.Password placeholder="Current password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" />
            <Input.Password placeholder="New password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" />
            <button className="btn" disabled={!pw.current || pw.next.length < 10} onClick={changePw} style={{ alignSelf: 'flex-end' }}>
              Change password
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Appearance() {
  const { themePref, setThemePref } = useShell();
  const [debug, setDebug] = useDebug();
  return (
    <>
      <div className="panel" style={{ maxWidth: 620 }}>
        <h3>Theme</h3>
        <p className="ds">Applies to the shell and every app.</p>
        <div className="themes">
          {[
            ['light', 'Light', ''],
            ['dark', 'Dark', 'dk'],
            ['system', 'System', 'sys'],
          ].map(([v, l, c]) => (
            <button key={v} className={`th ${c}${themePref === v ? ' on' : ''}`} onClick={() => setThemePref(v)}>
              <div className="pv">
                <i />
                <i />
              </div>
              <div className="lb">{l}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="panel" style={{ maxWidth: 620, marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <h3>Debug mode</h3>
            <p className="ds" style={{ margin: 0 }}>
              Show the frame's URL bar and bridge status around every app. Applies to this browser only. <span className="mono" style={{ whiteSpace: 'nowrap' }}>?debug=1</span> on any URL also turns it on.
            </p>
          </div>
          <button type="button" role="switch" aria-checked={debug} aria-label="Debug mode" className={`sw${debug ? ' on' : ''}`} onClick={() => setDebug(!debug)} />
        </div>
      </div>
    </>
  );
}

function ConnectedApps() {
  const toast = useToast();
  const [grants, setGrants] = useState<any[]>([]);
  const load = useCallback(async () => setGrants(await get('/me/oauth/grants')), []);
  useEffect(() => {
    load();
  }, [load]);
  const revoke = async (id: string) => {
    await del('/me/oauth/grants/' + id);
    toast('Disconnected');
    load();
  };
  return (
    <>
      <p className="ds" style={{ marginBottom: 12 }}>Apps that can access Flutics on your behalf via OAuth (ChatGPT, Grok, Claude, …).</p>
      <table className="tbl">
        <thead>
          <tr>
            <th>App</th>
            <th>Scopes</th>
            <th>Workspace</th>
            <th>Connected</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {grants.map((g) => (
            <tr key={g.id}>
              <td><b>{g.client_name || g.client_id}</b></td>
              <td className="mono" style={{ whiteSpace: 'normal' }}>{g.scopes?.join(', ')}</td>
              <td className="sub">{g.workspace || '—'}</td>
              <td className="sub">{fmtDate(g.created_at)}</td>
              <td style={{ textAlign: 'right' }}>
                <button type="button" className="btn sm gh" style={{ color: 'var(--red)' }} onClick={() => revoke(g.id)}>Revoke</button>
              </td>
            </tr>
          ))}
          {grants.length === 0 && (
            <tr className="empty-row"><td colSpan={5}>No connected apps</td></tr>
          )}
        </tbody>
      </table>
    </>
  );
}

function OAuthAdmin() {
  const toast = useToast();
  const [data, setData] = useState<{ clients: any[]; dcr_enabled: boolean }>({ clients: [], dcr_enabled: true });
  const [form, setForm] = useState<{ id: string; name: string; redirect_uris: string } | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const reload = () => get('/admin/oauth/clients').then(setData);
  useEffect(() => {
    reload();
  }, []);
  const saveDcr = async (on: boolean) => {
    await put('/admin/oauth/settings', { dcr_enabled: on });
    toast('Saved');
    reload();
  };
  const create = async () => {
    const uris = form!.redirect_uris.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    const r = await post('/admin/oauth/clients', { id: form!.id || undefined, name: form!.name, redirect_uris: uris, token_endpoint_auth_method: 'none' });
    setSecret(r.client_secret || null);
    setForm(null);
    reload();
  };
  return (
    <div className="panel" style={{ maxWidth: 900 }}>
      <div className="srow">
        <div className="l"><b>Open dynamic registration</b><span>Let remote clients register via RFC 7591</span></div>
        <button type="button" role="switch" aria-checked={data.dcr_enabled} className={`sw${data.dcr_enabled ? ' on' : ''}`} onClick={() => saveDcr(!data.dcr_enabled)} />
      </div>
      {secret && (
        <div className="panel" style={{ marginTop: 12, borderColor: 'var(--acbd)' }}>
          <p className="ds">Client secret (copy now):</p>
          <input className="inp mono" readOnly value={secret} />
        </div>
      )}
      <div className="pg-h" style={{ marginTop: 16 }}>
        <span>Registered clients</span>
        <button type="button" className="btn p" onClick={() => setForm({ id: '', name: '', redirect_uris: 'http://localhost:9999/cb' })}>Register client</button>
      </div>
      <table className="tbl">
        <thead><tr><th>Name</th><th>Client ID</th><th>Redirects</th><th></th></tr></thead>
        <tbody>
          {data.clients.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td className="mono">{c.id}</td>
              <td className="sub mono" style={{ maxWidth: 280, whiteSpace: 'normal' }}>{c.redirect_uris?.join(', ')}</td>
              <td style={{ textAlign: 'right' }}>
                <button type="button" className="btn sm gh" onClick={async () => { await del('/admin/oauth/clients/' + c.id); reload(); }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Modal title="Register OAuth client" open={!!form} onCancel={() => setForm(null)} onOk={create} okText="Create">
        {form && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="fld"><label>Client ID (optional)</label><Input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="Auto-generated if empty" /></div>
            <div className="fld"><label>Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="fld"><label>Redirect URIs (one per line)</label><Input.TextArea rows={3} value={form.redirect_uris} onChange={(e) => setForm({ ...form, redirect_uris: e.target.value })} /></div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Tokens() {
  const { ws } = useShell();
  return (
    <TokenManager
      listPath="/me/tokens"
      createPath="/me/tokens"
      deletePath={(id) => `/me/tokens/${id}`}
      blurb="Personal tokens for the CLI, CI and MCP clients."
      createLabel="Create token"
      withWorkspace
      withExpiry
      defaultWorkspace={ws.slug}
      defaultScopes={['apps:read', 'apps:create', 'apps:update']}
    />
  );
}

function SSO() {
  const { ws } = useShell();
  const toast = useToast();
  const [cfg, setCfg] = useState<any>(null);
  const [oidc, setOidc] = useState<any>(null);
  const [scimToken, setScimToken] = useState<string | null>(null);
  const [scimDays, setScimDays] = useState('');
  const load = useCallback(async () => {
    const c = await get(`/workspaces/${ws.slug}/sso`);
    setCfg(c);
    setOidc({ ...c.oidc, client_secret: '' });
  }, [ws.slug]);
  useEffect(() => {
    load();
  }, [load]);
  if (!cfg || !oidc) return null;
  const save = async (next = oidc) => {
    try {
      const c = await put(`/workspaces/${ws.slug}/sso`, next);
      setCfg(c);
      setOidc({ ...c.oidc, client_secret: '' });
      toast('Single sign-on saved');
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  const newScim = async () => {
    const body: Record<string, unknown> = {};
    if (scimDays.trim()) body.expires_in_days = parseInt(scimDays, 10);
    const r = await post(`/workspaces/${ws.slug}/scim-tokens`, body);
    setScimToken(r.token);
    setScimDays('');
    load();
  };
  const revokeScim = async (id: string) => {
    await del(`/workspaces/${ws.slug}/scim-tokens/${id}`);
    toast('SCIM token revoked');
    load();
  };
  const active = cfg.oidc.enabled && cfg.oidc.issuer;
  return (
    <div className="split">
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Single sign-on</h3>
          <span className={'tg' + (active ? ' g' : '')}>{active ? 'Active' : 'Off'}</span>
        </div>
        <p className="ds">OpenID Connect{cfg.oidc.global ? ' · inherited from server configuration' : ''}</p>
        <div className="fld" style={{ marginBottom: 10 }}>
          <label>Issuer URL</label>
          <Input placeholder="https://login.microsoftonline.com/<tenant>/v2.0" value={oidc.issuer} onChange={(e) => setOidc({ ...oidc, issuer: e.target.value })} />
        </div>
        <div className="fld" style={{ marginBottom: 10 }}>
          <label>Client ID</label>
          <Input value={oidc.client_id} onChange={(e) => setOidc({ ...oidc, client_id: e.target.value })} />
        </div>
        <div className="fld" style={{ marginBottom: 10 }}>
          <label>Client secret</label>
          <Input.Password placeholder={cfg.oidc.has_secret ? '•••••••• (stored encrypted)' : ''} value={oidc.client_secret} onChange={(e) => setOidc({ ...oidc, client_secret: e.target.value })} autoComplete="new-password" />
        </div>
        <dl className="kv" style={{ margin: '12px 0' }}>
          <dt>Redirect URI</dt>
          <dd className="mono">{cfg.redirect_uri}</dd>
          <dt>Sign-in URL</dt>
          <dd className="mono">{cfg.login_url}</dd>
        </dl>
        <div className="srow">
          <div className="l">
            <b>Enabled</b>
            <span>Show single sign-on on the sign-in page</span>
          </div>
          <Switch on={oidc.enabled} onChange={(v) => setOidc({ ...oidc, enabled: v })} />
        </div>
        <div className="srow">
          <div className="l">
            <b>Just-in-time provisioning</b>
            <span>Create members on first sign-in</span>
          </div>
          <Switch on={oidc.jit} onChange={(v) => setOidc({ ...oidc, jit: v })} />
        </div>
        <div className="srow">
          <div className="l">
            <b>Require SSO</b>
            <span>Password sign-in disabled for members</span>
          </div>
          <Switch on={oidc.require_sso} onChange={(v) => setOidc({ ...oidc, require_sso: v })} />
        </div>
        <div className="fld" style={{ marginTop: 12 }}>
          <label>Groups claim</label>
          <Input placeholder="groups" value={oidc.groups_claim || ''} onChange={(e) => setOidc({ ...oidc, groups_claim: e.target.value })} />
          <div className="mini" style={{ marginTop: 4 }}>Optional ID token claim (array of group names or object IDs). Syncs source=oidc groups on sign-in; SCIM and local groups are unchanged.</div>
        </div>
        <div className="fld" style={{ marginTop: 12 }}>
          <label>SSO email domains</label>
          <Input.TextArea
            rows={3}
            placeholder="example.com&#10;subsidiary.example.com"
            value={(oidc.sso_email_domains || []).join('\n')}
            onChange={(e) =>
              setOidc({
                ...oidc,
                sso_email_domains: parseSSOEmailDomains(e.target.value),
              })
            }
          />
          <div className="mini" style={{ marginTop: 4 }}>One domain per line. Used on the sign-in page to suggest SSO. Domains must be unique across the instance.</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="btn p" onClick={() => save()}>
            Save
          </button>
        </div>
      </div>
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>SCIM provisioning</h3>
          <span className={'tg' + (cfg.scim_tokens.length ? ' g' : '')}>{cfg.scim_tokens.length ? 'Configured' : 'Off'}</span>
        </div>
        <p className="ds">Users and groups from your directory (SCIM 2.0)</p>
        <dl className="kv" style={{ marginBottom: 12 }}>
          <dt>Endpoint</dt>
          <dd className="mono">{cfg.scim_base_url}</dd>
          <dt>Groups</dt>
          <dd>Synced as Flutics groups; bind roles on the Groups page</dd>
          <dt>Deprovisioning</dt>
          <dd>Suspend user, revoke sessions and tokens</dd>
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
            {cfg.scim_tokens.map((t: any) => (
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
            {cfg.scim_tokens.length === 0 && (
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
          <I n="key" />
          {cfg.scim_tokens.length ? 'Rotate token' : 'Generate token'}
        </button>
        <div style={{ marginTop: 14, fontSize: 12, color: 'var(--tx3)' }}>
          Works with Microsoft Entra ID, Okta and any SCIM 2.0 directory. For Google Workspace without SCIM, use OIDC groups above and/or directory sync below.
        </div>
      </div>
      <GoogleDirectorySync />
    </div>
  );
}

function GoogleDirectorySync() {
  const { ws } = useShell();
  const toast = useToast();
  const [cfg, setCfg] = useState<any>(null);
  const [draft, setDraft] = useState<any>(null);
  const load = useCallback(async () => {
    const c = await get(`/workspaces/${ws.slug}/directory-sync`);
    setCfg(c);
    setDraft({ ...c, credentials: '' });
  }, [ws.slug]);
  useEffect(() => {
    load();
  }, [load]);
  if (!cfg || !draft) return null;
  const save = async () => {
    try {
      const c = await put(`/workspaces/${ws.slug}/directory-sync`, draft);
      setCfg(c);
      setDraft({ ...c, credentials: '' });
      toast('Directory sync saved');
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  const runNow = async () => {
    try {
      const c = await post(`/workspaces/${ws.slug}/directory-sync/run`);
      setCfg(c);
      setDraft({ ...c, credentials: '' });
      toast('Sync finished');
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  const active = cfg.enabled && cfg.has_credentials && cfg.admin_email;
  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Google Workspace directory</h3>
        <span className={'tg' + (active ? ' g' : '')}>{active ? 'Active' : 'Off'}</span>
      </div>
      <p className="ds">Users and groups via Admin SDK (domain-wide delegation)</p>
      <div className="fld" style={{ marginBottom: 10 }}>
        <label>Customer ID or domain</label>
        <Input placeholder="my_customer or example.com" value={draft.customer} onChange={(e) => setDraft({ ...draft, customer: e.target.value })} />
      </div>
      <div className="fld" style={{ marginBottom: 10 }}>
        <label>Admin email to impersonate</label>
        <Input placeholder="admin@example.com" value={draft.admin_email} onChange={(e) => setDraft({ ...draft, admin_email: e.target.value })} />
      </div>
      <div className="fld" style={{ marginBottom: 10 }}>
        <label>Service account JSON</label>
        <Input.TextArea rows={4} placeholder={cfg.has_credentials ? '•••• (stored encrypted)' : '{ "client_email": … }'} value={draft.credentials} onChange={(e) => setDraft({ ...draft, credentials: e.target.value })} />
      </div>
      <div className="srow">
        <div className="l">
          <b>Enabled</b>
          <span>Sync on schedule and when you click Sync now</span>
        </div>
        <Switch on={draft.enabled} onChange={(v) => setDraft({ ...draft, enabled: v })} />
      </div>
      {cfg.last_error && <div className="mini" style={{ color: 'var(--red)', marginTop: 8 }}>{cfg.last_error}</div>}
      {cfg.last_stats && <div className="mini" style={{ marginTop: 8 }}>Last run: {JSON.stringify(cfg.last_stats)}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <button className="btn sm" onClick={runNow} disabled={!draft.enabled}>
          Sync now
        </button>
        <button className="btn p" onClick={save}>
          Save
        </button>
      </div>
    </div>
  );
}

type StorageView = {
  config: { kind: string; path?: string; s3: { bucket: string; region: string; endpoint?: string; path_style?: boolean; prefix?: string } };
  secrets: Record<string, { set: boolean; hint?: string }>;
  source: 'env' | 'settings';
  active: string;
  updated_at?: string;
  updated_by?: string;
};

function DataRetention() {
  const toast = useToast();
  const [view, setView] = useState<{ source: string; config: { events_days: number; webhook_deliveries_days: number; audit_days: number; email_days?: number }; updated_at?: string; updated_by?: string } | null>(null);
  const [cfg, setCfg] = useState<{ events_days: number; webhook_deliveries_days: number; audit_days: number; email_days: number } | null>(null);
  const [busy, setBusy] = useState('');
  useEffect(() => {
    get('/admin/settings/retention').then((v: any) => {
      setView(v);
      setCfg({
        events_days: v.config.events_days ?? 90,
        webhook_deliveries_days: v.config.webhook_deliveries_days ?? 30,
        audit_days: v.config.audit_days ?? 365,
        email_days: v.config.email_days ?? 90,
      });
    });
  }, []);
  if (!view || !cfg) return null;
  const save = async () => {
    setBusy('save');
    try {
      const v = await put('/admin/settings/retention', { config: cfg });
      setView(v);
      setCfg(v.config);
      toast('Retention saved');
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setBusy('');
    }
  };
  const reset = async () => {
    setBusy('reset');
    try {
      const v = await del('/admin/settings/retention');
      setView(v);
      setCfg(v.config);
      toast('Using server defaults');
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setBusy('');
    }
  };
  return (
    <div className="panel" style={{ maxWidth: 620 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Data retention</h3>
        <span className="tg">{view.source === 'env' ? 'Server defaults' : 'Saved setting'}</span>
      </div>
      <p className="ds">Daily purge of platform events, webhook delivery log, and audit history. Sessions expire on their own TTL.</p>
      {view.updated_at && (
        <dl className="kv" style={{ margin: '12px 0' }}>
          <dt>Updated</dt>
          <dd>
            {ago(view.updated_at)}
            {view.updated_by ? ` by ${view.updated_by}` : ''}
          </dd>
        </dl>
      )}
      <div className="fld">
        <label>Events (days)</label>
        <Input type="number" min={0} value={cfg.events_days} onChange={(e) => setCfg({ ...cfg, events_days: parseInt(e.target.value, 10) || 0 })} />
      </div>
      <div className="fld">
        <label>Webhook deliveries (days)</label>
        <Input type="number" min={0} value={cfg.webhook_deliveries_days} onChange={(e) => setCfg({ ...cfg, webhook_deliveries_days: parseInt(e.target.value, 10) || 0 })} />
      </div>
      <div className="fld">
        <label>Email outbox (days)</label>
        <Input type="number" min={0} value={cfg.email_days} onChange={(e) => setCfg({ ...cfg, email_days: parseInt(e.target.value, 10) || 0 })} />
      </div>
      <div className="fld">
        <label>Audit log (days)</label>
        <Input type="number" min={0} value={cfg.audit_days} onChange={(e) => setCfg({ ...cfg, audit_days: parseInt(e.target.value, 10) || 0 })} />
      </div>
      <p className="mini" style={{ marginTop: 8 }}>
        Audit default follows <span className="mono">MEADOW_AUDIT_RETENTION_DAYS</span> until you save here. Use 0 to keep a category forever.
      </p>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button className="btn p" disabled={!!busy} onClick={save}>
          Save
        </button>
        {view.source === 'settings' && (
          <button className="btn gh" disabled={!!busy} onClick={reset}>
            Reset to defaults
          </button>
        )}
      </div>
    </div>
  );
}

function Storage() {
  const toast = useToast();
  const [view, setView] = useState<StorageView | null>(null);
  const [cfg, setCfg] = useState<StorageView['config'] | null>(null);
  const [keyId, setKeyId] = useState('');
  const [secret, setSecret] = useState('');
  const [test, setTest] = useState<{ ok: boolean; error?: string; ms: number; backend: string } | null>(null);
  const [busy, setBusy] = useState('');
  const apply = (v: StorageView) => {
    setView(v);
    const s3 = v.config.s3;
    setCfg({
      ...v.config,
      s3: { ...s3, bucket: s3?.bucket ?? '', region: s3?.region ?? 'us-east-1' },
    });
    setKeyId('');
    setSecret('');
  };
  useEffect(() => {
    get('/admin/settings/storage').then(apply);
  }, []);
  if (!view || !cfg) return null;
  const s3 = cfg.s3;
  const setS3 = (patch: Partial<StorageView['config']['s3']>) => setCfg({ ...cfg, s3: { ...s3, ...patch } });
  const body = () => ({
    config:
      cfg.kind === 's3'
        ? { kind: 's3', s3: { ...s3, access_key_id: keyId, secret_access_key: secret } }
        : cfg.kind === 'postgres'
          ? { kind: 'postgres' }
          : { kind: 'local', path: cfg.path },
  });
  const run = async (what: string, fn: () => Promise<void>) => {
    setBusy(what);
    try {
      await fn();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setBusy('');
    }
  };
  const doTest = () => run('test', async () => setTest(await post('/admin/settings/storage/test', body())));
  const save = () =>
    run('save', async () => {
      apply(await put('/admin/settings/storage', body()));
      setTest(null);
      toast('Storage saved');
    });
  const reset = () =>
    run('reset', async () => {
      apply(await del('/admin/settings/storage'));
      setTest(null);
      toast('Using server configuration');
    });
  const secretPh = (k: string) => (view.secrets[k]?.set ? (view.secrets[k].hint ? `${view.secrets[k].hint} · stored encrypted` : '•••••••• · stored encrypted') : '');
  return (
    <div className="panel" style={{ maxWidth: 620 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Storage</h3>
        <span className="tg">{view.source === 'env' ? 'Server configuration' : 'Saved setting'}</span>
      </div>
      <p className="ds">App bundles and assets</p>
      <dl className="kv" style={{ margin: '12px 0' }}>
        <dt>Active</dt>
        <dd className="mono">{view.active}</dd>
        {view.updated_at && (
          <>
            <dt>Updated</dt>
            <dd>
              {ago(view.updated_at)}
              {view.updated_by ? ` by ${view.updated_by}` : ''}
            </dd>
          </>
        )}
      </dl>
      <div className="srow">
        <div className="l">
          <b>Backend</b>
        </div>
        <Seg
          value={cfg.kind === 's3' || cfg.kind === 'postgres' ? cfg.kind : 'local'}
          options={[
            ['local', 'Local filesystem'],
            ['s3', 'S3-compatible'],
            ['postgres', 'Database'],
          ]}
          onChange={(k) => {
            setCfg({ ...cfg, kind: k });
            setTest(null);
          }}
        />
      </div>
      {cfg.kind === 'postgres' ? null : cfg.kind !== 's3' ? (
        <div className="fld" style={{ margin: '12px 0' }}>
          <label>Path</label>
          <Input value={cfg.path} onChange={(e) => setCfg({ ...cfg, path: e.target.value })} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '12px 0' }}>
          <div className="fld">
            <label>Bucket</label>
            <Input value={s3.bucket} onChange={(e) => setS3({ bucket: e.target.value })} />
          </div>
          <div className="fld">
            <label>Region</label>
            <Input value={s3.region} onChange={(e) => setS3({ region: e.target.value })} />
          </div>
          <div className="fld" style={{ gridColumn: '1 / -1' }}>
            <label>Endpoint</label>
            <Input placeholder="Amazon S3" value={s3.endpoint} onChange={(e) => setS3({ endpoint: e.target.value })} />
          </div>
          <div className="fld">
            <label>Access key ID</label>
            <Input.Password placeholder={secretPh('s3.access_key_id')} value={keyId} onChange={(e) => setKeyId(e.target.value)} autoComplete="new-password" visibilityToggle={false} />
          </div>
          <div className="fld">
            <label>Secret access key</label>
            <Input.Password placeholder={secretPh('s3.secret_access_key')} value={secret} onChange={(e) => setSecret(e.target.value)} autoComplete="new-password" visibilityToggle={false} />
          </div>
          <div className="fld">
            <label>Key prefix</label>
            <Input placeholder="None" value={s3.prefix} onChange={(e) => setS3({ prefix: e.target.value })} />
          </div>
          <div className="srow" style={{ border: 0, padding: '18px 0 0' }}>
            <div className="l">
              <b>Path-style URLs</b>
            </div>
            <Switch on={!!s3.path_style} onChange={(v) => setS3({ path_style: v })} />
          </div>
        </div>
      )}
      {test && (
        <div className={'tg ' + (test.ok ? 'g' : 'r')} style={{ display: 'block', whiteSpace: 'normal', padding: '8px 10px', margin: '4px 0 12px', lineHeight: 1.45 }}>
          {test.ok ? `Connected to ${test.backend} · ${Math.round(test.ms)} ms` : test.error}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        {view.source === 'settings' && (
          <button className="btn gh" disabled={!!busy} onClick={reset} style={{ marginRight: 'auto' }}>
            Use server configuration
          </button>
        )}
        <button className="btn" disabled={!!busy} onClick={doTest}>
          {busy === 'test' ? 'Testing…' : 'Test connection'}
        </button>
        <button className="btn p" disabled={!!busy} onClick={save}>
          {busy === 'save' ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

type UpdateView = {
  enabled: boolean;
  disabled_by: string;
  image: string;
  current_version: string;
  latest_version: string;
  update_available: boolean;
  checked_at?: string;
  last_error?: string;
  apply_available: boolean;
  manual_check_available: boolean;
  lookup_note?: string;
};

function SoftwareUpdates() {
  const toast = useToast();
  const [view, setView] = useState<UpdateView | null>(null);
  const [applyBusy, setApplyBusy] = useState(false);
  const [applyStatus, setApplyStatus] = useState<string | null>(null);
  const [applyErr, setApplyErr] = useState<string | null>(null);
  const [checkBusy, setCheckBusy] = useState(false);
  const reload = () => get('/admin/update').then(setView);
  useEffect(() => {
    reload();
  }, []);
  const pollAfterApply = (target: string, fromVersion: string) => {
    setApplyStatus(`Updating to v${target} — Flutics will restart. This page reloads when it's back.`);
    const deadline = Date.now() + 5 * 60 * 1000;
    const tick = async () => {
      if (Date.now() > deadline) {
        setApplyErr('Update is taking longer than expected. Check the server logs.');
        setApplyStatus(null);
        setApplyBusy(false);
        return;
      }
      try {
        const st = await get<UpdateView>('/admin/update');
        setView(st);
        if (st.current_version === target || st.current_version !== fromVersion) {
          toast(`Updated to v${st.current_version}`);
          location.reload();
          return;
        }
      } catch {
        try {
          await fetch('/healthz', { credentials: 'same-origin' });
        } catch {
          /* restart in progress */
        }
      }
      window.setTimeout(tick, 3000);
    };
    window.setTimeout(tick, 3000);
  };
  const apply = () => {
    if (!view?.latest_version) return;
    const target = view.latest_version;
    Modal.confirm({
      title: 'Apply software update?',
      content: `Back up the database and restart Flutics on v${target}?`,
      okText: 'Update now',
      onOk: async () => {
        setApplyBusy(true);
        setApplyErr(null);
        const fromVersion = view.current_version;
        try {
          await post('/admin/update/apply', {});
          pollAfterApply(target, fromVersion);
        } catch (e: any) {
          toast(e.message, 'error');
          setApplyErr(e.message);
          setApplyBusy(false);
        }
      },
    });
  };
  if (!view) return null;
  const checkNow = async () => {
    setCheckBusy(true);
    try {
      const st = await post('/admin/update/check', {});
      setView(st);
      if (st.last_error) {
        toast(st.last_error, 'error');
      } else if (st.update_available) {
        toast(`Update available: v${st.latest_version}`);
      } else {
        toast('Up to date');
      }
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setCheckBusy(false);
    }
  };
  const autoOff =
    view.disabled_by === 'MEADOW_UPDATE_CHECK' ||
    view.disabled_by === 'DO_NOT_TRACK' ||
    view.disabled_by === 'MEADOW_UPDATE_IMAGE';
  const noImage = view.disabled_by === 'MEADOW_UPDATE_IMAGE' || !view.manual_check_available;
  return (
    <div className="panel" style={{ maxWidth: 620, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Software updates</h3>
        {view.update_available ? <span className="tg g">Update available: v{view.latest_version}</span> : null}
      </div>
      <p className="ds">Compares the running version with registry release tags in the same major version</p>
      <dl className="kv" style={{ margin: '12px 0' }}>
        <dt>Image</dt>
        <dd className="mono">{view.image || '—'}</dd>
        <dt>Running</dt>
        <dd className="mono">v{view.current_version}</dd>
        {view.latest_version && (
          <>
            <dt>Latest</dt>
            <dd className="mono">v{view.latest_version}</dd>
          </>
        )}
        {view.checked_at && (
          <>
            <dt>Last checked</dt>
            <dd>{ago(view.checked_at)}</dd>
          </>
        )}
        {view.last_error && (
          <>
            <dt>Last error</dt>
            <dd className="bad">{view.last_error}</dd>
          </>
        )}
      </dl>
      {autoOff && view.enabled === false && (
        <p className="sub">Automatic update checks disabled by the server environment ({view.disabled_by})</p>
      )}
      {view.lookup_note && <p className="sub">{view.lookup_note}</p>}
      {applyStatus && <p className="sub">{applyStatus}</p>}
      {applyErr && <p className="bad">{applyErr}</p>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn" disabled={checkBusy || noImage} onClick={checkNow}>
          {checkBusy ? 'Checking…' : 'Check for updates'}
        </button>
        {view.apply_available && view.update_available && (
          <button className="btn p" disabled={applyBusy || !!applyStatus} onClick={apply}>
            {applyBusy && !applyStatus ? 'Backing up…' : 'Update now'}
          </button>
        )}
      </div>
    </div>
  );
}

type TelemetryView = {
  enabled: boolean;
  admin_enabled: boolean;
  disabled_by: '' | 'admin' | 'MEADOW_TELEMETRY' | 'DO_NOT_TRACK';
  endpoint: string;
  interval_hours: number;
  installation_id: string;
  last_sent_at?: string;
  last_status: string;
  next_run_at?: string;
  payload: unknown;
  last_payload?: unknown;
};

function Telemetry() {
  const toast = useToast();
  const [view, setView] = useState<TelemetryView | null>(null);
  const [show, setShow] = useState<'' | 'next' | 'last'>('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    get('/admin/telemetry').then(setView);
  }, []);
  if (!view) return null;
  const envOff = view.disabled_by === 'MEADOW_TELEMETRY' || view.disabled_by === 'DO_NOT_TRACK';
  const toggle = async (on: boolean) => {
    setBusy(true);
    try {
      setView(await put('/admin/telemetry', { enabled: on }));
      toast(on ? 'Telemetry on' : 'Telemetry off');
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  const status = view.enabled ? 'On' : envOff ? `Off · ${view.disabled_by === 'DO_NOT_TRACK' ? 'DO_NOT_TRACK=1' : 'MEADOW_TELEMETRY=off'}` : 'Off';
  return (
    <div className="panel" style={{ maxWidth: 620 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Telemetry</h3>
        <span className={'tg ' + (view.enabled ? 'g' : '')}>{status}</span>
      </div>
      <p className="ds">Anonymous, aggregate usage report sent once a day by one instance</p>
      <dl className="kv" style={{ margin: '12px 0' }}>
        <dt>Endpoint</dt>
        <dd className="mono">{view.endpoint}</dd>
        <dt>Installation ID</dt>
        <dd className="mono">{view.installation_id}</dd>
        <dt>Last sent</dt>
        <dd>
          {view.last_sent_at ? ago(view.last_sent_at) : 'Never'}
          {view.last_status ? <span className="sub"> · {view.last_status}</span> : null}
        </dd>
        {view.enabled && view.next_run_at && (
          <>
            <dt>Next report</dt>
            <dd>{fmtDate(view.next_run_at)}</dd>
          </>
        )}
      </dl>
      <div className="srow">
        <div className="l">
          <b>Send usage report</b>
          {envOff && <span>Disabled by the server environment</span>}
        </div>
        <Switch on={view.enabled} disabled={envOff || busy} onChange={toggle} />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <button className="btn" onClick={() => setShow('next')}>
          View payload
        </button>
      </div>
      <Modal
        title="Telemetry payload"
        open={!!show}
        onCancel={() => setShow('')}
        footer={null}
        width={640}
      >
        {view.last_payload ? (
          <div style={{ marginBottom: 10 }}>
            <Seg
              value={show || 'next'}
              options={[
                ['next', 'Next report'],
                ['last', 'Last sent'],
              ]}
              onChange={(k) => setShow(k as 'next' | 'last')}
            />
          </div>
        ) : null}
        <div className="code-view">{JSON.stringify(show === 'last' ? view.last_payload : view.payload, null, 2)}</div>
      </Modal>
    </div>
  );
}

function WorkspaceGeneralAdmin() {
  const { ws, reloadMe } = useShell();
  const toast = useToast();
  const [displayName, setDisplayName] = useState(ws.name);
  const [form, setForm] = useState({ icon_url: '', accent_color: '' });
  const [preview, setPreview] = useState<Branding | undefined>();
  const [sharing, setSharing] = useState<boolean | null>(null);
  useEffect(() => {
    setDisplayName(ws.name);
    get(`/workspaces/${ws.slug}/branding`).then((b: Branding) => {
      setPreview(b);
      setForm({
        icon_url: b.icon_url?.startsWith('/api/') ? '' : b.icon_url || '',
        accent_color: b.accent_color || '',
      });
    });
    get(`/workspaces/${ws.slug}/sharing-settings`)
      .then((r: any) => setSharing(!!r.sharing_enabled))
      .catch(() => setSharing(null));
  }, [ws.slug, ws.name]);
  const saveSharing = async (on: boolean) => {
    try {
      await put(`/workspaces/${ws.slug}/sharing-settings`, { sharing_enabled: on });
      setSharing(on);
      toast(on ? 'Cross-workspace sharing enabled' : 'Cross-workspace sharing disabled');
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  const saveName = async () => {
    try {
      await patch(`/workspaces/${ws.slug}`, { name: displayName.trim() });
      await reloadMe();
      toast('Workspace name saved');
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  const saveBranding = async () => {
    try {
      const b = await put(`/workspaces/${ws.slug}/branding`, {
        icon_url: form.icon_url,
        accent_color: form.accent_color,
      });
      setPreview(b);
      toast('Workspace appearance saved');
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  const upload = async (file: File | null) => {
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const b = await api('POST', `/workspaces/${ws.slug}/branding/icon`, fd);
      setPreview(b);
      toast('Icon uploaded');
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  return (
    <div className="panel" style={{ maxWidth: 620 }}>
      <p style={{ color: 'var(--tx3)', fontSize: 12.5, marginTop: 0 }}>
        Workspace display name and optional icon or accent color in the shell switcher. Company branding is configured under Instance → Company &amp; branding.
      </p>
      <div className="srow">
        <div className="l">
          <b>Display name</b>
        </div>
        <input className="inp" style={{ width: 280 }} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <button type="button" className="btn sm" onClick={saveName}>
          Save name
        </button>
      </div>
      <div className="srow">
        <div className="l">
          <b>Cross-workspace sharing</b>
          <span>Off by default. Grants only the operate level to people, workspaces, groups or public links.</span>
        </div>
        <Switch on={!!sharing} onChange={saveSharing} disabled={sharing === null} />
      </div>
      <div className="srow">
        <div className="l">
          <b>Accent color</b>
          <span>Optional; defaults to company primary</span>
        </div>
        <ColorPicker
          format="hex"
          disabledAlpha
          allowClear
          value={form.accent_color || undefined}
          onChange={(color, hex) => setForm({ ...form, accent_color: color ? hex : '' })}
        />
      </div>
      <div className="srow">
        <div className="l">
          <b>Icon URL</b>
          <span>Or upload below</span>
        </div>
        <input className="inp" style={{ width: 280 }} value={form.icon_url} onChange={(e) => setForm({ ...form, icon_url: e.target.value })} placeholder="https://…" />
      </div>
      <div className="srow">
        <div className="l">
          <b>Icon file</b>
        </div>
        <input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0] || null)} />
        {preview?.icon_url && <span style={{ fontSize: 12, color: 'var(--tx3)' }}>Current icon set</span>}
      </div>
      <button type="button" className="btn p" onClick={saveBranding} style={{ marginTop: 8 }}>
        Save appearance
      </button>
    </div>
  );
}

type AllowItem = { pattern: string; source: string };
type AllowKind = { env: AllowItem[]; instance: AllowItem[]; org: AllowItem[]; workspace: AllowItem[] };
type AllowPage = { org_slug: string; org_name: string; webhook: AllowKind; egress: AllowKind };

function AllowRows({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const p = draft.trim();
    if (!p || items.includes(p)) return;
    onChange([...items, p]);
    setDraft('');
  };
  return (
    <>
      {items.map((p) => (
        <div key={p} className="srow">
          <span className="mono" style={{ flex: 1 }}>{p}</span>
          <button className="btn" onClick={() => onChange(items.filter((x) => x !== p))}>Remove</button>
        </div>
      ))}
      <div className="srow" style={{ gap: 8 }}>
        <input className="inp" style={{ flex: 1 }} value={draft} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
        <button className="btn" onClick={add}>Add</button>
      </div>
    </>
  );
}

function ReadOnlyPatterns({ label, items }: { label: string; items: AllowItem[] }) {
  return (
    <div className="srow">
      <div className="l"><b>{label}</b><span>Read-only</span></div>
      <div>
        {items.length === 0 && <span style={{ color: 'var(--tx3)' }}>None</span>}
        {items.map((i) => (
          <span key={i.pattern} className="tg" style={{ marginRight: 6 }}>{i.pattern}</span>
        ))}
      </div>
    </div>
  );
}

function AllowlistEditor({
  title,
  kind,
  view,
  orgSlug,
  instanceAdmin,
  instanceOnly,
  onSaved,
}: {
  title: string;
  kind: 'webhook' | 'egress';
  view: AllowKind;
  orgSlug: string;
  instanceAdmin: boolean;
  instanceOnly: boolean;
  onSaved: () => void;
}) {
  const { ws } = useShell();
  const toast = useToast();
  const [rows, setRows] = useState<string[]>(() => (view.workspace || []).map((i) => i.pattern));
  const [inst, setInst] = useState<string[]>(() => (view.instance || []).map((i) => i.pattern));
  const [orgRows, setOrgRows] = useState<string[]>(() => (view.org || []).map((i) => i.pattern));
  useEffect(() => {
    setRows((view.workspace || []).map((i) => i.pattern));
    setInst((view.instance || []).map((i) => i.pattern));
    setOrgRows((view.org || []).map((i) => i.pattern));
  }, [view]);
  const save = async (run: () => Promise<unknown>, ok: string) => {
    try {
      await run();
      toast(ok);
      onSaved();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  return (
    <div className="panel" style={{ maxWidth: 720, marginBottom: 16 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <ReadOnlyPatterns label="Environment" items={view.env || []} />
      {instanceOnly && !instanceAdmin && <ReadOnlyPatterns label="Instance" items={view.instance || []} />}
      {!instanceOnly && !instanceAdmin && <ReadOnlyPatterns label="Organization" items={view.org || []} />}
      {!instanceOnly && !instanceAdmin && <ReadOnlyPatterns label="Instance" items={view.instance || []} />}
      {!instanceOnly && (
        <>
          <div className="srow"><div className="l"><b>Workspace</b></div></div>
          <AllowRows items={rows} onChange={setRows} placeholder="resultados.tse.jus.br" />
          <button className="btn p" style={{ marginTop: 8 }} onClick={() => save(() => put(`/workspaces/${ws.slug}/allowlists/${kind}`, { entries: rows }), 'Saved')}>Save</button>
        </>
      )}
      {!instanceOnly && instanceAdmin && (
        <>
          <div className="srow" style={{ marginTop: 16 }}><div className="l"><b>Organization</b><span>{orgSlug}</span></div></div>
          <AllowRows items={orgRows} onChange={setOrgRows} placeholder="*.example.com" />
          <button className="btn" style={{ marginTop: 8 }} onClick={() => save(() => put(`/admin/allowlists/${kind}`, { scope: 'org', org: orgSlug, entries: orgRows }), 'Saved')}>Save organization</button>
        </>
      )}
      {instanceAdmin && (
        <>
          <div className="srow" style={{ marginTop: 16 }}><div className="l"><b>Instance</b></div></div>
          <AllowRows items={inst} onChange={setInst} placeholder="example.com" />
          <button className={instanceOnly ? 'btn p' : 'btn'} style={{ marginTop: 8 }} onClick={() => save(() => put(`/admin/allowlists/${kind}`, { scope: 'instance', entries: inst }), 'Saved')}>Save instance</button>
        </>
      )}
    </div>
  );
}

function AllowlistsAdmin() {
  const { ws, me } = useShell();
  const [page, setPage] = useState<AllowPage | null>(null);
  const load = () => get(`/workspaces/${ws.slug}/allowlists`).then(setPage);
  useEffect(() => {
    get(`/workspaces/${ws.slug}/allowlists`).then(setPage);
  }, [ws.slug]);
  if (!page) return null;
  return (
    <>
      <AllowlistEditor title="Webhook allowlist" kind="webhook" view={page.webhook} orgSlug={page.org_slug} instanceAdmin={!!me.instance_admin} instanceOnly={false} onSaved={load} />
      <AllowlistEditor title="Egress allowlist" kind="egress" view={page.egress} orgSlug={page.org_slug} instanceAdmin={!!me.instance_admin} instanceOnly onSaved={load} />
    </>
  );
}

function EmailAdmin() {
  const { ws, me } = useShell();
  const toast = useToast();
  const [wsCfg, setWsCfg] = useState<any>(null);
  const [instCfg, setInstCfg] = useState<any>(null);
  const [outbox, setOutbox] = useState<any[]>([]);
  const [testTo, setTestTo] = useState('');
  useEffect(() => {
    get(`/workspaces/${ws.slug}/email`).then(setWsCfg);
    get(`/workspaces/${ws.slug}/email/outbox`).then((r: any) => setOutbox(r.items || []));
    if (me.instance_admin) get('/admin/settings/email').then(setInstCfg);
  }, [ws.slug, me.instance_admin]);
  if (!wsCfg) return null;
  const saveWs = async () => {
    await put(`/workspaces/${ws.slug}/email`, wsCfg);
    toast('Email settings saved');
  };
  const saveInst = async () => {
    if (!instCfg) return;
    await put('/admin/settings/email', { config: instCfg.config });
    toast('Instance email saved');
  };
  const testSend = async () => {
    try {
      const r = await post(`/workspaces/${ws.slug}/email/test`, { to: testTo });
      toast(r.ok ? 'Test sent' : r.error || 'Test failed', r.ok ? 'success' : 'error');
    } catch (e: any) {
      toast(e.message || 'Test failed', 'error');
    }
  };
  return (
    <>
      {me.instance_admin && instCfg && (
        <div className="panel" style={{ maxWidth: 720, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Instance SMTP</h3>
          <div className="fld">
            <label>From address</label>
            <Input value={instCfg.config?.from_address || ''} onChange={(e) => setInstCfg({ ...instCfg, config: { ...instCfg.config, from_address: e.target.value } })} />
          </div>
          <div className="fld">
            <label>SMTP host</label>
            <Input value={instCfg.config?.smtp?.host || ''} onChange={(e) => setInstCfg({ ...instCfg, config: { ...instCfg.config, smtp: { ...(instCfg.config?.smtp || {}), host: e.target.value } } })} />
          </div>
          <div className="fld">
            <label>Port / TLS</label>
            <Input style={{ width: 100, marginRight: 8 }} type="number" value={instCfg.config?.smtp?.port || 587} onChange={(e) => setInstCfg({ ...instCfg, config: { ...instCfg.config, smtp: { ...(instCfg.config?.smtp || {}), port: parseInt(e.target.value, 10) } } })} />
            <Select style={{ width: 140 }} value={instCfg.config?.smtp?.tls || 'starttls'} onChange={(v) => setInstCfg({ ...instCfg, config: { ...instCfg.config, smtp: { ...(instCfg.config?.smtp || {}), tls: v } } })} options={[{ value: 'starttls', label: 'STARTTLS' }, { value: 'implicit', label: 'Implicit TLS' }]} />
          </div>
          <div className="fld">
            <label>Password secret (vault name)</label>
            <Input placeholder={instCfg.config?.smtp?.password_secret_set ? '•••• (set)' : 'smtp_password'} onChange={(e) => setInstCfg({ ...instCfg, config: { ...instCfg.config, smtp: { ...(instCfg.config?.smtp || {}), password_secret: e.target.value } } })} />
          </div>
          <button className="btn p" onClick={saveInst}>
            Save instance email
          </button>
        </div>
      )}
      <div className="panel" style={{ maxWidth: 720, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Workspace email</h3>
        <div className="srow">
          <div className="l">
            <b>Enabled</b>
          </div>
          <Switch on={wsCfg.enabled !== false} onChange={(v) => setWsCfg({ ...wsCfg, enabled: v })} />
        </div>
        <div className="fld">
          <label>From address</label>
          <Input value={wsCfg.from_address || ''} onChange={(e) => setWsCfg({ ...wsCfg, from_address: e.target.value })} />
        </div>
        <div className="fld">
          <label>Test send to</label>
          <Input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@example.com" />
          <button className="btn sm" style={{ marginTop: 8 }} onClick={testSend}>
            Send test
          </button>
        </div>
        <button className="btn p" onClick={saveWs}>
          Save workspace email
        </button>
      </div>
      <div className="panel" style={{ maxWidth: 920 }}>
        <h3 style={{ marginTop: 0 }}>Delivery log</h3>
        <table className="tbl">
          <thead>
            <tr>
              <th>Status</th>
              <th>Subject</th>
              <th>To</th>
              <th>App</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {outbox.map((r) => (
              <tr key={r.id}>
                <td>{r.status}</td>
                <td>{r.subject}</td>
                <td className="mono mini">{(r.to_addrs || []).join(', ')}</td>
                <td>{r.app_slug}</td>
                <td>
                  {r.status === 'failed' && (
                    <button className="btn sm" onClick={() => post(`/workspaces/${ws.slug}/email/outbox/${r.id}/retry`).then(() => get(`/workspaces/${ws.slug}/email/outbox`).then((x: any) => setOutbox(x.items || [])))}>
                      Retry
                    </button>
                  )}
                  {(r.status === 'queued' || r.status === 'failed') && (
                    <button className="btn sm gh" onClick={() => post(`/workspaces/${ws.slug}/email/outbox/${r.id}/cancel`).then(() => get(`/workspaces/${ws.slug}/email/outbox`).then((x: any) => setOutbox(x.items || [])))}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function Settings() {
  return <SettingsLayout />;
}

export {
  Profile,
  Appearance,
  ConnectedApps,
  Tokens,
  SSO,
  EmailAdmin,
  QuotasAdmin,
  AllowlistsAdmin,
  DataRetention,
  Storage,
  SoftwareUpdates,
  Telemetry,
  OAuthAdmin,
  WorkspaceGeneralAdmin,
};
