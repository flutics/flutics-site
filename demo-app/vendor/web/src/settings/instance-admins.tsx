import { useCallback, useEffect, useState } from 'react';
import { del, get, post } from '../api';
import { useToast } from '../util';

type AdminRow = { id: string; email: string; name: string };

export function InstanceAdminsAdmin() {
  const toast = useToast();
  const [items, setItems] = useState<AdminRow[]>([]);
  const [userId, setUserId] = useState('');

  const reload = useCallback(async () => {
    const res = await get<{ items: AdminRow[] }>('/admin/instance-admins');
    setItems(res.items || []);
  }, []);

  useEffect(() => {
    reload().catch((e: Error) => toast(e.message, 'error'));
  }, [reload, toast]);

  const grant = async () => {
    if (!userId.trim()) return;
    try {
      await post('/admin/instance-admins', { user_id: userId.trim() });
      setUserId('');
      await reload();
      toast('Instance admin granted');
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const revoke = async (id: string) => {
    try {
      await del(`/admin/instance-admins/${encodeURIComponent(id)}`);
      await reload();
      toast('Instance admin revoked');
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  return (
    <div className="panel" style={{ maxWidth: 640 }}>
      <p style={{ color: 'var(--tx3)', fontSize: 12.5, marginTop: 0 }}>
        Instance admins can manage company settings, instance secrets, and cross-workspace admin routes. At least one admin is required.
      </p>
      <ul style={{ paddingLeft: 18, fontSize: 13 }}>
        {items.map((u) => (
          <li key={u.id} style={{ marginBottom: 6 }}>
            {u.name || u.email} <span style={{ color: 'var(--tx3)' }}>({u.email})</span>{' '}
            <button type="button" className="btn sm" onClick={() => revoke(u.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="srow">
        <div className="l">
          <b>Grant by user id</b>
          <span>Paste a user UUID from Users</span>
        </div>
        <input className="inp" style={{ width: 320 }} value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="user uuid" />
        <button type="button" className="btn sm p" onClick={grant}>
          Grant
        </button>
      </div>
    </div>
  );
}
