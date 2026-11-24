import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { get, post } from './api';
import type { Me } from './shell';
import { handleAppFileMessage } from './shellfile';

export function ExternalShell({ me }: { me: Me }) {
  const { ws: wsSlug = '', app: appSlug = '' } = useParams();
  const frame = useRef<HTMLIFrameElement>(null);
  const [app, setApp] = useState<any>(null);
  const contentOrigin = useRef('');

  useEffect(() => {
    get(`/workspaces/${wsSlug}/external/apps`).then((apps) => {
      setApp(apps.find((x: any) => x.slug === appSlug) || apps[0]);
    });
  }, [wsSlug, appSlug]);

  const send = useCallback((msg: any) => {
    frame.current?.contentWindow?.postMessage(msg, contentOrigin.current);
  }, []);

  const fetchToken = useCallback(async () => {
    const t = await post(`/workspaces/${wsSlug}/apps/${app.slug}/token`);
    return t;
  }, [wsSlug, app]);

  useEffect(() => {
    if (!app) return;
    contentOrigin.current = new URL(me.content_url).origin;
    const onMsg = async (ev: MessageEvent) => {
      if (ev.source !== frame.current?.contentWindow || ev.origin !== contentOrigin.current) return;
      const m = ev.data;
      if (m?.type === 'meadow:ready') {
        const t = await fetchToken();
        send({
          type: 'meadow:init', token: t.token, expires_at: t.expires_at, theme: 'light',
          user: { id: me.user.id, name: me.user.name, email: me.user.email },
          workspace: { slug: wsSlug, name: me.workspaces.find((w) => w.slug === wsSlug)?.name || wsSlug },
        });
      }
      if (m?.type === 'meadow:token-request') {
        const t = await fetchToken();
        send({ type: 'meadow:token', token: t.token, expires_at: t.expires_at });
      }
      if (m?.type === 'meadow:file-save' || m?.type === 'meadow:file-open') {
        handleAppFileMessage(m, window.location.origin);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [app, me, wsSlug, send, fetchToken]);

  const ws = me.workspaces.find((w) => w.slug === wsSlug);
  if (!app) return <div className="mk" />;
  const contentBase = (app.content_url || `${me.content_url}/apps/${app.slug}/`).replace(/\/?$/, '/');
  const src = `${contentBase}?v=${encodeURIComponent(app.version)}`;
  return (
    <div className="mk ext-shell" data-theme="light">
      <header style={{ padding: '12px 20px', borderBottom: '1px solid var(--bd)' }}>{ws?.name || wsSlug}</header>
      <iframe ref={frame} title={app.slug} src={src} style={{ border: 0, width: '100%', maxWidth: '100vw' }} sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups" />
    </div>
  );
}
