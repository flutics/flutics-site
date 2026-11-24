export type InstanceBranding = {
  company_name?: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  primary_color_dark?: string;
};

/** Workspace accent/icon plus optional legacy fields from older API responses. */
export type Branding = InstanceBranding & {
  icon_url?: string;
  accent_color?: string;
  brand_name?: string;
  primary_color?: string;
};

export const MEADOW_NAME = 'Flutics';
export const MEADOW_PRIMARY_LIGHT = '#059669';
export const MEADOW_PRIMARY_DARK = '#34d399';

export function displayCompanyName(b: InstanceBranding | undefined) {
  return (b?.company_name || '').trim() || MEADOW_NAME;
}

/** @deprecated use displayCompanyName */
export function displayBrandName(b: Branding | undefined, _workspaceName?: string) {
  return displayCompanyName(b);
}

export function resolvedInstancePrimary(b: InstanceBranding | undefined, dark: boolean) {
  const key = dark ? 'primary_color_dark' : 'primary_color';
  const c = ((b as Branding)?.[key] || (b as Branding)?.primary_color || '').trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c)) return c;
  return dark ? MEADOW_PRIMARY_DARK : MEADOW_PRIMARY_LIGHT;
}

export function resolvedPrimary(b: Branding | undefined, dark: boolean) {
  const accent = (b?.accent_color || '').trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(accent)) return accent;
  return resolvedInstancePrimary(b, dark);
}

export function applyInstanceBranding(b: InstanceBranding | undefined, pageTitle: string | undefined, dark: boolean) {
  const company = displayCompanyName(b);
  const page = (pageTitle || '').trim();
  document.title = page ? `${page} · ${company}` : company;
  const href = (b?.favicon_url || '').trim();
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  if (href) link.href = href;
  else link.remove();
  document.documentElement.style.setProperty('--brand-primary', resolvedInstancePrimary(b, dark));
}

/** @deprecated use applyInstanceBranding */
export function applyDocumentBranding(b: Branding | undefined, _workspaceName: string, dark: boolean) {
  applyInstanceBranding(b, undefined, dark);
}
