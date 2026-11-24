import { useEffect, useState } from 'react';

// Debug mode is a per-browser developer switch. When it is on, the app view
// shows the frame chrome: content-origin URL bar, sandbox and toolchain tags,
// bridge status, last SDK call and the session token countdown. When it is off,
// the app fills the content area edge to edge.
//
// Turn it on in Settings > Appearance, or with ?debug=1 on any shell URL
// (?debug=0 turns it off). The value is kept in localStorage.
const KEY = 'meadow-debug';
const EVT = 'meadow:debug';

function fromQuery(): boolean | null {
  const q = new URLSearchParams(window.location.search).get('debug');
  if (q === null) return null;
  return q !== '0' && q !== 'false' && q !== 'off';
}

function store(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    // Storage blocked: the value still applies to this page load.
  }
}

export function readDebug(): boolean {
  const q = fromQuery();
  if (q !== null) {
    store(q);
    return q;
  }
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function setDebug(on: boolean) {
  store(on);
  window.dispatchEvent(new Event(EVT));
}

export function useDebug(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(readDebug);
  useEffect(() => {
    const sync = () => setOn(readDebug());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) sync();
    };
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return [on, setDebug];
}
