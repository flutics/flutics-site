import { useCallback, useEffect, useState } from 'react';
import { Drawer, Form, Input, Popconfirm, Select } from 'antd';
import { del, get, patch, post, put } from '../api';
import { I } from '../icons';
import { useShell } from '../shell';
import { PageH, ago, useToast } from '../util';

export function Groups() {
  const { ws, can } = useShell();
  const toast = useToast();
  const [groups, setGroups] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [edit, setEdit] = useState<any>(null);
  const [form] = Form.useForm();
  const load = useCallback(async () => {
    const [g, u, r] = await Promise.all([get(`/workspaces/${ws.slug}/groups`), can('users:read') ? get(`/workspaces/${ws.slug}/users`) : [], get(`/workspaces/${ws.slug}/roles`)]);
    setGroups(g);
    setUsers(u);
    setRoles(r);
  }, [ws.slug, can]);
  useEffect(() => {
    load();
  }, [load]);

  const open = (g: any) => {
    setEdit(g);
    form.setFieldsValue(g === 'new' ? { name: '', description: '', members: [], roles: [] } : { name: g.name, description: g.description, members: g.members.map((m: any) => m.id), roles: g.roles.map((r: any) => r.id) });
  };
  const save = async () => {
    const v = await form.validateFields();
    try {
      if (edit === 'new') {
        await post(`/workspaces/${ws.slug}/groups`, v);
        toast(`${v.name} created`);
      } else {
        const base = `/workspaces/${ws.slug}/groups/${edit.id}`;
        if (edit.source !== 'scim' && (v.name !== edit.name || v.description !== edit.description)) await patch(base, { name: v.name, description: v.description });
        else if (v.description !== edit.description) await patch(base, { description: v.description });
        if (edit.source !== 'scim') await put(base + '/members', { members: v.members });
        await put(base + '/roles', { roles: v.roles });
        toast('Group saved');
      }
      setEdit(null);
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  const remove = async () => {
    try {
      await del(`/workspaces/${ws.slug}/groups/${edit.id}`);
      toast(`${edit.name} deleted`);
      setEdit(null);
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  const synced = groups.some((g) => g.source === 'scim');
  const scim = edit && edit !== 'new' && edit.source === 'scim';

  return (
    <div className="pg">
      <PageH
        title="Groups"
        sub={synced ? 'Synced groups are managed by your identity provider; map them to roles here.' : 'Groups bundle people; roles are bound to groups.'}
        right={
          can('groups:create') && (
            <button className="btn p" onClick={() => open('new')}>
              <I n="plus" />
              New group
            </button>
          )
        }
      />
      <table className="tbl">
        <thead>
          <tr>
            <th>Group</th>
            <th>Source</th>
            <th className="num">Members</th>
            <th>Roles in {ws.name}</th>
            <th>Last synced</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <tr key={g.id}>
              <td>
                <b style={{ fontWeight: 550 }}>{g.name}</b>
                {g.description && <div className="sub">{g.description}</div>}
              </td>
              <td>
                {g.source === 'scim' ? (
                  <span className="tg b">
                    <I n="sync" style={{ width: 11, height: 11 }} />
                    Synced via SCIM
                  </span>
                ) : (
                  <span className="tg">Local</span>
                )}
              </td>
              <td className="num">{g.members.length}</td>
              <td>
                {g.roles.map((r: any) => (
                  <span key={r.id} className={'tg' + (r.name === 'Owner' ? ' g' : '')} style={{ marginRight: 4 }}>
                    {r.name}
                  </span>
                ))}
              </td>
              <td className="sub">{g.source === 'scim' ? ago(g.synced_at) : '—'}</td>
              <td style={{ textAlign: 'right' }}>
                {can('groups:update') && (
                  <button className="btn sm gh" onClick={() => open(g)}>
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
          {groups.length === 0 && (
            <tr className="empty-row">
              <td colSpan={6}>No groups yet</td>
            </tr>
          )}
        </tbody>
      </table>
      <Drawer
        title={edit === 'new' ? 'New group' : edit?.name}
        open={!!edit}
        onClose={() => setEdit(null)}
        width={420}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              {edit && edit !== 'new' && !scim && can('groups:delete') && (
                <Popconfirm title={`Delete ${edit.name}?`} okText="Delete" okButtonProps={{ danger: true }} onConfirm={remove}>
                  <button className="btn gh" style={{ color: 'var(--red)' }}>
                    Delete
                  </button>
                </Popconfirm>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => setEdit(null)}>
                Cancel
              </button>
              <button className="btn p" onClick={save}>
                {edit === 'new' ? 'Create group' : 'Save'}
              </button>
            </div>
          </div>
        }
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input disabled={scim} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input />
          </Form.Item>
          <Form.Item name="members" label="Members" extra={scim ? 'Membership is managed by your identity provider.' : undefined}>
            <Select mode="multiple" disabled={scim} optionFilterProp="label" options={users.map((u) => ({ value: u.id, label: u.name }))} />
          </Form.Item>
          <Form.Item name="roles" label="Roles">
            <Select mode="multiple" options={roles.map((r) => ({ value: r.id, label: r.name }))} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
