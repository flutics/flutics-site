export const SNOWFLAKE_CALLBACK_PATH = '/api/v1/auth/snowflake/callback';

/** Prefer the server-computed redirect URL (MEADOW_PUBLIC_URL based); fall back to this origin. */
export function snowflakeRedirectURL(list: { oauth_redirect_url?: string }[] | null | undefined, origin: string): string {
  const fromServer = list?.find((c) => typeof c.oauth_redirect_url === 'string' && c.oauth_redirect_url)?.oauth_redirect_url;
  return fromServer || origin.replace(/\/+$/, '') + SNOWFLAKE_CALLBACK_PATH;
}

export type WorkspaceLite = { id: string; slug: string; name: string };

/** Select options labelled by workspace name; unknown IDs stay visible so nothing is silently dropped. */
export function workspaceOptions(workspaces: WorkspaceLite[], selected: string[] = []): { value: string; label: string }[] {
  const opts = workspaces.map((w) => ({ value: w.id, label: w.name && w.name !== w.slug ? `${w.name} (${w.slug})` : w.slug || w.id }));
  for (const id of selected) if (!opts.some((o) => o.value === id)) opts.push({ value: id, label: id });
  return opts;
}

const connectRe = /^\/api\/v1\/(me\/snowflake|admin)\/connections\/[0-9a-f-]{36}\/oauth\/start(\?[^#]*)?$/i;
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const SF_CONNECTED_PARAM = 'sf_connected';

/** Instance "Connect & test": OAuth as the admin, then back to this page with ?sf_connected=<id> so the test runs. */
export function adminConnectAndTestURL(id: string, pathname: string): string {
  const back = `${pathname}?${SF_CONNECTED_PARAM}=${encodeURIComponent(id)}`;
  return `/api/v1/admin/connections/${encodeURIComponent(id)}/oauth/start?return_to=${encodeURIComponent(back)}`;
}

/** The connection id from ?sf_connected=<uuid>, or null. */
export function connectedParam(search: string): string | null {
  const v = new URLSearchParams(search).get(SF_CONNECTED_PARAM) || '';
  return uuidRe.test(v) ? v : null;
}

/** In-app connect: a top-level start URL that returns to the app page afterwards. */
export function userConnectURL(id: string, returnPath: string): string {
  const base = `/api/v1/me/snowflake/connections/${encodeURIComponent(id)}/oauth/start`;
  return returnPath.startsWith('/') && !returnPath.startsWith('//') ? `${base}?return_to=${encodeURIComponent(returnPath)}` : base;
}

/** Workspace "Connect & test": OAuth as yourself, then back to this page so the test runs. */
export function userConnectAndTestURL(id: string, pathname: string): string {
  return userConnectURL(id, `${pathname}?${SF_CONNECTED_PARAM}=${encodeURIComponent(id)}`);
}

/** Returns the same-origin connect URL from a snowflake_auth_required API error, or null. */
export function snowflakeConnectURL(err: { status?: number; body?: any } | null | undefined): string | null {
  if (!err || err.body?.error?.code !== 'snowflake_auth_required') return null;
  const u = err.body?.detail?.connect_url;
  return typeof u === 'string' && connectRe.test(u) ? u : null;
}

export function warehouseOptions(...lists: (string[] | null | undefined)[]): { value: string; label: string }[] {
  const seen = new Set<string>();
  const out: { value: string; label: string }[] = [];
  for (const l of lists)
    for (const w of l || []) {
      const v = w.trim();
      if (v && !seen.has(v.toUpperCase())) {
        seen.add(v.toUpperCase());
        out.push({ value: v, label: v });
      }
    }
  return out;
}
