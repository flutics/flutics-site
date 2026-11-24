import { useCallback, useEffect, useState } from 'react';
import { Input, Modal, Select } from 'antd';
import { del, get, post } from '../api';
import { useShell } from '../shell';
import { ago, copy, fmtDate, useToast } from '../util';

export type TokenRow = {
  id: string;
  name: string;
  prefix: string;
  workspace?: string;
  scopes: string[];
  created_at: string;
  expires_at?: string;
  last_used_at?: string;
};

type Props = {
  listPath: string;
  createPath: string;
  deletePath: (id: string) => string;
  blurb: string;
  createLabel: string;
  /** Personal tokens pick a workspace and an expiry; service tokens do neither. */
  withWorkspace?: boolean;
  withExpiry?: boolean;
  defaultWorkspace?: string;
  /** Scopes pre-selected in the create form; each view knows its own sensible default. */
  defaultScopes: string[];
  /** Instance tokens may also carry instance-wide scopes (instance:admin). */
  withInstanceScopes?: boolean;
};

// One manager for personal and service tokens: the endpoints differ, the table,
// the one-time reveal and the scope picker do not.
export function TokenManager({ listPath, createPath, deletePath, blurb, createLabel, withWorkspace, withExpiry, defaultWorkspace, defaultScopes, withInstanceScopes }: Props) {
  const { ws, me } = useShell();
  const toast = useToast();
  const [rows, setRows] = useState<TokenRow[]>([]);
  const [perms, setPerms] = useState<string[]>([]);
  const [created, setCreated] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; workspace: string; scopes: string[]; days: number } | null>(null);

  const load = useCallback(
    () =>
      get(listPath)
        .then((r: TokenRow[]) => setRows(r || []))
        .catch((e: any) => toast(e.message, 'error')),
    [listPath, toast],
  );
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    get('/permissions')
      .then((r: any) => setPerms(withInstanceScopes ? [...(r.all || []), ...(r.instance || [])] : r.all || []))
      .catch((e: any) => toast(e.message, 'error'));
  }, [toast, withInstanceScopes]);

  const create = async () => {
    if (!form) return;
    try {
      const body: Record<string, unknown> = { name: form.name, scopes: form.scopes };
      if (withWorkspace) body.workspace = form.workspace || '';
      if (withExpiry) body.days = form.days;
      const r = await post(createPath, body);
      setCreated(r.token);
      setForm(null);
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  const revoke = async (id: string) => {
    try {
      await del(deletePath(id));
      setCreated(null);
      toast('Token revoked');
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  return (
    <>
      {created && (
        <div className="panel" style={{ marginBottom: 12, borderColor: 'var(--acbd)', background: 'var(--acs)' }}>
          <h3>Token created</h3>
          <p className="ds" style={{ marginBottom: 8 }}>
            Copy it now. It will not be shown again.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="inp mono" readOnly value={created} />
            <button className="btn" onClick={() => copy(created).then(() => toast('Copied to clipboard'))}>
              Copy
            </button>
          </div>
        </div>
      )}
      <div className="pg-h" style={{ marginBottom: 10 }}>
        <div>
          <p style={{ margin: 0 }}>{blurb}</p>
        </div>
        <button className="btn p" onClick={() => setForm({ name: '', workspace: defaultWorkspace || ws.slug, scopes: defaultScopes, days: 90 })}>
          {createLabel}
        </button>
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Name</th>
            <th>Scopes</th>
            {withWorkspace && <th>Workspace</th>}
            <th>Created</th>
            <th>Last used</th>
            {withExpiry && <th>Expires</th>}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id}>
              <td>
                <b style={{ fontWeight: 550 }}>{t.name}</b>
                <div className="sub mono">{t.prefix}…</div>
              </td>
              <td className="mono" style={{ whiteSpace: 'normal', maxWidth: 320 }}>
                {t.scopes.join(', ')}
              </td>
              {withWorkspace && <td className="sub">{t.workspace || 'All'}</td>}
              <td className="sub">{fmtDate(t.created_at)}</td>
              <td className="sub">{t.last_used_at ? ago(t.last_used_at) : 'Never'}</td>
              {withExpiry && <td className="sub">{t.expires_at ? fmtDate(t.expires_at) : 'Never'}</td>}
              <td style={{ textAlign: 'right' }}>
                <button className="btn sm gh" style={{ color: 'var(--red)' }} onClick={() => revoke(t.id)}>
                  Revoke
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr className="empty-row">
              <td colSpan={5 + (withWorkspace ? 1 : 0) + (withExpiry ? 1 : 0)}>No tokens</td>
            </tr>
          )}
        </tbody>
      </table>
      <Modal
        title={createLabel}
        open={!!form}
        onCancel={() => setForm(null)}
        onOk={create}
        okText="Create"
        okButtonProps={{ disabled: !form?.name.trim() || !form?.scopes.length }}
        destroyOnClose
      >
        {form && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="fld">
              <label>Name</label>
              <Input autoFocus placeholder="e.g. CI publish" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            {withWorkspace && (
              <div className="fld">
                <label>Workspace</label>
                <Select
                  style={{ width: '100%' }}
                  value={form.workspace}
                  onChange={(v) => setForm({ ...form, workspace: v })}
                  options={[{ value: '', label: 'All my workspaces' }, ...me.workspaces.map((w) => ({ value: w.slug, label: w.name }))]}
                />
              </div>
            )}
            <div className="fld">
              <label>Scopes</label>
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                value={form.scopes}
                onChange={(v) => setForm({ ...form, scopes: v })}
                options={perms.map((s) => ({ value: s, label: s }))}
              />
            </div>
            {withExpiry && (
              <div className="fld">
                <label>Expires</label>
                <Select
                  style={{ width: '100%' }}
                  value={form.days}
                  onChange={(v) => setForm({ ...form, days: v })}
                  options={[30, 90, 180, 365].map((d) => ({ value: d, label: `${d} days` }))}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
