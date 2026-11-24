import { useEffect, useState } from 'react';
import { Input, Modal, Select, Switch, Table } from 'antd';
import { del, get, patch, put, ApiError } from '../api';
import { useShell } from '../shell';
import { useToast } from '../util';

const SECRET_KINDS = [
  'generic',
  'api_key',
  'password',
  'private_key',
  'oauth_client_secret',
  'webhook_signing',
  'token',
] as const;

type SecretRow = {
  name: string;
  kind: string;
  description?: string;
  version?: number;
  updated_at?: string;
  apps_may_use?: boolean;
  used_by?: { kind: string; name: string }[];
};

type Scope = 'workspace' | 'instance';

export function SecretsAdmin({ scope }: { scope: Scope }) {
  const { ws, me } = useShell();
  const toast = useToast();
  const [items, setItems] = useState<SecretRow[]>([]);
  const [workspaces, setWorkspaces] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [wsScope, setWsScope] = useState<'instance' | string>('instance');
  const [createOpen, setCreateOpen] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState<SecretRow | null>(null);
  const [form, setForm] = useState({ name: '', kind: 'generic', description: '', value: '', apps_may_use: false });
  const [replaceValue, setReplaceValue] = useState('');
  const [editForm, setEditForm] = useState({ kind: 'generic', description: '', apps_may_use: false });
  const [deleteErr, setDeleteErr] = useState<{ users?: string[]; message: string } | null>(null);

  const managingWorkspace = scope === 'instance' && wsScope !== 'instance';
  const targetWsId = managingWorkspace ? wsScope : ws.id;

  const listPath = () => {
    if (scope === 'workspace') return `/workspaces/${ws.slug}/secrets`;
    if (managingWorkspace) return `/admin/workspaces/${targetWsId}/secrets`;
    return '/admin/secrets';
  };

  const itemPath = (name: string) => {
    if (scope === 'workspace') return `/workspaces/${ws.slug}/secrets/${encodeURIComponent(name)}`;
    if (managingWorkspace) return `/admin/workspaces/${targetWsId}/secrets/${encodeURIComponent(name)}`;
    return `/admin/secrets/${encodeURIComponent(name)}`;
  };

  const load = () => get(listPath()).then((r: SecretRow[]) => setItems(r || []));

  useEffect(() => {
    if (scope === 'instance' && me.instance_admin) {
      get('/admin/workspaces').then((r: { items?: { id: string; slug: string; name: string }[] }) => setWorkspaces(r.items || [])).catch(() => {});
    }
  }, [scope, me.instance_admin]);

  useEffect(() => {
    load();
  }, [ws.slug, scope, wsScope, targetWsId]);

  const saveCreate = async () => {
    if (!form.name.trim()) return;
    await put(itemPath(form.name.trim()), {
      value: form.value,
      kind: form.kind,
      description: form.description,
      apps_may_use: !managingWorkspace && scope === 'instance' ? form.apps_may_use : undefined,
    });
    setCreateOpen(false);
    setForm({ name: '', kind: 'generic', description: '', value: '', apps_may_use: false });
    toast('Secret saved');
    load();
  };

  const saveReplace = async () => {
    if (!replaceOpen) return;
    await put(itemPath(replaceOpen), { value: replaceValue });
    setReplaceOpen(null);
    setReplaceValue('');
    toast('Secret value replaced');
    load();
  };

  const saveEdit = async () => {
    if (!editOpen) return;
    await patch(itemPath(editOpen.name), {
      kind: editForm.kind,
      description: editForm.description,
      apps_may_use: scope === 'instance' && !managingWorkspace ? editForm.apps_may_use : undefined,
    });
    setEditOpen(null);
    toast('Secret updated');
    load();
  };

  const remove = async (name: string) => {
    try {
      await del(itemPath(name));
      toast('Secret deleted');
      load();
    } catch (e: any) {
      const users = (e instanceof ApiError ? e.detail : e?.detail)?.users as string[] | undefined;
      setDeleteErr({ message: e.message || 'Delete failed', users });
    }
  };

  return (
    <div className="panel" style={{ maxWidth: 900 }}>
      {scope === 'instance' && (
        <div className="srow" style={{ marginBottom: 12 }}>
          <div className="l">
            <b>Scope</b>
          </div>
          <Select
            style={{ minWidth: 280 }}
            value={wsScope}
            onChange={setWsScope}
            options={[
              { value: 'instance', label: 'Instance' },
              ...workspaces.map((w) => ({ value: w.id, label: `Workspace: ${w.name}` })),
            ]}
          />
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <p className="ds" style={{ margin: 0 }}>
          Write-only values for webhooks, SMTP, and manifest references. Values are never returned.
        </p>
        <button type="button" className="btn p sm" onClick={() => setCreateOpen(true)}>
          Add secret
        </button>
      </div>
      <Table
        size="small"
        rowKey="name"
        pagination={false}
        dataSource={items}
        columns={[
          { title: 'Name', dataIndex: 'name', render: (n) => <span className="mono">{n}</span> },
          { title: 'Kind', dataIndex: 'kind' },
          { title: 'Description', dataIndex: 'description', render: (d) => d || '—' },
          { title: 'Version', dataIndex: 'version' },
          {
            title: 'Used by',
            dataIndex: 'used_by',
            render: (u: SecretRow['used_by']) => (u || []).map((x) => `${x.kind}:${x.name}`).join(', ') || '—',
          },
          {
            title: '',
            key: 'actions',
            render: (_, row) => (
              <span className="row-actions">
                <button type="button" className="btn sm" onClick={() => { setReplaceOpen(row.name); setReplaceValue(''); }}>
                  Replace value
                </button>
                <button
                  type="button"
                  className="btn sm"
                  onClick={() => {
                    setEditOpen(row);
                    setEditForm({ kind: row.kind || 'generic', description: row.description || '', apps_may_use: !!row.apps_may_use });
                  }}
                >
                  Edit details
                </button>
                <button type="button" className="btn sm gh" onClick={() => remove(row.name)}>
                  Delete
                </button>
              </span>
            ),
          },
        ]}
      />
      <Modal title="Add secret" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={saveCreate} okText="Save">
        <div className="fld">
          <label>Name</label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="off" />
        </div>
        <div className="fld">
          <label>Kind</label>
          <Select value={form.kind} onChange={(k) => setForm({ ...form, kind: k })} options={SECRET_KINDS.map((k) => ({ value: k, label: k }))} />
        </div>
        <div className="fld">
          <label>Description</label>
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        {scope === 'instance' && !managingWorkspace && (
          <div className="srow">
            <div className="l">
              <b>Apps may use</b>
            </div>
            <Switch checked={form.apps_may_use} onChange={(v) => setForm({ ...form, apps_may_use: v })} />
          </div>
        )}
        <div className="fld">
          <label>Value</label>
          <Input.Password value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} autoComplete="new-password" />
        </div>
      </Modal>
      <Modal title="Replace secret value" open={!!replaceOpen} onCancel={() => setReplaceOpen(null)} onOk={saveReplace} okText="Replace">
        <Input.Password value={replaceValue} onChange={(e) => setReplaceValue(e.target.value)} autoComplete="new-password" placeholder="New value" />
      </Modal>
      <Modal title="Edit secret details" open={!!editOpen} onCancel={() => setEditOpen(null)} onOk={saveEdit} okText="Save">
        <div className="fld">
          <label>Kind</label>
          <Select value={editForm.kind} onChange={(k) => setEditForm({ ...editForm, kind: k })} options={SECRET_KINDS.map((k) => ({ value: k, label: k }))} />
        </div>
        <div className="fld">
          <label>Description</label>
          <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
        </div>
        {scope === 'instance' && !managingWorkspace && (
          <div className="srow">
            <div className="l">
              <b>Apps may use</b>
            </div>
            <Switch checked={editForm.apps_may_use} onChange={(v) => setEditForm({ ...editForm, apps_may_use: v })} />
          </div>
        )}
      </Modal>
      <Modal title="Cannot delete secret" open={!!deleteErr} onCancel={() => setDeleteErr(null)} footer={null}>
        <p>{deleteErr?.message}</p>
        {deleteErr?.users?.length ? (
          <ul>
            {deleteErr.users.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        ) : null}
      </Modal>
    </div>
  );
}
