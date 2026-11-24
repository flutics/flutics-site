import { useCallback, useEffect, useState } from 'react';
import { Form, Input, Modal } from 'antd';
import { get, post } from '../api';
import { I } from '../icons';
import { useShell } from '../shell';
import { PageH, Person, useToast } from '../util';

export function ExternalUsers() {
  const { ws, can, apps } = useShell();
  const toast = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [form] = Form.useForm();
  const load = useCallback(async () => {
    setUsers(await get(`/workspaces/${ws.slug}/external-users`));
  }, [ws.slug]);
  useEffect(() => {
    load();
  }, [load]);

  const invite = async () => {
    const v = await form.validateFields();
    const appSlugs = typeof v.apps === 'string' ? v.apps.split(/[,\s]+/).filter(Boolean) : v.apps || [];
    try {
      const out = await post(`/workspaces/${ws.slug}/external-users`, { email: v.email, name: v.name, password: v.password, apps: appSlugs });
      toast(`Invited ${v.email}`);
      if (out.invite_token) console.info('invite token', out.invite_token);
      setAdding(false);
      form.resetFields();
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  return (
    <div className="pg wide" style={{ maxWidth: 1180 }}>
      <PageH
        title="External users"
        sub="Invite-only users who see only shared apps"
        right={
          can('users:create') && (
            <button className="btn p" onClick={() => setAdding(true)}>
              <I n="plus" />
              Invite
            </button>
          )
        }
      />
      <table className="tbl">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Apps</th>
          </tr>
        </thead>
        <tbody>
          {users.map((row) => (
            <tr key={row.user.id}>
              <td><Person name={row.user.name} /></td>
              <td>{row.user.email}</td>
              <td>{(row.apps || []).join(', ') || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Modal title="Invite external user" open={adding} onOk={invite} onCancel={() => setAdding(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Name">
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password (optional)">
            <Input.Password />
          </Form.Item>
          <Form.Item name="apps" label="App slugs">
            <Input placeholder={apps.map((a) => a.slug).join(', ')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
