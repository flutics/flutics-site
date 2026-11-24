/** Validate a signed delivery URL from the Meadow API (shell origin only). */
export function isTrustedDeliveryUrl(url: string, shellOrigin: string): boolean {
  if (!url || !shellOrigin) return false;
  try {
    const u = new URL(url);
    if (u.origin !== shellOrigin) return false;
    if (!/^\/api\/v1\/rt\/deliveries\/[0-9a-f-]{36}$/i.test(u.pathname)) return false;
    const disp = u.searchParams.get('disp');
    if (disp !== 'attachment' && disp !== 'inline') return false;
    if (!u.searchParams.get('sig') || !u.searchParams.get('exp')) return false;
    return true;
  } catch {
    return false;
  }
}

export function triggerFileSave(url: string) {
  const a = document.createElement('a');
  a.href = url;
  a.rel = 'noopener';
  a.download = '';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function triggerFileOpen(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** Handle meadow:file-save / meadow:file-open from a sandboxed app iframe. */
export function handleAppFileMessage(
  m: { type?: string; url?: string },
  shellOrigin: string,
): boolean {
  if (!m || typeof m.type !== 'string') return false;
  const url = String(m.url || '');
  if (!isTrustedDeliveryUrl(url, shellOrigin)) return false;
  if (m.type === 'meadow:file-save') {
    triggerFileSave(url);
    return true;
  }
  if (m.type === 'meadow:file-open') {
    triggerFileOpen(url);
    return true;
  }
  return false;
}
