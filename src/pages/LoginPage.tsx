import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brand } from '../brand/Logo';
import { DEMO_URL } from '../config';
import './login.css';

const MANIFEST: [key: string, lines: string][] = [
  ['tables', '  orders:\n    columns: [customer, total, status]'],
  ['queries', '  open_orders:\n    from: orders'],
  ['actions', '  approve_order:\n    set: { status: approved }'],
];

// Design skeleton: nothing is submitted anywhere. Real sign-in lives at LOGIN_URL.
export function LoginPage() {
  const [tried, setTried] = useState(false);
  return (
    <div className="lg">
      <main className="lg-main">
        <Link to="/" className="lg-brand" aria-label="Flutics home">
          <Brand height={32} />
        </Link>
        <div className="lg-form">
          <h1>Sign in to your workspace</h1>
          <button type="button" className="lg-btn primary" onClick={() => setTried(true)}>
            Sign in with a passkey
          </button>
          <p className="lg-or">or use your company account</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setTried(true);
            }}
          >
            <label htmlFor="lg-email">Work email</label>
            <input id="lg-email" type="email" autoComplete="off" required />
            <button type="submit" className="lg-btn">
              Continue with SSO
            </button>
          </form>
          <p className="lg-note" role="status">
            {tried ? 'Sign-in isn’t connected in this preview.' : 'Design preview. Nothing you type is sent.'}{' '}
            <Link to={DEMO_URL}>Open the demo</Link>
          </p>
        </div>
      </main>

      <aside className="lg-side" aria-label="Example app manifest">
        <p>One YAML file is the whole app.</p>
        <pre>
          {MANIFEST.map(([key, lines]) => (
            <code key={key}>
              <b>{key}:</b>
              {`\n${lines}\n`}
            </code>
          ))}
        </pre>
      </aside>
    </div>
  );
}
