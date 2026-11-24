# Flutics marketing site and browser demo

Two static Vite + React sites in one repo:

| Site | URL | Build command | Output |
|---|---|---|---|
| Marketing | https://flutics.com | `npm run build:www` | `site-output/www` |
| Live demo | https://demo.flutics.com | `npm run build:demo` | `site-output/demo` |

`npm run build` produces both. Do not deploy `site-output/` from this machine; connect the repo to Cloudflare Pages (see below).

## Local preview

```bash
npm install
npm run dev          # marketing, http://127.0.0.1:5173
npm run dev:demo     # demo,      http://127.0.0.1:5174
npm run build
npm run preview      # marketing build, :4173
npm run preview:demo # demo build,      :4174
```

Unknown paths must fall back to `index.html` (SPA). `public/_redirects` and `public/_headers` are copied into each build for Cloudflare Pages.

## Cloudflare Pages (two projects, same repo)

Create **two** Pages projects from this repository. Do not start a deploy until the custom domains are ready.

**Project 1 — flutics.com**
- Production branch: `main`
- Build command: `npm run build:www`
- Build output directory: `site-output/www`
- Custom domain: `flutics.com` (and `www.flutics.com` if you want it)

**Project 2 — demo.flutics.com**
- Production branch: `main`
- Build command: `npm run build:demo`
- Build output directory: `site-output/demo`
- Custom domain: `demo.flutics.com`

Root directory: repository root (leave empty). Node version: 20 or newer.

Other hosts, not part of this repo: `docs.flutics.com` (documentation), `login.flutics.com` (sign-in), and `https://<org>.flutics.com` for each organization (MCP at `https://<org>.flutics.com/mcp`).

## Demo

The demo runs Postgres in the browser with [PGlite](https://pglite.dev/), persisted to IndexedDB (`idb://flutics-demo`). Seed data is the fictional U.S. lighting company **Alder Light Co.** (USD). You can create a quote, receive a purchase order, issue an invoice, drag a pipeline card, and use **Reset demo** to reseed.

It is a working shell, not the product: no sandboxed iframes, no YAML manifests at runtime, no SSO, no row-level security or MCP in the browser. Shipping, payment recording and PDFs are out of scope.

## Copy rules

English (en-US) throughout. No prices, testimonials, or customer logos. Say “BI”, not analytics. No email addresses in marketing copy. Fictional demo data only.
