// Thin JSON client for the Meadow API (same origin, session cookie + CSRF header).
import { loginHref } from './redirect';
import { shouldRedirectToLogin } from './apiRedirect';
let csrf = '';

export function setCSRF(t: string | undefined) {
  if (t) csrf = t;
}

export function apiErrorMessage(data: any, status: number): string {
  const e = data?.error;
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object' && typeof e.message === 'string') return e.message;
  return `Request failed (${status})`;
}

export class ApiError extends Error {
  status: number;
  detail: any;
  body: any;
  constructor(msg: string, status: number, body: any) {
    super(msg);
    this.status = status;
    this.body = body;
    this.detail = body?.detail ?? body?.result?.validation;
  }
}

export async function api<T = any>(method: string, path: string, body?: any, opts: { raw?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (typeof body === 'string') {
    headers['Content-Type'] = 'application/yaml';
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  if (method !== 'GET' && csrf) headers['X-CSRF-Token'] = csrf;
  const res = await fetch('/api/v1' + path, { method, headers, body: payload, credentials: 'same-origin' });
  if (opts.raw) return res as any;
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    if (shouldRedirectToLogin(res.status, path, location.pathname, data?.error?.code)) {
      location.href = loginHref(location.pathname + location.search);
    }
    throw new ApiError(apiErrorMessage(data, res.status), res.status, data);
  }
  return data as T;
}

export const get = <T = any>(p: string) => api<T>('GET', p);
export const post = <T = any>(p: string, b?: any) => api<T>('POST', p, b);
export const put = <T = any>(p: string, b?: any) => api<T>('PUT', p, b);
export const patch = <T = any>(p: string, b?: any) => api<T>('PATCH', p, b);
export const del = <T = any>(p: string) => api<T>('DELETE', p);
