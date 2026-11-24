import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useThemePref } from './shell';
import { handleAppFileMessage } from './shellfile';

function iframeAllow(perms?: string[]) {
  const base = ['clipboard-write'];
  if (perms?.includes('microphone')) base.push('microphone');
  return base.join('; ');
}

type PublicToken = {
  token: string;
  expires_at: string;
  version?: string;
  api_url?: string;
  content_url?: string;
  permissions?: string[];
};

export function PublicShell() {
  const { ws = '', app: appSlug = '', token: pathToken } = useParams();
  const [search] = useSearchParams();
  const linkToken = pathToken || search.get('t') || '';
  const frame = useRef<HTMLIFrameElement>(null);
  const [src, setSrc] = useState('');
  const [err, setErr] = useState('');
  const [allow, setAllow] = useState('clipboard-write');
  const contentOrigin = useRef('');
  const [, , theme] = useThemePref();
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const tokenBody = useMemo(() => (linkToken ? { link_token: linkToken } : {}), [linkToken]);

  const send = useCallback((msg: unknown) => {
    frame.current?.contentWindow?.postMessage(msg, contentOrigin.current);
  }, []);

  const fetchToken = useCallback(async (): Promise<PublicToken> => {
    const r = await fetch(`/api/v1/public/workspaces/${ws}/apps/${appSlug}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenBody),
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) {
      const e = body?.error;
      const msg = typeof e === 'string' ? e : e?.message || 'Could not open this app';
      throw new Error(msg);
    }
    return body as PublicToken;
  }, [ws, appSlug, tokenBody]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await fetch('/api/v1/public/shell-config').then((r) => {
          if (!r.ok) throw new Error('Could not load shell configuration');
          return r.json();
        });
        const base = String(cfg.content_url || '').replace(/\/$/, '');
        if (!base) throw new Error('content URL is not configured');
        const t = await fetchToken();
        if (cancelled) return;
        if (t.permissions) setAllow(iframeAllow(t.permissions));
        const contentBase = String(t.content_url || `${base}/apps/${appSlug}/`).replace(/\/?$/, '/');
        contentOrigin.current = new URL(contentBase).origin;
        const ver = t.version ? `?v=${encodeURIComponent(t.version)}` : '';
        setSrc(`${contentBase}${ver}`);
      } catch (e: any) {
        if (!cancelled) setErr(e.message || 'Could not load app');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appSlug, fetchToken]);

  useEffect(() => {
    const onMsg = async (ev: MessageEvent) => {
      if (ev.source !== frame.current?.contentWindow || ev.origin !== contentOrigin.current) return;
      const m = ev.data;
      if (!m || typeof m.type !== 'string') return;
      try {
        if (m.type === 'meadow:ready') {
          const t = await fetchToken();
          if (t.permissions) setAllow(iframeAllow(t.permissions));
          send({
            type: 'meadow:init',
            token: t.token,
            expires_at: t.expires_at,
            api_url: t.api_url,
            theme: themeRef.current,
            workspace: { slug: ws },
            shell_origin: window.location.origin,
            shell_app_path: linkToken ? `/p/${ws}/${appSlug}/t/${linkToken}` : `/p/${ws}/${appSlug}`,
            route: { path: '/', search: '' },
          });
        }
        if (m.type === 'meadow:token-request') {
          const t = await fetchToken();
          send({ type: 'meadow:token', token: t.token, expires_at: t.expires_at, api_url: t.api_url });
        }
        if (m.type === 'meadow:file-save' || m.type === 'meadow:file-open') {
          handleAppFileMessage(m, window.location.origin);
        }
      } catch (e: any) {
        setErr(e.message || 'Session error');
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [ws, appSlug, send, fetchToken, linkToken]);

  useEffect(() => {
    send({ type: 'meadow:theme', theme });
  }, [theme, send]);

  return (
    <div className="mk pub-shell" data-theme={theme}>
      {err && <div className="err" style={{ padding: 16 }}>{err}</div>}
      {src && (
        <iframe
          ref={frame}
          title={appSlug}
          src={src}
          style={{ border: 0, width: '100%', maxWidth: '100vw' }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups"
          referrerPolicy="no-referrer"
          allow={allow}
        />
      )}
    </div>
  );
}
