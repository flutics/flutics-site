export function money(minor: number | string | bigint | null | undefined) {
  const n = Number(minor ?? 0) / 100;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function num(v: number | string | null | undefined, digits = 0) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(Number(v ?? 0));
}

function ymd(y: number, m: number, d: number) {
  return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`;
}

export function dDate(v: string | Date | null | undefined) {
  if (!v) return '—';
  // PGlite returns date/timestamp columns as Date at UTC midnight; don't shift them into the browser zone.
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return ymd(v.getUTCFullYear(), v.getUTCMonth() + 1, v.getUTCDate());
  }
  const s = String(v);
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return ymd(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const dt = new Date(s);
  if (Number.isNaN(dt.getTime())) return s;
  return ymd(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export const stageLabel: Record<string, string> = {
  ordered: 'Ordered',
  reserved: 'Pieces reserved',
  assembly: 'In assembly',
  in_stock: 'In stock',
  shipping: 'Shipping',
  delivered: 'Delivered',
};

export const stageClass: Record<string, string> = {
  ordered: 'blue',
  reserved: 'purple',
  assembly: 'gold',
  in_stock: 'cyan',
  shipping: 'gold',
  delivered: 'green',
};

export const reservationLabel: Record<string, string> = {
  none: 'None',
  pending: 'Pending',
  partial: 'Partial',
  full: 'Complete',
};

export const poStatusLabel: Record<string, string> = {
  draft: 'Draft',
  approved: 'Approved',
  sent: 'Sent',
  received: 'Received',
  cancelled: 'Cancelled',
};

export const invoiceStatusLabel: Record<string, string> = {
  open: 'Open',
  paid: 'Paid',
  void: 'Void',
};

export const situationLabel: Record<string, string> = {
  ok: 'OK',
  below_min: 'Below minimum',
  short: 'Short for orders',
  out: 'Out of stock',
};

export function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
