# drupal-consumer (PHP 8.x on Vercel)

True PHP server-side consumer that mirrors Drupal's preprocess + Twig rendering of the decoupled Next.js navigation.

## How it works

1. Makes **one** server-side HTTP call to `GET {REMOTE_ORIGIN}/api/remote/navigation/{channel}/{experience}/{locale}` (passing `x-vercel-protection-bypass` if configured).
2. Decodes the JSON envelope (`host`, `ssr`, `payload`, `src`) — **zero HTML parsing in PHP**.
3. Outputs:
   - `<script type="module" src="{host.url}" integrity="{host.integrity}" crossorigin="anonymous">`
   - `<template data-remote-component-payload>` for client-side hydration (zero browser call to `/remote/navigation/*`)
   - `<remote-component><template shadowrootmode="open">{ssr}</template></remote-component>` for true SSR & SEO crawlability.

## Routes

- `/` → `web/general/en-US`
- `/{experience}/{locale}` → e.g. `/general/zh-Hant`, `/retirement/en-US`, `/advisorservices/en-US`
- `/{channel}/{experience}/{locale}` → e.g. `/web/general/es`

## Deploy to Vercel

1. **Add New → Project** in Vercel, import this repo, set **Root Directory** to `apps/drupal-consumer`.
2. Set `REMOTE_ORIGIN` (e.g. `https://content-presentation.vercel.app`) and optionally `VERCEL_AUTOMATION_BYPASS_SECRET`.
3. Deploy — `vercel.json` configures the `vercel-php@0.7.3` serverless runtime automatically.

## Run locally

```bash
REMOTE_ORIGIN=http://localhost:3000 php -S localhost:8080 -t apps/drupal-consumer/api apps/drupal-consumer/api/index.php
```
