import { StrictMode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ConfigProvider, theme as antTheme } from 'antd';
import { Shell, resolveTheme, type Me } from '../vendor/web/src/shell';
import { Home } from '../vendor/web/src/pages/home';
import { Catalog } from '../vendor/web/src/pages/catalog';
import { AppDetailPage } from '../vendor/web/src/pages/appdetail';
import { Shared } from '../vendor/web/src/pages/shared';
import { handleDemoAPI, installFetchShim, resetDb } from './api';
import { WS_SLUG } from './constants';
import '../vendor/web/src/styles.css';
import './banner.css';

const FONT = 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif';

function Banner({ onReset }: { onReset: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(() => (sessionStorage.getItem('flutics-demo-reset') ? 'Demo data restored.' : null));
  useEffect(() => {
    if (sessionStorage.getItem('flutics-demo-reset')) sessionStorage.removeItem('flutics-demo-reset');
  }, []);
  return (
    <div className="flutics-demo-banner">
      <a href="/" title="Back to flutics.com">
        <img src="/brand/logo.svg" alt="" width={18} height={18} />
        <strong>Flutics demo</strong>
      </a>
      <span>Alder Light Co. · fictional · Postgres in this browser</span>
      {msg && <em>{msg}</em>}
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setMsg(null);
          try {
            await onReset();
            sessionStorage.setItem('flutics-demo-reset', '1');
            location.reload();
          } catch (e: any) {
            setMsg(e.message || 'Reset failed');
            setBusy(false);
          }
        }}
      >
        {busy ? 'Resetting…' : 'Reset demo'}
      </button>
    </div>
  );
}

function DemoRoot({ me, reloadMe }: { me: Me; reloadMe: () => Promise<void> }) {
  const [mode, setMode] = useState<'light' | 'dark'>(resolveTheme(localStorage.getItem('meadow-theme') || 'light'));
  const onTheme = useCallback((value: 'light' | 'dark') => setMode(value), []);
  useEffect(() => {
    document.body.classList.toggle('dark', mode === 'dark');
  }, [mode]);
  return (
    <ConfigProvider
      theme={{
        algorithm: mode === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#0e7c66',
          colorInfo: '#0e7c66',
          colorLink: '#0e7c66',
          fontFamily: FONT,
          fontSize: 13,
          borderRadius: 7,
          controlHeight: 30,
        },
      }}
    >
      <div className="flutics-demo-root">
        <Banner
          onReset={async () => {
            await resetDb();
            await reloadMe();
          }}
        />
        <Routes>
          <Route path="/" element={<Navigate to={`/w/${WS_SLUG}/home`} replace />} />
          <Route path="/w/:ws" element={<Shell me={me} onTheme={onTheme} />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<Home />} />
            <Route path="catalog" element={<Catalog />} />
            <Route path="catalog/:slug" element={<AppDetailPage />} />
            <Route path="shared" element={<Shared />} />
            <Route path="apps/:slug/*" element={null} />
            <Route path="*" element={<Navigate to="home" replace />} />
          </Route>
          <Route path="*" element={<Navigate to={`/w/${WS_SLUG}/home`} replace />} />
        </Routes>
      </div>
    </ConfigProvider>
  );
}

function Boot() {
  const [me, setMe] = useState<Me | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    const { status, data } = await handleDemoAPI('GET', '/api/v1/me');
    if (status !== 200) throw new Error(data?.error?.message || 'Could not start the demo session');
    setMe(data as Me);
  }, []);
  useEffect(() => {
    load().catch((e) => setErr(String(e.message || e)));
  }, [load]);
  if (err) {
    return (
      <main className="flutics-demo-boot-err">
        <h1>Could not start the Flutics demo</h1>
        <p>{err}</p>
        <button type="button" onClick={() => location.reload()}>
          Try again
        </button>
      </main>
    );
  }
  if (!me) {
    return (
      <div className="flutics-demo-boot">
        Starting Flutics…
      </div>
    );
  }
  return <DemoRoot me={me} reloadMe={load} />;
}

async function main() {
  await installFetchShim();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <Boot />
      </BrowserRouter>
    </StrictMode>,
  );
}

main().catch((error) => {
  document.body.innerHTML = `<main style="font:14px system-ui;padding:40px;color:#8b352c"><h1>Could not start the Flutics demo</h1><p>${String(error?.message || error).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string))}</p></main>`;
});
