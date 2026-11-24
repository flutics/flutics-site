/** Parse SSO email domains from admin textarea input (one domain per line in the UI). */
export function parseSSOEmailDomains(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(/[\s,]+/)) {
    let d = raw.trim().toLowerCase();
    if (d.startsWith('@')) d = d.slice(1).trim();
    if (!d || seen.has(d)) continue;
    seen.add(d);
    out.push(d);
  }
  return out;
}
