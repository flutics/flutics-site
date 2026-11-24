import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { get, post } from '../api';
import type { Me } from '../shell';
import { PageH, useToast } from '../util';
type Info = {
  client: { id: string; name: string };
  redirect_host: string;
  scopes: { scope: string; label: string }[];
};

export function OAuthConsent({ me }: { me: Me }) {
  const [params] = useSearchParams();
  const qs = params.toString();
  const toast = useToast();
  const [info, setInfo] = useState<Info | null>(null);
  useEffect(() => {
    get('/oauth/consent-info?' + qs).then((r: Info) => {
      setInfo(r);
    });
  }, [qs]);
  const act = async (action: 'allow' | 'deny') => {
    try {
      const r = await post('/oauth/consent?' + qs, { action });
      location.href = r.redirect;
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  if (!info) return null;
  return (
    <div className="pg" style={{ maxWidth: 520, margin: '48px auto' }}>
      <PageH title="Allow access" sub={`${info.client.name} wants to connect to Flutics`} />
      <div className="panel">
        <p className="ds">Redirect: <span className="mono">{info.redirect_host}</span></p>
        <p className="ds" style={{ marginTop: 12 }}>Permissions:</p>
        <ul style={{ margin: '8px 0 16px', paddingLeft: 20 }}>
          {info.scopes.map((s) => (
            <li key={s.scope}>{s.label}</li>
          ))}
        </ul>
        <p className="ds">Access applies to every workspace you belong to. The client chooses the workspace per request (for example the <span className="mono">workspace</span> argument on MCP tools).</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="button" className="btn" onClick={() => act('deny')}>Deny</button>
          <button type="button" className="btn p" onClick={() => act('allow')}>
            Allow
          </button>
        </div>
        <p className="mini" style={{ marginTop: 16 }}>Signed in as {me.user.email}</p>
      </div>
    </div>
  );
}
