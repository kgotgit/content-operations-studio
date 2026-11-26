# content-studio (Sanity Studio)

Sanity Studio v6 authoring workspace for the multi-experience navigation system (`navigationMenu` documents organized by Channel → Experience → Canonical `en-US` & localized target locales).

## Local Workspace Setup

1. Install dependencies from the **monorepo root**:
   ```bash
   pnpm install
   ```
2. Create `.env` from the template:
   ```bash
   cp apps/content-studio/.env.example apps/content-studio/.env
   ```
   Set `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET` (e.g. `dev`).
3. Ensure `http://localhost:3333` is added as an allowed CORS origin (with **Allow credentials**) in Sanity Manage → API → CORS origins.

## Start & Build Commands

```bash
pnpm --filter content-studio dev        # starts Sanity Studio on http://localhost:3333
pnpm --filter content-studio build      # builds static SPA to apps/content-studio/dist/
pnpm --filter content-studio deploy     # optional: deploy to Sanity-hosted Studio
```

### Seed sample navigation data
From the monorepo root (requires an editor token — never commit it or add it to Vercel):
```bash
SANITY_PROJECT_ID=<project-id> SANITY_DATASET=dev SANITY_AUTH_TOKEN=<editor-token> pnpm seed:nav
```

## Example Routes (`http://localhost:3333`)

| Route | Purpose |
| --- | --- |
| `/` | Studio home (Navigation Desk: Channel → Experience → Locale) |
| `/structure` | Document structure browser |
| `/vision` | GROQ Vision query playground |

## Deployment

Deploys to Vercel as a static SPA (`apps/content-studio/vercel.json` sets `framework: null`, `outputDirectory: dist`). See [DEPLOYMENT.md](../../DEPLOYMENT.md#2-content-studio-sanity-studio) for CORS and environment variable details.
