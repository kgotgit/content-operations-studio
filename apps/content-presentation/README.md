# content-presentation (Next.js App Router)

Next.js 16 application that serves:
1. Native multi-experience / multi-locale pages (`/[locale]/[experience]`).
2. Decoupled remote navigation fragments (`/remote/navigation/[channel]/[experience]/[locale]`).
3. The prebuilt, content-hashed `remote-components` ESM host bundle (`/remote-host/*`).
4. The single-fetch JSON envelope API (`/api/remote/navigation/[channel]/[experience]/[locale]`) consumed by PHP and .NET apps.
5. Runtime-rendered CMS preview pages (`/drupal-preview/*` and `/drupal-pages/*.html`).

## Local Workspace Setup

1. Install dependencies from the **monorepo root**:
   ```bash
   pnpm install
   ```
2. Create `.env.local` from the template:
   ```bash
   cp apps/content-presentation/.env.example apps/content-presentation/.env.local
   ```
   Set `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET` (e.g. `dev`), and `REVALIDATION_SECRET` (e.g. `openssl rand -hex 32`).

## Start & Build Commands

Run from the monorepo root (or inside `apps/content-presentation`):

```bash
pnpm --filter content-presentation dev                      # builds host bundle, then starts next dev on :3000
pnpm --filter content-presentation build                    # builds host bundle, then production next build
pnpm --filter content-presentation start                    # serves the production build on :3000
pnpm --filter content-presentation build:remote-host        # rebuilds public/remote-host/* + manifest.json only
pnpm --filter content-presentation generate:payload-pages   # generates static HTML snapshots into dist-drupal-pages/
```

## Example Routes (`http://localhost:3000`)

| Route | Purpose |
| --- | --- |
| `/en-US/general` | Native Next.js page — Personal / Investing (`en-US`) |
| `/zh-Hant/general` | Native Next.js page — Personal / Investing (`zh-Hant`) |
| `/es/general` | Native Next.js page — Personal / Investing (`es`) |
| `/en-US/retirement` | Native Next.js page — Workplace & Retirement |
| `/en-US/advisorservices` | Native Next.js page — Advisor Services |
| `/remote/navigation/web/general/en-US` | Raw `<ExposeRemoteComponent>` HTML/RSC fragment (`noindex, follow`) |
| `/api/remote/navigation/web/general/zh-Hant` | Single-fetch JSON envelope (`host`, `ssr`, `payload`) for PHP / .NET consumers |
| `/remote-host/manifest.json` | Host bundle manifest (version, content-hashed filename, SRI integrity, prod/dev variants) |
| `/drupal-pages/index.html` | Runtime-rendered CMS preview with all 4 default flavours |
| `/drupal-pages/web-general-zh-Hant.html` | Runtime-rendered CMS preview (single flavour; alias for `/drupal-preview/web/general/zh-Hant`) |
| `POST /api/revalidate` | On-demand Sanity/Smartling cache invalidation (`Authorization: Bearer <REVALIDATION_SECRET>`) |

## Docs & Deployment

- Full architecture: [docs/remote-navigation.md](../../docs/remote-navigation.md)
- Vercel setup & env vars: [DEPLOYMENT.md](../../DEPLOYMENT.md)
