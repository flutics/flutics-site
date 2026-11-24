import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { resetDemo } from '../db/client';
import { listAlerts, searchAll } from '../db/queries';
import { useLive } from '../useLive';

const sales = [
  ['pipeline', 'Pipeline'],
  ['orders', 'Orders'],
  ['quotes', 'Quotes'],
  ['companies', 'Companies'],
  ['contacts', 'Contacts'],
];
const inventory = [
  ['stock', 'Stock'],
  ['alerts', 'Alerts'],
  ['purchase-orders', 'Purchase orders'],
  ['suppliers', 'Suppliers'],
];
const billing = [['invoices', 'Invoices']];

function Item({ to, label, count }: { to: string; label: string; count?: number }) {
  return (
    <NavLink to={to} className={({ isActive }) => `mi${isActive ? ' on' : ''}`}>
      {label}
      {count ? <span className="cnt">{count}</span> : null}
    </NavLink>
  );
}

export function Shell() {
  const alerts = useLive(() => listAlerts(), []);
  const openAlerts = alerts.data?.length ?? 0;
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetNote, setResetNote] = useState<string | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const results = useLive(() => (open ? searchAll(q) : Promise.resolve(null)), [open, q]);

  async function onReset() {
    if (resetting) return;
    setResetting(true);
    setResetNote(null);
    try {
      await resetDemo();
      setResetNote('Demo data restored.');
      nav('/sales/orders');
      setTimeout(() => setResetNote(null), 3500);
    } catch (e) {
      setResetNote(e instanceof Error ? e.message : String(e));
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="demo-root">
      <div className="demo-banner">
        <strong>Flutics demo</strong>
        <span className="sp">·</span>
        <span>
          Browser only — Postgres in WASM (PGlite), saved in this browser. Fictional company: Alder Light Co.
        </span>
        <span className="grow">{resetNote ?? ''}</span>
        <a href="https://flutics.com/">Back to site</a>
        <button className="reset" type="button" onClick={onReset} disabled={resetting} id="reset-demo">
          {resetting ? 'Resetting…' : 'Reset demo'}
        </button>
      </div>
      <div className="demo-body">
        <aside className="sider">
          <div className="sbrand">
            <div className="logo">AL</div>
            <div>
              Alder Light Co.
              <small>Workspace · fictional</small>
            </div>
          </div>
          <nav className="menu" aria-label="Apps">
            <div className="mlabel">Sales / CRM</div>
            {sales.map(([p, l]) => (
              <Item key={p} to={`/sales/${p}`} label={l} />
            ))}
            <div className="mlabel">Inventory</div>
            {inventory.map(([p, l]) => (
              <Item key={p} to={`/inventory/${p}`} label={l} count={p === 'alerts' ? openAlerts : undefined} />
            ))}
            <div className="mlabel">Billing</div>
            {billing.map(([p, l]) => (
              <Item key={p} to={`/billing/${p}`} label={l} />
            ))}
          </nav>
          <div className="sider-foot">
            <span className="av">EW</span>
            <div>
              <div>Elena Walsh</div>
              <div className="muted">Sales</div>
            </div>
          </div>
        </aside>
        <div className="dmain">
          <div className="ph" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }} aria-hidden />
          <div className="dcontent" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 24px', height: 64, background: '#fff', borderBottom: '1px solid #f0f0f0', flex: 'none' }}>
              <button type="button" className="search" onClick={() => setOpen(true)} style={{ marginLeft: 'auto' }}>
                Search orders, companies, invoices…
                <span className="kbd" style={{ marginLeft: 'auto' }}>⌘K</span>
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px 32px' }}>
              <Outlet />
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div className="modal-back" onClick={() => setOpen(false)} role="presentation">
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Search">
            <div className="modal h">Search</div>
            <div className="modal b">
              <input
                className="dinput"
                style={{ width: '100%', minWidth: 0 }}
                autoFocus
                placeholder="Order, company, invoice, product, purchase order…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <div style={{ marginTop: 12 }}>
                {!q.trim() && <p className="muted">Type to search the demo database.</p>}
                {results.data && q.trim() && (
                  <>
                    <Hits
                      title="Orders"
                      items={results.data.orders.map((o) => ({
                        to: `/sales/orders/${o.id}`,
                        label: `${o.number} · ${o.account_name}`,
                      }))}
                      onPick={() => setOpen(false)}
                    />
                    <Hits
                      title="Companies"
                      items={results.data.accounts.map((a) => ({
                        to: `/sales/companies/${a.id}`,
                        label: a.trade_name,
                      }))}
                      onPick={() => setOpen(false)}
                    />
                    <Hits
                      title="Invoices"
                      items={results.data.invoices.map((i) => ({
                        to: `/billing/invoices/${i.id}`,
                        label: `${i.number} · ${i.account_name}`,
                      }))}
                      onPick={() => setOpen(false)}
                    />
                    <Hits
                      title="Purchase orders"
                      items={results.data.pos.map((p) => ({
                        to: `/inventory/purchase-orders/${p.id}`,
                        label: `${p.number}${p.supplier_name ? ` · ${p.supplier_name}` : ''}`,
                      }))}
                      onPick={() => setOpen(false)}
                    />
                    <Hits
                      title="Products"
                      items={results.data.products.map((p) => ({
                        to: '/sales/orders',
                        label: `${p.code} · ${p.name}`,
                      }))}
                      onPick={() => setOpen(false)}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Hits({
  title,
  items,
  onPick,
}: {
  title: string;
  items: { to: string; label: string }[];
  onPick: () => void;
}) {
  if (!items.length) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <div className="muted" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {title}
      </div>
      {items.map((it) => (
        <Link key={it.to + it.label} className="search-hit" to={it.to} onClick={onPick}>
          {it.label}
        </Link>
      ))}
    </div>
  );
}
