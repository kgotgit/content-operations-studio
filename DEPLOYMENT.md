# Deploying to Vercel

This monorepo deploys as **two Vercel projects** from the same Git repository:

| Vercel project | Root Directory | Framework | Output |
| --- | --- | --- | --- |
| `content-presentation` | `apps/content-presentation` | Next.js | Next.js build (remote navigation, payload host bundle, drupal-preview) |
| `content-studio` | `apps/content-studio` | Other (static, `framework: null`) | `dist/` (Sanity Studio SPA) |

Each app has a `vercel.json` with install/build settings. Vercel detects pnpm from
`packageManager` (`pnpm@10.20.0`) in the root `package.json`, and installs the whole
workspace so `packages/*` resolve.

> [!IMPORTANT]
> In both projects, keep **Settings → Build & Deployment → Root Directory → "Include files outside the root directory"** enabled (the default). The apps import the workspace packages in `packages/`.

---

## 1. content-presentation (Next.js)

### Create the project
```bash
cd apps/content-presentation
vercel link          # pick/create the "content-presentation" project
vercel env pull .env.local   # optional: pull configured env for local dev
```
Or, in the dashboard: **Add New → Project → import the repo → Root Directory `apps/content-presentation`**.

`pnpm run build` runs `scripts/build-remote-host.mjs` first, which writes
`public/remote-host/` (content-hashed host bundle + `manifest.json`), then `next build`.

### Environment variables
See [`apps/content-presentation/.env.example`](apps/content-presentation/.env.example) for the full list.

| Variable | Required | Scope | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | yes | all | Sanity project |
| `NEXT_PUBLIC_SANITY_DATASET` | yes | all | e.g. `production` (Prod), `dev` (Preview) |
| `NEXT_PUBLIC_SANITY_API_VERSION` | no | all | default `2024-01-01` |
| `SANITY_API_READ_TOKEN` | private datasets | all | server-only Viewer token |
| `REVALIDATION_SECRET` | **yes** | all | `/api/revalidate` returns 500 without it |
| `NEXT_PUBLIC_SITE_URL` | no | Production | canonical origin; falls back to Vercel system URLs |
| `NEXT_PUBLIC_GENERAL_DOMAIN` / `_RETIREMENT_` / `_ADVISOR_` | yes for Drupal | all | absolutize links inside the remote component |
| `REMOTE_CORS_ALLOW_ORIGIN` | no | all | `*` or the Drupal origin |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | when protection is on | Preview (+Prod if protected) | see below |
| `REMOTE_ORIGIN`, `REMOTE_PUBLIC_ORIGIN`, `REMOTE_ASSET_ORIGIN`, `REMOTE_FLAVOURS` | no | all | payload pages; defaults to this deployment |

Enable **Settings → Environment Variables → "Automatically expose System Environment Variables"**
so `VERCEL_URL`, `VERCEL_ENV` and `VERCEL_PROJECT_PRODUCTION_URL` are available.

```bash
# Example: set from the CLI
openssl rand -hex 32 | vercel env add REVALIDATION_SECRET production
vercel env add NEXT_PUBLIC_SANITY_DATASET production   # → production
vercel env add NEXT_PUBLIC_SANITY_DATASET preview      # → dev
```

### Vercel Deployment Protection and the bypass token
Preview deployments are protected by default (Vercel Authentication). Browsers with a Vercel
login get through, but **server-to-server** calls don't, for example:
- the `/drupal-preview` route fetching its own `/remote/navigation/*` payload,
- `generate-remote-payload-pages.mjs` run in CI against a preview URL,
- Drupal PHP fetching the payload from a protected deployment,
- the `remote-components` library's own server-side fetches.

Fix: **Settings → Deployment Protection → Protection Bypass for Automation → Add secret**.
Vercel then injects `VERCEL_AUTOMATION_BYPASS_SECRET` into deployments automatically. Our code
and the library send it as the `x-vercel-protection-bypass` header.

> [!CAUTION]
> The bypass secret is for **server-side** callers only. Never put it in HTML or client JavaScript.
> Keep the **production** deployment that Drupal and end users hit unprotected (the default "Standard Protection" protects previews only). Otherwise browsers can't load `/remote-host/*` and `/_next/static/*`.

Drupal (PHP) example:
```php
$response = \Drupal::httpClient()->get($remote_origin . '/remote/navigation/web/general/en-US', [
  'headers' => array_filter([
    'Accept' => 'text/html',
    'x-vercel-protection-bypass' => getenv('VERCEL_AUTOMATION_BYPASS_SECRET') ?: NULL,
  ]),
  'timeout' => 3,
]);
```

### Payload pages on Vercel
The static generator needs a running remote, so it can't run inside `next build`. On Vercel the
same pages are rendered on request by `app/drupal-preview/[[...flavour]]/route.ts`:

- `https://<deployment>/drupal-pages/index.html` (or `/drupal-preview`) shows all flavours
- `https://<deployment>/drupal-pages/web-general-zh-Hant.html` (or `/drupal-preview/web/general/zh-Hant`) shows a single flavour

The `/drupal-pages/*.html` URLs are `beforeFiles` rewrites in `next.config.ts`, so nothing is
generated during the build and nothing depends on a previous deployment. `public/drupal-pages/`
is gitignored and should stay empty.

By default it fetches payloads from **its own deployment**, so the payload's `/_next/static/*`
chunk hashes always match. Responses are CDN-cached for 5 minutes (`s-maxage=300`).

To produce static files against a deployed remote (e.g. for Drupal QA), run the CLI:
```bash
cd apps/content-presentation
REMOTE_ORIGIN=https://content-presentation-git-main-<team>.vercel.app \
VERCEL_AUTOMATION_BYPASS_SECRET=<secret> \
REMOTE_ASSET_ORIGIN=https://content-presentation-git-main-<team>.vercel.app \
pnpm generate:payload-pages            # writes dist-drupal-pages/ (gitignored)
```

> [!WARNING]
> A payload is tied to the deployment it was fetched from (chunk hashes + React build). Drupal
> must re-fetch payloads after each production deploy: key its cache on `manifest.json`'s
> `sha256`/`gitSha`, or purge on deploy. Vercel **Skew Protection** (Settings → Advanced) keeps
> old deployment assets available during the transition.

### Webhook (Sanity → revalidate)
Sanity Manage → API → Webhooks → **Create webhook**
- URL: `https://<production-domain>/api/revalidate`
- Trigger on: create / update / delete, filter `_type == "navigationMenu"`
- Projection: `{ channel, experience, locale }`
- HTTP header: `Authorization: Bearer <REVALIDATION_SECRET>`

---

## 2. content-studio (Sanity Studio)

### Create the project
Dashboard: **Add New → Project → import the repo → Root Directory `apps/content-studio`**.
`vercel.json` sets `framework: null` (needed: `next` is a dependency, so auto-detection would
choose Next.js), `buildCommand: pnpm run build` (`sanity build`), `outputDirectory: dist`, and
an SPA rewrite to `/index.html`.

### Environment variables
See [`apps/content-studio/.env.example`](apps/content-studio/.env.example). Only `SANITY_STUDIO_*`
variables reach the Studio, and they're inlined at build time.

| Variable | Required | Notes |
| --- | --- | --- |
| `SANITY_STUDIO_PROJECT_ID` | yes | |
| `SANITY_STUDIO_DATASET` | yes | `production` (Prod) / `dev` (Preview) |
| `SANITY_STUDIO_CLI_DATASET` | no | defaults to dataset |
| `SANITY_STUDIO_WORKFLOW_TAG`, `_WORKFLOW_DEV_DATASET`, `_WORKFLOW_PROD_DATASET` | no | workflow engine |

> [!CAUTION]
> Never add API write tokens as `SANITY_STUDIO_*` variables. They'd be shipped in public JavaScript. Studio users authenticate with their own Sanity login.

### Sanity CORS (required)
Sanity Manage → API → **CORS origins → Add**, with **Allow credentials** checked, for:
- `https://<studio-production-domain>`
- `https://*-<team>.vercel.app` (or each preview domain) for preview deployments
- `http://localhost:3333` for local dev

Without this, the deployed Studio can't log in or query the dataset.

---

## 3. Seeding data
```bash
SANITY_PROJECT_ID=he21d3pg SANITY_DATASET=production SANITY_AUTH_TOKEN=<editor-token> pnpm seed:nav
```
Run locally or in CI. `SANITY_AUTH_TOKEN` is a write token: never add it to a Vercel project.
