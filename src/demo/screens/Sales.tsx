import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createQuote, issueInvoice, moveOpportunity } from '../db/actions';
import {
  getAccount,
  getOrder,
  getOrderLines,
  getQuote,
  listAccounts,
  listContacts,
  listOpportunities,
  listOrders,
  listProducts,
  listQuotes,
} from '../db/queries';
import { money, dDate, num, reservationLabel, stageClass, stageLabel } from '../format';
import { Back, Err, Stat, Tag } from '../ui/widgets';
import { useLive } from '../useLive';

export function OrdersPage() {
  const { data, error } = useLive(() => listOrders(), []);
  const rows = data ?? [];
  const open = rows.filter((r) => !['delivered', 'closed', 'cancelled'].includes(r.status));
  const openTotal = open.reduce((s, r) => s + Number(r.total_minor), 0);
  const pending = rows.filter((r) => r.reservation_state === 'pending' || r.reservation_state === 'partial').length;
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: 0 }}>Orders</h1>
        <Link className="dbtn p" to="/sales/quotes/new" style={{ marginLeft: 'auto' }}>
          New quote
        </Link>
      </div>
      {error && <Err>{error}</Err>}
      <div className="stats">
        <Stat label="Open orders" value={open.length} />
        <Stat label="Open value" value={money(openTotal)} />
        <Stat label="Waiting on reservation" value={pending} />
        <Stat label="All orders" value={rows.length} />
      </div>
      <div className="card">
        <table className="dt">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th className="r">Value</th>
              <th>Promised</th>
              <th>Reservation</th>
              <th>Lines by stage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link to={`/sales/orders/${r.id}`}>{r.number}</Link>
                </td>
                <td>
                  <Link to={`/sales/companies/${r.account_id}`}>{r.account_name}</Link>
                </td>
                <td className="r num">{money(r.total_minor)}</td>
                <td>{dDate(r.promised_date)}</td>
                <td>
                  <Tag tone={r.reservation_state === 'full' ? 'green' : r.reservation_state === 'partial' ? 'gold' : 'red'}>
                    {reservationLabel[r.reservation_state] ?? r.reservation_state}
                  </Tag>
                </td>
                <td>
                  <div className="chips">
                    {parseStages(r.stages).map((s) => (
                      <Tag key={s.stage} tone={stageClass[s.stage] ?? ''}>
                        {stageLabel[s.stage] ?? s.stage} · {s.n}
                      </Tag>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function parseStages(raw: string | null) {
  if (!raw) return [];
  return raw.split(',').map((p) => {
    const [stage, n] = p.split(':');
    return { stage, n: Number(n) };
  });
}

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const order = useLive(() => getOrder(id), [id]);
  const lines = useLive(() => getOrderLines(id), [id]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const o = order.data;
  const ls = lines.data ?? [];

  async function invoiceRemaining() {
    setBusy(true);
    setMsg(null);
    try {
      const invId = await issueInvoice(id);
      nav(`/billing/invoices/${invId}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (!o && !order.loading) return <Err>Order not found.</Err>;
  if (!o) return <p className="muted">Loading…</p>;

  const billed = ls.reduce((s, l) => s + Number(l.billed_minor), 0);

  return (
    <>
      <Back to="/sales/orders" label="Orders" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: 0 }}>{o.number}</h1>
        <Tag tone="blue">{o.account_name}</Tag>
        <Tag>{o.status.replace('_', ' ')}</Tag>
        <button className="dbtn p" type="button" onClick={invoiceRemaining} disabled={busy} style={{ marginLeft: 'auto' }}>
          Issue invoice
        </button>
      </div>
      {msg && <Err>{msg}</Err>}
      <div className="stats">
        <Stat label="Total" value={money(o.total_minor)} />
        <Stat label="Promised" value={dDate(o.promised_date)} />
        <Stat label="Reservation" value={reservationLabel[o.reservation_state] ?? o.reservation_state} />
        <Stat label="Already billed" value={money(billed)} sub={`${money(Number(o.total_minor) - billed)} left`} />
      </div>
      <div className="card">
        <div className="ch">Lines</div>
        <table className="dt">
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th className="r">Qty</th>
              <th className="r">Unit</th>
              <th className="r">Total</th>
              <th>Stage</th>
              <th className="r">Billed</th>
            </tr>
          </thead>
          <tbody>
            {ls.map((l) => (
              <tr key={l.id}>
                <td>{l.line_no}</td>
                <td>
                  <div>{l.description}</div>
                  <div className="muted">{l.product_code}</div>
                </td>
                <td className="r num">{num(l.qty)}</td>
                <td className="r num">{money(l.unit_price_minor)}</td>
                <td className="r num">{money(l.line_total_minor)}</td>
                <td>
                  <Tag tone={stageClass[l.stage] ?? ''}>{stageLabel[l.stage] ?? l.stage}</Tag>
                </td>
                <td className="r num">
                  {num(l.billed_qty)} / {num(l.qty)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const STAGES = [
  ['lead', 'Lead'],
  ['qualified', 'Qualified'],
  ['proposal', 'Proposal'],
  ['negotiation', 'Negotiation'],
  ['won', 'Won'],
];

export function PipelinePage() {
  const { data, error } = useLive(() => listOpportunities(), []);
  const [msg, setMsg] = useState<string | null>(null);
  const rows = (data ?? []).filter((o) => o.stage !== 'lost');

  async function onDrop(id: string, stage: string) {
    try {
      await moveOpportunity(id, stage);
      setMsg(null);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <>
      <h1 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600, letterSpacing: 0 }}>Pipeline</h1>
      {error && <Err>{error}</Err>}
      {msg && <Err>{msg}</Err>}
      <div className="pipeline">
        {STAGES.map(([key, label]) => {
          const cards = rows.filter((o) => o.stage === key);
          const sum = cards.reduce((s, c) => s + Number(c.value_minor), 0);
          return (
            <div
              key={key}
              className="pcol"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData('text/opportunity-id');
                if (id) void onDrop(id, key);
              }}
            >
              <h3>
                {label} <span className="muted">{money(sum)}</span>
              </h3>
              {cards.map((c) => (
                <div
                  key={c.id}
                  className="pcard"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/opportunity-id', c.id)}
                >
                  <div className="ttl">{c.title}</div>
                  <div className="meta">
                    <span>{c.account_name}</span>
                    <span>{money(c.value_minor)} · {c.owner_name}</span>
                    {c.quote_number && (
                      <span>
                        {c.quote_number}
                        {c.quote_valid_until ? ` · until ${dDate(c.quote_valid_until)}` : ''}
                      </span>
                    )}
                    {c.awaiting_reply && <Tag tone="gold">Awaiting reply</Tag>}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <p className="muted" style={{ marginTop: 12 }}>Drag a card to another column to change its stage. Lost deals are hidden from this board.</p>
    </>
  );
}

export function CompaniesPage() {
  const { data, error } = useLive(() => listAccounts(), []);
  return (
    <>
      <h1 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600, letterSpacing: 0 }}>Companies</h1>
      {error && <Err>{error}</Err>}
      <div className="card">
        <table className="dt">
          <thead>
            <tr>
              <th>Company</th>
              <th>Segment</th>
              <th>Status</th>
              <th>Owner</th>
              <th className="r">Open pipeline</th>
              <th className="r">Open orders</th>
              <th className="r">Receivable</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((a) => (
              <tr key={a.id}>
                <td>
                  <Link to={`/sales/companies/${a.id}`}>{a.trade_name}</Link>
                  <div className="muted">{a.city}, {a.region}</div>
                </td>
                <td>{a.segment}</td>
                <td>
                  <Tag tone={a.status === 'active' ? 'green' : 'gold'}>{a.status}</Tag>
                </td>
                <td>{a.owner_name}</td>
                <td className="r num">{money(a.open_pipeline_minor)}</td>
                <td className="r num">
                  {num(a.open_orders)} · {money(a.open_orders_minor)}
                </td>
                <td className="r num">{money(a.receivable_minor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function CompanyDetailPage() {
  const { id = '' } = useParams();
  const account = useLive(() => getAccount(id), [id]);
  const orders = useLive(() => listOrders(), []);
  const a = account.data;
  if (!a && !account.loading) return <Err>Company not found.</Err>;
  if (!a) return <p className="muted">Loading…</p>;
  const mine = (orders.data ?? []).filter((o) => o.account_id === a.id);
  return (
    <>
      <Back to="/sales/companies" label="Companies" />
      <h1 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600, letterSpacing: 0 }}>{a.trade_name}</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        {a.segment} · {a.city}, {a.region} · {a.owner_name} · last touch: {a.last_interaction}
      </p>
      <div className="stats">
        <Stat label="Open pipeline" value={money(a.open_pipeline_minor)} />
        <Stat label="Open orders" value={money(a.open_orders_minor)} sub={`${num(a.open_orders)} open`} />
        <Stat label="Receivable" value={money(a.receivable_minor)} />
        <Stat label="Status" value={a.status} />
      </div>
      <div className="card">
        <div className="ch">Orders</div>
        <table className="dt">
          <thead>
            <tr>
              <th>Order</th>
              <th className="r">Value</th>
              <th>Promised</th>
              <th>Reservation</th>
            </tr>
          </thead>
          <tbody>
            {mine.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link to={`/sales/orders/${o.id}`}>{o.number}</Link>
                </td>
                <td className="r num">{money(o.total_minor)}</td>
                <td>{dDate(o.promised_date)}</td>
                <td>{reservationLabel[o.reservation_state]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ContactsPage() {
  const { data, error } = useLive(() => listContacts(), []);
  return (
    <>
      <h1 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600, letterSpacing: 0 }}>Contacts</h1>
      {error && <Err>{error}</Err>}
      <div className="card">
        <table className="dt">
          <thead>
            <tr>
              <th>Contact</th>
              <th>Companies</th>
              <th>Phone / profile</th>
              <th>Owner</th>
              <th>Last interaction</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((c) => (
              <tr key={c.id}>
                <td>
                  <div>{c.full_name}</div>
                  <div className="muted">{c.job_title}</div>
                </td>
                <td>{c.companies ?? '—'}</td>
                <td>
                  {c.phone ?? (c.instagram_handle ? `@${c.instagram_handle}` : c.facebook ? 'Facebook' : '—')}
                </td>
                <td>{c.owner_name}</td>
                <td>
                  {c.last_interaction}
                  {c.awaiting_reply && (
                    <>
                      {' '}
                      <Tag tone="gold">Awaiting reply</Tag>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function QuotesPage() {
  const { data, error } = useLive(() => listQuotes(), []);
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: 0 }}>Quotes</h1>
        <Link className="dbtn p" to="/sales/quotes/new" style={{ marginLeft: 'auto' }}>
          New quote
        </Link>
      </div>
      {error && <Err>{error}</Err>}
      <div className="card">
        <table className="dt">
          <thead>
            <tr>
              <th>Quote</th>
              <th>Company</th>
              <th>Status</th>
              <th>Valid until</th>
              <th className="r">Total</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((q) => (
              <tr key={q.id}>
                <td>
                  <Link to={`/sales/quotes/${q.id}`}>{q.number}</Link>
                </td>
                <td>{q.account_name}</td>
                <td>
                  <Tag tone={q.status === 'sent' ? 'blue' : q.status === 'accepted' ? 'green' : ''}>{q.status}</Tag>
                </td>
                <td>{dDate(q.valid_until)}</td>
                <td className="r num">{money(q.total_minor)}</td>
                <td>{q.owner_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function QuoteDetailPage() {
  const { id = '' } = useParams();
  const q = useLive(() => getQuote(id), [id]);
  const d = q.data;
  if (!d && !q.loading) return <Err>Quote not found.</Err>;
  if (!d) return <p className="muted">Loading…</p>;
  return (
    <>
      <Back to="/sales/quotes" label="Quotes" />
      <h1 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600, letterSpacing: 0 }}>{d.number}</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        {d.account_name} · {d.status} · valid until {dDate(d.valid_until)} · {money(d.total_minor)}
      </p>
      <div className="card">
        <table className="dt">
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
              <th className="r">Qty</th>
              <th className="r">Unit</th>
              <th className="r">Total</th>
            </tr>
          </thead>
          <tbody>
            {d.lines.map((l) => (
              <tr key={l.line_no}>
                <td>{l.line_no}</td>
                <td>
                  {l.description}
                  <div className="muted">{l.product_code}</div>
                </td>
                <td className="r num">{num(l.qty)}</td>
                <td className="r num">{money(l.unit_price_minor)}</td>
                <td className="r num">{money(l.line_total_minor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function NewQuotePage() {
  const nav = useNavigate();
  const accounts = useLive(() => listAccounts(), []);
  const products = useLive(() => listProducts(), []);
  const defaultUntil = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  }, []);
  const [accountId, setAccountId] = useState('');
  const [validUntil, setValidUntil] = useState(defaultUntil);
  const [lines, setLines] = useState<{ productId: string; qty: number }[]>([{ productId: '', qty: 1 }]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const prod = products.data ?? [];
  const total = lines.reduce((s, l) => {
    const p = prod.find((x) => x.id === l.productId);
    return s + (p ? Number(p.list_price_minor) * Number(l.qty || 0) : 0);
  }, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const clean = lines.filter((l) => l.productId && l.qty > 0);
      const id = await createQuote({ accountId, lines: clean, validUntil });
      nav(`/sales/quotes/${id}`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Back to="/sales/quotes" label="Quotes" />
      <h1 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600, letterSpacing: 0 }}>New quote</h1>
      <form className="card" onSubmit={submit} style={{ padding: 20, maxWidth: 720 }}>
        {msg && <Err>{msg}</Err>}
        <div className="field">
          <label htmlFor="account">Company</label>
          <select id="account" value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
            <option value="">Choose…</option>
            {(accounts.data ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.trade_name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="until">Valid until</label>
          <input id="until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} required />
        </div>
        <div className="field">
          <label>Lines</label>
          {lines.map((l, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <select
                value={l.productId}
                onChange={(e) => setLines((xs) => xs.map((x, j) => (j === i ? { ...x, productId: e.target.value } : x)))}
                style={{ flex: 1 }}
              >
                <option value="">Product…</option>
                {prod.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.name} · {money(p.list_price_minor)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                step={1}
                value={l.qty}
                onChange={(e) => setLines((xs) => xs.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value) } : x)))}
                style={{ width: 80 }}
              />
              <button
                type="button"
                className="dbtn"
                onClick={() => setLines((xs) => xs.filter((_, j) => j !== i))}
                disabled={lines.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="dbtn" onClick={() => setLines((xs) => [...xs, { productId: '', qty: 1 }])}>
            Add line
          </button>
        </div>
        <p style={{ fontWeight: 600 }}>Total {money(total)}</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="dbtn p" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Create quote'}
          </button>
        </div>
      </form>
    </>
  );
}
