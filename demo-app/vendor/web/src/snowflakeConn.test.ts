import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { adminConnectAndTestURL, connectedParam, snowflakeConnectURL, snowflakeRedirectURL, userConnectAndTestURL, userConnectURL, warehouseOptions, workspaceOptions } from './snowflakeConn.ts';

const id = '9588ce71-7c33-489d-95a7-e9c13665cff4';

describe('snowflakeRedirectURL', () => {
  it('prefers the server value', () => {
    assert.equal(snowflakeRedirectURL([{}, { oauth_redirect_url: 'https://pub.example/api/v1/auth/snowflake/callback' }], 'https://x.test'), 'https://pub.example/api/v1/auth/snowflake/callback');
  });
  it('falls back to the origin', () => {
    assert.equal(snowflakeRedirectURL([], 'https://x.test/'), 'https://x.test/api/v1/auth/snowflake/callback');
    assert.equal(snowflakeRedirectURL(null, 'https://x.test'), 'https://x.test/api/v1/auth/snowflake/callback');
  });
});

describe('workspaceOptions', () => {
  it('labels by name and keeps unknown ids', () => {
    assert.deepEqual(workspaceOptions([{ id: 'a', slug: 'sales', name: 'Sales' }, { id: 'b', slug: 'ops', name: 'ops' }], ['a', 'zzz']), [
      { value: 'a', label: 'Sales (sales)' },
      { value: 'b', label: 'ops' },
      { value: 'zzz', label: 'zzz' },
    ]);
  });
});

describe('snowflakeConnectURL', () => {
  it('extracts a safe connect url', () => {
    const u = `/api/v1/me/snowflake/connections/${id}/oauth/start?return_to=%2Fsettings`;
    assert.equal(snowflakeConnectURL({ status: 401, body: { error: { code: 'snowflake_auth_required' }, detail: { connect_url: u } } }), u);
  });
  it('rejects other codes and foreign urls', () => {
    assert.equal(snowflakeConnectURL({ status: 502, body: { error: { code: 'snowflake_unavailable' } } }), null);
    assert.equal(snowflakeConnectURL({ status: 401, body: { error: { code: 'snowflake_auth_required' }, detail: { connect_url: 'https://evil.test/x' } } }), null);
    assert.equal(snowflakeConnectURL(null), null);
  });
});

describe('warehouseOptions', () => {
  it('merges and dedupes case-insensitively', () => {
    assert.deepEqual(warehouseOptions(['COMPUTE_WH', 'etl_wh'], ['compute_wh', ' ', 'BI']), [
      { value: 'COMPUTE_WH', label: 'COMPUTE_WH' },
      { value: 'etl_wh', label: 'etl_wh' },
      { value: 'BI', label: 'BI' },
    ]);
  });
});

describe('connect & test', () => {
  it('builds the admin start url returning to this page', () => {
    const u = adminConnectAndTestURL(id, '/w/acme/settings/instance/connections');
    assert.equal(u, `/api/v1/admin/connections/${id}/oauth/start?return_to=${encodeURIComponent(`/w/acme/settings/instance/connections?sf_connected=${id}`)}`);
    assert.equal(snowflakeConnectURL({ body: { error: { code: 'snowflake_auth_required' }, detail: { connect_url: u } } }), u);
  });
  it('reads only a uuid sf_connected param', () => {
    assert.equal(connectedParam(`?sf_connected=${id}`), id);
    assert.equal(connectedParam('?sf_connected=x%3Cscript'), null);
    assert.equal(connectedParam(''), null);
  });
  it('in-app connect returns to the app', () => {
    assert.equal(userConnectURL(id, '/w/acme/apps/report'), `/api/v1/me/snowflake/connections/${id}/oauth/start?return_to=%2Fw%2Facme%2Fapps%2Freport`);
    assert.equal(userConnectURL(id, '//evil.test'), `/api/v1/me/snowflake/connections/${id}/oauth/start`);
  });
  it('workspace connect & test uses the user start route and returns here', () => {
    const u = userConnectAndTestURL(id, '/w/acme/settings/workspace/connections');
    assert.equal(u, `/api/v1/me/snowflake/connections/${id}/oauth/start?return_to=${encodeURIComponent(`/w/acme/settings/workspace/connections?sf_connected=${id}`)}`);
    assert.equal(connectedParam(`?sf_connected=${id}`), id);
  });
});
