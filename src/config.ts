export const SITE_URL = 'https://flutics.com';
export const DEMO_URL = 'https://demo.flutics.com';
export const LOGIN_URL = 'https://login.flutics.com';
export const DOCS_URL = 'https://docs.flutics.com';

export type ResourceLink = {
  label: string;
  href: string;
  placeholder: boolean;
  note?: string;
};

export const resources: ResourceLink[] = [
  { label: 'Documentation', href: DOCS_URL, placeholder: true, note: 'docs.flutics.com — not published yet' },
  { label: 'Self-hosting', href: `${DOCS_URL}/self-hosting`, placeholder: true, note: 'Self-hosting guide — not published yet' },
  { label: 'SDK', href: `${DOCS_URL}/sdk`, placeholder: true, note: 'SDK docs — not published yet' },
  { label: 'MCP', href: `${DOCS_URL}/mcp`, placeholder: true, note: 'MCP docs — not published yet. Each org also serves MCP at https://<org>.flutics.com/mcp' },
];
