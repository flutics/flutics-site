import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseSSOEmailDomains } from './ssoDomains.ts';

describe('parseSSOEmailDomains', () => {
  it('splits on newlines, commas, and spaces', () => {
    assert.deepEqual(parseSSOEmailDomains('example.com\nexample.org, third.test  fourth.test'), [
      'example.com',
      'example.org',
      'third.test',
      'fourth.test',
    ]);
  });

  it('strips @ and dedupes', () => {
    assert.deepEqual(parseSSOEmailDomains('@Example.COM\nexample.com'), ['example.com']);
  });
});
