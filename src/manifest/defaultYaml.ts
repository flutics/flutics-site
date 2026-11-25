export const DEFAULT_MANIFEST_YAML = `manifest: 1
name: Sample CRM
description: A tiny app defined by this YAML manifest — table, form and actions, no server.

table:
  id: contacts
  label: Contacts
  columns:
    - key: name
      label: Name
      type: text
      required: true
    - key: email
      label: Email
      type: email
    - key: stage
      label: Stage
      type: enum
      values: [lead, qualified, customer]
    - key: value
      label: Deal value (USD)
      type: number

actions:
  - id: qualify_leads
    label: Qualify all leads
    kind: bulk_update
    filter: { field: stage, equals: lead }
    field: stage
    value: qualified
  - id: export_csv
    label: Export CSV
    kind: export_csv
`;

export const DEFAULT_SEED_ROWS = [
  { name: 'Alder Light Co.', email: 'ops@alder-light.example', stage: 'customer', value: 42000 },
  { name: 'Northwind Traders', email: 'buyers@northwind.example', stage: 'qualified', value: 18500 },
  { name: 'Bright Harbor Labs', email: 'hello@brightharbor.example', stage: 'lead', value: 6200 },
];