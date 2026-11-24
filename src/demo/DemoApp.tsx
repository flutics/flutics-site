import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { getDb } from './db/client';
import {
  InvoiceDetailPage,
  InvoicesPage,
} from './screens/Billing';
import {
  AlertsPage,
  PurchaseOrderDetailPage,
  PurchaseOrdersPage,
  StockPage,
  SuppliersPage,
} from './screens/Inventory';
import {
  CompaniesPage,
  CompanyDetailPage,
  ContactsPage,
  NewQuotePage,
  OrderDetailPage,
  OrdersPage,
  PipelinePage,
  QuoteDetailPage,
  QuotesPage,
} from './screens/Sales';
import { Shell } from './shell/Shell';

export function DemoApp() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ok = true;
    getDb()
      .then(() => {
        if (ok) setReady(true);
      })
      .catch((e: unknown) => {
        if (ok) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      ok = false;
    };
  }, []);

  if (error) {
    return (
      <div className="demo-boot">
        <h1 style={{ fontSize: 22 }}>The demo database failed to start</h1>
        <p>{error}</p>
        <p>This demo uses PGlite (Postgres in WebAssembly). Try a current Chrome, Firefox or Edge, or reset the site data for this origin.</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="demo-boot">
        <h1 style={{ fontSize: 22 }}>Starting the in-browser database…</h1>
        <p>Loading Postgres (PGlite) and seeding fictional Alder Light Co. data.</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Navigate to="sales/orders" replace />} />
        <Route path="sales/orders" element={<OrdersPage />} />
        <Route path="sales/orders/:id" element={<OrderDetailPage />} />
        <Route path="sales/pipeline" element={<PipelinePage />} />
        <Route path="sales/companies" element={<CompaniesPage />} />
        <Route path="sales/companies/:id" element={<CompanyDetailPage />} />
        <Route path="sales/contacts" element={<ContactsPage />} />
        <Route path="sales/quotes" element={<QuotesPage />} />
        <Route path="sales/quotes/new" element={<NewQuotePage />} />
        <Route path="sales/quotes/:id" element={<QuoteDetailPage />} />
        <Route path="inventory" element={<Navigate to="stock" replace />} />
        <Route path="inventory/stock" element={<StockPage />} />
        <Route path="inventory/alerts" element={<AlertsPage />} />
        <Route path="inventory/purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="inventory/purchase-orders/:id" element={<PurchaseOrderDetailPage />} />
        <Route path="inventory/suppliers" element={<SuppliersPage />} />
        <Route path="billing" element={<Navigate to="invoices" replace />} />
        <Route path="billing/invoices" element={<InvoicesPage />} />
        <Route path="billing/invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="*" element={<Navigate to="sales/orders" replace />} />
      </Route>
    </Routes>
  );
}
