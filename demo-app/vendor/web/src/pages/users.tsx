import { useCallback, useEffect, useState } from 'react';
import { Button, Dropdown, Form, Input, Modal, Select, Tooltip } from 'antd';
import { del, get, patch, post, put } from '../api';
import { I } from '../icons';
import { useShell } from '../shell';
import { PageH, Person, ago, useToast } from '../util';

export function sourceTag(source: string) {
  if (source === 'scim')
    return (
      <span className="tg b">
        <I n="sync" style={{ width: 11, height: 11 }} />
        SCIM
      </span>
    );
  if (source === 'sso') return <span className="tg b">SSO</span>;
  return <span className="tg">Local</span>;
}

export function Users() {
  const { ws, can, me } = useShell();
  const toast = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [editRoles, setEditRoles] = useState<any>(null);
  const [resetLink, setResetLink] = useState<{ user: any; url: string; expiresAt: string } | null>(null);
  const [form] = Form.useForm();
  const load = useCallback(async () => {
    const [u, r, g] = await Promise.all([get(`/workspaces/${ws.slug}/users`), get(`/workspaces/${ws.slug}/roles`), can('groups:read') ? get(`/workspaces/${ws.slug}/groups`) : []]);
    setUsers(u);
    setRoles(r);
    setGroups(g);
  }, [ws.slug, can]);
  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    const v = await form.validateFields();
    try {
      await post(`/workspaces/${ws.slug}/users`, { ...v, roles: v.roles ? [v.roles] : [], groups: v.groups || [] });
      toast(`${v.email} added`);
      setAdding(false);
      form.resetFields();
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  const act = async (fn: () => Promise<any>, msg: string) => {
    try {
      await fn();
      toast(msg);
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  const scim = users.filter((u) => u.source === 'scim').length;
  const instanceAdmin = !!me.instance_admin;
  const canReset = (u: any) => u.source === 'local' || u.source === 'invite';
  const resetPassword = async (u: any) => {
    try {
      const r = await post(`/admin/users/${u.id}/password-reset`);
      setResetLink({ user: u, url: r.url, expiresAt: r.expires_at });
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  const copyLink = async () => {
    if (!resetLink) return;
    try {
      await navigator.clipboard.writeText(resetLink.url);
      toast('Link copied');
    } catch {
      toast('Could not copy the link', 'error');
    }
  };

  return (
    <div className="pg wide" style={{ maxWidth: 1180 }}>
      <PageH
        title="Users"
        sub={`${users.length} members${scim ? ` · ${scim} provisioned via SCIM` : ''}`}
        right={
          can('users:create') && (
            <button className="btn p" onClick={() => setAdding(true)}>
              <I n="plus" />
              Add user
            </button>
          )
        }
      />
      <table className="tbl">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Groups</th>
            <th>Role</th>
            <th>Source</th>
            <th>Last active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={u.id}>
              <td>
                <Person name={u.name} i={i} />
              </td>
              <td className="sub">{u.email}</td>
              <td style={{ whiteSpace: 'normal' }}>{u.groups.map((g: any) => g.name).join(', ') || <span className="sub">—</span>}</td>
              <td>
                {u.roles?.length ? u.roles.map((r: any) => <span key={r.id} className={'tg' + (r.name === 'Owner' ? ' g' : '')} style={{ marginRight: 4 }}>{r.name}</span>) : <span className="sub">via groups</span>}
                {u.status !== 'active' && <span className="tg r">suspended</span>}
              </td>
              <td>{sourceTag(u.source)}</td>
              <td className="sub">{u.id === me.user.id ? 'Now' : ago(u.last_active_at)}</td>
              <td style={{ textAlign: 'right' }}>
                {(can('users:update') || can('users:delete') || instanceAdmin) && u.id !== me.user.id && (
                  <Dropdown
                    trigger={['click']}
                    menu={{
                      items: [
                        can('users:update') && { key: 'roles', label: 'Change role', onClick: () => setEditRoles(u) },
                        instanceAdmin && {
                          key: 'reset',
                          disabled: !canReset(u),
                          label: canReset(u) ? 'Reset password' : (
                            <Tooltip title="This user signs in through your identity provider">
                              <span>Reset password</span>
                            </Tooltip>
                          ),
                          onClick: () => resetPassword(u),
                        },
                        can('users:update') && u.source !== 'scim' && {
                          key: 'status',
                          label: u.status === 'active' ? 'Suspend' : 'Reactivate',
                          onClick: () => act(() => patch(`/workspaces/${ws.slug}/users/${u.id}`, { status: u.status === 'active' ? 'suspended' : 'active' }), u.status === 'active' ? `${u.name} suspended` : `${u.name} reactivated`),
                        },
                        can('users:delete') && { key: 'remove', danger: true, label: 'Remove from workspace', onClick: () => act(() => del(`/workspaces/${ws.slug}/users/${u.id}`), `${u.name} removed`) },
                      ].filter(Boolean) as any,
                    }}
                  >
                    <button className="btn sm gh">•••</button>
                  </Dropdown>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Modal title="Add user" open={adding} onCancel={() => setAdding(false)} onOk={add} okText="Add user" destroyOnClose>
        <Form form={form} layout="vertical" requiredMark={false} preserve={false}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input autoFocus />
          </Form.Item>
          <Form.Item name="name" label="Name">
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Initial password" extra="Leave empty for SSO-only accounts.">
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="roles" label="Role">
            <Select allowClear options={roles.map((r) => ({ value: r.id, label: r.name }))} placeholder="Member" />
          </Form.Item>
          {groups.length > 0 && (
            <Form.Item name="groups" label="Groups">
              <Select mode="multiple" options={groups.filter((g) => g.source !== 'scim').map((g) => ({ value: g.id, label: g.name }))} />
            </Form.Item>
          )}
        </Form>
      </Modal>
      {editRoles && (
        <RolesModal
          title={`Roles for ${editRoles.name}`}
          roles={roles}
          value={editRoles.roles.map((r: any) => r.id)}
          onClose={() => setEditRoles(null)}
          onSave={(ids) => act(() => put(`/workspaces/${ws.slug}/users/${editRoles.id}/roles`, { roles: ids }), 'Roles updated').then(() => setEditRoles(null))}
        />
      )}
      <Modal
        title="Password reset link"
        open={!!resetLink}
        onCancel={() => setResetLink(null)}
        footer={<Button type="primary" onClick={() => setResetLink(null)}>Done</Button>}
        destroyOnClose
      >
        {resetLink && (
          <>
            <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 12 }}>
              Send this link to {resetLink.user.email}. It works once, expires {new Date(resetLink.expiresAt).toLocaleString()}, and asks the user to set a new password.
            </div>
            <Input readOnly value={resetLink.url} onFocus={(e) => e.currentTarget.select()} />
            <Button onClick={copyLink} style={{ marginTop: 10 }}>
              Copy link
            </Button>
          </>
        )}
      </Modal>
    </div>
  );
}

export function RolesModal({ title, roles, value, onClose, onSave }: { title: string; roles: any[]; value: string[]; onClose: () => void; onSave: (ids: string[]) => void }) {
  const [v, setV] = useState<string[]>(value);
  return (
    <Modal title={title} open onCancel={onClose} onOk={() => onSave(v)} okText="Save">
      <Select mode="multiple" style={{ width: '100%' }} value={v} onChange={setV} options={roles.map((r) => ({ value: r.id, label: r.name }))} />
    </Modal>
  );
}
