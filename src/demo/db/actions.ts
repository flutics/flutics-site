import { getDb, notifyDb } from './client';

function pad(n: number, w: number) {
  return String(n).padStart(w, '0');
}

export async function createQuote(input: {
  accountId: string;
  lines: { productId: string; qty: number }[];
  validUntil: string;
}) {
  if (!input.accountId) throw new Error('Choose a company.');
  if (!input.lines.length) throw new Error('Add at least one line.');
  const db = await getDb();
  const id = await db.transaction(async (tx) => {
    const n = await tx.query<{ n: number }>('select nextval(\'sales.quote_no\')::int as n');
    const number = `QT-26-${pad(Number(n.rows[0].n), 4)}`;
    const products = await tx.query<{ id: string; name: string; list_price_minor: string; uom: string }>(
      'select id, name, list_price_minor, uom from sales.products where id = any($1::uuid[])',
      [input.lines.map((l) => l.productId)],
    );
    const byId = new Map(products.rows.map((p) => [p.id, p]));
    let total = 0;
    const built = input.lines.map((l, i) => {
      const p = byId.get(l.productId);
      if (!p) throw new Error('Unknown product.');
      const qty = Number(l.qty);
      if (!(qty > 0)) throw new Error('Quantity must be greater than zero.');
      const unit = Number(p.list_price_minor);
      const lineTotal = Math.round(qty * unit);
      total += lineTotal;
      return { line_no: i + 1, product_id: p.id, description: p.name, qty, uom: p.uom, unit, lineTotal };
    });
    const ins = await tx.query<{ id: string }>(
      `insert into sales.quotes (number, account_id, status, valid_until, subtotal_minor, total_minor, owner_name)
       values ($1, $2, 'sent', $3, $4, $4, 'Elena Walsh')
       returning id`,
      [number, input.accountId, input.validUntil, total],
    );
    const quoteId = ins.rows[0].id;
    for (const line of built) {
      await tx.query(
        `insert into sales.quote_lines (quote_id, line_no, product_id, description, qty, uom, unit_price_minor, line_total_minor)
         values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [quoteId, line.line_no, line.product_id, line.description, line.qty, line.uom, line.unit, line.lineTotal],
      );
    }
    return quoteId;
  });
  notifyDb();
  return id;
}

export async function approveAndSendPurchaseOrder(id: string) {
  const db = await getDb();
  await db.transaction(async (tx) => {
    const r = await tx.query<{ status: string; supplier_id: string | null }>(
      'select status, supplier_id from inventory.purchase_orders where id = $1',
      [id],
    );
    const po = r.rows[0];
    if (!po) throw new Error('Purchase order not found.');
    if (po.status !== 'draft' && po.status !== 'approved') {
      throw new Error('Only a draft or approved purchase order can be sent.');
    }
    if (!po.supplier_id) throw new Error('Assign a supplier before sending.');
    await tx.query(
      `update inventory.purchase_orders
          set status = 'sent',
              approved_at = coalesce(approved_at, now()),
              sent_at = now()
        where id = $1`,
      [id],
    );
  });
  notifyDb();
}

export async function receivePurchaseOrder(id: string) {
  const db = await getDb();
  await db.transaction(async (tx) => {
    const r = await tx.query<{ status: string; number: string }>(
      'select status, number from inventory.purchase_orders where id = $1',
      [id],
    );
    const po = r.rows[0];
    if (!po) throw new Error('Purchase order not found.');
    if (po.status !== 'sent' && po.status !== 'approved') {
      throw new Error('Receive is available after the purchase order has been sent.');
    }
    const lines = await tx.query<{ id: string; item_id: string; qty: string; received_qty: string }>(
      'select id, item_id, qty, received_qty from inventory.purchase_order_lines where purchase_order_id = $1',
      [id],
    );
    for (const line of lines.rows) {
      const qty = Number(line.qty) - Number(line.received_qty);
      if (qty <= 0) continue;
      const n = await tx.query<{ n: number }>('select nextval(\'inventory.mv_no\')::int as n');
      const number = `MV-2611-${pad(Number(n.rows[0].n), 5)}`;
      await tx.query(
        `insert into inventory.stock_movements (number, item_id, qty, kind, ref_type, ref_id, note)
         values ($1,$2,$3,'receive','purchase_order',$4,$5)`,
        [number, line.item_id, qty, id, `Receipt of ${po.number}`],
      );
      await tx.query(
        `update inventory.stock_balances
            set on_hand = on_hand + $2,
                incoming = greatest(incoming - $2, 0)
          where item_id = $1`,
        [line.item_id, qty],
      );
      await tx.query(
        'update inventory.purchase_order_lines set received_qty = received_qty + $2 where id = $1',
        [line.id, qty],
      );
    }
    await tx.query(
      `update inventory.purchase_orders set status = 'received', received_at = now() where id = $1`,
      [id],
    );
    await tx.query(
      `update inventory.stock_alerts a
          set status = 'resolved',
              detail = detail || ' · resolved on receipt'
        where a.purchase_order_id = $1
          and a.status = 'open'
          and exists (
            select 1 from inventory.stock s
             where s.id = a.item_id and s.available >= s.min_qty and s.situation = 'ok'
          )`,
      [id],
    );
  });
  notifyDb();
}

export async function issueInvoice(orderId: string, lineIds?: string[]) {
  const db = await getDb();
  const invoiceId = await db.transaction(async (tx) => {
    const o = await tx.query<{ id: string; account_id: string; number: string; status: string }>(
      'select id, account_id, number, status from sales.sales_orders where id = $1',
      [orderId],
    );
    const order = o.rows[0];
    if (!order) throw new Error('Order not found.');
    if (order.status === 'cancelled') throw new Error('A cancelled order cannot be invoiced.');
    const lines = await tx.query<{
      id: string; product_id: string | null; description: string; qty: string;
      uom: string; unit_price_minor: string; line_total_minor: string;
      billed_qty: string;
    }>(
      `select l.id, l.product_id, l.description, l.qty, l.uom, l.unit_price_minor, l.line_total_minor,
              coalesce((select sum(il.qty) from billing.invoice_lines il
                         join billing.invoices i on i.id = il.invoice_id
                        where il.order_line_id = l.id and i.status <> 'void'), 0) as billed_qty
         from sales.sales_order_lines l
        where l.order_id = $1
          and ($2::uuid[] is null or l.id = any($2::uuid[]))
        order by l.line_no`,
      [orderId, lineIds && lineIds.length ? lineIds : null],
    );
    const billable = lines.rows
      .map((l) => {
        const remaining = Number(l.qty) - Number(l.billed_qty);
        return { ...l, remaining };
      })
      .filter((l) => l.remaining > 0);
    if (!billable.length) throw new Error('Nothing left to invoice on this order.');
    const n = await tx.query<{ n: number }>('select nextval(\'billing.invoice_no\')::int as n');
    const number = `INV-2026-${pad(Number(n.rows[0].n), 4)}`;
    let total = 0;
    const built = billable.map((l, i) => {
      const unit = Number(l.unit_price_minor);
      const lineTotal = Math.round(l.remaining * unit);
      total += lineTotal;
      return { ...l, line_no: i + 1, lineTotal, unit };
    });
    const ins = await tx.query<{ id: string }>(
      `insert into billing.invoices (number, account_id, order_id, status, issue_date, total_minor, paid_minor, installment_count)
       values ($1,$2,$3,'open', current_date, $4, 0, 1)
       returning id`,
      [number, order.account_id, order.id, total],
    );
    const id = ins.rows[0].id;
    for (const line of built) {
      await tx.query(
        `insert into billing.invoice_lines (invoice_id, line_no, order_line_id, product_id, description, qty, uom, unit_price_minor, line_total_minor)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [id, line.line_no, line.id, line.product_id, line.description, line.remaining, line.uom, line.unit, line.lineTotal],
      );
    }
    await tx.query(
      `insert into billing.installments (invoice_id, n, due_date, amount_minor, status)
       values ($1, 1, current_date + 30, $2, 'open')`,
      [id, total],
    );
    return id;
  });
  notifyDb();
  return invoiceId;
}

export async function moveOpportunity(id: string, stage: string) {
  const allowed = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
  if (!allowed.includes(stage)) throw new Error('Unknown stage.');
  const db = await getDb();
  await db.query('update sales.opportunities set stage = $2 where id = $1', [id, stage]);
  notifyDb();
}
