-- Fixed identifiers so seed data can reference itself clearly.
-- All people, companies and numbers are fictional.

insert into sales.accounts (id, kind, legal_name, trade_name, segment, city, region, owner_name, status, last_interaction) values
  ('aaaaaaaa-0001-4000-8000-000000000001', 'company', 'Sierra Blue Hotel LLC', 'Sierra Blue Hotel', 'Hospitality', 'Bend', 'OR', 'Elena Walsh', 'active', '40 min ago · Instagram'),
  ('aaaaaaaa-0001-4000-8000-000000000002', 'company', 'Form and Light Distributors LLC', 'Form & Light Distributors', 'Distribution', 'Denver', 'CO', 'Livia Pratt', 'active', 'yesterday · message'),
  ('aaaaaaaa-0001-4000-8000-000000000003', 'company', 'South Tide Construction LLC', 'South Tide Construction', 'Construction', 'Charleston', 'SC', 'Diego Alvarez', 'active', '22/11 · visit'),
  ('aaaaaaaa-0001-4000-8000-000000000004', 'company', 'Oak and Linen Interiors LLC', 'Oak & Linen Interiors', 'Architecture', 'Portland', 'OR', 'Elena Walsh', 'active', 'today · Instagram'),
  ('aaaaaaaa-0001-4000-8000-000000000005', 'company', 'Copper Atelier Architecture', 'Copper Atelier Architecture', 'Architecture', 'Seattle', 'WA', 'Elena Walsh', 'active', '21/11 · Facebook'),
  ('aaaaaaaa-0001-4000-8000-000000000006', 'company', 'The Old Fig Restaurant', 'The Old Fig Restaurant', 'Restaurants', 'Napa', 'CA', 'Elena Walsh', 'active', '20/11 · phone'),
  ('aaaaaaaa-0001-4000-8000-000000000007', 'company', 'Free Line Studio', 'Free Line Studio', 'Offices', 'Austin', 'TX', 'Elena Walsh', 'active', '18/11 · message'),
  ('aaaaaaaa-0001-4000-8000-000000000008', 'company', 'Waterside Inn', 'Waterside Inn', 'Hospitality', 'Camden', 'ME', 'Elena Walsh', 'prospect', 'today · Facebook'),
  ('aaaaaaaa-0001-4000-8000-000000000009', 'company', 'Willow Path Studio', 'Willow Path Studio', 'Architecture', 'Brooklyn', 'NY', 'Livia Pratt', 'prospect', '2 h ago · Instagram');

insert into sales.contacts (id, full_name, job_title, phone, instagram_handle, facebook, owner_name, awaiting_reply, last_interaction) values
  ('cccccccc-0001-4000-8000-000000000001', 'Renata Shaw', 'Purchasing manager', '(541) 555-0142', null, false, 'Elena Walsh', true, '40 min ago'),
  ('cccccccc-0001-4000-8000-000000000002', 'Camila Rowe', 'Architect', null, 'camila.rowe.arc', false, 'Livia Pratt', true, '2 h ago'),
  ('cccccccc-0001-4000-8000-000000000003', 'Fernando Teller', 'Buyer', '(303) 555-0188', null, false, 'Livia Pratt', false, 'yesterday'),
  ('cccccccc-0001-4000-8000-000000000004', 'Beatrice Lemmon', 'Partner', null, 'oaklinen.studio', false, 'Elena Walsh', false, 'today'),
  ('cccccccc-0001-4000-8000-000000000005', 'Rodrigo Pace', 'Site engineer', '(843) 555-0160', null, false, 'Diego Alvarez', false, '22/11'),
  ('cccccccc-0001-4000-8000-000000000006', 'Helen Vance', 'Operations director', '(541) 555-0133', null, false, 'Elena Walsh', false, '18/11'),
  ('cccccccc-0001-4000-8000-000000000007', 'Gustav Ferris', 'Architect', '(206) 555-0174', null, false, 'Elena Walsh', false, '21/11'),
  ('cccccccc-0001-4000-8000-000000000008', 'Sylvia Pratt', 'Owner', null, null, true, 'Elena Walsh', true, '25 min ago'),
  ('cccccccc-0001-4000-8000-000000000009', 'Otto Brandon', 'Building maintenance', '(512) 555-0191', null, false, 'Elena Walsh', false, '10/11');

insert into sales.account_contacts (account_id, contact_id, role, is_primary) values
  ('aaaaaaaa-0001-4000-8000-000000000001', 'cccccccc-0001-4000-8000-000000000001', 'buyer', true),
  ('aaaaaaaa-0001-4000-8000-000000000001', 'cccccccc-0001-4000-8000-000000000006', 'other', false),
  ('aaaaaaaa-0001-4000-8000-000000000008', 'cccccccc-0001-4000-8000-000000000001', 'buyer', false),
  ('aaaaaaaa-0001-4000-8000-000000000008', 'cccccccc-0001-4000-8000-000000000008', 'other', true),
  ('aaaaaaaa-0001-4000-8000-000000000009', 'cccccccc-0001-4000-8000-000000000002', 'architect', true),
  ('aaaaaaaa-0001-4000-8000-000000000002', 'cccccccc-0001-4000-8000-000000000003', 'buyer', true),
  ('aaaaaaaa-0001-4000-8000-000000000004', 'cccccccc-0001-4000-8000-000000000004', 'other', true),
  ('aaaaaaaa-0001-4000-8000-000000000003', 'cccccccc-0001-4000-8000-000000000005', 'site', true),
  ('aaaaaaaa-0001-4000-8000-000000000005', 'cccccccc-0001-4000-8000-000000000007', 'architect', true),
  ('aaaaaaaa-0001-4000-8000-000000000006', 'cccccccc-0001-4000-8000-000000000006', 'other', true),
  ('aaaaaaaa-0001-4000-8000-000000000007', 'cccccccc-0001-4000-8000-000000000009', 'other', true);

insert into sales.products (id, code, name, family, finish, list_price_minor) values
  ('eeeeeeee-0001-4000-8000-000000000001', 'BZ-TRI-BE', 'Path bollard Trilha · Brushed bronze', 'Bollards', 'Brushed bronze', 69000),
  ('eeeeeeee-0001-4000-8000-000000000002', 'PD-AUR-40-BE', 'Pendant Aurora Ø40 · Brushed bronze', 'Pendants', 'Brushed bronze', 289000),
  ('eeeeeeee-0001-4000-8000-000000000003', 'PD-DUN-58-BE', 'Pendant Duna Ø58 · Brushed bronze', 'Pendants', 'Brushed bronze', 189000),
  ('eeeeeeee-0001-4000-8000-000000000004', 'AR-FIT-BE', 'Wall light Fita · Brushed bronze', 'Wall lights', 'Brushed bronze', 89000),
  ('eeeeeeee-0001-4000-8000-000000000005', 'PL-CIR-32', 'Ceiling light Circo Ø32 · Patina', 'Ceiling lights', 'Patina', 124000),
  ('eeeeeeee-0001-4000-8000-000000000006', 'BZ-TRI-PO', 'Path bollard Trilha · Polished bronze', 'Bollards', 'Polished bronze', 74000);

-- Pipeline
insert into sales.opportunities (id, title, account_id, contact_id, stage, value_minor, expected_close, source, owner_name, quote_number, quote_valid_until, awaiting_reply) values
  ('bbbbbbbb-0001-4000-8000-000000000001', 'Lobby pendants, second building', 'aaaaaaaa-0001-4000-8000-000000000009', 'cccccccc-0001-4000-8000-000000000002', 'lead', 1488000, '2026-12-18', 'inbox', 'Livia Pratt', null, null, true),
  ('bbbbbbbb-0001-4000-8000-000000000002', 'Garden path lighting', 'aaaaaaaa-0001-4000-8000-000000000008', 'cccccccc-0001-4000-8000-000000000008', 'lead', 1840000, '2026-12-20', 'inbox', 'Elena Walsh', null, null, true),
  ('bbbbbbbb-0001-4000-8000-000000000003', 'Dining room pendants', 'aaaaaaaa-0001-4000-8000-000000000006', 'cccccccc-0001-4000-8000-000000000006', 'qualified', 620000, '2026-12-10', 'referral', 'Elena Walsh', null, null, false),
  ('bbbbbbbb-0001-4000-8000-000000000004', 'Showroom refresh, wall lights', 'aaaaaaaa-0001-4000-8000-000000000004', 'cccccccc-0001-4000-8000-000000000004', 'proposal', 6390000, '2026-12-08', 'inbox', 'Elena Walsh', 'QT-26-0144', '2026-12-05', false),
  ('bbbbbbbb-0001-4000-8000-000000000005', 'Studio ceiling lights', 'aaaaaaaa-0001-4000-8000-000000000005', 'cccccccc-0001-4000-8000-000000000007', 'proposal', 2790000, '2026-12-12', 'inbox', 'Elena Walsh', 'QT-26-0146', '2026-12-01', false),
  ('bbbbbbbb-0001-4000-8000-000000000006', 'Annex suites, 12 pendants', 'aaaaaaaa-0001-4000-8000-000000000001', 'cccccccc-0001-4000-8000-000000000001', 'negotiation', 6450000, '2026-12-15', 'visit', 'Elena Walsh', 'QT-26-0148', '2026-12-09', false),
  ('bbbbbbbb-0001-4000-8000-000000000007', 'Site office lighting', 'aaaaaaaa-0001-4000-8000-000000000003', 'cccccccc-0001-4000-8000-000000000005', 'negotiation', 7450000, '2026-12-22', 'visit', 'Diego Alvarez', 'QT-26-0147', '2026-12-11', false),
  ('bbbbbbbb-0001-4000-8000-000000000008', 'Warehouse restock, Q1', 'aaaaaaaa-0001-4000-8000-000000000002', 'cccccccc-0001-4000-8000-000000000003', 'won', 11800000, '2026-11-20', 'referral', 'Livia Pratt', 'QT-26-0137', null, false),
  ('bbbbbbbb-0001-4000-8000-000000000009', 'Reception desk lights', 'aaaaaaaa-0001-4000-8000-000000000007', 'cccccccc-0001-4000-8000-000000000009', 'lost', 1580000, '2026-11-18', 'web', 'Elena Walsh', null, null, false);

-- Open quotes (for create-quote to sit beside)
insert into sales.quotes (id, number, account_id, contact_id, opportunity_id, status, valid_until, subtotal_minor, total_minor, owner_name, created_at) values
  ('22222222-0001-4000-8000-000000000001', 'QT-26-0148', 'aaaaaaaa-0001-4000-8000-000000000001', 'cccccccc-0001-4000-8000-000000000001', 'bbbbbbbb-0001-4000-8000-000000000006', 'sent', '2026-12-09', 6450000, 6450000, 'Elena Walsh', '2026-11-18 14:00:00-03'),
  ('22222222-0001-4000-8000-000000000002', 'QT-26-0147', 'aaaaaaaa-0001-4000-8000-000000000003', 'cccccccc-0001-4000-8000-000000000005', 'bbbbbbbb-0001-4000-8000-000000000007', 'sent', '2026-12-11', 7450000, 7450000, 'Diego Alvarez', '2026-11-19 11:00:00-03'),
  ('22222222-0001-4000-8000-000000000003', 'QT-26-0146', 'aaaaaaaa-0001-4000-8000-000000000005', 'cccccccc-0001-4000-8000-000000000007', 'bbbbbbbb-0001-4000-8000-000000000005', 'sent', '2026-12-01', 2790000, 2790000, 'Elena Walsh', '2026-11-16 16:20:00-03'),
  ('22222222-0001-4000-8000-000000000004', 'QT-26-0144', 'aaaaaaaa-0001-4000-8000-000000000004', 'cccccccc-0001-4000-8000-000000000004', 'bbbbbbbb-0001-4000-8000-000000000004', 'sent', '2026-12-05', 6390000, 6390000, 'Elena Walsh', '2026-11-20 09:10:00-03');

insert into sales.quote_lines (quote_id, line_no, product_id, description, qty, unit_price_minor, line_total_minor) values
  ('22222222-0001-4000-8000-000000000001', 1, 'eeeeeeee-0001-4000-8000-000000000002', 'Pendant Aurora Ø40 · Brushed bronze', 12, 289000, 3468000),
  ('22222222-0001-4000-8000-000000000001', 2, 'eeeeeeee-0001-4000-8000-000000000004', 'Wall light Fita · Brushed bronze', 18, 89000, 1602000),
  ('22222222-0001-4000-8000-000000000001', 3, 'eeeeeeee-0001-4000-8000-000000000001', 'Path bollard Trilha · Brushed bronze', 20, 69000, 1380000),
  ('22222222-0001-4000-8000-000000000002', 1, 'eeeeeeee-0001-4000-8000-000000000005', 'Ceiling light Circo Ø32 · Patina', 40, 124000, 4960000),
  ('22222222-0001-4000-8000-000000000002', 2, 'eeeeeeee-0001-4000-8000-000000000004', 'Wall light Fita · Brushed bronze', 28, 89000, 2492000),
  ('22222222-0001-4000-8000-000000000003', 1, 'eeeeeeee-0001-4000-8000-000000000003', 'Pendant Duna Ø58 · Brushed bronze', 10, 189000, 1890000),
  ('22222222-0001-4000-8000-000000000003', 2, 'eeeeeeee-0001-4000-8000-000000000004', 'Wall light Fita · Brushed bronze', 10, 89000, 890000),
  ('22222222-0001-4000-8000-000000000004', 1, 'eeeeeeee-0001-4000-8000-000000000004', 'Wall light Fita · Brushed bronze', 30, 89000, 2670000),
  ('22222222-0001-4000-8000-000000000004', 2, 'eeeeeeee-0001-4000-8000-000000000003', 'Pendant Duna Ø58 · Brushed bronze', 12, 189000, 2268000),
  ('22222222-0001-4000-8000-000000000004', 3, 'eeeeeeee-0001-4000-8000-000000000005', 'Ceiling light Circo Ø32 · Patina', 12, 124000, 1488000);

-- Orders. Line stages are stored as progress fields; sales.line_status computes the chip.
insert into sales.sales_orders (id, number, account_id, status, promised_date, total_minor, reservation_state, owner_name, confirmed_at) values
  ('dddddddd-0001-4000-8000-000000000142', 'SO-26-0142', 'aaaaaaaa-0001-4000-8000-000000000001', 'in_fulfillment', '2026-12-12', 16092000, 'partial', 'Elena Walsh', '2026-11-10 10:00:00-03'),
  ('dddddddd-0001-4000-8000-000000000141', 'SO-26-0141', 'aaaaaaaa-0001-4000-8000-000000000005', 'in_fulfillment', '2026-12-05', 3864000, 'full', 'Elena Walsh', '2026-11-12 11:00:00-03'),
  ('dddddddd-0001-4000-8000-000000000140', 'SO-26-0140', 'aaaaaaaa-0001-4000-8000-000000000003', 'confirmed', '2026-12-20', 8920000, 'pending', 'Diego Alvarez', '2026-11-22 15:00:00-03'),
  ('dddddddd-0001-4000-8000-000000000139', 'SO-26-0139', 'aaaaaaaa-0001-4000-8000-000000000004', 'in_fulfillment', '2026-11-28', 1278000, 'full', 'Elena Walsh', '2026-11-08 09:00:00-03'),
  ('dddddddd-0001-4000-8000-000000000138', 'SO-26-0138', 'aaaaaaaa-0001-4000-8000-000000000006', 'in_fulfillment', '2026-12-02', 2415000, 'full', 'Elena Walsh', '2026-11-11 16:00:00-03'),
  ('dddddddd-0001-4000-8000-000000000137', 'SO-26-0137', 'aaaaaaaa-0001-4000-8000-000000000002', 'in_fulfillment', '2026-12-15', 11730000, 'partial', 'Livia Pratt', '2026-11-09 13:00:00-03'),
  ('dddddddd-0001-4000-8000-000000000136', 'SO-26-0136', 'aaaaaaaa-0001-4000-8000-000000000007', 'delivered', '2026-11-25', 964000, 'full', 'Elena Walsh', '2026-10-30 10:00:00-03'),
  ('dddddddd-0001-4000-8000-000000000135', 'SO-26-0135', 'aaaaaaaa-0001-4000-8000-000000000008', 'in_fulfillment', '2026-11-30', 4380000, 'full', 'Elena Walsh', '2026-11-05 10:00:00-03'),
  ('dddddddd-0001-4000-8000-000000000134', 'SO-26-0134', 'aaaaaaaa-0001-4000-8000-000000000005', 'delivered', '2026-11-21', 2150000, 'full', 'Elena Walsh', '2026-10-28 10:00:00-03'),
  ('dddddddd-0001-4000-8000-000000000133', 'SO-26-0133', 'aaaaaaaa-0001-4000-8000-000000000001', 'delivered', '2026-11-18', 6720000, 'full', 'Elena Walsh', '2026-10-20 10:00:00-03');

-- helper: (id, order, line_no, product, desc, qty, price, total, reserved, assembly, finished, shipped, delivered)
insert into sales.sales_order_lines (id, order_id, line_no, product_id, description, qty, unit_price_minor, line_total_minor, promised_date, reserved_complete, assembly_started_at, finished_qty, shipped_qty, delivered_qty) values
  -- SO-26-0142 Hotel: 4 lines, mixed stages, total 160920
  ('33333333-0142-4000-8000-000000000001', 'dddddddd-0001-4000-8000-000000000142', 1, 'eeeeeeee-0001-4000-8000-000000000002', 'Pendant Aurora Ø40 · Brushed bronze', 12, 289000, 3468000, '2026-12-12', true, '2026-11-18 08:00:00-03', 12, 0, 0), -- in stock (finished)
  ('33333333-0142-4000-8000-000000000002', 'dddddddd-0001-4000-8000-000000000142', 2, 'eeeeeeee-0001-4000-8000-000000000003', 'Pendant Duna Ø58 · Brushed bronze', 16, 189000, 3024000, '2026-12-12', true, '2026-11-20 08:00:00-03', 0, 0, 0), -- assembly
  ('33333333-0142-4000-8000-000000000003', 'dddddddd-0001-4000-8000-000000000142', 3, 'eeeeeeee-0001-4000-8000-000000000004', 'Wall light Fita · Brushed bronze', 18, 89000, 1602000, '2026-12-12', true, null, 0, 0, 0), -- reserved
  ('33333333-0142-4000-8000-000000000004', 'dddddddd-0001-4000-8000-000000000142', 4, 'eeeeeeee-0001-4000-8000-000000000001', 'Path bollard Trilha · Brushed bronze', 116, 69000, 8004000, '2026-12-12', false, null, 0, 0, 0), -- ordered (partial reservation at order level)
  -- SO-26-0141 Atelier: 3 reserved
  ('33333333-0141-4000-8000-000000000001', 'dddddddd-0001-4000-8000-000000000141', 1, 'eeeeeeee-0001-4000-8000-000000000002', 'Pendant Aurora Ø40 · Brushed bronze', 8, 289000, 2312000, '2026-12-05', true, null, 0, 0, 0),
  ('33333333-0141-4000-8000-000000000002', 'dddddddd-0001-4000-8000-000000000141', 2, 'eeeeeeee-0001-4000-8000-000000000004', 'Wall light Fita · Brushed bronze', 10, 89000, 890000, '2026-12-05', true, null, 0, 0, 0),
  ('33333333-0141-4000-8000-000000000003', 'dddddddd-0001-4000-8000-000000000141', 3, 'eeeeeeee-0001-4000-8000-000000000001', 'Path bollard Trilha · Brushed bronze', 10, 69000, 690000, '2026-12-05', true, null, 0, 0, 0),
  -- SO-26-0140 Construtora: 5 ordered (pending reservation) 40*124000=4960000, 28*89000=2492000, 12*124000=1488000 wait that's 8.9m - use mix totaling 8920000
  ('33333333-0140-4000-8000-000000000001', 'dddddddd-0001-4000-8000-000000000140', 1, 'eeeeeeee-0001-4000-8000-000000000005', 'Ceiling light Circo Ø32 · Patina', 20, 124000, 2480000, '2026-12-20', false, null, 0, 0, 0),
  ('33333333-0140-4000-8000-000000000002', 'dddddddd-0001-4000-8000-000000000140', 2, 'eeeeeeee-0001-4000-8000-000000000004', 'Wall light Fita · Brushed bronze', 20, 89000, 1780000, '2026-12-20', false, null, 0, 0, 0),
  ('33333333-0140-4000-8000-000000000003', 'dddddddd-0001-4000-8000-000000000140', 3, 'eeeeeeee-0001-4000-8000-000000000001', 'Path bollard Trilha · Brushed bronze', 20, 69000, 1380000, '2026-12-20', false, null, 0, 0, 0),
  ('33333333-0140-4000-8000-000000000004', 'dddddddd-0001-4000-8000-000000000140', 4, 'eeeeeeee-0001-4000-8000-000000000006', 'Path bollard Trilha · Polished bronze', 20, 74000, 1480000, '2026-12-20', false, null, 0, 0, 0),
  ('33333333-0140-4000-8000-000000000005', 'dddddddd-0001-4000-8000-000000000140', 5, 'eeeeeeee-0001-4000-8000-000000000003', 'Pendant Duna Ø58 · Brushed bronze', 9, 200000, 1800000, '2026-12-20', false, null, 0, 0, 0),
  -- SO-26-0139 Oak & Linen: 2 shipping
  ('33333333-0139-4000-8000-000000000001', 'dddddddd-0001-4000-8000-000000000139', 1, 'eeeeeeee-0001-4000-8000-000000000004', 'Wall light Fita · Brushed bronze', 6, 89000, 534000, '2026-11-28', true, '2026-11-15 08:00:00-03', 6, 6, 0),
  ('33333333-0139-4000-8000-000000000002', 'dddddddd-0001-4000-8000-000000000139', 2, 'eeeeeeee-0001-4000-8000-000000000005', 'Ceiling light Circo Ø32 · Patina', 6, 124000, 744000, '2026-11-28', true, '2026-11-15 08:00:00-03', 6, 6, 0),
  -- SO-26-0138 Figueira: 2 assembly, 1 in stock 15*89000=1,335,000 + 6*124000=744,000 + 6*56000? 2415000-1335000-744000=336000 → 4*84000. Use 9*89000 + 8*124000 + 6*69000 = 801000+992000+414000=2207000 close. 15*89000 + 6*124000 + 6*69000 = 1335000+744000+414000=2493000. Adjust: 12*89000 + 6*124000 + 6*69000 = 1068000+744000+414000=2226000. 10*89000 + 8*124000 + 5*69000 = 890000+992000+345000=2227000.
  -- Exact 2,415,000: 15 * 89000 = 1,335,000; 6 * 124000 = 744,000; remainder 336,000 → 4 * 84000 not a product. 9*89000=801000, 5*124000=620000, 16*69000=1,104,000 sum=2,525,000. 
  -- 10*89000=890000, 5*124000=620000, 13*69000=897000 sum=2,407,000. Close enough? Let's use unit prices that sum exactly:
  -- 15*89000 + 8*69000 + 2*124000 = 1,335,000 + 552,000 + 248,000 = 2,135,000. 
  -- 12 * 89000 = 1,068,000; 9 * 124000 = 1,116,000; 3 * 77000. 
  -- 15*89000 + 12*69000 = 1,335,000+828,000=2,163,000 remainder 252,000.
  -- I'll just set 3 lines: 10*89000, 6*124000, 8*69000 = 890000+744000+552000=2,186,000. Not exact.
  -- 2415000/ and products: 7 * 289000 = 2,023,000 remainder 392,000.
  -- Keep it exact: 15 * 89000 = 1,335,000 (wall, assembly), 6 * 124000 = 744,000 (ceiling, assembly), 6 * 56000 — no.
  -- 18 * 89000 = 1,602,000 (assembly); 5 * 124000 = 620,000 (assembly); 2 * 96500. 
  -- 5 * 289000 = 1,445,000; 4 * 124000 = 496,000; 7 * 69000 = 483,000; total 2,424,000. Off by 9,000.
  -- 5 * 289000 = 1,445,000; 4 * 124000 = 496,000; 6 * 69000 = 414,000; total 2,355,000. Off by 60,000.
  -- 3 * 289000 = 867,000; 6 * 124000 = 744,000; 12 * 69000 = 828,000; total 2,439,000.
  -- 3 * 289000 = 867,000; 6 * 124000 = 744,000; 10 * 69000 + 2 * 89000 = 690000+178000=2,479,000.
  -- SIMPLE: 15 * 89000 = 1,335,000 assembly; 10 * 69000 = 690,000 assembly; 3 * 124000 = 372,000 in stock; total 2,397,000. Close (18k off).
  -- I'll use custom unit on last line? Better change order total? Mockup says R$ 24.150,00. I'll make lines sum exactly:
  -- Line1: 10 wall 89000 = 890000 assembly
  -- Line2: 8 ceiling 124000 = 992000 assembly  
  -- Line3: 7 bollard 69000 = 483000 in stock
  -- Total = 2,365,000. I'll set the order total to the sum of lines (consistency > matching mockup to the last real).
  -- I'll compute totals from lines in a later update. For Figueira I'll use:
  ('33333333-0138-4000-8000-000000000001', 'dddddddd-0001-4000-8000-000000000138', 1, 'eeeeeeee-0001-4000-8000-000000000004', 'Wall light Fita · Brushed bronze', 15, 89000, 1335000, '2026-12-02', true, '2026-11-19 08:00:00-03', 0, 0, 0),
  ('33333333-0138-4000-8000-000000000002', 'dddddddd-0001-4000-8000-000000000138', 2, 'eeeeeeee-0001-4000-8000-000000000005', 'Ceiling light Circo Ø32 · Patina', 6, 124000, 744000, '2026-12-02', true, '2026-11-20 08:00:00-03', 0, 0, 0),
  ('33333333-0138-4000-8000-000000000003', 'dddddddd-0001-4000-8000-000000000138', 3, 'eeeeeeee-0001-4000-8000-000000000001', 'Path bollard Trilha · Brushed bronze', 5, 69000, 345000, '2026-12-02', true, '2026-11-18 08:00:00-03', 5, 0, 0),
  -- SO-26-0137 Dist: 4 reserved, 2 ordered. Total 11,730,000. 30*289000=8,670,000; 20*69000=1,380,000; 12*124000=1,488,000; 2*89000=178,000 wait 11,716,000. 30*289000 + 24*69000 + 8*124000 = 8,670,000+1,656,000+992,000=11,318,000.
  -- 36*289000 = 10,404,000; 12*69000=828,000; 4*124000=496,000 total 11,728,000. Close. 36*289000 + 10*69000 + 5*124000 = 10,404,000+690,000+620,000=11,714,000.
  -- 40 * 289000 = 11,560,000 remainder 170,000. I'll use 30 aurora + 20 trilha + 8 circo + 10 fita = 8,670,000+1,380,000+992,000+890,000=11,932,000.
  -- Set exact: 32 * 289000 = 9,248,000; 20 * 69000 = 1,380,000; 8 * 124000 = 992,000; 1 * 110000.  32*289 + 16*69 + 10*124 = 9,248,000+1,104,000+1,240,000=11,592,000.
  -- 30*289000=8,670,000 (reserved); 15*69000=1,035,000 (reserved); 10*124000=1,240,000 (reserved); 8*89000=712,000 (reserved); 2*289000=578,000 (ordered); 4*124000=496,000 (ordered). Total 12,731,000 too much.
  -- I'll pick 20 aurora reserved, 10 trilha reserved, 8 circo reserved, 6 fita reserved, 4 aurora ordered, 2 circo ordered:
  -- 20*289000=5,780,000; 10*69000=690,000; 8*124000=992,000; 6*89000=534,000; 4*289000=1,156,000; 2*124000=248,000; total 9,400,000. Need 11,730,000.
  -- 28*289000=8,092,000 reserved + 4*289000=1,156,000 ordered + 16*69000=1,104,000 reserved + 4*124000=496,000 reserved? = 10,848,000.
  -- 36*289000 = 10,404,000 (30 reserved + 6 ordered) + 12*69000=828,000 reserved + 4*124000=496,000 reserved = 11,728,000. I'll set order total from lines later.
  ('33333333-0137-4000-8000-000000000001', 'dddddddd-0001-4000-8000-000000000137', 1, 'eeeeeeee-0001-4000-8000-000000000002', 'Pendant Aurora Ø40 · Brushed bronze', 30, 289000, 8670000, '2026-12-15', true, null, 0, 0, 0),
  ('33333333-0137-4000-8000-000000000002', 'dddddddd-0001-4000-8000-000000000137', 2, 'eeeeeeee-0001-4000-8000-000000000001', 'Path bollard Trilha · Brushed bronze', 12, 69000, 828000, '2026-12-15', true, null, 0, 0, 0),
  ('33333333-0137-4000-8000-000000000003', 'dddddddd-0001-4000-8000-000000000137', 3, 'eeeeeeee-0001-4000-8000-000000000005', 'Ceiling light Circo Ø32 · Patina', 4, 124000, 496000, '2026-12-15', true, null, 0, 0, 0),
  ('33333333-0137-4000-8000-000000000004', 'dddddddd-0001-4000-8000-000000000137', 4, 'eeeeeeee-0001-4000-8000-000000000006', 'Path bollard Trilha · Polished bronze', 8, 74000, 592000, '2026-12-15', true, null, 0, 0, 0),
  ('33333333-0137-4000-8000-000000000005', 'dddddddd-0001-4000-8000-000000000137', 5, 'eeeeeeee-0001-4000-8000-000000000004', 'Wall light Fita · Brushed bronze', 8, 89000, 712000, '2026-12-15', false, null, 0, 0, 0),
  ('33333333-0137-4000-8000-000000000006', 'dddddddd-0001-4000-8000-000000000137', 6, 'eeeeeeee-0001-4000-8000-000000000003', 'Pendant Duna Ø58 · Brushed bronze', 2, 189000, 378000, '2026-12-15', false, null, 0, 0, 0),
  -- SO-26-0136 Free Line: 3 delivered. 4*124000 + 6*89000 = 496000+534000=1,030,000. 8*69000+4*89000=552000+356000=908000 close to 964000.
  -- 4*124000 + 4*89000 + 2*69000 = 496000+356000+138000=990000. 2*289000 + 2*124000 + 2*69000 = 578000+248000+138000=964000 EXACT.
  ('33333333-0136-4000-8000-000000000001', 'dddddddd-0001-4000-8000-000000000136', 1, 'eeeeeeee-0001-4000-8000-000000000002', 'Pendant Aurora Ø40 · Brushed bronze', 2, 289000, 578000, '2026-11-25', true, '2026-11-10 08:00:00-03', 2, 2, 2),
  ('33333333-0136-4000-8000-000000000002', 'dddddddd-0001-4000-8000-000000000136', 2, 'eeeeeeee-0001-4000-8000-000000000005', 'Ceiling light Circo Ø32 · Patina', 2, 124000, 248000, '2026-11-25', true, '2026-11-10 08:00:00-03', 2, 2, 2),
  ('33333333-0136-4000-8000-000000000003', 'dddddddd-0001-4000-8000-000000000136', 3, 'eeeeeeee-0001-4000-8000-000000000001', 'Path bollard Trilha · Brushed bronze', 2, 69000, 138000, '2026-11-25', true, '2026-11-10 08:00:00-03', 2, 2, 2),
  -- SO-26-0135 Pousada: 2 in stock, 1 shipping. 4380000. 10*289000=2,890,000; 10*69000=690,000; 8*89000=712,000 total 4,292,000. 8*289000=2,312,000; 12*69000=828,000; 10*124000=1,240,000 total 4,380,000 EXACT.
  ('33333333-0135-4000-8000-000000000001', 'dddddddd-0001-4000-8000-000000000135', 1, 'eeeeeeee-0001-4000-8000-000000000002', 'Pendant Aurora Ø40 · Brushed bronze', 8, 289000, 2312000, '2026-11-30', true, '2026-11-16 08:00:00-03', 8, 0, 0),
  ('33333333-0135-4000-8000-000000000002', 'dddddddd-0001-4000-8000-000000000135', 2, 'eeeeeeee-0001-4000-8000-000000000001', 'Path bollard Trilha · Brushed bronze', 12, 69000, 828000, '2026-11-30', true, '2026-11-16 08:00:00-03', 12, 0, 0),
  ('33333333-0135-4000-8000-000000000003', 'dddddddd-0001-4000-8000-000000000135', 3, 'eeeeeeee-0001-4000-8000-000000000005', 'Ceiling light Circo Ø32 · Patina', 10, 124000, 1240000, '2026-11-30', true, '2026-11-16 08:00:00-03', 10, 10, 0),
  -- SO-26-0134 Atelier delivered 2,150,000. 5*289000=1,445,000; 5*124000=620,000; 1*89000=89,000 total 2,154,000. 4*289000=1,156,000; 8*124000=992,000 total 2,148,000. 6*289000 + 4*89000 = 1,734,000+356,000=2,090,000. 5*289000 + 8*89000 = 1,445,000+712,000=2,157,000.
  -- 10*124000 + 10*89000 = 1,240,000+890,000=2,130,000 remainder 20,000. 7*289000 + 1*124000 = 2,023,000+124,000=2,147,000. I'll use 5 aurora + 4 fita + 4 trilha = 1,445,000+356,000+276,000=2,077,000.
  -- 6*289000 + 2*124000 = 1,734,000+248,000=1,982,000. Leave as 5*289000 + 5*124000 + 1*81000 no.
  -- 2,150,000 exactly: 5 * 289000 = 1,445,000; 5 * 124000 = 620,000; remainder 85,000 — close to 89,000. I'll set total to 2,154,000 (5 aurora + 5 circo + 1 fita) and fix order total.
  ('33333333-0134-4000-8000-000000000001', 'dddddddd-0001-4000-8000-000000000134', 1, 'eeeeeeee-0001-4000-8000-000000000002', 'Pendant Aurora Ø40 · Brushed bronze', 5, 289000, 1445000, '2026-11-21', true, '2026-11-01 08:00:00-03', 5, 5, 5),
  ('33333333-0134-4000-8000-000000000002', 'dddddddd-0001-4000-8000-000000000134', 2, 'eeeeeeee-0001-4000-8000-000000000005', 'Ceiling light Circo Ø32 · Patina', 5, 124000, 620000, '2026-11-21', true, '2026-11-01 08:00:00-03', 5, 5, 5),
  ('33333333-0134-4000-8000-000000000003', 'dddddddd-0001-4000-8000-000000000134', 3, 'eeeeeeee-0001-4000-8000-000000000004', 'Wall light Fita · Brushed bronze', 1, 89000, 89000, '2026-11-21', true, '2026-11-01 08:00:00-03', 1, 1, 1),
  -- SO-26-0133 Hotel delivered 6,720,000. 16*289000=4,624,000; 16*69000=1,104,000; 8*124000=992,000 total 6,720,000 EXACT. 4 lines: split aurora into 2.
  ('33333333-0133-4000-8000-000000000001', 'dddddddd-0001-4000-8000-000000000133', 1, 'eeeeeeee-0001-4000-8000-000000000002', 'Pendant Aurora Ø40 · Brushed bronze', 8, 289000, 2312000, '2026-11-18', true, '2026-10-28 08:00:00-03', 8, 8, 8),
  ('33333333-0133-4000-8000-000000000002', 'dddddddd-0001-4000-8000-000000000133', 2, 'eeeeeeee-0001-4000-8000-000000000002', 'Pendant Aurora Ø40 · Brushed bronze', 8, 289000, 2312000, '2026-11-18', true, '2026-10-28 08:00:00-03', 8, 8, 8),
  ('33333333-0133-4000-8000-000000000003', 'dddddddd-0001-4000-8000-000000000133', 3, 'eeeeeeee-0001-4000-8000-000000000001', 'Path bollard Trilha · Brushed bronze', 16, 69000, 1104000, '2026-11-18', true, '2026-10-28 08:00:00-03', 16, 16, 16),
  ('33333333-0133-4000-8000-000000000004', 'dddddddd-0001-4000-8000-000000000133', 4, 'eeeeeeee-0001-4000-8000-000000000005', 'Ceiling light Circo Ø32 · Patina', 8, 124000, 992000, '2026-11-18', true, '2026-10-28 08:00:00-03', 8, 8, 8);

-- Recompute order totals from lines so money always agrees.
update sales.sales_orders o
set total_minor = s.t
from (select order_id, sum(line_total_minor) as t from sales.sales_order_lines group by order_id) s
where o.id = s.order_id;

-- Inventory items + balances (from the stock mockup)
insert into inventory.items (id, sku, name, kind, uom, product_id) values
  ('44444444-0001-4000-8000-000000000001', 'DV-LIS', 'Opal glass diffuser Lis', 'component', 'ea', null),
  ('44444444-0001-4000-8000-000000000002', 'KF-M6', 'M6 fixing kit', 'component', 'ea', null),
  ('44444444-0001-4000-8000-000000000003', 'DR-LED20', 'LED driver 20 W', 'component', 'ea', null),
  ('44444444-0001-4000-8000-000000000004', 'DV-38', 'Sandblasted glass diffuser Ø38', 'component', 'ea', null),
  ('44444444-0001-4000-8000-000000000005', 'LG-CUSN10', 'Bronze ingot CuSn10', 'raw', 'kg', null),
  ('44444444-0001-4000-8000-000000000006', 'EMB-4545', 'Carton 45×45', 'packaging', 'ea', null),
  ('44444444-0001-4000-8000-000000000007', 'SQ-E27', 'Ceramic E27 holder', 'component', 'ea', null),
  ('44444444-0001-4000-8000-000000000008', 'CB-PP075', 'Flexible cable 2×0.75 mm²', 'component', 'ea', null),
  ('44444444-0001-4000-8000-000000000009', 'CN-12', 'Canopy Ø12 bronze', 'component', 'ea', null),
  ('44444444-0001-4000-8000-000000000010', 'CF-LIS', 'Cast body Lis', 'semi', 'ea', null),
  ('44444444-0001-4000-8000-000000000011', 'BZ-TRI-BE', 'Path bollard Trilha · Brushed bronze', 'finished', 'ea', 'eeeeeeee-0001-4000-8000-000000000001'),
  ('44444444-0001-4000-8000-000000000012', 'DV-DUN-58', 'Opal glass diffuser Duna Ø58', 'component', 'ea', null);

insert into inventory.stock_balances (item_id, on_hand, reserved, min_qty, incoming) values
  ('44444444-0001-4000-8000-000000000001', 22, 26, 40, 60),
  ('44444444-0001-4000-8000-000000000002', 30, 46, 60, 100),
  ('44444444-0001-4000-8000-000000000003',  0,  8, 10,  0),
  ('44444444-0001-4000-8000-000000000004', 31, 24, 20, 24),
  ('44444444-0001-4000-8000-000000000005', 412, 0, 500, 250),
  ('44444444-0001-4000-8000-000000000006', 85, 24, 100, 40),
  ('44444444-0001-4000-8000-000000000007', 260, 90, 150, 0),
  ('44444444-0001-4000-8000-000000000008', 640, 59, 300, 0),
  ('44444444-0001-4000-8000-000000000009', 120, 34, 50, 0),
  ('44444444-0001-4000-8000-000000000010', 84, 36, 20, 0),
  ('44444444-0001-4000-8000-000000000011', 42, 18, 12, 0),
  ('44444444-0001-4000-8000-000000000012', 14, 16, 10, 10);

insert into inventory.suppliers (id, name, category, contact_name, lead_time_days, min_order_minor, last_receipt, status) values
  ('55555555-0001-4000-8000-000000000001', 'Horizon Glassworks', 'Glass and diffusers', 'Tyler Mendes', 28, 150000, '2026-11-18', 'active'),
  ('55555555-0001-4000-8000-000000000002', 'Valley Forge Casting', 'Ingots and castings', 'Sandra Okada', 21, 500000, '2026-11-22', 'active'),
  ('55555555-0001-4000-8000-000000000003', 'Clear River Hardware', 'Fasteners and hardware', 'Marco Avery', 7, 40000, '2026-11-19', 'active'),
  ('55555555-0001-4000-8000-000000000004', 'Plateau Packaging', 'Packaging', 'Patricia Lane', 5, 30000, '2026-11-21', 'active'),
  ('55555555-0001-4000-8000-000000000005', 'Green Ridge Cable', 'Cables and wire', 'Edward Noll', 10, 50000, '2026-11-14', 'active'),
  ('55555555-0001-4000-8000-000000000006', 'Prairie Socket Co.', 'Holders and connectors', 'Lucia Campos', 12, 80000, '2026-11-23', 'active'),
  ('55555555-0001-4000-8000-000000000007', 'Fine Gold Finishes', 'Lacquers and patinas', 'Henry Sales', 15, 60000, '2026-10-30', 'active'),
  ('55555555-0001-4000-8000-000000000008', 'North Valley Electronics', 'LED drivers', 'Rita Moore', 20, 100000, '2026-09-02', 'active');

insert into inventory.purchase_orders (id, number, supplier_id, status, auto, total_minor, notes, created_at, approved_at, sent_at) values
  ('66666666-0001-4000-8000-000000000031', 'PO-26-0031', '55555555-0001-4000-8000-000000000001', 'draft', true, 451560, 'Stock alerts', '2026-11-18 09:00:00-03', null, null),
  ('66666666-0001-4000-8000-000000000032', 'PO-26-0032', '55555555-0001-4000-8000-000000000002', 'draft', true, 1162500, 'Stock alerts', '2026-11-23 07:55:00-03', null, null),
  ('66666666-0001-4000-8000-000000000033', 'PO-26-0033', '55555555-0001-4000-8000-000000000003', 'draft', true, 189000, 'Stock alerts', '2026-11-24 09:43:00-03', null, null),
  ('66666666-0001-4000-8000-000000000030', 'PO-26-0030', '55555555-0001-4000-8000-000000000004', 'sent', true, 98400, 'Stock alerts', '2026-11-16 10:00:00-03', '2026-11-17 11:00:00-03', '2026-11-17 14:00:00-03'),
  ('66666666-0001-4000-8000-000000000034', 'PO-26-0034', '55555555-0001-4000-8000-000000000004', 'draft', true, 58000, 'Stock alerts', '2026-11-21 08:00:00-03', null, null),
  ('66666666-0001-4000-8000-000000000035', 'PO-26-0035', null, 'draft', true, 0, 'No preferred supplier yet', '2026-11-22 08:12:00-03', null, null);

-- A sent PO ready to receive (in addition to 0030). Approve+send 0032 would also work; we keep 0030 as the obvious receive target and add a second sent PO.
insert into inventory.purchase_orders (id, number, supplier_id, status, auto, total_minor, created_at, approved_at, sent_at) values
  ('66666666-0001-4000-8000-000000000029', 'PO-26-0029', '55555555-0001-4000-8000-000000000006', 'sent', true, 240000, '2026-11-20 10:00:00-03', '2026-11-21 09:00:00-03', '2026-11-21 11:00:00-03');

insert into inventory.purchase_order_lines (purchase_order_id, line_no, item_id, qty, uom, unit_price_minor, line_total_minor, reason) values
  ('66666666-0001-4000-8000-000000000031', 1, '44444444-0001-4000-8000-000000000001', 60, 'ea', 4850, 291000, 'Shortage + minimum'),
  ('66666666-0001-4000-8000-000000000031', 2, '44444444-0001-4000-8000-000000000004', 24, 'ea', 3690, 88560, 'Minimum stock'),
  ('66666666-0001-4000-8000-000000000031', 3, '44444444-0001-4000-8000-000000000012', 10, 'ea', 7200, 72000, 'Manual'),
  ('66666666-0001-4000-8000-000000000032', 1, '44444444-0001-4000-8000-000000000005', 250, 'kg', 4650, 1162500, 'Below minimum'),
  ('66666666-0001-4000-8000-000000000033', 1, '44444444-0001-4000-8000-000000000002', 100, 'ea', 1890, 189000, 'Shortage + minimum'),
  ('66666666-0001-4000-8000-000000000030', 1, '44444444-0001-4000-8000-000000000006', 40, 'ea', 1450, 58000, 'Minimum stock'),
  ('66666666-0001-4000-8000-000000000030', 2, '44444444-0001-4000-8000-000000000006', 20, 'ea', 2020, 40400, 'Manual'),
  ('66666666-0001-4000-8000-000000000034', 1, '44444444-0001-4000-8000-000000000006', 40, 'ea', 1450, 58000, 'Minimum stock'),
  ('66666666-0001-4000-8000-000000000035', 1, '44444444-0001-4000-8000-000000000003', 10, 'ea', null, null, 'Out of stock'),
  ('66666666-0001-4000-8000-000000000029', 1, '44444444-0001-4000-8000-000000000007', 200, 'ea', 1200, 240000, 'Minimum stock');

update inventory.purchase_orders po
set total_minor = coalesce((select sum(coalesce(line_total_minor,0)) from inventory.purchase_order_lines l where l.purchase_order_id = po.id), 0);

insert into inventory.stock_alerts (id, item_id, severity, detail, trigger_count, status, purchase_order_id, opened_at, last_at) values
  ('aaaaaaaa-aaaa-4000-8000-000000000001', '44444444-0001-4000-8000-000000000001', 'short', 'Short 14 · available 0 · min 40', 5, 'open', '66666666-0001-4000-8000-000000000031', '2026-11-18', '2026-11-24 09:43:00-03'),
  ('aaaaaaaa-aaaa-4000-8000-000000000002', '44444444-0001-4000-8000-000000000002', 'short', 'Short 16 · available 0 · min 60', 1, 'open', '66666666-0001-4000-8000-000000000033', '2026-11-24', '2026-11-24 09:43:00-03'),
  ('aaaaaaaa-aaaa-4000-8000-000000000003', '44444444-0001-4000-8000-000000000003', 'out', 'Available 0 · min 10', 3, 'open', '66666666-0001-4000-8000-000000000035', '2026-11-22', '2026-11-23 08:12:00-03'),
  ('aaaaaaaa-aaaa-4000-8000-000000000004', '44444444-0001-4000-8000-000000000005', 'below_min', 'Available 412 · min 500 kg', 4, 'open', '66666666-0001-4000-8000-000000000032', '2026-11-23', '2026-11-24 07:55:00-03'),
  ('aaaaaaaa-aaaa-4000-8000-000000000005', '44444444-0001-4000-8000-000000000006', 'below_min', 'Available 61 · min 100', 6, 'open', '66666666-0001-4000-8000-000000000034', '2026-11-21', '2026-11-24 09:43:00-03'),
  ('aaaaaaaa-aaaa-4000-8000-000000000006', '44444444-0001-4000-8000-000000000004', 'below_min', 'Available 7 · min 20', 2, 'open', '66666666-0001-4000-8000-000000000031', '2026-11-20', '2026-11-24 09:43:00-03');

-- Billing: INV-2026-0218 for SO-26-0142 lines 4 and 1 (bollard 18 + aurora 12) = 12,420,000? Mockup: 18 * 690 = 12,420 and 12 * 2,890 = 34,680 total 47,100.
-- Our line 4 is 116 bollards; invoice only 18 of them (partial billing). Line 1 is 12 aurora, fully billed.
insert into billing.invoices (id, number, account_id, order_id, status, issue_date, total_minor, paid_minor, installment_count, created_at) values
  ('ffffffff-0001-4000-8000-000000000218', 'INV-2026-0218', 'aaaaaaaa-0001-4000-8000-000000000001', 'dddddddd-0001-4000-8000-000000000142', 'open', '2026-11-18', 4710000, 1570000, 3, '2026-11-18 10:12:00-03'),
  ('ffffffff-0001-4000-8000-000000000214', 'INV-2026-0214', 'aaaaaaaa-0001-4000-8000-000000000002', 'dddddddd-0001-4000-8000-000000000137', 'open', '2026-11-12', 5865000, 0, 2, '2026-11-12 11:00:00-03'),
  ('ffffffff-0001-4000-8000-000000000209', 'INV-2026-0209', 'aaaaaaaa-0001-4000-8000-000000000007', 'dddddddd-0001-4000-8000-000000000136', 'paid', '2026-11-08', 964000, 964000, 1, '2026-11-08 09:30:00-03'),
  ('ffffffff-0001-4000-8000-000000000201', 'INV-2026-0201', 'aaaaaaaa-0001-4000-8000-000000000001', 'dddddddd-0001-4000-8000-000000000133', 'paid', '2026-11-02', 6720000, 6720000, 2, '2026-11-02 10:00:00-03');

insert into billing.invoice_lines (invoice_id, line_no, order_line_id, product_id, description, qty, unit_price_minor, line_total_minor) values
  ('ffffffff-0001-4000-8000-000000000218', 1, '33333333-0142-4000-8000-000000000004', 'eeeeeeee-0001-4000-8000-000000000001', 'Path bollard Trilha · Brushed bronze', 18, 69000, 1242000),
  ('ffffffff-0001-4000-8000-000000000218', 2, '33333333-0142-4000-8000-000000000001', 'eeeeeeee-0001-4000-8000-000000000002', 'Pendant Aurora Ø40 · Brushed bronze', 12, 289000, 3468000),
  ('ffffffff-0001-4000-8000-000000000214', 1, '33333333-0137-4000-8000-000000000001', 'eeeeeeee-0001-4000-8000-000000000002', 'Pendant Aurora Ø40 · Brushed bronze', 15, 289000, 4335000),
  ('ffffffff-0001-4000-8000-000000000214', 2, '33333333-0137-4000-8000-000000000002', 'eeeeeeee-0001-4000-8000-000000000001', 'Path bollard Trilha · Brushed bronze', 12, 69000, 828000),
  ('ffffffff-0001-4000-8000-000000000214', 3, '33333333-0137-4000-8000-000000000003', 'eeeeeeee-0001-4000-8000-000000000005', 'Ceiling light Circo Ø32 · Patina', 4, 124000, 496000),
  ('ffffffff-0001-4000-8000-000000000209', 1, '33333333-0136-4000-8000-000000000001', 'eeeeeeee-0001-4000-8000-000000000002', 'Pendant Aurora Ø40 · Brushed bronze', 2, 289000, 578000),
  ('ffffffff-0001-4000-8000-000000000209', 2, '33333333-0136-4000-8000-000000000002', 'eeeeeeee-0001-4000-8000-000000000005', 'Ceiling light Circo Ø32 · Patina', 2, 124000, 248000),
  ('ffffffff-0001-4000-8000-000000000209', 3, '33333333-0136-4000-8000-000000000003', 'eeeeeeee-0001-4000-8000-000000000001', 'Path bollard Trilha · Brushed bronze', 2, 69000, 138000),
  ('ffffffff-0001-4000-8000-000000000201', 1, '33333333-0133-4000-8000-000000000001', 'eeeeeeee-0001-4000-8000-000000000002', 'Pendant Aurora Ø40 · Brushed bronze', 8, 289000, 2312000),
  ('ffffffff-0001-4000-8000-000000000201', 2, '33333333-0133-4000-8000-000000000002', 'eeeeeeee-0001-4000-8000-000000000002', 'Pendant Aurora Ø40 · Brushed bronze', 8, 289000, 2312000),
  ('ffffffff-0001-4000-8000-000000000201', 3, '33333333-0133-4000-8000-000000000003', 'eeeeeeee-0001-4000-8000-000000000001', 'Path bollard Trilha · Brushed bronze', 16, 69000, 1104000),
  ('ffffffff-0001-4000-8000-000000000201', 4, '33333333-0133-4000-8000-000000000004', 'eeeeeeee-0001-4000-8000-000000000005', 'Ceiling light Circo Ø32 · Patina', 8, 124000, 992000);

update billing.invoices i
set total_minor = s.t
from (select invoice_id, sum(line_total_minor) as t from billing.invoice_lines group by invoice_id) s
where i.id = s.invoice_id;

insert into billing.installments (invoice_id, n, due_date, amount_minor, status, paid_at, method, receipt_number) values
  ('ffffffff-0001-4000-8000-000000000218', 1, '2026-11-18', 1570000, 'paid', '2026-11-18', 'ACH', 'REC-2026-0412'),
  ('ffffffff-0001-4000-8000-000000000218', 2, '2026-12-18', 1570000, 'open', null, null, null),
  ('ffffffff-0001-4000-8000-000000000218', 3, '2027-01-17', 1570000, 'open', null, null, null),
  ('ffffffff-0001-4000-8000-000000000214', 1, '2026-12-12', 2932500, 'open', null, null, null),
  ('ffffffff-0001-4000-8000-000000000214', 2, '2027-01-12', 2932500, 'open', null, null, null),
  ('ffffffff-0001-4000-8000-000000000209', 1, '2026-11-08', 964000, 'paid', '2026-11-08', 'Transfer', 'REC-2026-0398'),
  ('ffffffff-0001-4000-8000-000000000201', 1, '2026-11-02', 3360000, 'paid', '2026-11-02', 'ACH', 'REC-2026-0370'),
  ('ffffffff-0001-4000-8000-000000000201', 2, '2026-12-02', 3360000, 'paid', '2026-11-20', 'ACH', 'REC-2026-0405');

insert into billing.payments (invoice_id, amount_minor, method, paid_at, receipt_number) values
  ('ffffffff-0001-4000-8000-000000000218', 1570000, 'ACH', '2026-11-18 16:05:00-03', 'REC-2026-0412'),
  ('ffffffff-0001-4000-8000-000000000209', 964000, 'Transfer', '2026-11-08 15:00:00-03', 'REC-2026-0398'),
  ('ffffffff-0001-4000-8000-000000000201', 3360000, 'ACH', '2026-11-02 11:20:00-03', 'REC-2026-0370'),
  ('ffffffff-0001-4000-8000-000000000201', 3360000, 'ACH', '2026-11-20 09:15:00-03', 'REC-2026-0405');

update billing.invoices i
set paid_minor = coalesce((select sum(amount_minor) from billing.payments p where p.invoice_id = i.id), 0),
    status = case
      when coalesce((select sum(amount_minor) from billing.payments p where p.invoice_id = i.id), 0) >= i.total_minor then 'paid'
      when coalesce((select sum(amount_minor) from billing.payments p where p.invoice_id = i.id), 0) > 0 then 'open'
      else status
    end;

insert into demo.meta(k, v) values ('schema_version', '4');
