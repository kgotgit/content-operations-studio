# dotnet-consumer (ASP.NET Core 8)

True C# / ASP.NET Core 8 server-side consumer demonstrating how an enterprise .NET web app embeds the decoupled Next.js navigation with **zero HTML parsing** and **zero client-side calls** to `/remote/navigation/*`.

## How it works

1. `IHttpClientFactory` makes **one** server-side HTTP call to `GET {REMOTE_ORIGIN}/api/remote/navigation/{channel}/{experience}/{locale}` (sending `x-vercel-protection-bypass` if configured).
2. Deserializes the JSON envelope into a strongly-typed `RemoteNavEnvelope` record and caches it in `IMemoryCache` (default 5 minutes).
3. Renders full SEO-friendly HTML with:
   - `<script type="module" src="{host.url}" integrity="{host.integrity}" crossorigin="anonymous">`
   - `<template data-remote-component-payload>` for client-side hydration
   - `<remote-component><template shadowrootmode="open">{ssr}</template></remote-component>` for true SSR & SEO crawlability.

## Local Workspace Setup

1. **Install .NET 8 SDK (macOS):**
   - Without Homebrew (no `sudo`):
     ```bash
     curl -sSL https://dot.net/v1/dotnet-install.sh | bash /dev/stdin --channel 8.0
     export PATH="$HOME/.dotnet:$PATH"
     ```
     *(Or download the macOS Arm64 `.pkg` from [dotnet.microsoft.com/download/dotnet/8.0](https://dotnet.microsoft.com/download/dotnet/8.0).)*
   - With Homebrew: `brew install --cask dotnet-sdk`
2. **Start `content-presentation`** locally (`pnpm --filter content-presentation dev` on `:3000`), or use your deployed Vercel URL as `REMOTE_ORIGIN`.
3. See [`.env.example`](.env.example) and [`appsettings.json`](appsettings.json) for configuration.

## Start Locally (port 5080)

```bash
cd apps/dotnet-consumer
REMOTE_ORIGIN=http://localhost:3000 dotnet run --urls http://localhost:5080
```

Against a protected Vercel preview:
```bash
cd apps/dotnet-consumer
REMOTE_ORIGIN=https://<your-preview>.vercel.app \
VERCEL_AUTOMATION_BYPASS_SECRET=<your-secret> \
  dotnet run --urls http://localhost:5080
```

## Example Routes (`http://localhost:5080`)

| Route | Navigation Flavour / Purpose |
| --- | --- |
| `/` | `web/general/en-US` (defaults) |
| `/general/en-US` | `web/general/en-US` |
| `/general/zh-Hant` | `web/general/zh-Hant` (Traditional Chinese) |
| `/general/es` | `web/general/es` (Spanish) |
| `/retirement/en-US` | `web/retirement/en-US` (Workplace & Retirement) |
| `/advisorservices/en-US` | `web/advisorservices/en-US` (Advisor Services) |
| `/web/general/en-HK` | Explicit `{channel}/{experience}/{locale}` |
| `/health` | JSON health check (`runtime`, `remoteOrigin`, `cacheTtlSeconds`) |

## Hosting / Deployment (Docker)

Vercel does not provide a native ASP.NET Core runtime (unlike PHP via `vercel-php`). Deploy this app using the included multi-stage `Dockerfile` to **Azure Container Apps**, **Azure App Service**, **Fly.io**, **Render**, or **Google Cloud Run**:

```bash
docker build -t dotnet-consumer apps/dotnet-consumer
docker run -p 5080:8080 -e REMOTE_ORIGIN=https://content-presentation.vercel.app dotnet-consumer
```

See [docs/remote-navigation.md](../../docs/remote-navigation.md) and [DEPLOYMENT.md](../../DEPLOYMENT.md#4-dotnet-consumer-aspnet-core-8--container-hosting).
