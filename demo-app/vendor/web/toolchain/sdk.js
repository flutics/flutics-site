// @meadow/sdk: the only way an app talks to Meadow. Runs inside the sandboxed
// iframe on the content origin; gets a short-lived per-app token from the shell
// over postMessage and calls the declared queries/actions with it.
import { createElement, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

const cfgEl = typeof document !== 'undefined' ? document.getElementById('meadow-config') : null;
const cfg = cfgEl ? JSON.parse(cfgEl.textContent) : { api: '', shell: '*', app: 'dev' };

const state = { token: null, exp: 0, user: null, theme: 'light', primaryColor: null, workspace: null, ready: false };
const routeState = { path: '/', search: '', shellOrigin: '', shellAppPath: '' };
let routeSnapshot = { path: '/', search: '' };
const subs = new Set();
const routeSubs = new Set();
const waiting = [];
let readyResolve;
const readyPromise = new Promise((r) => (readyResolve = r));

function emit() {
  for (const fn of subs) fn();
}
function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}
function subscribeRoute(fn) {
  routeSubs.add(fn);
  return () => routeSubs.delete(fn);
}
function emitRoute() {
  for (const fn of routeSubs) fn();
}
function normalizeAppPath(path) {
  if (!path || path === '/') return '/';
  const p = path.startsWith('/') ? path : '/' + path;
  return p.replace(/\/+/g, '/');
}
function normalizeAppSearch(search) {
  if (!search) return '';
  return search.startsWith('?') ? search : '?' + search;
}
function applyAppRoute(path, search) {
  const p = normalizeAppPath(path);
  const s = normalizeAppSearch(search);
  if (routeState.path === p && routeState.search === s) return false;
  routeState.path = p;
  routeState.search = s;
  routeSnapshot = { path: p, search: s };
  emitRoute();
  return true;
}
function post(msg) {
  if (window.parent && window.parent !== window) window.parent.postMessage(msg, cfg.shell);
}

function applyToken(m) {
  state.token = m.token;
  state.exp = Date.parse(m.expires_at) || Date.now() + 4 * 60 * 1000;
  while (waiting.length) waiting.shift()();
}

window.addEventListener('message', (ev) => {
  if (ev.source !== window.parent || ev.origin !== cfg.shell) return;
  const m = ev.data;
  if (!m || typeof m.type !== 'string') return;
  switch (m.type) {
    case 'meadow:init':
      state.user = m.user || null;
      state.workspace = m.workspace || null;
      state.theme = m.theme === 'dark' ? 'dark' : 'light';
      state.primaryColor = m.primary_color || null;
      if (m.api_url) cfg.api = String(m.api_url).replace(/\/$/, '');
      routeState.shellOrigin = m.shell_origin || '';
      routeState.shellAppPath = m.shell_app_path || '';
      applyAppRoute(m.route?.path || '/', m.route?.search || '');
      applyToken(m);
      state.ready = true;
      readyResolve();
      emit();
      break;
    case 'meadow:navigate':
      applyAppRoute(m.path || '/', m.search || '');
      break;
    case 'meadow:token':
      if (m.api_url) cfg.api = String(m.api_url).replace(/\/$/, '');
      applyToken(m);
      break;
    case 'meadow:theme':
      state.theme = m.theme === 'dark' ? 'dark' : 'light';
      if (m.primary_color) state.primaryColor = m.primary_color;
      emit();
      break;
  }
});

post({ type: 'meadow:ready', app: cfg.app, version: cfg.version });

// Keep the shell's command palette reachable while focus is inside the app.
window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    post({ type: 'meadow:palette' });
  }
});

async function token() {
  await readyPromise;
  if (state.token && Date.now() < state.exp - 30000) return state.token;
  const p = new Promise((r) => waiting.push(r));
  post({ type: 'meadow:token-request' });
  await p;
  return state.token;
}

export class MeadowError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.name = 'MeadowError';
    this.status = status;
    this.detail = detail;
  }
}

async function call(kind, id, args) {
  const t = await token();
  const started = performance.now();
  let res, body;
  try {
    res = await fetch(`${cfg.api}/${kind}/${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ args: args || {} }),
      credentials: 'omit',
    });
    body = await res.json().catch(() => ({}));
  } catch (e) {
    post({ type: 'meadow:call', kind, id, status: 0, ms: Math.round(performance.now() - started) });
    throw new MeadowError('Network error', 0);
  }
  post({ type: 'meadow:call', kind, id, status: res.status, ms: Math.round(performance.now() - started), rows: body.row_count, error: body.error?.code, detail: body.detail });
  if (!res.ok) {
    const e = body.error;
    const msg = typeof e === 'string' ? e : e && typeof e.message === 'string' ? e.message : `Request failed (${res.status})`;
    throw new MeadowError(msg, res.status, body.detail);
  }
  return body;
}

/** Run a declared query. Resolves to { rows, columns, row_count, ms }. */
export function query(id, args) {
  return call('queries', id, args);
}

/** Run a declared action (insert_data, merge_data, call_webhook or an imported action like "crm.create_deal"). */
export function action(id, args) {
  return call('actions', id, args);
}

/** Upload a file for a declared file argument on an action (returns { id }). */
export async function uploadFile(actionId, field, blob, contentType) {
  const t = await token();
  const fd = new FormData();
  fd.append('action', actionId);
  fd.append('field', field);
  fd.append('file', blob, 'upload');
  const q = `?action=${encodeURIComponent(actionId)}&field=${encodeURIComponent(field)}`;
  const res = await fetch(`${cfg.api}/uploads${q}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}` },
    body: fd,
    credentials: 'omit',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = body.error;
    const msg = typeof e === 'string' ? e : e?.message || `Upload failed (${res.status})`;
    throw new MeadowError(msg, res.status, body.detail);
  }
  return body;
}

async function toBytes(blobOrBytes) {
  if (blobOrBytes instanceof ArrayBuffer) return new Uint8Array(blobOrBytes);
  if (ArrayBuffer.isView(blobOrBytes)) return new Uint8Array(blobOrBytes.buffer, blobOrBytes.byteOffset, blobOrBytes.byteLength);
  if (blobOrBytes instanceof Blob) return new Uint8Array(await blobOrBytes.arrayBuffer());
  throw new MeadowError('Expected Blob or byte array', 400);
}

async function uploadDelivery(blobOrBytes, { filename, contentType }, disposition) {
  const t = await token();
  const body = await toBytes(blobOrBytes);
  const ct = contentType || 'application/octet-stream';
  const fn = encodeURIComponent(String(filename || 'download'));
  const res = await fetch(`${cfg.api}/deliveries?disp=${encodeURIComponent(disposition)}&filename=${fn}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${t}`,
      'Content-Type': ct,
    },
    body,
    credentials: 'omit',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = json.error;
    const msg = typeof e === 'string' ? e : e?.message || `File upload failed (${res.status})`;
    throw new MeadowError(msg, res.status, json.detail);
  }
  return json.url;
}

function shellFileAction(type, url) {
  if (window.parent && window.parent !== window) {
    post({ type, url });
    return;
  }
  if (type === 'meadow:file-save') {
    const a = document.createElement('a');
    a.href = url;
    a.rel = 'noopener';
    a.download = '';
    a.click();
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/** Save a file via the shell (PDF export, CSV download, …). */
export async function saveFile(blobOrBytes, opts) {
  const url = await uploadDelivery(blobOrBytes, opts || {}, 'attachment');
  shellFileAction('meadow:file-save', url);
}

/** Open a file inline in a new tab (shell origin, signed URL). */
export async function openFile(blobOrBytes, opts) {
  const url = await uploadDelivery(blobOrBytes, opts || {}, 'inline');
  shellFileAction('meadow:file-open', url);
}

export const files = { save: saveFile, open: openFile };

/** Short-lived signed URL to play back an uploaded file id. */
export async function filePlayUrl(fileId) {
  const t = await token();
  const res = await fetch(`${cfg.api}/files/${encodeURIComponent(fileId)}/url`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: '{}',
    credentials: 'omit',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new MeadowError(body.error?.message || 'Could not get file URL', res.status);
  return body.url;
}

/** Show a toast in the Meadow shell. */
export function toast(text, kind = 'success') {
  post({ type: 'meadow:toast', text: String(text), kind });
}

export function ready() {
  return readyPromise;
}

export function getUser() {
  return state.user;
}

export function getTheme() {
  return state.theme;
}

export function getShellOrigin() {
  return routeState.shellOrigin || '';
}

export function getWorkspaceSlug() {
  return state.workspace?.slug || '';
}

export function useTheme() {
  return useSyncExternalStore(subscribe, () => state.theme);
}

export function usePrimaryColor() {
  return useSyncExternalStore(subscribe, () => state.primaryColor);
}

export function useUser() {
  return useSyncExternalStore(subscribe, () => state.user);
}

/** Full shell URL for an in-app path (for href and new tabs). */
export function shellHref(appPath = '/', search = '') {
  const p = normalizeAppPath(appPath);
  const s = normalizeAppSearch(search);
  const base = (routeState.shellOrigin || '') + (routeState.shellAppPath || '');
  if (!base) return p + s;
  return (p === '/' ? base : base + p) + s;
}

/** Sync in-app navigation with the shell URL bar. */
export function navigateApp(appPath = '/', search = '', replace = false) {
  if (!applyAppRoute(appPath, search)) return;
  post({ type: 'meadow:route', path: routeState.path, search: routeState.search, replace: !!replace });
}

export function useAppRoute() {
  return useSyncExternalStore(subscribeRoute, () => routeSnapshot, () => routeSnapshot);
}

function openShellUrl(href) {
  if (href) post({ type: 'meadow:open', url: href });
}

/** In-app link with a real shell href; modifier or middle-click opens a new tab. */
export function Link({ to = '/', search = '', replace = false, children, className, style, onClick, ...rest }) {
  const href = shellHref(to, search);
  const go = (e) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    // An explicit target (other than _self) is a deliberate new-window link.
    if (rest.target && rest.target !== '_self') return;
    const mod = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
    if (e.button === 1 || mod) {
      e.preventDefault();
      openShellUrl(href);
      return;
    }
    if (e.button !== 0) return;
    e.preventDefault();
    navigateApp(to, search, replace);
  };
  return createElement('a', { href, className, style, onClick: go, onAuxClick: go, ...rest }, children);
}

/**
 * useQuery(id, args?, { enabled? }) → { rows, data, loading, error, refetch }
 * Re-runs whenever the JSON of args changes.
 */
export function useQuery(id, args, opts = {}) {
  const key = JSON.stringify(args || {});
  const enabled = opts.enabled !== false;
  const [st, setSt] = useState({ data: null, loading: enabled, error: null });
  const seq = useRef(0);
  const run = useCallback(async () => {
    const n = ++seq.current;
    setSt((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await query(id, JSON.parse(key));
      if (n === seq.current) setSt({ data, loading: false, error: null });
      return data;
    } catch (error) {
      if (n === seq.current) setSt((s) => ({ ...s, loading: false, error }));
      return null;
    }
  }, [id, key]);
  useEffect(() => {
    if (enabled) run();
  }, [run, enabled]);
  return { data: st.data, rows: st.data ? st.data.rows : [], loading: st.loading, error: st.error, refetch: run };
}

/** useAction(id) → { run(args), loading, error } */
export function useAction(id) {
  const [st, setSt] = useState({ loading: false, error: null });
  const run = useCallback(
    async (args) => {
      setSt({ loading: true, error: null });
      try {
        const r = await action(id, args);
        setSt({ loading: false, error: null });
        return r;
      } catch (error) {
        setSt({ loading: false, error });
        throw error;
      }
    },
    [id],
  );
  return { run, loading: st.loading, error: st.error };
}

export const config = cfg;

const meadow = { query, action, toast, ready, getUser, getTheme, files, onTheme: (fn) => subscribe(() => fn(state.theme)) };
if (typeof window !== 'undefined') window.meadow = meadow;
export default meadow;
