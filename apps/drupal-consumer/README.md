# drupal-consumer (PHP 8.x on Vercel)

True PHP 8.x server-side consumer that mirrors Drupal's preprocess + Twig rendering of the decoupled Next.js navigation.

## How it works

1. Makes **one** server-side HTTP call to `GET {REMOTE_ORIGIN}/api/remote/navigation/{channel}/{experience}/{locale}` (sending `x-vercel-protection-bypass` if configured).
2. Decodes the JSON envelope (`host`, `ssr`, `payload`, `src`) — **zero HTML parsing in PHP**.
3. Outputs:
   - `<script type="module" src="{host.url}" integrity="{host.integrity}" crossorigin="anonymous">`
   - `<template data-remote-component-payload>` for client-side hydration (zero browser call to `/remote/navigation/*`)
   - `<remote-component><template shadowrootmode="open">{ssr}</template></remote-component>` for true SSR & SEO crawlability.

## Local Workspace Setup

1. **Install PHP 8.x (macOS):**
   - With Homebrew: `brew install php`
   - Without Homebrew: install [Laravel Herd](https://herd.laravel.com/) (free macOS `.dmg` with PHP bundled)
2. **Start `content-presentation`** locally (`pnpm --filter content-presentation dev` on `:3000`), or use your deployed Vercel URL as `REMOTE_ORIGIN`.
3. See [`.env.example`](.env.example) for all supported environment variables.

## Start Locally (port 8080)

```bash
# Against local Next.js dev server
REMOTE_ORIGIN=http://localhost:3000 \
  php -S localhost:8080 -t apps/drupal-consumer/api apps/drupal-consumer/api/index.php

# Against a protected Vercel preview deployment
REMOTE_ORIGIN=https://<your-preview>.vercel.app \
VERCEL_AUTOMATION_BYPASS_SECRET=<your-secret> \
  php -S localhost:8080 -t apps/drupal-consumer/api apps/drupal-consumer/api/index.php
```

## Example Routes (`http://localhost:8080`)

| Route | Navigation Flavour |
| --- | --- |
| `/` | `web/general/en-US` (defaults) |
| `/general/en-US` | `web/general/en-US` |
| `/general/zh-Hant` | `web/general/zh-Hant` (Traditional Chinese) |
| `/general/es` | `web/general/es` (Spanish) |
| `/retirement/en-US` | `web/retirement/en-US` (Workplace & Retirement) |
| `/advisorservices/en-US` | `web/advisorservices/en-US` (Advisor Services) |
| `/web/general/en-HK` | Explicit `{channel}/{experience}/{locale}` |

## Deploy to Vercel

1. Push `main` so `content-presentation` serves `/api/remote/navigation/*`.
2. In Vercel: **Add New → Project** → import this repo → set **Root Directory** to `apps/drupal-consumer`.
3. Add `REMOTE_ORIGIN` (e.g. `https://content-presentation.vercel.app`) and optionally `VERCEL_AUTOMATION_BYPASS_SECRET` in **Environment Variables**.
4. Deploy — `vercel.json` configures `vercel-php@0.7.3` and routes all paths to `api/index.php`.

See [docs/remote-navigation.md](../../docs/remote-navigation.md) and [DEPLOYMENT.md](../../DEPLOYMENT.md#3-drupal-consumer-php-8x-on-vercel).
