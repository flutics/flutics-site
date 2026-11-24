export const WS_SLUG = 'alder';
export const WS_NAME = 'Alder Light';
export const ORG_NAME = 'Alder Light Co.';
export const SCHEMA_VERSION = '1';
export const TOOLCHAIN = '2026.10';
export const IDB = 'idb://flutics-demo-core';

export const USER = {
  id: '55555555-5555-4555-8555-555555555555',
  name: 'Elena Walsh',
  email: 'elena@alder-light.example',
  kind: 'internal',
};

export const TEAM = [
  USER,
  { id: '55555555-5555-4555-8555-555555555556', name: 'Diego Alvarez', email: 'diego@alder-light.example', kind: 'internal' },
  { id: '55555555-5555-4555-8555-555555555557', name: 'Livia Pratt', email: 'livia@alder-light.example', kind: 'internal' },
];

export const APPS = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'sales-crm',
    name: 'Sales CRM',
    version: '1.4.2',
    description: 'Companies, deals and pipeline stages for the sales team.',
    category: 'Sales Ops',
    color: '#0ea5e9',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    slug: 'inventory',
    name: 'Inventory',
    version: '1.0.0',
    description: 'Stock, suppliers and purchase orders.',
    category: 'Operations',
    color: '#0e7c66',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    slug: 'billing',
    name: 'Billing',
    version: '1.0.0',
    description: 'Invoices and installments linked to customer accounts.',
    category: 'Finance',
    color: '#1d4ed8',
  },
] as const;

export function schemaName(slug: string) {
  return slug.replace(/-/g, '_');
}
