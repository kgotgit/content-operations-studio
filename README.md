# content-operations-studio

Monorepo for a headless, multi-experience navigation engine powered by **Sanity Studio** and **Next.js (App Router)**, with server-rendered **Declarative Shadow DOM** delivery to non-Next.js hosts (**Drupal/PHP** and **ASP.NET Core 8**).

## Apps & Packages

| Path | Runtime / Stack | What it does | README |
| --- | --- | --- | --- |
| `apps/content-presentation` | Next.js 16, React 19, Tailwind v4 | Native navigation pages, `/remote/navigation/*` fragments, `/api/remote/navigation/*` JSON envelope, prebuilt ESM host bundle, `/drupal-preview` | [README](apps/content-presentation/README.md) |
| `apps/content-studio` | Sanity Studio v6 | Authoring desk organized by Channel → Experience → Locale (canonical `en-US` + Smartling mock translations) | [README](apps/content-studio/README.md) |
| `apps/drupal-consumer` | PHP 8.x (`vercel-php`) | True PHP server-side consumer (Vercel-ready) — 1 JSON fetch, zero HTML parsing, Declarative Shadow DOM SSR | [README](apps/drupal-consumer/README.md) |
| `apps/dotnet-consumer` | ASP.NET Core 8 (C#) | True .NET server-side consumer with `IMemoryCache` + `Dockerfile` — 1 JSON fetch, zero HTML parsing, Declarative Shadow DOM SSR | [README](apps/dotnet-consumer/README.md) |
| `packages/navigation-*` | TypeScript | Shared `navigation-contract` (Zod/enums), `navigation-sanity` (GROQ/client), `navigation-adapters` (domain URLs), `navigation-ui` (React header/mega menu) | — |

## Documentation

- [Remote navigation: server-rendered delivery to non-Next.js hosts](docs/remote-navigation.md) — architecture, host bundle, payload hook, Declarative Shadow DOM, PHP/.NET setup, caching, SEO
- [Deploying to Vercel](DEPLOYMENT.md) — multi-project Vercel setup, env variables, Deployment Protection bypass, Sanity CORS & webhooks
- [Task specification](prompt.md)

---

## Local Workspace Setup

### 1. Install Node workspace dependencies (Node ≥ 20.9, pnpm 10)
```bash
pnpm install
```

### 2. Configure local environment files
```bash
cp apps/content-presentation/.env.example apps/content-presentation/.env.local
cp apps/content-studio/.env.example apps/content-studio/.env
```
Fill in your Sanity project ID and dataset (e.g. `dev`), plus a random `REVALIDATION_SECRET` in `apps/content-presentation/.env.local`.

### 3. Start the apps

Run each app in its own terminal (or run the Next.js + Studio apps together with `pnpm dev`):

```bash
# 1. Next.js presentation & remote navigation host (port 3000)
pnpm --filter content-presentation dev

# 2. Sanity Studio CMS (port 3333)
pnpm --filter content-studio dev

# 3. PHP / Drupal consumer (port 8080 — requires PHP 8.x; see apps/drupal-consumer/README.md)
REMOTE_ORIGIN=http://localhost:3000 \
  php -S localhost:8080 -t apps/drupal-consumer/api apps/drupal-consumer/api/index.php

# 4. ASP.NET Core 8 consumer (port 5080 — requires .NET 8 SDK; see apps/dotnet-consumer/README.md)
cd apps/dotnet-consumer && REMOTE_ORIGIN=http://localhost:3000 dotnet run --urls http://localhost:5080
```

---

## Example Routes

| App | Example URL | Description |
| --- | --- | --- |
| `content-presentation` | `http://localhost:3000/en-US/general` | Native Next.js page (General, `en-US`) |
| `content-presentation` | `http://localhost:3000/zh-Hant/general` | Native Next.js page (General, Traditional Chinese) |
| `content-presentation` | `http://localhost:3000/en-US/retirement` | Native Next.js page (Workplace & Retirement) |
| `content-presentation` | `http://localhost:3000/remote/navigation/web/general/en-US` | Raw remote component fragment (`noindex, follow`) |
| `content-presentation` | `http://localhost:3000/api/remote/navigation/web/general/zh-Hant` | Single-fetch JSON envelope (`host` + `ssr` + `payload`) |
| `content-presentation` | `http://localhost:3000/drupal-pages/index.html` | Simulated CMS page (all 4 flavours, DSD + zero client fetch) |
| `content-presentation` | `http://localhost:3000/drupal-preview/web/general/zh-Hant` | Simulated CMS page (single flavour, SEO-ready) |
| `content-studio` | `http://localhost:3333` | Sanity Studio authoring desk |
| `drupal-consumer` (PHP) | `http://localhost:8080/general/zh-Hant` | True PHP consumer rendering `web/general/zh-Hant` |
| `drupal-consumer` (PHP) | `http://localhost:8080/retirement/en-US` | True PHP consumer rendering `web/retirement/en-US` |
| `dotnet-consumer` (.NET) | `http://localhost:5080/general/zh-Hant` | True ASP.NET Core 8 consumer rendering `web/general/zh-Hant` |
| `dotnet-consumer` (.NET) | `http://localhost:5080/health` | .NET health & runtime status JSON |
