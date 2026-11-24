import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isModifiedClick, onPlainClickNavigate } from './navclick.ts';

function ev(over: Partial<MouseEvent> = {}): MouseEvent {
  return {
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    defaultPrevented: false,
    preventDefault() {
      (this as MouseEvent).defaultPrevented = true;
    },
    ...over,
  } as MouseEvent;
}

describe('isModifiedClick', () => {
  it('is false for plain left click', () => {
    assert.equal(isModifiedClick(ev()), false);
  });
  it('is true for non-primary buttons', () => {
    assert.equal(isModifiedClick(ev({ button: 1 })), true);
  });
  it('is true for modifier keys', () => {
    assert.equal(isModifiedClick(ev({ metaKey: true })), true);
    assert.equal(isModifiedClick(ev({ ctrlKey: true })), true);
    assert.equal(isModifiedClick(ev({ shiftKey: true })), true);
    assert.equal(isModifiedClick(ev({ altKey: true })), true);
  });
});

describe('onPlainClickNavigate', () => {
  it('calls navigate and preventDefault on plain click', () => {
    const e = ev();
    let called = false;
    onPlainClickNavigate(e, () => {
      called = true;
    });
    assert.equal(called, true);
    assert.equal(e.defaultPrevented, true);
  });
  it('skips navigate for modified click', () => {
    const e = ev({ metaKey: true });
    let called = false;
    onPlainClickNavigate(e, () => {
      called = true;
    });
    assert.equal(called, false);
    assert.equal(e.defaultPrevented, false);
  });
});
