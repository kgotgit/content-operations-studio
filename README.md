# content-operations-studio

Turborepo-style pnpm monorepo for a headless, multi-experience navigation system:
Sanity Studio for authoring, a Next.js app that renders the navigation natively and as a
remote component, and a server-rendered delivery path for legacy CMS hosts (e.g. Drupal).

| Path | What |
| --- | --- |
| `apps/content-presentation` | Next.js app: native pages, `/remote/navigation/*` fragments, `/api/remote/navigation/*` JSON envelope, bundled host, CMS preview |
| `apps/content-studio` | Sanity Studio |
| `apps/drupal-consumer` | True PHP 8.x consumer (Vercel-ready via `vercel-php`), zero HTML parsing |
| `apps/dotnet-consumer` | True ASP.NET Core 8 (C#) consumer with `IMemoryCache` + `Dockerfile`, zero HTML parsing |
| `packages/navigation-*` | Contract (types/schemas), Sanity queries, URL adapters, UI components |

## Docs

- [Remote navigation: server-rendered delivery to non-Next.js hosts](docs/remote-navigation.md): host bundle, payload hook, Declarative Shadow DOM, CMS integration, caching, SEO
- [Deploying to Vercel](DEPLOYMENT.md): projects, env variables, deployment protection, webhooks
- [Task specification](prompt.md)

## Quick start

```bash
pnpm install
cp apps/content-presentation/.env.example apps/content-presentation/.env.local   # fill in values
pnpm --filter content-presentation dev     # http://localhost:3000
pnpm --filter content-studio dev           # http://localhost:3333
```

Then open `http://localhost:3000/drupal-pages/index.html` to see the navigation embedded in a simulated CMS page.
