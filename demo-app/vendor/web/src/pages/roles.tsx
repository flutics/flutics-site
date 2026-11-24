import { useCallback, useEffect, useState } from 'react';
import { Input, Modal, Popconfirm } from 'antd';
import { del, get, patch, post } from '../api';
import { I } from '../icons';
import { useShell } from '../shell';
import { PageH, useToast } from '../util';

type Role = { id: string; name: string; description: string; builtin: boolean; permissions: string[]; groups: number; users: number };

export function Roles() {
  const { ws, can } = useShell();
  const toast = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [catalog, setCatalog] = useState<{ group: string; permissions: string[] }[]>([]);
  const [edit, setEdit] = useState<Partial<Role> | null>(null);
  const editable = can('workspaces:update');
  const load = useCallback(async () => {
    const [r, c] = await Promise.all([get(`/workspaces/${ws.slug}/roles`), get('/permissions')]);
    setRoles(r);
    setCatalog(c.groups);
  }, [ws.slug]);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!edit) return;
    try {
      if (edit.id) await patch(`/workspaces/${ws.slug}/roles/${edit.id}`, { name: edit.name, description: edit.description, permissions: edit.permissions });
      else await post(`/workspaces/${ws.slug}/roles`, { name: edit.name, description: edit.description, permissions: edit.permissions });
      toast(edit.id ? 'Role updated' : `${edit.name} created`);
      setEdit(null);
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  const remove = async () => {
    try {
      await del(`/workspaces/${ws.slug}/roles/${edit!.id}`);
      toast('Role deleted');
      setEdit(null);
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  const toggle = (p: string) => {
    if (!edit) return;
    const s = new Set(edit.permissions || []);
    if (s.has(p)) s.delete(p);
    else s.add(p);
    setEdit({ ...edit, permissions: [...s] });
  };

  return (
    <div className="pg">
      <PageH
        title="Roles & permissions"
        sub="Roles bundle workspace-scoped permissions. Assign them to groups or users."
        right={
          editable && (
            <button className="btn p" onClick={() => setEdit({ name: '', description: '', permissions: ['apps:read', 'workspaces:read'] })}>
              <I n="plus" />
              New role
            </button>
          )
        }
      />
      <table className="tbl mx">
        <thead>
          <tr>
            <th>Permission</th>
            {roles.map((r) => (
              <th key={r.id}>
                {!r.builtin && editable ? (
                  <button className="rh" onClick={() => setEdit(r)} title="Edit role">
                    {r.name}
                    <I n="edit" style={{ width: 11, height: 11 }} />
                  </button>
                ) : (
                  <span className="rh" title={r.description}>
                    {r.name}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {catalog.map((g) => [
            <tr className="grp" key={g.group}>
              <td colSpan={roles.length + 1}>{g.group}</td>
            </tr>,
            ...g.permissions.map((p) => (
              <tr key={p}>
                <td className="mono">{p}</td>
                {roles.map((r) => {
                  const has = (r.permissions || []).includes(p);
                  return (
                    <td key={r.id}>
                      {r.name === 'Builder' && r.builtin && p === 'apps:delete' ? (
                        <span className="tg a">own</span>
                      ) : has ? (
                        <span className="y">
                          <I n="check" style={{ width: 15, height: 15 }} />
                        </span>
                      ) : (
                        <span className="n">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            )),
          ])}
          <tr className="grp">
            <td colSpan={roles.length + 1}>Assigned to</td>
          </tr>
          <tr>
            <td className="sub">Groups · users</td>
            {roles.map((r) => (
              <td key={r.id} className="sub">
                {r.groups} · {r.users}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p style={{ color: 'var(--tx3)', fontSize: 12, marginTop: 10 }}>Data access between apps is granted per export on each app and on the Data page.</p>
      <Modal
        title={edit?.id ? `Edit ${edit.name}` : 'New role'}
        open={!!edit}
        onCancel={() => setEdit(null)}
        width={560}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              {edit?.id && (
                <Popconfirm title="Delete this role?" okText="Delete" okButtonProps={{ danger: true }} onConfirm={remove}>
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
              <button className="btn p" onClick={save} disabled={!edit?.name?.trim()}>
                Save
              </button>
            </div>
          </div>
        }
        destroyOnClose
      >
        {edit && (
          <>
            <div className="split" style={{ marginBottom: 14 }}>
              <div className="fld">
                <label>Name</label>
                <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} autoFocus />
              </div>
              <div className="fld">
                <label>Description</label>
                <Input value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
              </div>
            </div>
            {catalog.map((g) => (
              <div key={g.group} style={{ marginBottom: 10 }}>
                <div className="mini" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>
                  {g.group}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {g.permissions.map((p) => {
                    const on = edit.permissions?.includes(p);
                    return (
                      <button key={p} className={'tg' + (on ? ' g' : '')} style={{ cursor: 'pointer', fontFamily: 'var(--mono)' }} onClick={() => toggle(p)}>
                        {on && <I n="check" style={{ width: 11, height: 11 }} />}
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </Modal>
    </div>
  );
}
