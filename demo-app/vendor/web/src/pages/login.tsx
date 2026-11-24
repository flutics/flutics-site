import { useEffect, useState } from 'react';
import { get, post, setCSRF } from '../api';
import { postLoginDestination, safeRedirectPath } from '../redirect';
import { Logo } from '../icons';
import { applyInstanceBranding, displayCompanyName, type InstanceBranding } from '../branding';

type Discover = { method: 'password' } | { method: 'sso'; redirect: string; require_password?: boolean };

function ssoLoginHref(base: string): string {
  const next = safeRedirectPath(new URLSearchParams(location.search).get('next'));
  return next ? `${base}?next=${encodeURIComponent(next)}` : base;
}

export function Login({ mode }: { mode: 'light' | 'dark' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(new URLSearchParams(location.search).get('error') || '');
  const resetDone = new URLSearchParams(location.search).get('reset') === '1';
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<'email' | 'signin'>('email');
  const [discover, setDiscover] = useState<Discover | null>(null);
  const [sso, setSso] = useState<{ workspace: string; name: string; url: string }[]>([]);
  const [branding, setBranding] = useState<InstanceBranding | undefined>();
  const wsSlug = new URLSearchParams(location.search).get('workspace') || '';
  useEffect(() => {
    get('/auth/providers').then((p) => setSso(p.sso || [])).catch(() => {});
  }, []);
  useEffect(() => {
    get('/public/branding')
      .then((b: InstanceBranding) => {
        setBranding(b);
        applyInstanceBranding(b, undefined, mode === 'dark');
      })
      .catch(() => applyInstanceBranding(undefined, undefined, mode === 'dark'));
  }, [mode]);
  useEffect(() => {
    if (wsSlug) {
      get(`/public/workspaces/${wsSlug}/branding`)
        .then((b: InstanceBranding) => {
          setBranding(b);
          applyInstanceBranding(b, undefined, mode === 'dark');
        })
        .catch(() => {});
    }
  }, [wsSlug, mode]);
  const continueEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const d: Discover = await post('/auth/discover', { email });
      setDiscover(d);
      setStep('signin');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const r = await post('/auth/login', { email, password });
      setCSRF(r.csrf_token);
      location.href = postLoginDestination(location.search);
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  };
  const showPassword = !discover || discover.method !== 'sso' || discover.require_password !== false;
  const ssoHref = discover?.method === 'sso' ? ssoLoginHref(discover.redirect) : sso[0]?.url ? ssoLoginHref(sso[0].url) : undefined;
  return (
    <div className="mk login" data-theme={mode} style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
      {step === 'email' ? (
        <form className="login-card" onSubmit={continueEmail}>
          <div className="brand">
            {branding?.logo_url ? <img src={branding.logo_url} alt="" width={22} height={22} style={{ borderRadius: 5, objectFit: 'cover' }} /> : <Logo size={22} />}
            {displayCompanyName(branding)}
          </div>
          <h1>Sign in</h1>
          {resetDone && <div className="ok">Password updated. Sign in with your new password.</div>}
          {err && <div className="err">{err}</div>}
          <div className="fld">
            <label htmlFor="email">Email</label>
            <input id="email" className="inp" type="email" autoComplete="username" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button className="btn p" type="submit" disabled={busy} style={{ marginTop: 6 }}>
            {busy ? 'Continuing…' : 'Continue'}
          </button>
          {sso.length > 0 && (
            <a className="btn" href={ssoLoginHref(sso[0].url)} style={{ marginTop: 10 }}>
              Sign in with SSO
            </a>
          )}
        </form>
      ) : (
        <form className="login-card" onSubmit={submit}>
          <div className="brand">
            {branding?.logo_url ? <img src={branding.logo_url} alt="" width={22} height={22} style={{ borderRadius: 5, objectFit: 'cover' }} /> : <Logo size={22} />}
            {displayCompanyName(branding)}
          </div>
          <h1>Sign in</h1>
          <p className="ds" style={{ marginBottom: 12 }}>{email}</p>
          {err && <div className="err">{err}</div>}
          {discover?.method === 'sso' && (
            <a className="btn p" href={ssoLoginHref(discover.redirect)} style={{ marginBottom: 10 }}>
              Continue with SSO
            </a>
          )}
          {showPassword && (
            <>
              <div className="fld">
                <label htmlFor="password">Password</label>
                <input id="password" className="inp" type="password" autoComplete="current-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button className="btn p" type="submit" disabled={busy} style={{ marginTop: 6 }}>
                {busy ? 'Signing in…' : 'Sign in with password'}
              </button>
            </>
          )}
          {ssoHref && showPassword && (
            <a className="btn" href={ssoHref} style={{ marginTop: 10, fontSize: 13 }}>
              Sign in with SSO
            </a>
          )}
          <button type="button" className="btn" style={{ marginTop: 10, fontSize: 13 }} onClick={() => { setStep('email'); setDiscover(null); setPassword(''); }}>
            Use a different email
          </button>
        </form>
      )}
    </div>
  );
}
