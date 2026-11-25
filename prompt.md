# TASK SPECIFICATION: Enterprise Multi-Experience Navigation Engine

## 1. Project Overview & Objectives
You are tasked with engineering a production-grade, multi-tenant navigation architecture inside this Turborepo monorepo (`content-operations-studio`). This system modernizes legacy Drupal marketing navigation into a headless, decoupled solution powered by Sanity.io and Next.js (App Router), styled with Tailwind CSS and shadcn/ui.

### Core Architecture Goals:
1. **Multi-Experience & Channel Matrix**:
   - **Experiences (Flavors/Orgs)**:
     - General / Prospects (Personal & retail investing portal)
     - Retirement / Workplace (Corporate workplace retirement & 401k portal)
     - Advisor Services (Institutional RIA custodian & advisor services portal)
   - **Channels**: `web`, `mobile`, `email`, `agentic`.
2. **Smartling-Powered Localization (Mocked via Reference Data)**:
   - *Note on Smartling Setup*: Smartling is not yet configured or connected with live API credentials. Assume Smartling integration is active architecturally; mock the integration by providing realistic reference translation data.
   - `en-US` serves as the canonical master document.
   - Target locales (`en-HK`, `en-SG`, `es`, `zh-Hant`, `zh-Hans`) are pre-populated with reference mock data simulating completed Smartling translation jobs (including simulated `smartling: { jobId: "MOCK-SL-1029", status: "translated", lastSyncedAt: "..." }`).
   - Data-fetching layer implements resilient fallback (`coalesce(targetDoc, canonicalDoc)`) so missing/in-progress translations never break production navigation.
3. **Dual Delivery (Native SSR + Vercel Remote Components via `remote-components`)**:
   - **Native**: Directly imported as a React Server Component (RSC) inside `app/[locale]/[experience]/layout.tsx`.
   - **Remote Micro-Frontend for Drupal**: Exposed via `remote-components` (`remote-components/remote/nextjs/app`) using `<ExposeRemoteComponent name="header-navigation">` on a clean, path-based route (`/remote/navigation/[channel]/[experience]/[locale]`).
   - **Stop-Gap Drupal Ingestion with Full SEO Compatibility**:
     - *The Problem*: Client-side-only runtime fetches inside `<remote-component>` prevent search crawlers (Googlebot, Bingbot, Baidu, non-JS spiders) from indexing internal navigation links and cause Cumulative Layout Shift (CLS).
     - *The Solution (HTML-First / DSD Ingestion)*:
       1. **Declarative Shadow DOM (DSD) SSR**: Drupal embeds the server-rendered header markup directly inside `<template shadowrootmode="open">`. Modern browsers and search crawlers parse the Shadow DOM immediately during HTML streaming with zero layout shift (CLS: 0.00).
       2. **SEO Crawlable Fallback**: Include a crawlable `<noscript>` containing a semantic `<nav>` link hierarchy with all internal terminal links (`<a>`), guaranteeing complete indexation and PageRank distribution for classic crawlers.
       3. **Zero-Dependency Web Component Controller**: `/remote-component.js` detects existing DSD SSR content, skips redundant client fetches, and binds interactive event handlers (click toggles, hover grace periods, `event.composedPath()` shadow-DOM click-outside, Escape key) with instantaneous 0ms response.
   - **Edge CDN Optimization**: Build-time matrix pre-rendering (`generateStaticParams`) ensures 100% Vercel Edge CDN cache hits with zero dynamic cold-start latency.
4. **Enterprise-Grade Requirements**:
   - Cross-domain URL resolution (relative slugs dynamically resolved to environment-specific base URLs per experience).
   - Dynamic client-side Auth Island ("Log In" vs. "My Account") preventing edge-cache pollution.
   - Analytics event tagging (`data-analytics-*`) for GTM/Adobe Launch.
   - Full WCAG 2.1 AA accessibility (Radix focus management, skip-to-content, keyboard escape).

---

## 2. Monorepo Package Architecture

Implement and configure the following packages and applications:

```
apps/
  ├── content-presentation/          # Next.js App Router (Native + Remote Endpoints)
  └── content-studio/                # Sanity Studio CMS
packages/
  ├── navigation-contract/           # Zod schemas, TypeScript types, Domain Enums
  ├── navigation-sanity/             # Sanity Document Schemas, Desk Structure, GROQ Queries
  ├── navigation-adapters/           # Cross-domain URL resolvers, Channel Transformers
  └── navigation-ui/                 # shadcn/ui NavigationMenu, Mobile Drawer, Auth Island
```

---

### Step 2.1: `packages/navigation-contract`
Create all domain contracts, Zod schemas, and TypeScript interfaces.

1. **Enums & Constants**:
   - `EXPERIENCES`: `['general', 'retirement', 'advisorservices'] as const`
   - `CHANNELS`: `['web', 'mobile', 'email', 'agentic'] as const`
   - `LOCALES`: `['en-US', 'en-HK', 'en-SG', 'es', 'zh-Hant', 'zh-Hans'] as const`
2. **Data Contracts**:
   - `NavItemLevel3`: Terminal link with `id`, `title`, `href`, optional `badge` (e.g., "New"), optional `description`, optional `icon`, `isExternal`, and `analyticsTag`.
   - `NavItemLevel2`: Column/Section grouping with `id`, `sectionTitle`, optional `href`, and `items: NavItemLevel3[]`.
   - `NavPromoCard`: Featured callout slot with `title`, `description`, `ctaText`, `ctaUrl`, `image` (Sanity image object), and `badge`.
   - `NavItemLevel1`: Top-level bar item with `id`, `title`, optional direct `href`, and optional `megaMenu: { sections: NavItemLevel2[]; promoCard?: NavPromoCard }`.
   - `UtilityItem`: Top utility item with `id`, `title`, `href`, `icon`, and `requiresAuth: boolean`.
   - `SmartlingMetadata`: `{ jobId?: string; status: 'source' | 'in_progress' | 'translated'; lastSyncedAt?: string }`.
   - `NavigationDocument`: Compound payload containing `channel`, `experience`, `locale`, `isCanonical`, `utilityLinks`, `items: NavItemLevel1[]`, `experienceSwitcherLinks`, and `smartling`.
3. Export comprehensive Zod validation schemas for all types to guarantee runtime safety.

---

### Step 2.2: `packages/navigation-sanity`
Implement the Sanity schema, desk structure, and data access client.

1. **Schema Types**:
   - `navigationMenu` (Document):
     - `title`: String
     - `channel`: String (options: `CHANNELS`)
     - `experience`: String (options: `EXPERIENCES`)
     - `locale`: String (options: `LOCALES`)
     - `isCanonical`: Boolean (default `true` when `locale === 'en-US'`)
     - `smartling`: Object `{ jobId: string, status: string, lastSyncedAt: datetime }`
     - `utilityLinks`: Array of `utilityLink` objects
     - `items`: Array of `navItemL1` objects containing:
       - `title`: String (translatable)
       - `href`: String (optional fallback direct route)
       - `isMegaMenu`: Boolean
       - `sections`: Array of `navItemL2` objects containing:
         - `sectionTitle`: String (translatable)
         - `items`: Array of `navItemL3` objects (translatable `title`, `description`, `badge`)
       - `promoCard`: Object with `title`, `description`, `ctaText`, `ctaUrl`, `image`
   - Mark non-translatable fields (`channel`, `experience`, IDs, system flags) as read-only when `isCanonical === false`.
2. **Studio Structure (`structure.ts`)**:
   - Organize Sanity Desk into: **Navigation** -> **Channel** (`web`, `mobile`, ...) -> **Experience** (`general`, `retirement`, `advisorservices`) -> **Canonical (en-US)** & **Smartling Target Locales**.
3. **GROQ Data Fetcher with Fallback**:
   - Create `getNavigationData({ channel, experience, locale })`:
     ```groq
     coalesce(
       *[_type == "navigationMenu" && channel == $channel && experience == $experience && locale == $locale && !(_id in path("drafts.**"))][0],
       *[_type == "navigationMenu" && channel == $channel && experience == $experience && locale == "en-US" && !(_id in path("drafts.**"))][0]
     ) {
       _id,
       title,
       channel,
       experience,
       locale,
       isCanonical,
       smartling,
       utilityLinks[] { id, title, href, icon, requiresAuth },
       items[] {
         id,
         title,
         href,
         isMegaMenu,
         sections[] {
           id,
           sectionTitle,
           items[] { id, title, href, description, badge, icon, isExternal, analyticsTag }
         },
         promoCard { title, description, ctaText, ctaUrl, "imageUrl": image.asset->url }
       }
     }
     ```
   - Wire with Next.js App Router cache tags: `next: { tags: ['navigation', `nav-${experience}-${locale}`] }`.

---

### Step 2.3: `packages/navigation-adapters`
Implement cross-domain URL normalization and data transformations:
1. **Cross-Domain Base URL Resolver**:
   - Define domain configuration (supporting environment variables):
     - `general` -> `https://www.company.com` (or current host)
     - `retirement` -> `https://workplace.company.com`
     - `advisorservices` -> `https://advisorservices.company.com`
   - Transform relative paths in `href` into absolute URLs when target domain differs from the consuming host (crucial for legacy Drupal embedding).
2. **Channel Formatters**:
   - `toAgenticBotContext(doc)`: Extracts a flat intent-route dictionary optimized for LLM/agentic function-calling tools.
   - `toMobilePayload(doc)`: Lightweight JSON structure omitting desktop-specific promo assets.

---

### Step 2.4: `packages/navigation-ui`
Build accessible, performant React components using Tailwind CSS and shadcn/ui.

1. **Styling & Scoping**:
   - Wrap the entire header in a scoped container class `.remote-nav-scope` using CSS layers to prevent style leakage in legacy Drupal.
2. **Component Breakdown**:
   - `SkipToContent`: Hidden accessible link (`sr-only focus:not-sr-only`) targeting `#main-content`.
   - `UtilityBar`: Top bar rendering:
     - Experience Switcher tabs (General, Workplace, Advisor Services).
     - Smartling Locale Dropdown (`DropdownMenu`).
     - Global Search trigger button.
     - `AuthZoneIsland`: Client Component that inspects session state / cookies:
       - Displays "Log In" / "Open Account" when unauthenticated.
       - Displays "My Account" / "Log Out" when authenticated (without breaking static edge caching).
   - `MainNavigation (L1)`: Centered container (`max-w-7xl mx-auto`), left-to-right aligned using shadcn `NavigationMenu`:
     - Hover/Focus triggers dropdown mega menu with smooth animations.
     - Supports direct links and mega menus.
   - `MegaMenuGrid (L2 & L3)`:
     - Responsive multi-column layout for L2 sections and L3 link lists.
     - L3 items include title, subtle description, optional badge (`New`, `Popular`), and `data-analytics-*` attributes.
     - Right-hand column dedicated to `PromoCard` slot with image, copy, and CTA button.
   - `MobileDrawer`: Accessible shadcn `Sheet` with nested Accordions for mobile viewports (`< lg`).
3. **Active Route Detection**:
   - Native: Uses Next.js `usePathname()`.
   - Remote (Drupal): Falls back to reading `window.location.pathname` on client mount to highlight active items.
4. **Keyboard & a11y**:
   - Handle `Escape` key to close open mega menus and return focus to the active trigger.

---

### Step 2.5: `apps/content-presentation` (Next.js 15+ App Router)
Implement routing, SSR integration, remote endpoints, and cache invalidation.

1. **Native Next.js Integration**:
   - `app/[locale]/[experience]/layout.tsx`:
     - Fetches navigation via `getNavigationData({ channel: 'web', experience, locale })`.
     - Renders `<HeaderNavigation data={navData} currentLocale={locale} currentExperience={experience} />`.
2. **Path-Based Remote Component Endpoint (`remote-components`)**:
   - Wrap Next.js config with `withRemoteComponentsConfig` from `'remote-components/config/nextjs'`.
   - Route: `app/remote/navigation/[channel]/[experience]/[locale]/page.tsx`.
   - **Expose Remote Component**: Wraps output with `<ExposeRemoteComponent name="header-navigation">` from `'remote-components/remote/nextjs/app'`.
   - **Build-Time Matrix Pre-rendering (`generateStaticParams`)**:
     - Loop over all permutations of `CHANNELS` * `EXPERIENCES` * `LOCALES`.
     - Output static HTML/RSC payloads cached at Vercel Edge CDN.
   - **Legacy Drupal Stop-Gap Ingestion Pattern (100% SEO-Friendly & Zero CLS)**:
     - Pre-linked Stylesheet: `/remote/navigation/styles.css?v=<version>` preloaded in Drupal `<head>`.
     - Web Component Loader: `/remote-component.js?v=<version>` exports the resilient zero-dependency Custom Element controller.
     - **Deterministic Cache-Busting Versioning (`?v=X.Y.Z`)**:
       Drupal reads the remote component version descriptor from `<script id="remote-component-version">{"version": "0.4.16"}</script>` or HTTP response headers and stamps `?v=0.4.16` onto stylesheet and script URLs. When new component builds are released, Akamai edge and browser caches bust automatically.
     - **Pattern A: Declarative Shadow DOM (DSD) SSR Ingestion (Recommended for Drupal 9/10)**:
       Drupal theme preprocess (`hook_preprocess_page`) or Twig plugin fetches and caches the SSR HTML fragment (`s-maxage=86400`), rendering it with DSD and `<noscript>` fallback:
       ```html
       <!-- In Drupal page.html.twig -->
       <remote-component id="header-remote" src="https://example.com/remote/navigation/web/general/en-US" version="0.4.16">
         <template shadowrootmode="open">
           <link rel="stylesheet" href="https://example.com/remote/navigation/styles.css?v=0.4.16" />
           <!-- Server-Side Rendered Header HTML injected directly by Drupal Render Cache -->
           {{ remote_header_ssr | raw }}
         </template>
         <noscript>
           <nav aria-label="SEO Crawlable Site Links" style="display:none;">
             <a href="/accounts/brokerage">Brokerage Account</a>
             <a href="/accounts/ira">Traditional & Roth IRAs</a>
             <a href="/products/stocks">Stocks & Equities</a>
             <a href="/trading/desktop">Flagship Active Desktop</a>
           </nav>
         </noscript>
       </remote-component>
       <script type="module" src="https://example.com/remote-component.js?v=0.4.16"></script>
       ```
     - **Pattern B: Bundled Host + `<template>` Payload + `onRequest` (Zero Client Remote Call, Recommended)**:
       Consumers never install or import `remote-components`. The remote app publishes a self-contained ESM bundle of the official HTML host, and the consumer inlines the server-fetched payload.
       1. **Host bundle build step** (`apps/content-presentation/scripts/build-remote-host.mjs`, run via `prebuild`/`predev` or `pnpm build:remote-host`):
          - esbuild bundles `remote-components/host/html` + React + a small payload hook into `public/remote-host/remote-components-host.<sha8>.js` (+ `.map`, LEGAL file, stable alias).
          - Writes `public/remote-host/manifest.json`: `version` (`<library>+<app>`), `library.version`, `react`, `file`, `sha256`, SRI `integrity` (sha384), `bytes`, `gitSha`, `builtAt`, and copy-paste `usage` snippets.
          - Consumers read the manifest server-side to stamp the immutable hashed filename + `integrity`, so cache busting is automatic on every release.
       2. **Payload hook** (`scripts/remote-host/payload-hook.js`, imported before the host defines the element):
          - Listens (capture) for the element's synchronous `beforeload` event and attaches `el.onRequest`.
          - `onRequest(url)` resolves the inlined payload and returns `new Response(html, { status: 200 })`, so the library skips `fetch()`. Returning `undefined` falls back to the network.
          - Lookup order: `payload="<template-id>"` attribute (only while its `data-src` matches `src`), then `template[data-remote-component-payload][data-src="<src>"]`, then `window.RemoteComponentsHost.registerPayload(src, html)`.
          - Consumer-defined `onRequest` hooks are respected and never overwritten.
       3. **Consumer markup** (Drupal fetches `GET /remote/navigation/<channel>/<experience>/<locale>` with `Accept: text/html`, then caches it in the Render Cache and at Akamai):
          ```html
          <script type="module" src="https://example.com/remote-host/remote-components-host.<sha8>.js"
                  integrity="sha384-..." crossorigin="anonymous"></script>

          <template id="rc-payload-web-general-en-US" data-remote-component-payload
                    data-src="https://example.com/remote/navigation/web/general/en-US">
            {{ remote_header_payload | raw }}
          </template>
          <remote-component src="https://example.com/remote/navigation/web/general/en-US"
                            payload="rc-payload-web-general-en-US"></remote-component>
          <noscript>
            <nav aria-label="Site navigation">{{ crawlable_links | raw }}</nav>
          </noscript>
          ```
       4. **SEO caveat**: crawlers do not index `<template>` content, so always emit the `<noscript>` link list (or use Pattern A, DSD) for crawlable navigation.
       5. **Reference generator** (`scripts/generate-remote-payload-pages.mjs`, `pnpm generate:payload-pages`): fetches flavours (default `web/general/en-US`, `web/general/zh-Hant`, `web/general/es`, `web/retirement/en-US`) from `REMOTE_ORIGIN` and writes `public/drupal-pages/*.html` + `pages.json`, simulating Drupal SSR output. It needs a running remote server, so run it after deploy or `next start`, not during `next build`.
       6. Hydration JS/CSS chunks (`/_next/static/*`) are still loaded from the remote origin; these are immutable, CDN-cached assets, not the component route.
       7. **Build coupling (important)**: a payload references the exact `/_next/static/*` chunk hashes and React build of the deployment it was fetched from.
          - Drupal/Akamai must re-fetch payloads on every remote deploy (key the cache on the manifest `version`/`gitSha`, or purge on deploy), or keep old deployment assets available (Vercel skew protection).
          - The host is built in two variants: `production` (minified, what consumers ship) and `development` (React dev build). React's production build cannot hydrate a `next dev` payload (debug rows cause React error #504), so the generator detects `"b":"development"` in the payload and picks the matching variant from `manifest.variants`.
     - **Pattern C: Edge Side Includes (ESI) / Edge Workers (Akamai, Cloudflare, Fastly)**:
       The CDN Edge stitches the SSR header HTML into the Drupal response before delivering to the client or bot:
       ```html
       <remote-component id="header-remote" src="https://example.com/remote/navigation/web/general/en-US">
         <template shadowrootmode="open">
           <esi:include src="https://example.com/remote/navigation/web/general/en-US" />
         </template>
       </remote-component>
       ```
     - **Pattern D: Client-Side Progressive Fallback**:
       If SSR is not pre-rendered by Drupal, `<remote-component src="..."></remote-component>` performs a progressive client fetch and hydrates the Shadow DOM automatically.
3. **On-Demand Cache Invalidation**:
   - Route: `app/api/revalidate/route.ts`:
     - Accepts webhook from Sanity or Smartling.
     - Calls `revalidateTag('navigation', 'max')` and `revalidatePath('/remote/navigation/[channel]/[experience]/[locale]')`.

---

### Step 2.6: Mock Data & Seeding Script (Smartling Simulated Data)
Provide complete, realistic demo reference data mirroring the multi-experience enterprise financial structure:

1. **Flavors / Experiences**:
   - **General**: L1 items: *Investing* (Brokerage, IRAs), *Trading* (Platforms, Tools), *Research & Education*, *Wealth Management*.
   - **Retirement**: L1 items: *Workplace Plans* (401k, Equity Plans), *Participant Services*, *Financial Wellness*.
   - **Advisor Services**: L1 items: *Custody Solutions*, *Trading & Tech*, *Business Consulting*.
2. **Locales & Smartling Mocking**:
   - **Canonical (`en-US`)**: Master documents with `isCanonical: true` and `smartling: { status: 'source' }`.
   - **Target Reference Translations**: Provide high-fidelity mock translations for:
     - `zh-Hant` (Traditional Chinese, e.g. 投資, 交易平台, 退休計劃)
     - `zh-Hans` (Simplified Chinese, e.g. 投资, 交易平台, 退休计划)
     - `es` (Spanish, e.g. Inversiones, Plataformas de Trading, Jubilación)
     - `en-HK` & `en-SG` (Localized English with regional disclaimers)
   - Every target locale document must include simulated Smartling metadata:
     `smartling: { jobId: "SL-JOB-98214", status: "translated", lastSyncedAt: "2026-11-21T00:00:00Z" }`.
   - Maintain 1:1 matching IDs across canonical and translated items to ensure structural parity.
3. **Import Script**:
   - Implement `scripts/seed-navigation.ts` or an NDJSON file (`sample-data/navigation-mock.ndjson`) executable via `pnpm seed:nav` or `sanity dataset import`.

---

## 3. Verification & Validation Steps
Upon completion, verify:
1. `pnpm build` succeeds across all workspace packages without TypeScript or lint errors.
2. Visiting `/remote/navigation/web/general/en-US` and `/remote/navigation/web/retirement/zh-Hant` returns static, edge-cacheable responses.
3. Requesting a non-translated locale gracefully returns the translated shell or falls back to canonical `en-US` without runtime exceptions.
4. Mobile viewports cleanly trigger the mobile drawer sheet with nested accordions.
5. All interactive elements satisfy keyboard accessibility (`Tab`, `Enter`, `Escape`).
