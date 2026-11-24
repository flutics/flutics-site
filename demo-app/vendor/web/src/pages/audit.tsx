import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DatePicker, Drawer, Dropdown, Input, Select } from 'antd';
import { ShellLink } from '../shelllink';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { get } from '../api';
import { useShell } from '../shell';
import { PageH, ago, fmtDate } from '../util';

type Row = {
  id: number;
  at: string;
  actor: string;
  action: string;
  target: string;
  ip?: string;
  correlation_id?: string;
  meta?: Record<string, unknown>;
};

export function Audit() {
  const { ws } = useShell();
  const { id: routeId } = useParams();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [events, setEvents] = useState<string[]>([]);
  const [event, setEvent] = useState<string>();
  const [actor, setActor] = useState('');
  const [agentOnly, setAgentOnly] = useState(false);
  const [client, setClient] = useState('');
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [open, setOpen] = useState<Row | null>(null);
  const base = `/workspaces/${ws.slug}/audit`;

  const params = useCallback(() => {
    const p = new URLSearchParams();
    if (event) p.set('event', event);
    if (actor.trim()) p.set('actor', actor.trim());
    if (agentOnly) p.set('agent', '1');
    if (client.trim()) p.set('client', client.trim());
    if (range?.[0]) p.set('from', range[0].toISOString());
    if (range?.[1]) p.set('to', range[1].endOf('day').toISOString());
    p.set('limit', '50');
    return p;
  }, [event, actor, agentOnly, client, range]);

  const load = useCallback(
    (next?: number) => {
      const p = params();
      if (next) p.set('cursor', String(next));
      return get(`${base}?${p}`) as Promise<{ items: Row[]; next_cursor: number | null }>;
    },
    [base, params],
  );

  useEffect(() => {
    get(`${base}/meta`).then((m: { events: string[] }) => setEvents(m.events || []));
  }, [base]);

  useEffect(() => {
    const t = setTimeout(() => {
      load().then((r) => {
        setRows(r.items || []);
        setCursor(r.next_cursor ?? null);
      });
    }, 200);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    if (!routeId) return;
    get(`${base}/${routeId}`).then((row: Row) => setOpen(row)).catch(() => setOpen(null));
  }, [base, routeId]);

  const loadMore = () => {
    if (!cursor) return;
    load(cursor).then((r) => {
      setRows((prev) => [...(prev || []), ...(r.items || [])]);
      setCursor(r.next_cursor ?? null);
    });
  };

  const exportFmt = (format: 'csv' | 'jsonl') => {
    const p = params();
    p.set('format', format);
    window.location.href = `/api/v1${base}/export?${p}`;
  };

  return (
    <div className="pg">
      <PageH
        title="Audit"
        right={
          <>
            <Input allowClear placeholder="Actor" style={{ width: 140 }} value={actor} onChange={(e) => setActor(e.target.value)} />
            <Select style={{ width: 140 }} value={agentOnly ? '1' : ''} onChange={(v) => setAgentOnly(v === '1')} options={[
              { value: '', label: 'All activity' },
              { value: '1', label: 'Agent calls' },
            ]} />
            <Input allowClear placeholder="Client" style={{ width: 140 }} value={client} onChange={(e) => setClient(e.target.value)} />
            <Select allowClear placeholder="Event" style={{ width: 200 }} value={event} onChange={setEvent} options={events.map((e) => ({ value: e, label: e }))} />
            <DatePicker.RangePicker value={range} onChange={(v) => setRange(v)} />
            <Dropdown
              menu={{
                items: [
                  { key: 'csv', label: 'CSV', onClick: () => exportFmt('csv') },
                  { key: 'jsonl', label: 'JSON Lines', onClick: () => exportFmt('jsonl') },
                ],
              }}
            >
              <button type="button" className="btn">Export</button>
            </Dropdown>
          </>
        }
      />
      <div className="panel" style={{ padding: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 130 }}>Time</th>
              <th>Actor</th>
              <th>Event</th>
              <th>Target</th>
              <th>IP</th>
              <th>Correlation</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r.id} className={open?.id === r.id ? 'on' : ''}>
                <td className="sub" title={fmtDate(r.at)}>{ago(r.at)}</td>
                <td>{r.actor}</td>
                <td><ShellLink to={`audit/${r.id}`} className="tg mono">{r.action}</ShellLink></td>
                <td className="sub"><ShellLink to={`audit/${r.id}`}>{r.target || '—'}</ShellLink></td>
                <td className="sub mono">{r.ip || '—'}</td>
                <td className="sub mono" title={r.correlation_id || ''}>{r.correlation_id ? r.correlation_id.slice(0, 8) + '…' : '—'}</td>
              </tr>
            ))}
            {rows && rows.length === 0 && (
              <tr className="empty-row">
                <td colSpan={6}>No entries</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {cursor != null && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <button type="button" className="btn sm" onClick={loadMore}>Load more</button>
        </div>
      )}
      <Drawer open={!!open} onClose={() => setOpen(null)} width={520} title={open?.action}>
        {open && (
          <>
            <dl className="kv" style={{ marginBottom: 16 }}>
              <dt>Time</dt>
              <dd>{dayjs(open.at).format('YYYY-MM-DD HH:mm:ss')}</dd>
              <dt>Actor</dt>
              <dd>{open.actor}</dd>
              <dt>Event</dt>
              <dd className="mono">{open.action}</dd>
              <dt>Target</dt>
              <dd>{open.target || '—'}</dd>
              <dt>IP</dt>
              <dd className="mono">{open.ip || '—'}</dd>
              <dt>Correlation</dt>
              <dd className="mono">{open.correlation_id || '—'}</dd>
            </dl>
            <pre className="mono" style={{ fontSize: 11, whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(open, null, 2)}</pre>
          </>
        )}
      </Drawer>
    </div>
  );
}
