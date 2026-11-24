import { Link, type LinkProps } from 'react-router-dom';
import { isModifiedClick } from './navclick';

type ShellLinkProps = LinkProps & {
  /** Called after a plain in-app navigation click (not modifier / new-tab). */
  onPlainClick?: () => void;
};

/** Router link with a real href; optional side effect on plain left-click. */
export function ShellLink({ onPlainClick, onClick, ...rest }: ShellLinkProps) {
  return (
    <Link
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented && !isModifiedClick(e)) onPlainClick?.();
      }}
    />
  );
}
