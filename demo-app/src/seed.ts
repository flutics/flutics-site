import type { PGlite } from '@electric-sql/pglite';
import { TEAM, USER } from './constants';

export async function seedAll(db: PGlite) {
  for (const u of TEAM) {
    await db.query('insert into public.demo_users(id, name, email, kind) values ($1,$2,$3,$4)', [u.id, u.name, u.email, u.kind]);
  }
  await db.query("select set_config('app.user_id', $1, false)", [USER.id]);
  await seedSales(db);
  await seedInventory(db);
  await seedBilling(db);
}

const C = {
  sierra: 'aaaaaaaa-0001-4000-8000-000000000001',
  form: 'aaaaaaaa-0001-4000-8000-000000000002',
  south: 'aaaaaaaa-0001-4000-8000-000000000003',
  oak: 'aaaaaaaa-0001-4000-8000-000000000004',
  copper: 'aaaaaaaa-0001-4000-8000-000000000005',
  fig: 'aaaaaaaa-0001-4000-8000-000000000006',
  free: 'aaaaaaaa-0001-4000-8000-000000000007',
  water: 'aaaaaaaa-0001-4000-8000-000000000008',
  willow: 'aaaaaaaa-0001-4000-8000-000000000009',
};

async function seedSales(db: PGlite) {
  await db.exec('set search_path to sales_crm, public');
  const companies: [string, string, string, string][] = [
    [C.sierra, 'Sierra Blue Hotel', 'sierrabluehotel.example', 'enterprise'],
    [C.form, 'Form & Light Distributors', 'formandlight.example', 'mid_market'],
    [C.south, 'South Tide Construction', 'southtide.example', 'mid_market'],
    [C.oak, 'Oak & Linen Interiors', 'oakandlinen.example', 'smb'],
    [C.copper, 'Copper Atelier Architecture', 'copperatelier.example', 'smb'],
    [C.fig, 'The Old Fig Restaurant', 'oldfig.example', 'smb'],
    [C.free, 'Free Line Studio', 'freeline.example', 'smb'],
    [C.water, 'Waterside Inn', 'watersideinn.example', 'smb'],
    [C.willow, 'Willow Path Studio', 'willowpath.example', 'smb'],
  ];
  for (const row of companies) {
    await db.query(`insert into companies(id, name, domain, segment, owner_id) values ($1,$2,$3,$4,$5)`, [...row, USER.id]);
  }
  const e = USER.id;
  const d = TEAM[1].id;
  const l = TEAM[2].id;
  const deals: [string, string, string, number, string, string][] = [
    ['Garden path lighting', C.water, 'lead', 18400, '2026-12-20', e],
    ['Lobby pendants, second building', C.willow, 'lead', 14680, '2026-12-28', l],
    ['Dining room pendants', C.fig, 'qualified', 6200, '2026-12-10', e],
    ['Showroom refresh, wall lights', C.oak, 'proposal', 63900, '2026-12-08', e],
    ['Studio ceiling lights', C.copper, 'proposal', 27900, '2026-12-12', e],
    ['Annex suites, 12 pendants', C.sierra, 'proposal', 64500, '2026-12-15', e],
    ['Site office lighting', C.south, 'proposal', 74500, '2026-12-22', d],
    ['Warehouse restock, Q1', C.form, 'won', 118000, '2026-11-20', l],
    ['Banquet hall sconces', C.sierra, 'won', 47100, '2026-11-18', e],
    ['Retail floor refresh', C.form, 'qualified', 38900, '2026-12-05', e],
  ];
  for (const row of deals) {
    await db.query(
      `insert into deals(title, company_id, stage, amount, close_date, owner_id) values ($1,$2,$3,$4,$5,$6)`,
      row,
    );
  }
}

const I = {
  lis: '44444444-0001-4000-8000-000000000001',
  kit: '44444444-0001-4000-8000-000000000002',
  led: '44444444-0001-4000-8000-000000000003',
  dv38: '44444444-0001-4000-8000-000000000004',
  carton: '44444444-0001-4000-8000-000000000006',
  tri: '44444444-0001-4000-8000-000000000011',
  duna: '44444444-0001-4000-8000-000000000012',
  ingot: '44444444-0001-4000-8000-000000000005',
};
const S = {
  horizon: '66666666-0001-4000-8000-000000000001',
  valley: '66666666-0001-4000-8000-000000000002',
  north: '66666666-0001-4000-8000-000000000003',
};
const PO = {
  p30: '66666666-0001-4000-8000-000000000030',
  p31: '66666666-0001-4000-8000-000000000031',
  p32: '66666666-0001-4000-8000-000000000032',
};

async function seedInventory(db: PGlite) {
  await db.exec('set search_path to inventory, public');
  await db.query(`insert into suppliers(id, name, city, state) values
    ($1,'Horizon Glassworks','Portland','OR'),
    ($2,'Valley Forge Casting','Bethlehem','PA'),
    ($3,'Northline Electrical','Chicago','IL')`, [S.horizon, S.valley, S.north]);
  const items: [string, string, string, string, string, number, number, number, number][] = [
    [I.lis, 'DV-LIS', 'Opal glass diffuser Lis', 'component', 'ea', 40, 22, 26, 60],
    [I.kit, 'KF-M6', 'M6 fixing kit', 'component', 'ea', 60, 30, 46, 100],
    [I.led, 'DR-LED20', 'LED driver 20 W', 'component', 'ea', 10, 0, 8, 0],
    [I.dv38, 'DV-38', 'Sandblasted glass diffuser Ø38', 'component', 'ea', 20, 31, 24, 24],
    [I.carton, 'EMB-4545', 'Carton 45×45', 'packaging', 'ea', 100, 85, 24, 40],
    [I.tri, 'BZ-TRI-BE', 'Path bollard Trail · Brushed bronze', 'finished', 'ea', 12, 42, 18, 0],
    [I.duna, 'DV-DUN-58', 'Opal glass diffuser Dune Ø58', 'component', 'ea', 10, 14, 16, 10],
    [I.ingot, 'LG-CUSN10', 'Bronze ingot CuSn10', 'raw', 'kg', 500, 412, 0, 250],
  ];
  for (const row of items) {
    await db.query(
      `insert into items(id, sku, name, kind, uom, min_qty, on_hand, reserved, incoming)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      row,
    );
  }
  await db.query(
    `insert into purchase_orders(id, number, supplier_id, status, total) values
      ($1,'PO-26-0030',$2,'sent',984.00),
      ($3,'PO-26-0031',$2,'sent',4515.60),
      ($4,'PO-26-0032',$5,'approved',0)`,
    [PO.p30, S.horizon, PO.p31, PO.p32, S.valley],
  );
  await db.query(
    `insert into purchase_order_lines(purchase_order_id, line_no, item_id, qty, uom, unit_price, received_qty) values
      ($1,1,$2,40,'ea',14.50,0),
      ($1,2,$3,20,'ea',20.20,0),
      ($4,1,$5,60,'ea',48.50,0),
      ($4,2,$6,24,'ea',36.90,0),
      ($4,3,$7,10,'ea',72.00,0)`,
    [PO.p30, I.carton, I.carton, PO.p31, I.lis, I.dv38, I.duna],
  );
}

const INV = {
  i218: 'ffffffff-0001-4000-8000-000000000218',
  i214: 'ffffffff-0001-4000-8000-000000000214',
  i209: 'ffffffff-0001-4000-8000-000000000209',
};

async function seedBilling(db: PGlite) {
  await db.exec('set search_path to billing, public');
  await db.query(
    `insert into invoices(id, number, account_name, status, issue_date, total, paid, installment_count) values
      ($1,'INV-2026-0218','Sierra Blue Hotel','open','2026-11-18',47100,15700,3),
      ($2,'INV-2026-0214','Form & Light Distributors','open','2026-11-12',56590,0,2),
      ($3,'INV-2026-0209','Free Line Studio','paid','2026-11-08',9640,9640,1)`,
    [INV.i218, INV.i214, INV.i209],
  );
  await db.query(
    `insert into invoice_lines(invoice_id, line_no, description, qty, uom, unit_price, line_total) values
      ($1,1,'Path bollard Trail · Brushed bronze',18,'ea',690,12420),
      ($1,2,'Pendant Aurora Ø40 · Brushed bronze',12,'ea',2890,34680),
      ($2,1,'Warehouse restock, Q1',1,'lot',56590,56590),
      ($3,1,'Studio ceiling lights',1,'lot',9640,9640)`,
    [INV.i218, INV.i214, INV.i209],
  );
  await db.query(
    `insert into installments(invoice_id, seq, due_date, amount, status, reference) values
      ($1,1,'2026-11-18',15700,'paid','ACH: REC-2026-0412'),
      ($1,2,'2026-12-18',15700,'open',null),
      ($1,3,'2027-01-17',15700,'open',null),
      ($2,1,'2026-12-12',28295,'open',null),
      ($2,2,'2027-01-12',28295,'open',null),
      ($3,1,'2026-11-08',9640,'paid','ACH: REC-2026-0398')`,
    [INV.i218, INV.i214, INV.i209],
  );
}
