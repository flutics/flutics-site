import { useEffect, useState } from 'react';
import { Brand } from '../brand/Logo';
import { DEMO_URL, LOGIN_URL, resources, type ResourceLink } from '../config';

function Placeholder({ link }: { link: ResourceLink }) {
  const onClick = (e: React.MouseEvent) => {
    if (link.placeholder) e.preventDefault();
  };
  return (
    <a
      className={`res${link.placeholder ? ' placeholder-link' : ''}`}
      href={link.placeholder ? undefined : link.href}
      aria-disabled={link.placeholder || undefined}
      title={link.placeholder ? link.note : undefined}
      onClick={onClick}
    >
      <span>
        <span className="name">{link.label}</span>
        <div className="meta">{link.placeholder ? link.note : link.href}</div>
      </span>
      {link.placeholder && <span className="ph-tag">URL not final</span>}
    </a>
  );
}

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className={`lnav${scrolled ? ' on' : ''}${open ? ' open' : ''}`}>
        <div className="wrap">
          <a className="brand" href="#top" onClick={() => setOpen(false)} aria-label="Flutics home">
            <Brand />
          </a>
          <nav className="lnav-links" aria-label="Page">
            <a href="#problems" onClick={() => setOpen(false)}>Problems</a>
            <a href="#apps" onClick={() => setOpen(false)}>Apps</a>
            <a href="#agents" onClick={() => setOpen(false)}>Agents</a>
            <a href="#platform" onClick={() => setOpen(false)}>Platform</a>
            <a href="#resources" onClick={() => setOpen(false)}>Resources</a>
          </nav>
          <div className="lnav-cta">
            <a className="signin" href={LOGIN_URL}>Sign in</a>
            <a className="btn primary" href={DEMO_URL} onClick={() => setOpen(false)}>
              Live demo
            </a>
          </div>
          <button className="menu-btn" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <main id="main">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="wrap">
            <div className="hero-copy">
              <p className="eyebrow">Internal operations, in one place</p>
              <h1 id="hero-title">Sales, stock and billing that share the same truth.</h1>
              <p className="lead">
                When a quote becomes an order, parts are reserved and an invoice can be issued — without retyping anything
                into a spreadsheet. Your team works in the apps. ChatGPT, Claude and Grok can run the same queries and
                actions, under the same permissions.
              </p>
              <div className="hero-cta">
                <a className="btn on-dark" href={DEMO_URL}>
                  Open the live demo
                </a>
                <a className="btn ghost-dark" href="#problems">
                  See the problems we solve
                </a>
              </div>
              <p className="hero-note">
                The demo runs entirely in your browser. No account, no server. Fictional company data only.
              </p>
            </div>
            <div className="hero-frame">
              <div className="bar" aria-hidden="true">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
                <span className="url">demo.flutics.com · Alder Light Co. (fictional)</span>
              </div>
              <img
                src="/screens/orders.png"
                width={1600}
                height={900}
                alt="Flutics Sales app showing open orders, reservation state and line status for a fictional lighting manufacturer"
              />
            </div>
          </div>
        </section>

        <section className="section" id="problems" aria-labelledby="problems-title">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">Problems solved</p>
              <h2 id="problems-title">The work is already happening. It just isn’t in one system.</h2>
              <p className="lead">
                Most teams already have a CRM, a stock spreadsheet and a billing tool. The cost is the gap between them —
                and the work that only a person can copy across.
              </p>
            </div>
            <div className="grid g3">
              <article className="card">
                <div className="stepno">01</div>
                <h3>Nobody can say if it can ship.</h3>
                <p>
                  The order lives in the CRM, the bill of materials in a spreadsheet, the invoice in another product.
                  Promised dates slip because reserved parts, assembly and billing are three different conversations.
                </p>
              </article>
              <article className="card">
                <div className="stepno">02</div>
                <h3>Low stock is noticed too late.</h3>
                <p>
                  Purchase drafts are rebuilt by hand after someone notices a shortage. Alerts pile up as duplicates.
                  Receiving goods does not reliably free the next order in line.
                </p>
              </article>
              <article className="card">
                <div className="stepno">03</div>
                <h3>Agents can draft. They can’t do the work.</h3>
                <p>
                  ChatGPT, Claude and Grok can write an email, but they cannot reserve stock or issue an invoice unless
                  those systems expose safe, permissioned tools. Flutics does: every query and action is available over
                  MCP, scoped to the same roles and row-level security as a person.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section alt" id="apps" aria-labelledby="apps-title">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">The v1 apps</p>
              <h2 id="apps-title">Sales, inventory and billing, designed to work as a set.</h2>
              <p className="lead">
                Three apps in one workspace, talking only through versioned contracts — so you can start with sales, add
                stock later, or skip billing until you need it. Screens below are from the v1 design, filled with
                fictional data for a U.S. lighting maker.
              </p>
            </div>
            <div className="grid g3">
              <article className="card app-card">
                <div className="body">
                  <p className="app-kicker">Sales / CRM</p>
                  <h3>From first contact to a delivered line.</h3>
                  <p>
                    Companies and contacts, a pipeline of opportunities, a catalog with bills of materials, quotes and
                    orders. Each order line has a live status: Ordered, Pieces reserved, In assembly, In stock, Shipping,
                    Delivered — computed from the work the other apps actually did, not typed in by hand.
                  </p>
                </div>
                <div className="shot">
                  <img src="/screens/pipeline.png" width={1600} height={1000} alt="Sales pipeline kanban with fictional opportunities and quote values in US dollars" />
                </div>
              </article>
              <article className="card app-card">
                <div className="body">
                  <p className="app-kicker">Inventory + purchasing</p>
                  <h3>Available stock is on hand minus reserved.</h3>
                  <p>
                    An append-only stock ledger. One open alert per item, updated rather than duplicated. Low stock
                    writes a line into a purchase draft for the preferred supplier; a purchasing lead approves before
                    anything is sent. Receiving a purchase order posts the goods and can clear the alert.
                  </p>
                </div>
                <div className="shot">
                  <img src="/screens/inventory.png" width={1600} height={1000} alt="Inventory list showing on-hand, reserved and available quantities, with items below minimum highlighted" />
                </div>
              </article>
              <article className="card app-card">
                <div className="body">
                  <p className="app-kicker">Billing</p>
                  <h3>Invoices that know the order line.</h3>
                  <p>
                    Invoice lines are linked to the sales order line and the product. You can invoice part of an order,
                    record payments, and see billed and paid amounts next to the order itself — in the company’s
                    currency and locale, not a hard-coded format.
                  </p>
                </div>
                <div className="shot">
                  <img src="/screens/billing.png" width={1600} height={1000} alt="Invoice detail linked to a sales order, with installment payments and remaining amount to bill" />
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section" id="agents" aria-labelledby="agents-title">
          <div className="wrap agents">
            <div>
              <p className="eyebrow">Agents doing the work</p>
              <h2 id="agents-title">Your agents use the same tools as your team.</h2>
              <p className="lead" style={{ margin: '16px 0 28px' }}>
                Flutics exposes every app query and action as an MCP tool. An agent can list unanswered conversations,
                draft a quote, or request a reservation — and it cannot do more than the token’s owner is allowed to do.
              </p>
              <div className="agent-list">
                <div>
                  <h3>MCP, per organization</h3>
                  <p>
                    A streamable HTTP MCP server at <code>https://&lt;org&gt;.flutics.com/mcp</code>. The same personal access tokens, the same workspace binding. Connect ChatGPT, Claude or Grok and they see the tools for the apps they may use.
                  </p>
                </div>
                <div>
                  <h3>Permissions stay in Postgres</h3>
                  <p>
                    App-level agent access can be read, all, or none. A single query or action can opt in or out, and a
                    sensitive action can require confirmation before it runs. Tokens are scoped; row-level security and
                    group membership still apply.
                  </p>
                </div>
                <div>
                  <h3>People still approve the irreversible steps</h3>
                  <p>
                    The v1 apps are designed so agents draft — a reply, a quote, a purchase draft, a payment — and a
                    person confirms the send, the reservation, or the payment. Agent calls are written to the audit log
                    and can be filtered.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <div className="code">
                <div className="code-h">mcp.json</div>
                <pre>
                  <code>{`{
  "mcpServers": {
    "flutics": {
      "url": "https://acme.flutics.com/mcp",
      "headers": {
        "Authorization": "Bearer <token>"
      }
    }
  }
}`}</code>
                </pre>
              </div>
              <div className="chips" aria-label="Example MCP tools">
                {['list_workspaces', 'list_apps', 'run_query', 'run_action', 'validate_manifest', 'publish_app'].map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>
              <p className="hero-note" style={{ color: 'var(--muted)', marginTop: 14 }}>
                Each organization has its own host and MCP endpoint, for example https://acme.flutics.com/mcp. Tokens are never shown in this demo.
              </p>
            </div>
          </div>
        </section>

        <section className="section alt" id="platform" aria-labelledby="platform-title">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">The platform</p>
              <h2 id="platform-title">Apps as a manifest, governed by Postgres.</h2>
              <p className="lead">
                Flutics is the app platform the v1 suite runs on. A builder writes a YAML manifest and a React screen;
                the server migrates the schema, enforces security, and serves the app in one shell.
              </p>
            </div>
            <div className="tech-grid">
              <article className="card tech-item">
                <h3>Manifest apps</h3>
                <p>
                  Tables, parameterized SQL queries, actions, and data-sharing contracts in a YAML manifest, plus a
                  small React UI. Apps run in sandboxed iframes on a separate origin, inside one catalog with tabs and a
                  command palette.
                </p>
              </article>
              <article className="card tech-item">
                <h3>Postgres and row-level security</h3>
                <p>
                  Each app gets its own schema and database role. Every query runs as the signed-in user. Policies use
                  the current user and group membership. A bug in a screen cannot return rows the policy forbids.
                </p>
              </article>
              <article className="card tech-item">
                <h3>RBAC, SSO and SCIM</h3>
                <p>
                  Workspace roles (Owner, Admin, Builder, Member, Viewer) plus custom roles bound to groups. OpenID
                  Connect with PKCE, optional “require SSO”, and SCIM provisioning from a directory such as Entra ID or
                  Okta.
                </p>
              </article>
              <article className="card tech-item">
                <h3>Self-host with Docker</h3>
                <p>
                  A Go server and Postgres, typically one container in front of your database. There is no per-seat fee
                  to self-host. Guides cover a VPS with Docker Compose, AWS, Render, and other platforms. Hosted Flutics
                  Cloud is being planned; pricing is not published yet.
                </p>
              </article>
              <article className="card tech-item">
                <h3>SDK and CLI</h3>
                <p>
                  An SDK for the React screens, and a CLI to log in, scaffold an app, publish with a dry-run, and run
                  queries. Each publish can record the git commit, branch and origin. A skill file teaches coding agents
                  the manifest format and the sharing rules.
                </p>
              </article>
              <article className="card tech-item">
                <h3>MCP, events and contracts</h3>
                <p>
                  Each organization serves MCP at <code>https://&lt;org&gt;.flutics.com/mcp</code>. Apps share data only through versioned view and action contracts —
                  never by joining another app’s tables. Publishes and actions land in an event log; outbound webhooks
                  are signed. BI stays with your own queries on Postgres, not a separate reporting product.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section" id="resources" aria-labelledby="resources-title">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">Resources</p>
              <h2 id="resources-title">Docs, self-hosting, SDK and MCP.</h2>
              <p className="lead">
                Public documentation URLs are not final. They are listed here as placeholders so the structure is
                obvious; the live demo is available now.
              </p>
            </div>
            <div className="res-list">
              {resources.map((r) => (
                <Placeholder key={r.label} link={r} />
              ))}
              <a className="res" href={DEMO_URL}>
                <span>
                  <span className="name">Live demo</span>
                  <div className="meta">Runs in the browser, no server · demo.flutics.com</div>
                </span>
              </a>
            </div>
          </div>
        </section>

        <section className="cta-band" aria-labelledby="cta-title">
          <div className="wrap">
            <h2 id="cta-title">Try it with fictional data, in this browser.</h2>
            <p className="lead">
              Create a quote, receive a purchase order, issue an invoice. Reset the demo whenever you want a clean
              company again.
            </p>
            <div className="hero-cta">
              <a className="btn on-dark" href={DEMO_URL}>
                Open the live demo
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="lfoot">
        <div className="wrap">
          <div className="lfoot-grid">
            <div>
              <a className="brand" href="#top" aria-label="Flutics home">
                <Brand />
              </a>
              <p className="fine">
                Internal apps for operations, governed by Postgres, with agents that can do the work.
              </p>
            </div>
            <div>
              <h4>Product</h4>
              <nav>
                <a href="#apps">Apps</a>
                <a href="#agents">Agents</a>
                <a href="#platform">Platform</a>
                <a href={DEMO_URL}>Live demo</a>
                <a href={LOGIN_URL}>Sign in</a>
              </nav>
            </div>
            <div>
              <h4>Resources</h4>
              <nav>
                {resources.map((r) => (
                  <span key={r.label} style={{ color: 'var(--muted)' }} title={r.note}>
                    {r.label}
                    {r.placeholder ? ' (URL not final)' : ''}
                  </span>
                ))}
              </nav>
            </div>
          </div>
          <div className="lfoot-base">
            <span>© {new Date().getFullYear()} Flutics</span>
            <span>No prices or customer claims are shown here because none have been published.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
