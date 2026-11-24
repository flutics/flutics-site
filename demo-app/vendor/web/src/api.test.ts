import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shouldRedirectToLogin } from './apiRedirect.ts';

describe('API login redirect', () => {
  it('leaves Snowflake OAuth challenges to the caller', () => {
    assert.equal(shouldRedirectToLogin(401, '/workspaces/acme/connections/id/test', '/w/acme/settings/workspace/connections', 'snowflake_auth_required'), false);
  });

  it('redirects ordinary session expiry but not auth, login or public routes', () => {
    assert.equal(shouldRedirectToLogin(401, '/apps', '/w/acme/apps', 'unauthorized'), true);
    assert.equal(shouldRedirectToLogin(401, '/auth/me', '/w/acme', 'unauthorized'), false);
    assert.equal(shouldRedirectToLogin(401, '/apps', '/login', 'unauthorized'), false);
    assert.equal(shouldRedirectToLogin(401, '/apps', '/p/acme/app', 'unauthorized'), false);
    assert.equal(shouldRedirectToLogin(403, '/apps', '/w/acme/apps', 'unauthorized'), false);
  });
});
