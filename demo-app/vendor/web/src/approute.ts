/** Parse/build Meadow shell URLs for embedded apps (mirrors internal/approute). */

export type ParsedAppRoute = { focus: boolean; path: string; search: string };

export function parseAppShellPath(pathname: string, wsSlug: string, appSlug: string): ParsedAppRoute | null {
  const prefix = `/w/${wsSlug}/apps/${appSlug}`;
  if (!pathname.startsWith(prefix)) return null;
  let rest = pathname.slice(prefix.length);
  if (rest === '') return { focus: false, path: '/', search: '' };
  if (!rest.startsWith('/')) return null;
  let focus = false;
  if (rest === '/focus') return { focus: true, path: '/', search: '' };
  if (rest.startsWith('/focus/')) {
    focus = true;
    rest = rest.slice('/focus'.length) || '/';
  }
  const path = rest || '/';
  if (!path.startsWith('/')) return null;
  return { focus, path, search: '' };
}

export function buildAppShellPath(wsSlug: string, appSlug: string, appPath: string, focus = false): string {
  let p = appPath || '/';
  if (!p.startsWith('/')) p = '/' + p;
  let base = `/w/${wsSlug}/apps/${appSlug}`;
  if (focus) base += '/focus';
  if (p === '/') return base;
  return base + p;
}

export function normalizeAppPath(path: string): string {
  if (!path || path === '/') return '/';
  const p = path.startsWith('/') ? path : '/' + path;
  return p.replace(/\/+/g, '/');
}

export function normalizeAppSearch(search: string): string {
  if (!search) return '';
  return search.startsWith('?') ? search : '?' + search;
}

export function sameAppRoute(
  a: { path: string; search: string },
  b: { path: string; search: string },
): boolean {
  return normalizeAppPath(a.path) === normalizeAppPath(b.path) && normalizeAppSearch(a.search) === normalizeAppSearch(b.search);
}

/** True when the iframe should post meadow:route to the shell. */
export function shouldPostAppRoute(
  appPath: string,
  appSearch: string,
  shellPathname: string,
  shellSearch: string,
  wsSlug: string,
  appSlug: string,
  _focus: boolean,
): boolean {
  const parsed = splitAppShellLocation(shellPathname, shellSearch, wsSlug, appSlug);
  if (!parsed) return true;
  const next = { path: normalizeAppPath(appPath), search: normalizeAppSearch(appSearch) };
  const cur = { path: parsed.path, search: normalizeAppSearch(parsed.search) };
  return !sameAppRoute(next, cur);
}

/** True when the shell should post meadow:navigate to the iframe. */
export function shouldSendAppNavigate(
  last: { path: string; search: string } | null,
  shellPathname: string,
  shellSearch: string,
  wsSlug: string,
  appSlug: string,
): boolean {
  const parsed = splitAppShellLocation(shellPathname, shellSearch, wsSlug, appSlug);
  if (!parsed) return false;
  const next = { path: parsed.path, search: normalizeAppSearch(parsed.search) };
  if (!last) return true;
  return !sameAppRoute(last, next);
}

export function splitAppShellLocation(pathname: string, search: string, wsSlug: string, appSlug: string): ParsedAppRoute | null {
  const parsed = parseAppShellPath(pathname, wsSlug, appSlug);
  if (!parsed) return null;
  parsed.search = search || '';
  return parsed;
}
