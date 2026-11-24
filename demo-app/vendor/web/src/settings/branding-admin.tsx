import { useEffect, useState } from 'react';
import { ColorPicker, Input } from 'antd';
import { api, get, put } from '../api';
import type { InstanceBranding } from '../branding';
import { MEADOW_NAME, MEADOW_PRIMARY_DARK, MEADOW_PRIMARY_LIGHT } from '../branding';
import { useToast } from '../util';

function normHex(c: string | undefined, fallback: string) {
  const v = (c || '').trim();
  return /^#([0-9a-fA-F]{6})$/.test(v) ? v : fallback;
}

export function InstanceBrandingAdmin() {
  const toast = useToast();
  const [form, setForm] = useState<InstanceBranding>({
    company_name: '',
    logo_url: '',
    favicon_url: '',
    primary_color: MEADOW_PRIMARY_LIGHT,
    primary_color_dark: MEADOW_PRIMARY_DARK,
  });
  const [previewLight, setPreviewLight] = useState(MEADOW_PRIMARY_LIGHT);
  const [previewDark, setPreviewDark] = useState(MEADOW_PRIMARY_DARK);

  useEffect(() => {
    get('/admin/branding').then((b: InstanceBranding) => {
      setForm({
        company_name: b.company_name || '',
        logo_url: b.logo_url?.startsWith('/api/') ? '' : b.logo_url || '',
        favicon_url: b.favicon_url?.startsWith('/api/') ? '' : b.favicon_url || '',
        primary_color: b.primary_color || MEADOW_PRIMARY_LIGHT,
        primary_color_dark: b.primary_color_dark || MEADOW_PRIMARY_DARK,
      });
      setPreviewLight(normHex(b.primary_color, MEADOW_PRIMARY_LIGHT));
      setPreviewDark(normHex(b.primary_color_dark, MEADOW_PRIMARY_DARK));
    });
  }, []);

  const save = async () => {
    try {
      const b = await put('/admin/branding', {
        company_name: form.company_name,
        logo_url: form.logo_url,
        favicon_url: form.favicon_url,
        primary_color: previewLight,
        primary_color_dark: previewDark,
      });
      setForm((f) => ({ ...f, ...b }));
      toast('Company branding saved');
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const upload = async (kind: 'logo' | 'favicon', file: File | null) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api('POST', `/admin/branding/${kind}`, fd);
      toast(kind === 'logo' ? 'Logo uploaded' : 'Favicon uploaded');
      const b: InstanceBranding = await get('/admin/branding');
      setForm((f) => ({ ...f, logo_url: b.logo_url, favicon_url: b.favicon_url }));
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const company = (form.company_name || '').trim() || MEADOW_NAME;

  return (
    <div className="panel" style={{ maxWidth: 680 }}>
      <p style={{ color: 'var(--tx3)', fontSize: 12.5, marginTop: 0 }}>
        Company name, logo and colors apply to sign-in, the shell header logo, browser title, emails, and the default app theme.
      </p>
      <div className="srow">
        <div className="l">
          <b>Company name</b>
        </div>
        <Input style={{ width: 280 }} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder={MEADOW_NAME} />
      </div>
      <div className="srow">
        <div className="l">
          <b>Primary color (light)</b>
        </div>
        <ColorPicker
          format="hex"
          disabledAlpha
          value={previewLight}
          onChange={(_, hex) => setPreviewLight(hex)}
        />
      </div>
      <div className="srow">
        <div className="l">
          <b>Primary color (dark)</b>
        </div>
        <ColorPicker format="hex" disabledAlpha value={previewDark} onChange={(_, hex) => setPreviewDark(hex)} />
      </div>
      <div className="srow">
        <div className="l">
          <b>Logo URL</b>
        </div>
        <Input style={{ width: 280 }} value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://…" />
      </div>
      <div className="srow">
        <div className="l">
          <b>Logo file</b>
        </div>
        <input type="file" accept="image/*" onChange={(e) => upload('logo', e.target.files?.[0] || null)} />
      </div>
      <div className="srow">
        <div className="l">
          <b>Favicon URL</b>
        </div>
        <Input style={{ width: 280 }} value={form.favicon_url} onChange={(e) => setForm({ ...form, favicon_url: e.target.value })} />
      </div>
      <div className="srow">
        <div className="l">
          <b>Favicon file</b>
        </div>
        <input type="file" accept="image/*,.ico" onChange={(e) => upload('favicon', e.target.files?.[0] || null)} />
      </div>
      <div className="branding-preview-grid">
        <div className="branding-preview light" style={{ ['--brand-primary' as string]: previewLight }}>
          <div className="branding-preview-bar">{company}</div>
          <button type="button" className="btn p">
            Preview button
          </button>
        </div>
        <div className="branding-preview dark" style={{ ['--brand-primary' as string]: previewDark }}>
          <div className="branding-preview-bar">{company}</div>
          <button type="button" className="btn p">
            Preview button
          </button>
        </div>
      </div>
      <button type="button" className="btn p" onClick={save} style={{ marginTop: 12 }}>
        Save branding
      </button>
    </div>
  );
}
