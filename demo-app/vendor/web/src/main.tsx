import { StrictMode, useCallback, useEffect, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { loginHref, postLoginDestination } from './redirect';
import { ConfigProvider, theme as antTheme } from 'antd';
import { get, setCSRF } from './api';
import { Shell, resolveTheme, type Me } from './shell';
import { Login } from './pages/login';
import { ResetPassword } from './pages/resetpassword';
import { Home } from './pages/home';
import { Catalog } from './pages/catalog';
import { Shared } from './pages/shared';
import { AppDetailPage } from './pages/appdetail';
import { Users } from './pages/users';
import { ExternalUsers } from './pages/externalusers';
import { ExternalShell } from './externalshell';
import { PublicShell } from './publicshell';
import { Groups } from './pages/groups';
import { Roles } from './pages/roles';
import { Events } from './pages/events';
import { Audit } from './pages/audit';
import { Data } from './pages/data';
import { Settings } from './pages/settings';
import { SettingsIndex, SettingsLegacyTab } from './settings';
import { OAuthConsent } from './pages/oauthconsent';
import { Forbidden } from './forbidden';
import { useShell } from './shell';
import { type Branding, resolvedPrimary } from './branding';
import './styles.css';

function Guard({ perm, children }: { perm: string; children: ReactNode }) {
  const { can } = useShell();
  if (!can(perm)) return <Forbidden />;
  return <>{children}</>;
}

// The old main-nav Connections page now lives in Settings (MDW-102); saved
// links and bookmarks keep working through the legacy settings tab mapping.
function ConnectionsRedirect() {
  const { path } = useShell();
  return <Navigate to={path('settings/connections')} replace />;
}

const FONT = 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif';

function antdTheme(mode: 'light' | 'dark', branding?: Branding) {
  const dark = mode === 'dark';
  const primary = resolvedPrimary(branding, dark);
  return {
    algorithm: dark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
    token: {
      colorPrimary: primary,
      colorInfo: primary,
      colorLink: primary,
      colorBgContainer: dark ? '#14171b' : '#ffffff',
      colorBgElevated: dark ? '#14171b' : '#ffffff',
      colorBorder: dark ? '#23272e' : '#e6e8eb',
      colorBorderSecondary: dark ? '#1c1f25' : '#eef0f2',
      colorText: dark ? '#e7e9ec' : '#111827',
      colorTextSecondary: dark ? '#a3a9b3' : '#4b5563',
      colorTextTertiary: dark ? '#6b7280' : '#8a94a3',
      colorTextLightSolid: dark ? '#04140e' : '#ffffff',
      fontFamily: FONT,
      fontSize: 13,
      borderRadius: 7,
      controlHeight: 30,
    },
  };
}

function RequireAuth({ me, children }: { me: Me | null; children: ReactNode }) {
  const loc = useLocation();
  if (!me) return <Navigate to={loginHref(loc.pathname + loc.search)} replace />;
  return <>{children}</>;
}

function Root() {
  const loc = useLocation();
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [mode, setMode] = useState<'light' | 'dark'>(resolveTheme(localStorage.getItem('meadow-theme') || 'light'));
  const [branding, setBranding] = useState<Branding | undefined>();
  useEffect(() => {
    get('/me')
      .then((m) => {
        setCSRF(m.csrf_token);
        if (m.prefs?.theme) localStorage.setItem('meadow-theme', m.prefs.theme);
        setMe(m);
      })
      .catch(() => setMe(null));
  }, []);
  const onTheme = useCallback((t: 'light' | 'dark') => setMode(t), []);
  const onBranding = useCallback((b: Branding | undefined) => setBranding(b), []);
  useEffect(() => {
    document.body.classList.toggle('dark', mode === 'dark');
  }, [mode]);
  const isPublicApp = loc.pathname.startsWith('/p/');
  if (me === undefined && !isPublicApp && loc.pathname !== '/reset-password') return null;
  return (
    <ConfigProvider theme={antdTheme(mode, branding)}>
      <Routes>
        <Route path="/login" element={me ? <Navigate to={postLoginDestination(loc.search)} replace /> : <Login mode={mode} />} />
        <Route path="/reset-password" element={<ResetPassword mode={mode} />} />
        <Route path="/oauth/consent" element={<RequireAuth me={me ?? null}>{me && <OAuthConsent me={me} />}</RequireAuth>} />
        <Route path="/" element={me ? <DefaultWorkspace me={me} /> : <Navigate to={loginHref('/')} replace />} />
        <Route path="/w/:ws" element={<RequireAuth me={me ?? null}>{me && <Shell me={me} onTheme={onTheme} onBranding={onBranding} />}</RequireAuth>}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="shared" element={<Shared />} />
          <Route path="catalog/:slug" element={<AppDetailPage />} />
          <Route path="apps/:slug/*" element={null} />
          <Route path="connections" element={<ConnectionsRedirect />} />
          <Route path="data" element={<Guard perm="workspaces:update"><Data /></Guard>} />
          <Route path="users" element={<Guard perm="users:update"><Users /></Guard>} />
          <Route path="external-users" element={<Guard perm="users:update"><ExternalUsers /></Guard>} />
          <Route path="groups" element={<Guard perm="groups:update"><Groups /></Guard>} />
          <Route path="roles" element={<Guard perm="workspaces:update"><Roles /></Guard>} />
          <Route path="events" element={<Guard perm="workspaces:update"><Events /></Guard>} />
          <Route path="audit" element={<Guard perm="workspaces:update"><Audit /></Guard>} />
          <Route path="audit/:id" element={<Guard perm="workspaces:update"><Audit /></Guard>} />
          <Route path="settings" element={<SettingsIndex />} />
          <Route path="settings/:section/:page" element={<Settings />} />
          <Route path="settings/:tab" element={<SettingsLegacyTab />} />
        </Route>
        <Route path="/w/:ws/x/:app" element={<RequireAuth me={me ?? null}>{me && <ExternalShell me={me} />}</RequireAuth>} />
        <Route path="/p/:ws/:app" element={<PublicShell />} />
        <Route path="/p/:ws/:app/t/:token" element={<PublicShell />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ConfigProvider>
  );
}

function DefaultWorkspace({ me }: { me: Me }) {
  const nav = useNavigate();
  useEffect(() => {
    const def = me.workspaces.find((w) => w.slug === me.prefs?.default_workspace) || me.workspaces[0];
    if (def?.external) {
      get(`/workspaces/${def.slug}/external/apps`).then((apps) => {
        if (apps[0]) nav(`/w/${def.slug}/x/${apps[0].slug}`, { replace: true });
        else nav(`/w/${def.slug}/x`, { replace: true });
      }).catch(() => nav('/login', { replace: true }));
      return;
    }
    if (def) nav(`/w/${def.slug}/home`, { replace: true });
  }, [me, nav]);
  if (!me.workspaces.length)
    return (
      <div className="login">
        <div className="login-card">You are not a member of any workspace yet.</div>
      </div>
    );
  return null;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </StrictMode>,
);
