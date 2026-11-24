import { useCallback, useEffect, useState } from 'react';
import { Drawer, Input, Select } from 'antd';
import { get } from '../api';
import { useShell } from '../shell';
import { PageH, ago, fmtDate } from '../util';

type Ev = { id: string; app: string; app_name?: string; type: string; payload: any; actor: string; created_at: string };

const TYPE_TAG: Record<string, string> = { 'app.published': 'g', 'app.deleted': 'r' };

function summary(e: Ev) {
  const p = e.payload || {};
  if (e.type === 'app.published') return `v${p.version}${p.trigger ? ` · ${p.trigger}` : ''}`;
  if (e.type === 'action.executed') return `${p.action}${p.rows != null ? ` · ${p.rows} row${p.rows === 1 ? '' : 's'}` : ''}${p.via ? ` · via ${p.via}` : ''}`;
  return '';
}

export function Events() {
  const { ws } = useShell();
  const [rows, setRows] = useState<Ev[] | null>(null);
  const [meta, setMeta] = useState<{ types: string[]; apps: string[] }>({ types: [], apps: [] });
  const [type, setType] = useState<string>();
  const [app, setApp] = useState<string>();
  const [q, setQ] = useState('');
  const [more, setMore] = useState(false);
  const [open, setOpen] = useState<Ev | null>(null);
  const base = `/workspaces/${ws.slug}/events`;
  const query = useCallback(
    (before?: string) => {
      const p = new URLSearchParams();
      if (type) p.set('type', type);
      if (app) p.set('app', app);
      if (q.trim()) p.set('q', q.trim());
      if (before) p.set('before', before);
      return get(`${base}?${p}`) as Promise<Ev[]>;
    },
    [base, type, app, q],
  );
  useEffect(() => {
    const t = setTimeout(() => {
      query().then((r) => {
        setRows(r);
        setMore(r.length === 100);
      });
    }, 200);
    return () => clearTimeout(t);
  }, [query]);
  useEffect(() => {
    get(`${base}/meta`).then(setMeta);
  }, [base]);
  const loadMore = async () => {
    if (!rows?.length) return;
    const r = await query(rows[rows.length - 1].created_at);
    setRows([...rows, ...r]);
    setMore(r.length === 100);
  };
  return (
    <div className="pg">
      <PageH
        title="Events"
        right={
          <>
            <Input.Search allowClear placeholder="Search" style={{ width: 200 }} value={q} onChange={(e) => setQ(e.target.value)} />
            <Select allowClear placeholder="Type" style={{ width: 170 }} value={type} onChange={setType} options={meta.types.map((t) => ({ value: t, label: t }))} />
            <Select allowClear placeholder="App" style={{ width: 160 }} value={app} onChange={setApp} options={meta.apps.map((a) => ({ value: a, label: a }))} />
          </>
        }
      />
      <div className="panel" style={{ padding: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 130 }}>Time</th>
              <th>Type</th>
              <th>App</th>
              <th>Details</th>
              <th>Actor</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((e) => (
              <tr key={e.id} onClick={() => setOpen(e)} style={{ cursor: 'pointer' }} className={open?.id === e.id ? 'on' : ''}>
                <td className="sub" title={fmtDate(e.created_at)}>
                  {ago(e.created_at)}
                </td>
                <td>
                  <span className={'tg mono ' + (TYPE_TAG[e.type] || '')}>{e.type}</span>
                </td>
                <td>{e.app_name || e.app || <span className="sub">—</span>}</td>
                <td className="sub mono">{summary(e)}</td>
                <td className="sub">{e.actor}</td>
              </tr>
            ))}
            {rows && rows.length === 0 && (
              <tr className="empty-row">
                <td colSpan={5}>No events</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {more && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <button className="btn sm" onClick={loadMore}>
            Load more
          </button>
        </div>
      )}
      <Drawer open={!!open} onClose={() => setOpen(null)} width={520} title={open?.type}>
        {open && (
          <>
            <dl className="kv" style={{ marginBottom: 16 }}>
              <dt>Event ID</dt>
              <dd className="mono">{open.id}</dd>
              <dt>Time</dt>
              <dd>{new Date(open.created_at).toLocaleString()}</dd>
              <dt>App</dt>
              <dd>{open.app_name || open.app || '—'}</dd>
              <dt>Actor</dt>
              <dd>{open.actor || '—'}</dd>
            </dl>
            <div className="mini" style={{ marginBottom: 6 }}>
              Payload
            </div>
            <pre className="code" style={{ margin: 0, padding: 12, borderRadius: 8, background: 'var(--bg2)', fontSize: 12, overflow: 'auto' }}>
              {JSON.stringify(open.payload, null, 2)}
            </pre>
          </>
        )}
      </Drawer>
    </div>
  );
}
