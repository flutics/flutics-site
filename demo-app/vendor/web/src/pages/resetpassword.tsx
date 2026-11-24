import { useEffect, useState } from 'react';
import { get, post } from '../api';
import { Logo } from '../icons';
import { applyInstanceBranding, displayCompanyName, type InstanceBranding } from '../branding';

export function ResetPassword({ mode }: { mode: 'light' | 'dark' }) {
  const token = new URLSearchParams(location.search).get('token') || '';
  const [email, setEmail] = useState('');
  const [valid, setValid] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [branding, setBranding] = useState<InstanceBranding | undefined>();

  useEffect(() => {
    get('/public/branding')
      .then((b: InstanceBranding) => {
        setBranding(b);
        applyInstanceBranding(b, 'Reset password', mode === 'dark');
      })
      .catch(() => applyInstanceBranding(undefined, 'Reset password', mode === 'dark'));
  }, [mode]);

  useEffect(() => {
    if (!token) {
      setErr('This reset link is missing or invalid.');
      setChecking(false);
      return;
    }
    post('/auth/password-reset/verify', { token })
      .then((r) => {
        setValid(true);
        setEmail(r.email || '');
      })
      .catch((e: any) => setErr(e.message))
      .finally(() => setChecking(false));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (password.length < 8) {
      setErr('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setErr('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await post('/auth/password-reset', { token, password });
      location.href = '/login?reset=1';
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="mk login" data-theme={mode} style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
      <form className="login-card" onSubmit={submit}>
        <div className="brand">
          {branding?.logo_url ? <img src={branding.logo_url} alt="" width={22} height={22} style={{ borderRadius: 5, objectFit: 'cover' }} /> : <Logo size={22} />}
          {displayCompanyName(branding)}
        </div>
        <h1>Set a new password</h1>
        {checking ? (
          <p className="ds">Checking link…</p>
        ) : valid ? (
          <>
            {email && <p className="ds" style={{ marginBottom: 12 }}>{email}</p>}
            {err && <div className="err">{err}</div>}
            <div className="fld">
              <label htmlFor="password">New password</label>
              <input id="password" className="inp" type="password" autoComplete="new-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="fld">
              <label htmlFor="confirm">Confirm password</label>
              <input id="confirm" className="inp" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <button className="btn p" type="submit" disabled={busy} style={{ marginTop: 6 }}>
              {busy ? 'Saving…' : 'Set password'}
            </button>
          </>
        ) : (
          <>
            <div className="err">{err || 'This reset link is invalid or has expired.'}</div>
            <a className="btn" href="/login">
              Back to sign in
            </a>
          </>
        )}
      </form>
    </div>
  );
}
