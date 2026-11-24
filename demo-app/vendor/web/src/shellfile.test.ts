import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { handleAppFileMessage, isTrustedDeliveryUrl } from './shellfile.ts';

const origin = 'https://meadow.example.com';
const good =
  'https://meadow.example.com/api/v1/rt/deliveries/550e8400-e29b-41d4-a716-446655440000?exp=1&disp=attachment&sig=abc';

describe('isTrustedDeliveryUrl', () => {
  it('accepts signed delivery URLs on the shell origin', () => {
    assert.equal(isTrustedDeliveryUrl(good, origin), true);
  });
  it('rejects foreign origins', () => {
    assert.equal(isTrustedDeliveryUrl(good.replace('meadow.example.com', 'evil.test'), origin), false);
  });
  it('rejects missing signature params', () => {
    assert.equal(
      isTrustedDeliveryUrl('https://meadow.example.com/api/v1/rt/deliveries/550e8400-e29b-41d4-a716-446655440000', origin),
      false,
    );
  });
});

describe('handleAppFileMessage', () => {
  it('ignores messages from the wrong origin path', () => {
    assert.equal(handleAppFileMessage({ type: 'meadow:file-save', url: 'https://evil.test/x' }, origin), false);
  });
});
