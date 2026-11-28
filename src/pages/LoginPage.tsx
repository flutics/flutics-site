import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brand } from '../brand/Logo';
import { DEMO_URL } from '../config';
import './login.css';

const HUB: [title: string, text: string][] = [
  ['Run daily work', 'Sales, stock and billing in one place, working from the same records.'],
  ['See what’s happening', 'Live numbers for your team, without copying them into spreadsheets.'],
  ['Put AI to work', 'Assistants can look things up and take action, with the same permissions as you.'],
];

// Design skeleton: nothing is submitted anywhere. Real sign-in lives at LOGIN_URL.
export function LoginPage() {
  const [tried, setTried] = useState(false);
  return (
    <div className="lg">
      <main className="lg-main">
        <Link to="/" className="lg-brand" aria-label="Flutics home">
          <Brand />
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
            <input id="lg-email" type="email" autoComplete="email" required />
            <button type="submit" className="lg-btn">
              Continue with SSO
            </button>
          </form>
          <p className="lg-note" role="status">
            {tried ? 'Sign-in isn’t connected in this preview.' : 'Design preview. Nothing you type is sent.'}{' '}
            <a href={DEMO_URL}>Open the demo</a>
          </p>
        </div>
      </main>

      <aside className="lg-side" aria-labelledby="lg-pitch">
        <h2 id="lg-pitch">Your company’s digital hub.</h2>
        <p>An AI-first place to run operations and understand your business.</p>
        <ul>
          {HUB.map(([title, text]) => (
            <li key={title}>
              <b>{title}</b>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
