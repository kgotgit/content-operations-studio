# dotnet-consumer (ASP.NET Core 8)

True C# / ASP.NET Core 8 server-side consumer demonstrating how an enterprise .NET web app embeds the decoupled Next.js navigation with **zero HTML parsing** and **zero client-side calls** to `/remote/navigation/*`.

## How it works

1. `IHttpClientFactory` makes **one** server-side HTTP call to `GET {REMOTE_ORIGIN}/api/remote/navigation/{channel}/{experience}/{locale}` (sending `x-vercel-protection-bypass` if configured).
2. Deserializes the JSON envelope into a strongly-typed `RemoteNavEnvelope` record and caches it in `IMemoryCache` (default 5 minutes).
3. Renders full SEO-friendly HTML with:
   - `<script type="module" src="{host.url}" integrity="{host.integrity}" crossorigin="anonymous">`
   - `<template data-remote-component-payload>` for client-side hydration
   - `<remote-component><template shadowrootmode="open">{ssr}</template></remote-component>` for true SSR & SEO crawlability.

## Routes

- `/` → `web/general/en-US`
- `/{experience}/{locale}` → e.g. `/general/zh-Hant`, `/retirement/en-US`, `/advisorservices/en-US`
- `/{channel}/{experience}/{locale}` → e.g. `/web/general/es`
- `/health` → JSON health check

## Run locally (.NET 8 SDK)

```bash
cd apps/dotnet-consumer
REMOTE_ORIGIN=http://localhost:3000 dotnet run --urls http://localhost:5080
```

## Hosting / Deployment

Vercel does not provide a native ASP.NET Core runtime (unlike PHP via `vercel-php`). Deploy this app using the included multi-stage `Dockerfile` to **Azure Container Apps**, **Azure App Service**, **Fly.io**, **Render**, or **Google Cloud Run**:

```bash
docker build -t dotnet-consumer apps/dotnet-consumer
docker run -p 8080:8080 -e REMOTE_ORIGIN=https://content-presentation.vercel.app dotnet-consumer
```
