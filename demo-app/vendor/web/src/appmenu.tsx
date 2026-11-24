import type { MenuProps } from 'antd';
import { Dropdown } from 'antd';
import { I } from './icons';
import type { AppChrome } from './appchrome';

export function appMenuItems(
  chrome: AppChrome,
  opts: { fav: boolean; onPin: () => void; inFocus: boolean },
): MenuProps['items'] {
  const { fav, onPin, inFocus } = opts;
  return [
    { key: 'who', label: `${chrome.name} · v${chrome.version}`, disabled: true },
    { type: 'divider' },
    { key: 'pin', icon: <I n="pin" />, label: fav ? 'Unpin from sidebar' : 'Pin to sidebar', onClick: onPin },
    { key: 'manifest', icon: <I n="code" />, label: 'Manifest', onClick: () => chrome.openManifest() },
    { key: 'reload', icon: <I n="sync" />, label: 'Reload app', onClick: () => chrome.reload() },
    { type: 'divider' },
    inFocus
      ? {
          key: 'exit-focus',
          icon: <I n="arrow" />,
          label: <a href={chrome.shellHref}>Exit focus mode</a>,
        }
      : {
          key: 'focus',
          icon: <I n="ext" />,
          label: (
            <a href={chrome.focusHref} target="_blank" rel="noopener noreferrer">
              Open in focus mode
            </a>
          ),
        },
  ];
}

export function AppMenuButton({
  chrome,
  fav,
  onPin,
  inFocus,
  className,
  title = 'App actions',
}: {
  chrome: AppChrome;
  fav: boolean;
  onPin: () => void;
  inFocus: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      menu={{ items: appMenuItems(chrome, { fav, onPin, inFocus }) }}
    >
      <button type="button" className={className || 'ib'} title={title} aria-label={title}>
        <I n="more" />
      </button>
    </Dropdown>
  );
}
