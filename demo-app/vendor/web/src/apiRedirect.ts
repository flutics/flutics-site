export function shouldRedirectToLogin(status: number, path: string, pathname: string, errorCode?: string): boolean {
  return status === 401 && errorCode !== 'snowflake_auth_required' && !path.startsWith('/auth/') && pathname !== '/login' && !pathname.startsWith('/p/');
}
