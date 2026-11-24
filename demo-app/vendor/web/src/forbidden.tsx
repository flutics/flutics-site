import { useShell } from './shell';
import { ShellLink } from './shelllink';

export function Forbidden() {
  const { path } = useShell();
  return (
    <div className="pg">
      <div className="empty" style={{ maxWidth: 420, margin: '48px auto' }}>
        <h2 style={{ marginBottom: 8, color: 'var(--tx)' }}>403</h2>
        <p>You don’t have permission to view this page.</p>
        <ShellLink className="btn" style={{ marginTop: 16 }} to={path('home')}>
          Back to home
        </ShellLink>
      </div>
    </div>
  );
}
