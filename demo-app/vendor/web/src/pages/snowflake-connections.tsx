import { AutoComplete, Input, Modal, Select } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { del, get, post, put } from '../api';
import { I } from '../icons';
import { useShell } from '../shell';
import { adminConnectAndTestURL, connectedParam, snowflakeConnectURL, snowflakeRedirectURL, SF_CONNECTED_PARAM, userConnectAndTestURL, userConnectURL, warehouseOptions, workspaceOptions, type WorkspaceLite } from '../snowflakeConn';
import { copy, useToast } from '../util';

type AdminConn = {
  id: string;
  name: string;
  kind: string;
  account: string;
  auth_method: string;
  oauth_client_id?: string;
  has_secret: boolean;
  service_user?: string;
  private_key_secret?: string;
  default_role: string;
  default_warehouse: string;
  warehouses: string[];
  allowed_roles: string[];
  availability: string;
  workspaces?: string[];
  workspace_ids?: string[];
  oauth_redirect_url?: string;
};

function RedirectURL({ url }: { url: string }) {
  const toast = useToast();
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Input readOnly value={url} className="mono" />
      <button type="button" className="btn sm gh" onClick={() => copy(url).then(() => toast('Copied to clipboard'))}>
        Copy
      </button>
    </div>
  );
}

type TestResult = { ok: boolean; current_user?: string; current_role?: string; current_warehouse?: string; error?: string; busy?: boolean };

function TestResultLine({ r }: { r?: TestResult }) {
  if (!r) return null;
  if (r.busy) return <div className="muted">Testing…</div>;
  if (!r.ok) return <div style={{ color: 'var(--err, #c0392b)' }}>Test failed: {r.error}</div>;
  return (
    <div className="mono" style={{ color: 'var(--ok, #2e7d32)' }}>
      OK · user {r.current_user || '—'} · role {r.current_role || '—'} · warehouse {r.current_warehouse || '—'}
    </div>
  );
}

function promptConnect(message: string, url: string, okText = 'Connect Snowflake') {
  Modal.confirm({
    title: 'Connect your Snowflake account',
    content: message,
    okText,
    onOk: () => {
      window.location.href = url;
    },
  });
}

// Back from "Connect & test": run the test once and drop the marker from the URL.
function useConnectedReturnTest(test: (id: string) => void) {
  useEffect(() => {
    const id = connectedParam(window.location.search);
    if (!id) return;
    const u = new URL(window.location.href);
    u.searchParams.delete(SF_CONNECTED_PARAM);
    window.history.replaceState(window.history.state, '', u.pathname + u.search + u.hash);
    test(id);
  }, [test]);
}

const emptyAdmin = (): Partial<AdminConn> & { oauth_client_secret?: string; workspace_ids?: string[] } => ({
  name: '',
  account: '',
  auth_method: 'oauth_user',
  oauth_client_id: '',
  oauth_client_secret: '',
  default_role: '',
  default_warehouse: '',
  warehouses: [],
  allowed_roles: [],
  availability: 'selected',
  workspace_ids: [],
});

export function InstanceConnectionsAdmin() {
  const toast = useToast();
  const [list, setList] = useState<AdminConn[] | null>(null);
  const [form, setForm] = useState<(ReturnType<typeof emptyAdmin> & { id?: string; has_secret?: boolean }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceLite[]>([]);
  const [whFetched, setWhFetched] = useState<string[]>([]);
  const [whNote, setWhNote] = useState('');
  const load = useCallback(async () => setList(await get('/admin/connections')), []);
  useEffect(() => {
    load();
    get('/admin/workspaces')
      .then((r: { items?: WorkspaceLite[] }) => setWorkspaces(r.items || []))
      .catch(() => {});
  }, [load]);
  const formId = form?.id;
  const formOpen = !!form;
  useEffect(() => {
    setWhFetched([]);
    if (!formId) {
      setWhNote(formOpen ? 'Save the connection first; warehouses load from Snowflake once it exists.' : '');
      return;
    }
    setWhNote('Loading warehouses from Snowflake…');
    get(`/admin/connections/${formId}/warehouses`)
      .then((r: { items?: string[] }) => {
        setWhFetched(r.items || []);
        setWhNote(r.items?.length ? '' : 'Snowflake returned no warehouses for this role.');
      })
      .catch((e: any) =>
        setWhNote(snowflakeConnectURL(e) ? 'Use Connect & test on this connection to sign in to Snowflake and load warehouses. You can still type names.' : `Could not load warehouses: ${e.message}`),
      );
  }, [formId, formOpen]);
  const redirectURL = snowflakeRedirectURL(list, window.location.origin);
  const save = async () => {
    if (!form?.name?.trim() || !form.account?.trim()) return;
    setBusy(true);
    try {
      const body = { ...form, kind: 'snowflake', workspace_ids: form.workspace_ids || [] };
      if (form.id) await put(`/admin/connections/${form.id}`, body);
      else await post('/admin/connections', body);
      toast(form.id ? 'Connection saved' : 'Connection created');
      setForm(null);
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const connectAndTest = (id: string) => {
    window.location.href = adminConnectAndTestURL(id, window.location.pathname);
  };
  const test = useCallback(async (id: string) => {
    setResults((m) => ({ ...m, [id]: { ok: false, busy: true } }));
    try {
      const r = await post(`/admin/connections/${id}/test`, {});
      setResults((m) => ({ ...m, [id]: r }));
    } catch (e: any) {
      setResults((m) => ({ ...m, [id]: { ok: false, error: e.message } }));
      if (snowflakeConnectURL(e)) promptConnect(e.message, adminConnectAndTestURL(id, window.location.pathname), 'Connect & test');
    }
  }, []);
  // Back from "Connect & test": run the test once and drop the marker from the URL.
  useConnectedReturnTest(test);
  if (!list) return null;
  const set = (p: Partial<typeof form>) => setForm({ ...form!, ...p });
  return (
    <>
      <div className="pg-h" style={{ marginBottom: 10 }}>
        <p style={{ margin: 0 }}>Global Snowflake connections. Workspaces opt in under Settings → Workspace → Connections.</p>
        <button className="btn p" onClick={() => setForm(emptyAdmin())}>
          <I n="plus" /> Add connection
        </button>
      </div>
      <div className="fld" style={{ marginBottom: 12 }}>
        <label>OAuth redirect URL (use as OAUTH_REDIRECT_URI in the Snowflake security integration)</label>
        <RedirectURL url={redirectURL} />
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Name</th>
            <th>Auth</th>
            <th>Account</th>
            <th>Availability</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {list.map((c) => (
            <tr key={c.id}>
              <td className="mono">
                <b>{c.name}</b>
              </td>
              <td>{c.auth_method}</td>
              <td className="mono">{c.account}</td>
              <td>{c.availability}</td>
              <td>
                <TestResultLine r={results[c.id]} />
                <div className="acts">
                  {c.auth_method === 'oauth_user' ? (
                    <button className="btn sm gh" title="Sign in to Snowflake as yourself, then run the test" onClick={() => connectAndTest(c.id)}>
                      Connect &amp; test
                    </button>
                  ) : (
                    <button className="btn sm gh" onClick={() => test(c.id)}>
                      Test
                    </button>
                  )}
                  <button className="btn sm gh" onClick={() => setForm({ ...emptyAdmin(), ...c, workspace_ids: c.workspace_ids || [], oauth_client_secret: '' })}>
                    Edit
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Modal open={!!form} title={form?.id ? `Edit ${form.name}` : 'Add Snowflake connection'} onCancel={() => setForm(null)} onOk={save} confirmLoading={busy} width={640} destroyOnClose>
        {form && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="fld">
              <label>Name</label>
              <Input disabled={!!form.id} value={form.name} onChange={(e) => set({ name: e.target.value })} className="mono" />
            </div>
            <div className="fld">
              <label>Account</label>
              <Input value={form.account} onChange={(e) => set({ account: e.target.value })} className="mono" />
            </div>
            <div className="fld">
              <label>Auth</label>
              <Select
                value={form.auth_method || 'oauth_user'}
                options={[
                  { value: 'oauth_user', label: 'User OAuth' },
                  { value: 'keypair', label: 'Key pair (service user)' },
                ]}
                onChange={(v) => set({ auth_method: v })}
              />
            </div>
            <div className="fld">
              <label>Default role</label>
              <Input value={form.default_role} onChange={(e) => set({ default_role: e.target.value })} className="mono" />
            </div>
            {form.auth_method === 'keypair' && (
              <>
                <div className="fld">
                  <label>Service user</label>
                  <Input value={form.service_user} onChange={(e) => set({ service_user: e.target.value })} className="mono" />
                </div>
                <div className="fld">
                  <label>Private key secret</label>
                  <Input value={form.private_key_secret} onChange={(e) => set({ private_key_secret: e.target.value })} className="mono" placeholder="instance vault name" />
                </div>
                <div className="fld" style={{ gridColumn: '1 / -1' }}>
                  <label>Allowed roles</label>
                  <Select mode="tags" value={form.allowed_roles} onChange={(v) => set({ allowed_roles: v })} style={{ width: '100%' }} />
                </div>
              </>
            )}
            {form.auth_method !== 'keypair' && (
              <>
                <div className="fld">
                  <label>OAuth client ID</label>
                  <Input value={form.oauth_client_id} onChange={(e) => set({ oauth_client_id: e.target.value })} className="mono" />
                </div>
                <div className="fld">
                  <label>OAuth client secret</label>
                  <Input.Password
                    value={form.oauth_client_secret}
                    onChange={(e) => set({ oauth_client_secret: e.target.value })}
                    visibilityToggle={false}
                    placeholder={form.has_secret ? 'Stored — leave blank to keep' : ''}
                  />
                </div>
                <div className="fld" style={{ gridColumn: '1 / -1' }}>
                  <label>OAuth redirect URL</label>
                  <RedirectURL url={redirectURL} />
                </div>
              </>
            )}
            <div className="fld">
              <label>Default warehouse</label>
              <AutoComplete
                value={form.default_warehouse}
                options={warehouseOptions(form.warehouses, whFetched)}
                onChange={(v) => set({ default_warehouse: v })}
                className="mono"
                filterOption={(input, o) => String(o?.value ?? '').toUpperCase().includes(input.toUpperCase())}
              />
            </div>
            <div className="fld" style={{ gridColumn: '1 / -1' }}>
              <label>Allowed warehouses</label>
              <Select mode="tags" value={form.warehouses} options={warehouseOptions(whFetched)} onChange={(v) => set({ warehouses: v })} style={{ width: '100%' }} />
              {whNote && <div className="ds">{whNote}</div>}
            </div>
            <div className="fld">
              <label>Availability</label>
              <Select
                value={form.availability || 'selected'}
                options={[
                  { value: 'all', label: 'All workspaces' },
                  { value: 'selected', label: 'Selected workspaces' },
                ]}
                onChange={(v) => set({ availability: v })}
              />
            </div>
            {form.availability === 'selected' && (
              <div className="fld">
                <label>Workspaces</label>
                <Select
                  mode="multiple"
                  value={form.workspace_ids}
                  options={workspaceOptions(workspaces, form.workspace_ids)}
                  optionFilterProp="label"
                  onChange={(v) => set({ workspace_ids: v })}
                  style={{ width: '100%' }}
                  placeholder="Select workspaces"
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

type WSConn = {
  id: string;
  name: string;
  kind: string;
  account: string;
  auth_method: string;
  require_group: string;
  allowed_roles: string[];
  default_role: string;
  default_warehouse: string;
  warehouses: string[];
  used_by?: { slug: string; name: string }[];
};

export function WorkspaceConnectionsAdmin() {
  const { ws } = useShell();
  const toast = useToast();
  const [enabled, setEnabled] = useState<WSConn[]>([]);
  const [available, setAvailable] = useState<AdminConn[]>([]);
  const [alias, setAlias] = useState('');
  const [pick, setPick] = useState<string | undefined>();
  const [requireGroup, setRequireGroup] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const base = `/workspaces/${ws.slug}/connections`;
  const load = useCallback(async () => {
    setEnabled(await get(base));
    setAvailable(await get(`${base}/available`));
  }, [base]);
  useEffect(() => {
    load();
  }, [load]);
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const test = useCallback(
    async (id: string) => {
      setResults((m) => ({ ...m, [id]: { ok: false, busy: true } }));
      try {
        const r = await post(`${base}/${id}/test`, {});
        setResults((m) => ({ ...m, [id]: r }));
      } catch (e: any) {
        setResults((m) => ({ ...m, [id]: { ok: false, error: e.message } }));
        if (snowflakeConnectURL(e)) promptConnect(e.message, userConnectAndTestURL(id, window.location.pathname), 'Connect & test');
      }
    },
    [base],
  );
  useConnectedReturnTest(test);
  const enable = async () => {
    if (!pick || !alias.trim()) return;
    try {
      await post(`${base}/enable`, { connection_id: pick, alias: alias.trim(), require_group: requireGroup.trim(), allowed_roles: roles });
      toast('Connection enabled');
      setPick(undefined);
      setAlias('');
      setRequireGroup('');
      setRoles([]);
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  const disable = (id: string) =>
    Modal.confirm({
      title: 'Disable this connection in the workspace?',
      okText: 'Disable',
      onOk: async () => {
        await del(`${base}/${id}`);
        toast('Disabled');
        load();
      },
    });
  return (
    <>
      <p>Snowflake connections enabled in {ws.name}. Instance admins register connections globally.</p>
      <p className="ds">Test checks connection and authentication health with the configured default identity. It does not evaluate a particular app query's group gate or requested role.</p>
      <table className="tbl">
        <thead>
          <tr>
            <th>Alias</th>
            <th>Account</th>
            <th>Auth</th>
            <th>Require group</th>
            <th>Workspace roles</th>
            <th>Used by</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {enabled.map((c) => (
            <tr key={c.id}>
              <td className="mono">{c.name}</td>
              <td className="mono">{c.account}</td>
              <td>{c.auth_method || '—'}</td>
              <td className="mono">{c.require_group || '—'}</td>
              <td className="mono">{c.allowed_roles?.length ? c.allowed_roles.join(', ') : '—'}</td>
              <td>{c.used_by?.length ? c.used_by.map((a) => a.name).join(', ') : '—'}</td>
              <td>
                <TestResultLine r={results[c.id]} />
                <div className="acts">
                  <button className="btn sm gh" onClick={() => test(c.id)}>
                    Test
                  </button>
                  <button className="btn sm gh" onClick={() => disable(c.id)}>
                    Disable
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {available.length > 0 && (
        <div className="panel" style={{ marginTop: 16 }}>
          <h4 style={{ marginTop: 0 }}>Enable a connection</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Select style={{ minWidth: 220 }} placeholder="Connection" value={pick} onChange={setPick} options={available.map((c) => ({ value: c.id, label: c.name }))} />
            <Input placeholder="Manifest alias" value={alias} onChange={(e) => setAlias(e.target.value)} className="mono" style={{ width: 160 }} />
            <Input placeholder="Require group (optional)" value={requireGroup} onChange={(e) => setRequireGroup(e.target.value)} className="mono" style={{ width: 180 }} />
            <Select mode="tags" placeholder="Workspace roles (optional)" value={roles} onChange={setRoles} style={{ minWidth: 220 }} />
            <button className="btn p" onClick={enable}>
              Enable
            </button>
          </div>
        </div>
      )}
    </>
  );
}

type MyConn = {
  connection_id: string;
  alias: string;
  workspace: string;
  account: string;
  auth_method: string;
  status: string;
  identity: string;
};

// Status labels come straight from the API's per-connection status; unknown
// values render as-is so new server states stay visible.
const MY_CONN_STATUS: Record<string, string> = { connected: 'Connected', not_connected: 'Not connected', not_required: 'No sign-in needed' };

export function ProfileSnowflake() {
  const toast = useToast();
  const [rows, setRows] = useState<MyConn[]>([]);
  const load = useCallback(async () => setRows(await get('/me/snowflake/connections')), []);
  useEffect(() => {
    load();
  }, [load]);
  const connect = (id: string) => {
    window.location.href = userConnectURL(id, window.location.pathname);
  };
  const disconnect = async (id: string) => {
    try {
      await del(`/me/snowflake/connections/${id}`);
      toast('Disconnected');
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  return (
    <div className="panel" style={{ marginTop: 16 }}>
      <h3 style={{ marginTop: 0 }}>My connections</h3>
      <p className="ds">Data sources available to you in your workspaces. Your Snowflake sign-in is shared across workspaces using the same connection.</p>
      {!rows.length ? (
        <p className="ds">
          No connections are enabled in your workspaces yet. An instance admin makes a connection available to a workspace (Settings → Instance → Connections), then a workspace admin enables it with an
          alias (Settings → Workspace → Connections). It then shows up here.
        </p>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>Workspace</th>
              <th>Connection</th>
              <th>Account</th>
              <th>Auth</th>
              <th>Status</th>
              <th>Identity used</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.connection_id + r.workspace + r.alias}>
                <td>{r.workspace}</td>
                <td className="mono">{r.alias}</td>
                <td className="mono">{r.account}</td>
                <td>{r.auth_method || '—'}</td>
                <td>
                  <span className={'tg' + (r.status === 'connected' ? ' g' : '')}>{MY_CONN_STATUS[r.status] ?? r.status}</span>
                </td>
                <td className="mono">{r.identity || '—'}</td>
                <td>
                  {r.auth_method !== 'oauth_user' ? null : r.status === 'connected' ? (
                    <button className="btn sm gh" onClick={() => disconnect(r.connection_id)}>
                      Disconnect
                    </button>
                  ) : (
                    <button className="btn sm p" onClick={() => connect(r.connection_id)}>
                      Connect
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
