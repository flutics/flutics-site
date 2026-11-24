import { Modal } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { post } from './api';
import {
  buildAppShellPath,
  normalizeAppPath,
  normalizeAppSearch,
  shouldPostAppRoute,
  shouldSendAppNavigate,
  splitAppShellLocation,
} from './approute';
import { useDebug } from './debug';
import { I } from './icons';
import { useShell } from './shell';
import { useToast } from './util';
import { AppDetailDrawer } from './pages/appdetail';
import { handleAppFileMessage } from './shellfile';

// AppView hosts one app: the frame and the sandboxed iframe on the
// content origin. The frame chrome (URL bar, status footer, inset border) only
// shows in debug mode (see debug.ts); otherwise the iframe fills the content area. It stays mounted while its tab is open, so switching
// tabs or pages keeps the app's state. The bridge hands the iframe a short-lived
// app token and keeps theme and telemetry in sync over postMessage.
export function AppView({ app, active, focus }: { app: any; active: boolean; focus?: boolean }) {
  const { ws, me, theme, brandPrimary, openPalette, registerAppChrome } = useShell();
  const toast = useToast();
  const loc = useLocation();
  const nav = useNavigate();
  const frame = useRef<HTMLIFrameElement>(null);
  const routeRef = useRef({ path: '/', search: '' });
  const lastIframeRoute = useRef<{ path: string; search: string } | null>(null);
  const routeFromIframe = useRef(false);
  const [debug] = useDebug();
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [last, setLast] = useState<string>('');
  const [exp, setExp] = useState<number>(0);
  const [now, setNow] = useState(Date.now());
  const [detail, setDetail] = useState(false);
  const [nonce, setNonce] = useState(0);
  const contentBase = (app.content_url || `${me.content_url}/apps/${app.slug}/`).replace(/\/?$/, '/');
  const contentOrigin = new URL(contentBase).origin;
  const src = `${contentBase}?v=${encodeURIComponent(app.version)}`;
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const ready = useRef(false);
  const send = useCallback(
    (msg: any) => {
      if (ready.current) frame.current?.contentWindow?.postMessage(msg, contentOrigin);
    },
    [contentOrigin],
  );
  const fetchToken = useCallback(async () => {
    const t = await post(`/workspaces/${ws.slug}/apps/${app.slug}/token`);
    setExp(Date.parse(t.expires_at));
    return t;
  }, [ws.slug, app.slug]);

  const shellAppPath = buildAppShellPath(ws.slug, app.slug, '/', !!focus);
  const appRoute = splitAppShellLocation(loc.pathname, loc.search, ws.slug, app.slug);
  if (appRoute) routeRef.current = { path: appRoute.path, search: appRoute.search };

  const pushShellRoute = useCallback(
    (appPath: string, search: string, replace: boolean) => {
      if (!shouldPostAppRoute(appPath, search, loc.pathname, loc.search, ws.slug, app.slug, !!focus)) return;
      routeFromIframe.current = true;
      const nextPath = buildAppShellPath(ws.slug, app.slug, normalizeAppPath(appPath), !!focus);
      const nextSearch = normalizeAppSearch(search);
      const next = nextPath + nextSearch;
      if (loc.pathname + loc.search !== next) nav(next, { replace });
    },
    [ws.slug, app.slug, focus, loc.pathname, loc.search, nav],
  );

  useEffect(() => {
    if (!active || !ready.current) return;
    if (routeFromIframe.current) {
      routeFromIframe.current = false;
      const r = splitAppShellLocation(loc.pathname, loc.search, ws.slug, app.slug);
      if (r) lastIframeRoute.current = { path: r.path, search: normalizeAppSearch(r.search) };
      return;
    }
    if (!shouldSendAppNavigate(lastIframeRoute.current, loc.pathname, loc.search, ws.slug, app.slug)) return;
    const r = splitAppShellLocation(loc.pathname, loc.search, ws.slug, app.slug);
    if (!r) return;
    lastIframeRoute.current = { path: r.path, search: normalizeAppSearch(r.search) };
    send({ type: 'meadow:navigate', path: r.path, search: r.search });
  }, [loc.pathname, loc.search, active, ws.slug, app.slug, send]);

  useEffect(() => {
    const onMsg = async (ev: MessageEvent) => {
      if (ev.source !== frame.current?.contentWindow || ev.origin !== contentOrigin) return;
      const m = ev.data;
      if (!m || typeof m.type !== 'string') return;
      try {
        switch (m.type) {
          case 'meadow:ready': {
            ready.current = true;
            const t = await fetchToken();
            const r = routeRef.current;
            send({
              type: 'meadow:init', token: t.token, expires_at: t.expires_at, theme: themeRef.current,
              primary_color: brandPrimary,
              user: { id: me.user.id, name: me.user.name, email: me.user.email }, workspace: { slug: ws.slug, name: ws.name },
              shell_origin: window.location.origin,
              shell_app_path: shellAppPath,
              route: { path: r.path, search: r.search },
            });
            lastIframeRoute.current = { path: r.path, search: normalizeAppSearch(r.search) };
            setStatus('connected');
            break;
          }
          case 'meadow:token-request': {
            const t = await fetchToken();
            send({ type: 'meadow:token', token: t.token, expires_at: t.expires_at });
            break;
          }
          case 'meadow:call':
            setLast(`${m.id} · ${m.status >= 400 || m.status === 0 ? m.status || 'network error' : m.ms + ' ms'}`);
            if (m.status === 401 && m.error === 'snowflake_auth_required') {
              const connId = typeof m.detail?.connection_id === 'string' ? m.detail.connection_id : '';
              const rel = typeof m.detail?.connect_url === 'string' ? m.detail.connect_url : '';
              const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
              const relRe = /^\/api\/v1\/me\/snowflake\/connections\/[0-9a-f-]{36}\/oauth\/start$/;
              let path: string | null = null;
              if (uuidRe.test(connId)) {
                path = `/api/v1/me/snowflake/connections/${connId}/oauth/start`;
              } else if (relRe.test(rel)) {
                path = rel;
              }
              if (path) {
                Modal.confirm({
                  title: 'Connect Snowflake',
                  content: 'This query needs your Snowflake sign-in. Connect, then run the query again.',
                  okText: 'Connect',
                  onOk: () => {
                    // Top-level start URL (never fetched) that comes back to this app page.
                    const back = window.location.pathname + window.location.search;
                    window.open(`${window.location.origin}${path}?return_to=${encodeURIComponent(back)}`, '_blank', 'noopener,noreferrer');
                  },
                });
              }
            }
            break;
          case 'meadow:toast':
            toast(String(m.text).slice(0, 200), m.kind === 'error' ? 'error' : 'success');
            break;
          case 'meadow:palette':
            openPalette();
            break;
          case 'meadow:route':
            pushShellRoute(String(m.path || '/'), String(m.search || ''), !!m.replace);
            break;
          case 'meadow:open': {
            const url = String(m.url || '');
            if (url.startsWith('http://') || url.startsWith('https://')) window.open(url, '_blank', 'noopener,noreferrer');
            else if (url.startsWith('/') && !url.startsWith('//')) window.open(window.location.origin + url, '_blank', 'noopener,noreferrer');
            break;
          }
          case 'meadow:file-save':
          case 'meadow:file-open':
            handleAppFileMessage(m, window.location.origin);
            break;
          case 'meadow:error':
            setStatus('error');
            setLast(String(m.message || 'error').slice(0, 120));
            break;
        }
      } catch (e: any) {
        setStatus('error');
        setLast(e.message);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [contentOrigin, fetchToken, send, me.user, ws.slug, ws.name, toast, openPalette, pushShellRoute, shellAppPath, brandPrimary]);

  const primaryRef = useRef(brandPrimary);
  primaryRef.current = brandPrimary;
  useEffect(() => {
    send({ type: 'meadow:theme', theme, primary_color: primaryRef.current });
  }, [theme, brandPrimary, send]);

  useEffect(() => {
    if (!active) return;
    const h = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(h);
  }, [active]);

  const left = Math.max(0, Math.round((exp - now) / 1000));
  const host = contentOrigin.replace(/^https?:\/\//, '');
  const routePath = appRoute?.path || '/';
  const routeSearch = appRoute?.search || '';
  const focusHref = buildAppShellPath(ws.slug, app.slug, routePath, true) + routeSearch;
  const shellHref = buildAppShellPath(ws.slug, app.slug, routePath, false) + routeSearch;
  const reload = useCallback(() => {
    ready.current = false;
    setStatus('loading');
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!active) {
      registerAppChrome(app.slug, null);
      return;
    }
    registerAppChrome(app.slug, {
      slug: app.slug,
      name: app.name,
      version: app.version,
      focusHref,
      shellHref,
      reload,
      openManifest: () => setDetail(true),
    });
    return () => registerAppChrome(app.slug, null);
  }, [active, app.slug, app.name, app.version, focusHref, shellHref, reload, registerAppChrome]);

  return (
    <div className="appview">
      <div className={debug ? 'frame debug' : 'frame bare'}>
        {debug && (
          <div className="frame-bar">
            <span className="lock">
              <I n="lock" />
              {host}/apps/{app.slug}/
            </span>
            <span className="r">
              <span>sandboxed</span>
              <span>toolchain {app.toolchain || me.toolchain}</span>
            </span>
          </div>
        )}
        <iframe
          key={nonce}
          ref={frame}
          title={app.name}
          src={src}
          sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups"
          referrerPolicy="no-referrer"
          allow="clipboard-write"
        />
        {debug ? (
          <div className="frame-ft">
            <span className={status === 'error' ? 'bad' : status === 'connected' ? 'ok' : ''}>● {status}</span>
            {last && <span>{last}</span>}
            {exp > 0 && (
              <span>
                session token · {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')} left
              </span>
            )}
          </div>
        ) : (
          status === 'error' && (
            <div className="frame-err" role="alert">
              <span>{last || 'The app reported an error.'}</span>
              <button type="button" className="btn sm gh" onClick={reload}>
                Reload
              </button>
            </div>
          )
        )}
      </div>
      <AppDetailDrawer slug={app.slug} open={detail} onClose={() => setDetail(false)} />
    </div>
  );
}
