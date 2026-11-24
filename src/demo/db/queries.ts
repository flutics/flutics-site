import { query } from './client';

export type Account = {
  id: string;
  legal_name: string;
  trade_name: string | null;
  segment: string | null;
  city: string | null;
  region: string | null;
  owner_name: string | null;
  status: string;
  last_interaction: string | null;
  open_pipeline_minor: string | number;
  open_orders: string | number;
  open_orders_minor: string | number;
  receivable_minor: string | number;
};

export type Contact = {
  id: string;
  full_name: string;
  job_title: string | null;
  phone: string | null;
  instagram_handle: string | null;
  facebook: boolean;
  owner_name: string | null;
  awaiting_reply: boolean;
  last_interaction: string | null;
  companies: string | null;
};

export type Opportunity = {
  id: string;
  title: string;
  account_id: string | null;
  account_name: string | null;
  stage: string;
  value_minor: string | number;
  owner_name: string | null;
  source: string | null;
  expected_close: string | null;
  quote_number: string | null;
  quote_valid_until: string | null;
  awaiting_reply: boolean;
};

export type OrderListRow = {
  id: string;
  number: string;
  account_id: string;
  account_name: string;
  status: string;
  promised_date: string | null;
  total_minor: string | number;
  reservation_state: string;
  owner_name: string | null;
  stages: string | null;
};

export type OrderLine = {
  id: string;
  line_no: number;
  product_id: string | null;
  product_code: string | null;
  description: string;
  qty: string | number;
  uom: string;
  unit_price_minor: string | number;
  line_total_minor: string | number;
  promised_date: string | null;
  stage: string;
  billed_qty: string | number;
  billed_minor: string | number;
};

export async function listOrders() {
  return query<OrderListRow>(`
    select o.id, o.number, o.account_id, a.trade_name as account_name, o.status,
           o.promised_date, o.total_minor, o.reservation_state, o.owner_name,
           (select string_agg(x.stage || ':' || x.n, ',')
              from (select ls.stage, count(*)::int as n
                      from sales.line_status ls
                     where ls.order_id = o.id
                     group by ls.stage) x) as stages
      from sales.sales_orders o
      join sales.accounts a on a.id = o.account_id
     order by o.number desc
  `);
}

export async function getOrder(id: string) {
  const rows = await query<OrderListRow>(`
    select o.id, o.number, o.account_id, a.trade_name as account_name, o.status,
           o.promised_date, o.total_minor, o.reservation_state, o.owner_name,
           null::text as stages
      from sales.sales_orders o
      join sales.accounts a on a.id = o.account_id
     where o.id = $1
  `, [id]);
  return rows[0] ?? null;
}

export async function getOrderLines(orderId: string) {
  return query<OrderLine>(`
    select ls.id, ls.line_no, ls.product_id, p.code as product_code, ls.description,
           ls.qty, ls.uom, ls.unit_price_minor, ls.line_total_minor, ls.promised_date, ls.stage,
           coalesce((select sum(il.qty) from billing.invoice_lines il
                      join billing.invoices i on i.id = il.invoice_id
                     where il.order_line_id = ls.id and i.status <> 'void'), 0) as billed_qty,
           coalesce((select sum(il.line_total_minor) from billing.invoice_lines il
                      join billing.invoices i on i.id = il.invoice_id
                     where il.order_line_id = ls.id and i.status <> 'void'), 0) as billed_minor
      from sales.line_status ls
      left join sales.products p on p.id = ls.product_id
     where ls.order_id = $1
     order by ls.line_no
  `, [orderId]);
}

export async function listAccounts() {
  return query<Account>(`
    select a.*,
           coalesce((select sum(o.value_minor) from sales.opportunities o
                      where o.account_id = a.id and o.stage not in ('won','lost')), 0) as open_pipeline_minor,
           coalesce((select count(*) from sales.sales_orders o
                      where o.account_id = a.id and o.status not in ('delivered','closed','cancelled')), 0) as open_orders,
           coalesce((select sum(o.total_minor) from sales.sales_orders o
                      where o.account_id = a.id and o.status not in ('delivered','closed','cancelled')), 0) as open_orders_minor,
           coalesce((select sum(i.total_minor - i.paid_minor) from billing.invoices i
                      where i.account_id = a.id and i.status <> 'void'), 0) as receivable_minor
      from sales.accounts a
     order by a.trade_name
  `);
}

export async function getAccount(id: string) {
  const rows = await listAccounts();
  return rows.find((a) => a.id === id) ?? null;
}

export async function listContacts() {
  return query<Contact>(`
    select c.*,
           (select string_agg(a.trade_name, ', ' order by ac.is_primary desc)
              from sales.account_contacts ac
              join sales.accounts a on a.id = ac.account_id
             where ac.contact_id = c.id) as companies
      from sales.contacts c
     order by c.full_name
  `);
}

export async function listOpportunities() {
  return query<Opportunity>(`
    select o.*, a.trade_name as account_name
      from sales.opportunities o
      left join sales.accounts a on a.id = o.account_id
     order by o.value_minor desc
  `);
}

export async function listProducts() {
  return query<{ id: string; code: string; name: string; family: string | null; list_price_minor: string | number; uom: string }>(`
    select id, code, name, family, list_price_minor, uom from sales.products where status = 'active' order by code
  `);
}

export async function listQuotes() {
  return query<{
    id: string; number: string; account_name: string; status: string;
    valid_until: string | null; total_minor: string | number; owner_name: string | null; created_at: string;
  }>(`
    select q.id, q.number, a.trade_name as account_name, q.status, q.valid_until,
           q.total_minor, q.owner_name, q.created_at
      from sales.quotes q
      join sales.accounts a on a.id = q.account_id
     order by q.number desc
  `);
}

export async function getQuote(id: string) {
  const head = await query<{
    id: string; number: string; account_id: string; account_name: string; status: string;
    valid_until: string | null; total_minor: string | number; owner_name: string | null; created_at: string;
  }>(`
    select q.id, q.number, q.account_id, a.trade_name as account_name, q.status, q.valid_until,
           q.total_minor, q.owner_name, q.created_at
      from sales.quotes q
      join sales.accounts a on a.id = q.account_id
     where q.id = $1
  `, [id]);
  const lines = await query<{
    line_no: number; description: string; qty: string | number; uom: string;
    unit_price_minor: string | number; line_total_minor: string | number; product_code: string | null;
  }>(`
    select l.line_no, l.description, l.qty, l.uom, l.unit_price_minor, l.line_total_minor, p.code as product_code
      from sales.quote_lines l
      left join sales.products p on p.id = l.product_id
     where l.quote_id = $1
     order by l.line_no
  `, [id]);
  return head[0] ? { ...head[0], lines } : null;
}

export async function listStock() {
  return query<{
    id: string; sku: string; name: string; kind: string; uom: string;
    on_hand: string | number; reserved: string | number; available: string | number;
    min_qty: string | number; incoming: string | number; situation: string;
  }>(`
    select * from inventory.stock order by
      case situation when 'short' then 0 when 'out' then 1 when 'below_min' then 2 else 3 end,
      sku
  `);
}

export async function listAlerts() {
  return query<{
    id: string; sku: string; name: string; severity: string; detail: string;
    trigger_count: number; status: string; po_number: string | null; opened_at: string | null; last_at: string | null;
    uom: string;
  }>(`
    select a.id, i.sku, i.name, a.severity, a.detail, a.trigger_count, a.status,
           po.number as po_number, a.opened_at, a.last_at, i.uom
      from inventory.stock_alerts a
      join inventory.items i on i.id = a.item_id
      left join inventory.purchase_orders po on po.id = a.purchase_order_id
     where a.status = 'open'
     order by case a.severity when 'short' then 0 when 'out' then 1 else 2 end, a.last_at desc
  `);
}

export async function listPurchaseOrders() {
  return query<{
    id: string; number: string; supplier_name: string | null; status: string; auto: boolean;
    total_minor: string | number; line_count: string | number; created_at: string; received_at: string | null;
  }>(`
    select po.id, po.number, s.name as supplier_name, po.status, po.auto, po.total_minor,
           (select count(*) from inventory.purchase_order_lines l where l.purchase_order_id = po.id) as line_count,
           po.created_at, po.received_at
      from inventory.purchase_orders po
      left join inventory.suppliers s on s.id = po.supplier_id
     order by po.number desc
  `);
}

export async function getPurchaseOrder(id: string) {
  const head = await query<{
    id: string; number: string; supplier_id: string | null; supplier_name: string | null;
    status: string; auto: boolean; total_minor: string | number; notes: string | null;
    created_at: string; approved_at: string | null; sent_at: string | null; received_at: string | null;
    lead_time_days: number | null; min_order_minor: string | number | null; contact_name: string | null;
  }>(`
    select po.*, s.name as supplier_name, s.lead_time_days, s.min_order_minor, s.contact_name
      from inventory.purchase_orders po
      left join inventory.suppliers s on s.id = po.supplier_id
     where po.id = $1
  `, [id]);
  const lines = await query<{
    id: string; line_no: number; item_id: string; sku: string; name: string; qty: string | number;
    received_qty: string | number; uom: string; unit_price_minor: string | number | null;
    line_total_minor: string | number | null; reason: string | null;
  }>(`
    select l.id, l.line_no, l.item_id, i.sku, i.name, l.qty, l.received_qty, l.uom,
           l.unit_price_minor, l.line_total_minor, l.reason
      from inventory.purchase_order_lines l
      join inventory.items i on i.id = l.item_id
     where l.purchase_order_id = $1
     order by l.line_no
  `, [id]);
  return head[0] ? { ...head[0], lines } : null;
}

export async function listSuppliers() {
  return query<{
    id: string; name: string; category: string | null; contact_name: string | null;
    lead_time_days: number | null; min_order_minor: string | number | null;
    last_receipt: string | null; status: string; open_po: string | null;
  }>(`
    select s.*,
           (select po.number from inventory.purchase_orders po
             where po.supplier_id = s.id and po.status in ('draft','approved','sent')
             order by po.number desc limit 1) as open_po
      from inventory.suppliers s
     order by s.name
  `);
}

export async function listInvoices() {
  return query<{
    id: string; number: string; account_name: string; order_number: string | null;
    status: string; issue_date: string; total_minor: string | number; paid_minor: string | number;
  }>(`
    select i.id, i.number, a.trade_name as account_name, o.number as order_number,
           i.status, i.issue_date, i.total_minor, i.paid_minor
      from billing.invoices i
      join sales.accounts a on a.id = i.account_id
      left join sales.sales_orders o on o.id = i.order_id
     order by i.number desc
  `);
}

export async function getInvoice(id: string) {
  const head = await query<{
    id: string; number: string; account_id: string; account_name: string; order_id: string | null;
    order_number: string | null; status: string; issue_date: string; total_minor: string | number;
    paid_minor: string | number; installment_count: number;
  }>(`
    select i.id, i.number, i.account_id, a.trade_name as account_name, i.order_id, o.number as order_number,
           i.status, i.issue_date, i.total_minor, i.paid_minor, i.installment_count
      from billing.invoices i
      join sales.accounts a on a.id = i.account_id
      left join sales.sales_orders o on o.id = i.order_id
     where i.id = $1
  `, [id]);
  const lines = await query<{
    line_no: number; description: string; product_code: string | null; qty: string | number;
    uom: string; unit_price_minor: string | number; line_total_minor: string | number; order_line_id: string | null;
  }>(`
    select l.line_no, l.description, p.code as product_code, l.qty, l.uom,
           l.unit_price_minor, l.line_total_minor, l.order_line_id
      from billing.invoice_lines l
      left join sales.products p on p.id = l.product_id
     where l.invoice_id = $1
     order by l.line_no
  `, [id]);
  const installments = await query<{
    n: number; due_date: string; amount_minor: string | number; status: string;
    paid_at: string | null; method: string | null; receipt_number: string | null;
  }>(`
    select n, due_date, amount_minor, status, paid_at, method, receipt_number
      from billing.installments where invoice_id = $1 order by n
  `, [id]);
  return head[0] ? { ...head[0], lines, installments } : null;
}

export async function searchAll(q: string) {
  const term = `%${q.trim()}%`;
  if (!q.trim()) return { orders: [], accounts: [], invoices: [], products: [], pos: [] };
  const [orders, accounts, invoices, products, pos] = await Promise.all([
    query<{ id: string; number: string; account_name: string }>(`
      select o.id, o.number, a.trade_name as account_name
        from sales.sales_orders o join sales.accounts a on a.id = o.account_id
       where o.number ilike $1 or a.trade_name ilike $1 or a.legal_name ilike $1
       order by o.number desc limit 8
    `, [term]),
    query<{ id: string; trade_name: string }>(`
      select id, trade_name from sales.accounts
       where trade_name ilike $1 or legal_name ilike $1 or city ilike $1
       limit 8
    `, [term]),
    query<{ id: string; number: string; account_name: string }>(`
      select i.id, i.number, a.trade_name as account_name
        from billing.invoices i join sales.accounts a on a.id = i.account_id
       where i.number ilike $1 or a.trade_name ilike $1
       limit 8
    `, [term]),
    query<{ id: string; code: string; name: string }>(`
      select id, code, name from sales.products where code ilike $1 or name ilike $1 limit 8
    `, [term]),
    query<{ id: string; number: string; supplier_name: string | null }>(`
      select po.id, po.number, s.name as supplier_name
        from inventory.purchase_orders po
        left join inventory.suppliers s on s.id = po.supplier_id
       where po.number ilike $1 or s.name ilike $1
       limit 8
    `, [term]),
  ]);
  return { orders, accounts, invoices, products, pos };
}
