// Bootstraps an app inside the sandboxed iframe: waits for the shell handshake,
// loads the app bundle and renders it inside antd's ConfigProvider with the
// workspace theme. Theme changes from the shell re-render live.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App as AntApp, ConfigProvider, theme as antTheme } from 'antd';
import { config, ready, usePrimaryColor, useTheme } from './sdk.js';

const FONT = 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif';

const light = {
  colorPrimary: '#059669', colorInfo: '#059669', colorLink: '#059669', colorBgContainer: '#ffffff', colorBgLayout: '#ffffff', colorBgElevated: '#ffffff',
  colorBorder: '#e6e8eb', colorBorderSecondary: '#eef0f2', colorText: '#111827', colorTextSecondary: '#4b5563', colorTextTertiary: '#8a94a3',
  colorFillAlter: '#f7f8fa', colorError: '#dc2626', colorWarning: '#b45309',
};
const dark = {
  colorPrimary: '#34d399', colorInfo: '#34d399', colorLink: '#34d399', colorBgContainer: '#14171b', colorBgLayout: '#14171b', colorBgElevated: '#181b20',
  colorBorder: '#23272e', colorBorderSecondary: '#1c1f25', colorText: '#e7e9ec', colorTextSecondary: '#a3a9b3', colorTextTertiary: '#6b7280',
  colorFillAlter: '#121418', colorTextLightSolid: '#04140e', colorError: '#f87171', colorWarning: '#fbbf24',
};

class Boundary extends React.Component {
  constructor(p) {
    super(p);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    window.parent.postMessage({ type: 'meadow:error', message: String(error && error.message) }, config.shell);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontSize: 13 }}>
          <b>This app crashed.</b>
          <pre style={{ whiteSpace: 'pre-wrap', opacity: 0.7 }}>{String(this.state.error.message || this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function Host({ Component }) {
  const mode = useTheme();
  const primaryOverride = usePrimaryColor();
  const isDark = mode === 'dark';
  const base = isDark ? dark : light;
  const primary = primaryOverride || base.colorPrimary;
  const tokens = { ...base, colorPrimary: primary, colorInfo: primary, colorLink: primary };
  React.useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
  }, [mode]);
  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: { ...tokens, fontFamily: FONT, fontSize: 13, borderRadius: 7, controlHeight: 30 },
        components: {
          Table: { headerBg: isDark ? '#121418' : '#f7f8fa', headerColor: isDark ? '#6b7280' : '#8a94a3', cellPaddingBlock: 9, cellPaddingInline: 12, headerSplitColor: 'transparent', rowHoverBg: isDark ? '#1a1d22' : '#f3f4f6' },
          Segmented: { itemSelectedBg: isDark ? '#1f2329' : '#ffffff', trackBg: isDark ? '#121418' : '#f7f8fa' },
          Drawer: { colorBgElevated: isDark ? '#14171b' : '#ffffff' },
        },
      }}
    >
      <AntApp>
        <Boundary>
          <Component />
        </Boundary>
      </AntApp>
    </ConfigProvider>
  );
}

async function main() {
  const el = document.getElementById('root');
  await ready();
  let mod;
  try {
    mod = await import(config.bundle);
  } catch (e) {
    el.textContent = 'Could not load this app.';
    window.parent.postMessage({ type: 'meadow:error', message: String(e && e.message) }, config.shell);
    return;
  }
  if (typeof mod.mount === 'function') {
    mod.mount(el, { config });
    return;
  }
  const Component = mod.default;
  if (!Component) {
    el.textContent = 'This app has no default export.';
    return;
  }
  createRoot(el).render(<Host Component={Component} />);
}

main();
