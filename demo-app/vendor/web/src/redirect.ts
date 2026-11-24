/** Same-origin relative path safe for post-login redirect, or null. */
export function safeRedirectPath(raw: string | null | undefined): string | null {
  const next = (raw || '').trim();
  if (!next || !next.startsWith('/')) return null;
  if (next.startsWith('//')) return null;
  if (next.includes('\\') || next.includes(':') || /[\r\n\t]/.test(next)) return null;
  if (next.startsWith('/login')) return null;
  return next;
}

export function loginHref(fromPathAndQuery: string): string {
  const next = safeRedirectPath(fromPathAndQuery);
  if (!next) return '/login';
  return `/login?next=${encodeURIComponent(next)}`;
}

export function postLoginDestination(search: string): string {
  const next = safeRedirectPath(new URLSearchParams(search).get('next'));
  return next || '/';
}
