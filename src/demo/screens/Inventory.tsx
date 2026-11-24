import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { approveAndSendPurchaseOrder, receivePurchaseOrder } from '../db/actions';
import { getPurchaseOrder, listAlerts, listPurchaseOrders, listStock, listSuppliers } from '../db/queries';
import { money, dDate, num, poStatusLabel, situationLabel } from '../format';
import { Back, Err, Stat, Tag } from '../ui/widgets';
import { useLive } from '../useLive';

const sitTone: Record<string, string> = { ok: 'green', below_min: 'gold', short: 'red', out: 'red' };
const sevTone: Record<string, string> = { short: 'red', out: 'red', below_min: 'gold' };
const poTone: Record<string, string> = { draft: '', approved: 'blue', sent: 'gold', received: 'green', cancelled: 'red' };

export function StockPage() {
  const { data, error } = useLive(() => listStock(), []);
  const rows = data ?? [];
  const attention = rows.filter((r) => r.situation !== 'ok').length;
  return (
    <>
      <h1 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600, letterSpacing: 0 }}>Stock</h1>
      {error && <Err>{error}</Err>}
      <div className="stats">
        <Stat label="Active items" value={rows.length} />
        <Stat label="Need attention" value={attention} />
        <Stat label="Reserved (lines)" value={rows.filter((r) => Number(r.reserved) > 0).length} />
        <Stat
          label="Available (on hand − reserved)"
          value={num(rows.reduce((s, r) => s + Number(r.available), 0))}
        />
      </div>
      <div className="card">
        <table className="dt">
          <thead>
            <tr>
              <th>Item</th>
              <th>Type</th>
              <th className="r">On hand</th>
              <th className="r">Reserved</th>
              <th className="r">Available</th>
              <th className="r">Minimum</th>
              <th className="r">Incoming</th>
              <th>Situation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.name}
                  <div className="muted">{r.sku}</div>
                </td>
                <td>{r.kind}</td>
                <td className="r num">{num(r.on_hand)}</td>
                <td className="r num">{num(r.reserved)}</td>
                <td className="r num">{num(r.available)}</td>
                <td className="r num">{num(r.min_qty)} {r.uom}</td>
                <td className="r num">{num(r.incoming)}</td>
                <td>
                  <Tag tone={sitTone[r.situation] ?? ''}>{situationLabel[r.situation] ?? r.situation}</Tag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function AlertsPage() {
  const { data, error } = useLive(() => listAlerts(), []);
  return (
    <>
      <h1 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600, letterSpacing: 0 }}>Stock alerts</h1>
      {error && <Err>{error}</Err>}
      <p className="muted" style={{ margin: '0 0 16px' }}>
        One open alert per item. Repeated triggers update the same alert — they never create a duplicate.
      </p>
      <div className="card">
        <table className="dt">
          <thead>
            <tr>
              <th>Item</th>
              <th>Situation</th>
              <th>Triggers</th>
              <th>Purchase draft</th>
              <th>Last</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((a) => (
              <tr key={a.id}>
                <td>
                  {a.name}
                  <div className="muted">{a.sku}</div>
                </td>
                <td>
                  <Tag tone={sevTone[a.severity] ?? ''}>{situationLabel[a.severity] ?? a.severity}</Tag>
                  <div className="muted">{a.detail}</div>
                </td>
                <td>{a.trigger_count}×</td>
                <td>{a.po_number ?? '—'}</td>
                <td>{dDate(a.last_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function PurchaseOrdersPage() {
  const { data, error } = useLive(() => listPurchaseOrders(), []);
  return (
    <>
      <h1 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600, letterSpacing: 0 }}>Purchase orders</h1>
      {error && <Err>{error}</Err>}
      <p className="muted" style={{ margin: '0 0 16px' }}>
        Drafts are created from stock alerts. Open a sent purchase order and use Receive goods to post stock.
      </p>
      <div className="card">
        <table className="dt">
          <thead>
            <tr>
              <th>Number</th>
              <th>Supplier</th>
              <th>Status</th>
              <th className="r">Lines</th>
              <th className="r">Total</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((p) => (
              <tr key={p.id}>
                <td>
                  <Link to={`/inventory/purchase-orders/${p.id}`}>{p.number}</Link>
                  {p.auto && <span className="muted"> · auto</span>}
                </td>
                <td>{p.supplier_name ?? 'No supplier'}</td>
                <td>
                  <Tag tone={poTone[p.status] ?? ''}>{poStatusLabel[p.status] ?? p.status}</Tag>
                </td>
                <td className="r">{num(p.line_count)}</td>
                <td className="r num">{money(p.total_minor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function PurchaseOrderDetailPage() {
  const { id = '' } = useParams();
  const po = useLive(() => getPurchaseOrder(id), [id]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const d = po.data;

  async function run(kind: 'send' | 'receive') {
    setBusy(kind);
    setMsg(null);
    setOk(null);
    try {
      if (kind === 'send') {
        await approveAndSendPurchaseOrder(id);
        setOk('Purchase order approved and sent. You can now receive the goods.');
      } else {
        await receivePurchaseOrder(id);
        setOk('Goods received. On-hand stock has been updated, and alerts were resolved where the minimum is now met.');
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  if (!d && !po.loading) return <Err>Purchase order not found.</Err>;
  if (!d) return <p className="muted">Loading…</p>;

  const canSend = d.status === 'draft' || d.status === 'approved';
  const canReceive = d.status === 'sent' || d.status === 'approved';

  return (
    <>
      <Back to="/inventory/purchase-orders" label="Purchase orders" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: 0 }}>{d.number}</h1>
        <Tag tone={poTone[d.status] ?? ''}>{poStatusLabel[d.status]}</Tag>
        {d.auto && <Tag>Automatic</Tag>}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="dbtn" type="button" disabled={!canSend || !!busy || !d.supplier_id} onClick={() => run('send')}>
            {busy === 'send' ? 'Sending…' : 'Approve and send'}
          </button>
          <button className="dbtn ok" type="button" disabled={!canReceive || !!busy} onClick={() => run('receive')} id="receive-po">
            {busy === 'receive' ? 'Receiving…' : 'Receive goods'}
          </button>
        </span>
      </div>
      {msg && <Err>{msg}</Err>}
      {ok && <p className="okmsg">{ok}</p>}
      <div className="stats">
        <Stat label="Supplier" value={d.supplier_name ?? 'None'} sub={d.contact_name ?? undefined} />
        <Stat label="Total" value={money(d.total_minor)} />
        <Stat label="Lead time" value={d.lead_time_days ? `${d.lead_time_days} days` : '—'} />
        <Stat label="Received" value={d.received_at ? dDate(d.received_at) : 'Not yet'} />
      </div>
      <div className="card">
        <div className="ch">Lines</div>
        <table className="dt">
          <thead>
            <tr>
              <th>Item</th>
              <th>Reason</th>
              <th className="r">Qty</th>
              <th className="r">Received</th>
              <th className="r">Unit</th>
              <th className="r">Total</th>
            </tr>
          </thead>
          <tbody>
            {d.lines.map((l) => (
              <tr key={l.id}>
                <td>
                  {l.name}
                  <div className="muted">{l.sku}</div>
                </td>
                <td>{l.reason ?? '—'}</td>
                <td className="r num">{num(l.qty)} {l.uom}</td>
                <td className="r num">{num(l.received_qty)}</td>
                <td className="r num">{l.unit_price_minor == null ? '—' : money(l.unit_price_minor)}</td>
                <td className="r num">{l.line_total_minor == null ? '—' : money(l.line_total_minor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function SuppliersPage() {
  const { data, error } = useLive(() => listSuppliers(), []);
  return (
    <>
      <h1 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600, letterSpacing: 0 }}>Suppliers</h1>
      {error && <Err>{error}</Err>}
      <div className="card">
        <table className="dt">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Category</th>
              <th>Contact</th>
              <th>Lead time</th>
              <th className="r">Minimum order</th>
              <th>Open draft</th>
              <th>Last receipt</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.category}</td>
                <td>{s.contact_name}</td>
                <td>{s.lead_time_days ? `${s.lead_time_days} days` : '—'}</td>
                <td className="r num">{s.min_order_minor ? money(s.min_order_minor) : '—'}</td>
                <td>{s.open_po ?? '—'}</td>
                <td>{dDate(s.last_receipt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
