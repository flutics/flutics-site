import { Link, useParams } from 'react-router-dom';
import { getInvoice, listInvoices } from '../db/queries';
import { money, dDate, invoiceStatusLabel, num } from '../format';
import { Back, Err, Stat, Tag } from '../ui/widgets';
import { useLive } from '../useLive';

const invTone: Record<string, string> = { open: 'gold', paid: 'green', void: 'red' };

export function InvoicesPage() {
  const { data, error } = useLive(() => listInvoices(), []);
  const rows = data ?? [];
  const open = rows.filter((r) => r.status === 'open');
  const due = open.reduce((s, r) => s + (Number(r.total_minor) - Number(r.paid_minor)), 0);
  return (
    <>
      <h1 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600, letterSpacing: 0 }}>Invoices</h1>
      {error && <Err>{error}</Err>}
      <div className="stats">
        <Stat label="Invoices" value={rows.length} />
        <Stat label="Open" value={open.length} />
        <Stat label="Outstanding" value={money(due)} />
        <Stat label="Paid" value={rows.filter((r) => r.status === 'paid').length} />
      </div>
      <div className="card">
        <table className="dt">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Order</th>
              <th>Issued</th>
              <th>Status</th>
              <th className="r">Total</th>
              <th className="r">Paid</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link to={`/billing/invoices/${r.id}`}>{r.number}</Link>
                </td>
                <td>{r.account_name}</td>
                <td>{r.order_number ?? '—'}</td>
                <td>{dDate(r.issue_date)}</td>
                <td>
                  <Tag tone={invTone[r.status] ?? ''}>{invoiceStatusLabel[r.status] ?? r.status}</Tag>
                </td>
                <td className="r num">{money(r.total_minor)}</td>
                <td className="r num">{money(r.paid_minor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function InvoiceDetailPage() {
  const { id = '' } = useParams();
  const inv = useLive(() => getInvoice(id), [id]);
  const d = inv.data;
  if (!d && !inv.loading) return <Err>Invoice not found.</Err>;
  if (!d) return <p className="muted">Loading…</p>;
  const outstanding = Number(d.total_minor) - Number(d.paid_minor);
  return (
    <>
      <Back to="/billing/invoices" label="Invoices" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: 0 }}>{d.number}</h1>
        <Tag tone={invTone[d.status] ?? ''}>{invoiceStatusLabel[d.status]}</Tag>
        {d.order_id && (
          <Link to={`/sales/orders/${d.order_id}`}>{d.order_number}</Link>
        )}
      </div>
      <div className="stats">
        <Stat label="Customer" value={d.account_name} />
        <Stat label="Issued" value={dDate(d.issue_date)} />
        <Stat label="Total" value={money(d.total_minor)} />
        <Stat label="Outstanding" value={money(outstanding)} sub={`${money(d.paid_minor)} paid`} />
      </div>
      <div className="grid2">
        <div className="card">
          <div className="ch">Lines</div>
          <table className="dt">
            <thead>
              <tr>
                <th>Product</th>
                <th className="r">Qty</th>
                <th className="r">Unit</th>
                <th className="r">Total</th>
              </tr>
            </thead>
            <tbody>
              {d.lines.map((l) => (
                <tr key={l.line_no}>
                  <td>
                    {l.description}
                    <div className="muted">{l.product_code}</div>
                  </td>
                  <td className="r num">{num(l.qty)} {l.uom}</td>
                  <td className="r num">{money(l.unit_price_minor)}</td>
                  <td className="r num">{money(l.line_total_minor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="ch">Installments</div>
          <table className="dt">
            <thead>
              <tr>
                <th>#</th>
                <th>Due</th>
                <th className="r">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {d.installments.map((i) => (
                <tr key={i.n}>
                  <td>{i.n}/{d.installment_count}</td>
                  <td>{dDate(i.due_date)}</td>
                  <td className="r num">{money(i.amount_minor)}</td>
                  <td>
                    <Tag tone={i.status === 'paid' ? 'green' : 'gold'}>{i.status}</Tag>
                    {i.method && <div className="muted">{i.method}{i.receipt_number ? ` · ${i.receipt_number}` : ''}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
