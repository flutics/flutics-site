/** True when the browser should handle navigation (new tab, etc.) without client routing. */
export function isModifiedClick(
  e: Pick<MouseEvent, 'button' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>,
): boolean {
  return e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
}

/** Run `navigate` only for a plain primary-button click; leave modified / middle clicks to the browser. */
type ClickLike = Pick<MouseEvent, 'button' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'defaultPrevented'> & {
  preventDefault(): void;
};

export function onPlainClickNavigate(e: ClickLike, navigate: () => void): void {
  if (e.defaultPrevented || isModifiedClick(e)) return;
  e.preventDefault();
  navigate();
}
