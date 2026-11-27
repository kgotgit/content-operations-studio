/**
 * Shared renderer for "consumer" pages that embed the remote navigation with an inlined
 * payload (no client-side call to the remote route).
 *
 * Used by:
 *   - scripts/generate-remote-payload-pages.mjs  (CLI: writes static HTML files)
 *   - app/drupal-preview/[[...flavour]]/route.ts (Vercel: renders on request)
 *
 * This is the reference implementation of what Drupal's PHP/Twig layer does:
 * fetch payload server-side, then inline into <template>, then emit <remote-component payload="...">.
 */

export const DEFAULT_FLAVOURS = [
  'web/retail/en-US',
  'web/retail/zh-Hant',
  'web/retail/es',
  'web/advisorServices/en-US',
];

const FLAVOUR_RE = /^[a-zA-Z]+\/[a-zA-Z]+\/[A-Za-z-]+$/;

export const isValidFlavour = (flavour) => FLAVOUR_RE.test(flavour);
export const slug = (flavour) => flavour.replace(/\//g, '-');
export const stripSlash = (url) => String(url || '').replace(/\/+$/, '');

export const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * Fetch one flavour's remote component HTML server-side.
 * @param {{ origin: string, flavour: string, bypassSecret?: string, fetchImpl?: typeof fetch, init?: RequestInit }} opts
 */
export async function fetchPayload({ origin, flavour, bypassSecret, fetchImpl = fetch, init = {} }) {
  if (!isValidFlavour(flavour)) throw new Error(`Invalid flavour "${flavour}"`);
  const url = `${stripSlash(origin)}/remote/navigation/${flavour}`;
  const headers = { Accept: 'text/html', ...(init.headers || {}) };
  // Vercel Deployment Protection: Protection Bypass for Automation
  if (bypassSecret) headers['x-vercel-protection-bypass'] = bypassSecret;

  const started = Date.now();
  const res = await fetchImpl(url, { ...init, headers });
  if (!res.ok) {
    const hint = res.status === 401 || res.status === 403
      ? ' (deployment protection? set VERCEL_AUTOMATION_BYPASS_SECRET)'
      : '';
    throw new Error(`GET ${url} -> HTTP ${res.status}${hint}`);
  }
  const html = await res.text();
  if (/<\/template>/i.test(html)) {
    throw new Error(`Payload for ${flavour} contains </template>; cannot be inlined safely.`);
  }
  // `next dev` remotes stream a development RSC payload (buildId "development"),
  // which only React's development build can hydrate.
  const mode = /\\?"b\\?":\\?"development\\?"|react-dom-client_development/.test(html) ? 'development' : 'production';
  return { flavour, url, html, mode, ms: Date.now() - started, bytes: Buffer.byteLength(html) };
}

/** Pick the host bundle variant that matches the payload's React build. */
export function pickHost(manifest, mode) {
  const variant = manifest.variants?.[mode];
  if (variant) return variant;
  if (mode === 'development') {
    throw new Error('Remote is running `next dev` but the manifest has no development host variant. Re-run build-remote-host.mjs.');
  }
  return { file: manifest.file, integrity: manifest.integrity, mode: 'production' };
}

/** Extract unique <a href> + text pairs for the SEO <noscript> fallback. */
export function extractLinks(html) {
  const links = new Map();
  for (const m of html.matchAll(/<a\b[^>]*\bhref="([^"#][^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = m[1].replace(/&amp;/g, '&');
    const text = m[2]
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<p\b[\s\S]*?<\/p>/gi, ' ') // drop descriptions
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
    if (text && !links.has(href)) links.set(href, text);
  }
  return [...links].map(([href, text]) => ({ href, text }));
}

/**
 * Server-rendered, crawlable snapshot of the header for Declarative Shadow DOM.
 *
 * Takes the remote payload (a full Next.js document) and keeps only what should be visible
 * before any JavaScript runs: stylesheet links (absolutized to the remote origin) plus the
 * component markup, with every <script> removed so nothing executes in the host page.
 * The snapshot is marked `data-rc-ssr` so the payload hook can swap it for the hydrated
 * component without a flash (see payload-hook.js).
 */
export function extractSsrMarkup(html, publicOrigin) {
  const base = `${stripSlash(publicOrigin)}/`;
  const abs = (href) => {
    try {
      return new URL(href.replace(/&amp;/g, '&'), base).href;
    } catch {
      return href;
    }
  };
  const links = [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/gi)]
    .map((m) => m[0].match(/\bhref="([^"]+)"/i)?.[1])
    .filter(Boolean)
    .map((href) => `<link rel="stylesheet" href="${escapeHtml(abs(href))}" data-rc-ssr>`)
    .join('');

  let body = html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html;
  const start = body.search(/<div\b[^>]*\bdata-bundle=/i);
  if (start >= 0) body = body.slice(start);
  body = body
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<template\b[\s\S]*?<\/template>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // Rename so neither the library nor the hook mistakes the snapshot for the live component
    .replace(/\sdata-(bundle|route|runtime|type)="/g, ' data-ssr-$1="')
    .replace(/\sid="([^"]*__ssr)"/g, ' data-ssr-id="$1"');

  if (!body.includes('enterprise-header-navigation')) {
    throw new Error('Could not extract header markup from the remote payload');
  }
  return `${links}<div data-rc-ssr>${body}</div>`;
}

/**
 * Embed = hydration payload (inert <template>) + host element whose Declarative Shadow DOM
 * contains the server-rendered header. Browsers and crawlers parse the DSD as real, styled,
 * isolated DOM on the first response; the bundled host later hydrates it from the payload.
 *
 * @param {{ payload: Awaited<ReturnType<typeof fetchPayload>>, publicOrigin: string }} opts
 */
export function renderEmbed({ payload, publicOrigin }) {
  const { flavour } = payload;
  const id = `rc-payload-${slug(flavour)}`;
  const src = `${stripSlash(publicOrigin)}/remote/navigation/${flavour}`;
  const ssr = extractSsrMarkup(payload.html, publicOrigin);
  return `
    <!-- Remote navigation: ${escapeHtml(flavour)} -->
    <template id="${id}" data-remote-component-payload data-src="${escapeHtml(src)}">${payload.html}</template>
    <remote-component src="${escapeHtml(src)}" payload="${id}"><template shadowrootmode="open">${ssr}</template></remote-component>`;
}

/**
 * @param {{
 *   title: string,
 *   manifest: any,
 *   host: { file: string, integrity: string, mode: string },
 *   assetOrigin?: string,  // where /remote-host/* is served ('' = same origin)
 *   embeds: string,
 *   nav?: string,
 *   generator?: string,
 *   lang?: string,                 // <html lang>, e.g. "zh-Hant"
 *   description?: string,
 *   robots?: string,               // e.g. "index, follow" or "noindex"
 *   canonical?: string,            // absolute URL
 *   alternates?: { hreflang: string, href: string }[],
 * }} opts
 */
export function renderPage({
  title,
  manifest,
  host,
  assetOrigin = '',
  embeds,
  nav = '',
  generator = 'payload-page.mjs',
  lang = 'en',
  description = '',
  robots = 'noindex',
  canonical = '',
  alternates = [],
}) {
  const hostSrc = `${stripSlash(assetOrigin)}/remote-host/${host.file}`;
  const seo = [
    `<meta name="robots" content="${escapeHtml(robots)}" />`,
    description && `<meta name="description" content="${escapeHtml(description)}" />`,
    canonical && `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    ...alternates.map((a) => `<link rel="alternate" hreflang="${escapeHtml(a.hreflang)}" href="${escapeHtml(a.href)}" />`),
  ]
    .filter(Boolean)
    .join('\n  ');
  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${seo}
  <title>${escapeHtml(title)}</title>
  <meta name="generator" content="${escapeHtml(generator)}" />
  <!-- Bundled remote-components HTML host v${escapeHtml(manifest.version)} (${escapeHtml(host.mode)} build) -->
  <link rel="modulepreload" href="${escapeHtml(hostSrc)}" integrity="${host.integrity}" crossorigin="anonymous" />
  <script type="module" src="${escapeHtml(hostSrc)}" integrity="${host.integrity}" crossorigin="anonymous"></script>
  <style>
    body { margin: 0; font-family: Georgia, 'Times New Roman', serif; background: #f4f4f2; color: #333; }
    .toolbar { background: #111; color: #fff; padding: 6px 16px; font: 11px Arial, sans-serif; display: flex; justify-content: space-between; }
    .embed-label { font: 600 11px/1 ui-monospace, monospace; color: #555; padding: 18px 16px 6px; text-transform: uppercase; letter-spacing: .05em; }
    main { max-width: 1100px; margin: 32px auto; padding: 28px; background: #fff; border-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,.1); }
    nav.pages a { margin-right: 12px; font: 13px sans-serif; }
    #payload-report { font: 12px/1.5 ui-monospace, monospace; background: #0f172a; color: #e2e8f0; padding: 12px 14px; border-radius: 6px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="toolbar"><span>Legacy CMS (simulated) &bull; server-side payload embedding</span><span>host ${escapeHtml(manifest.version)} &bull; ${escapeHtml(host.mode)}</span></div>
${embeds}
  <main id="main-content">
    <h1 style="margin-top:0">${escapeHtml(title)}</h1>
    <p>Each header above is server-rendered into Declarative Shadow DOM, so it's real, crawlable HTML
       before any JavaScript runs. The bundled host then hydrates it from an inlined payload via
       <code>onRequest</code>, so the browser makes no request to <code>/remote/navigation/*</code>.</p>
    <nav class="pages">${nav}</nav>
    <h2 style="font-size:16px">Runtime report</h2>
    <div id="payload-report">waiting for hydration…</div>
  </main>
  <script type="module">
    // Demo-only diagnostics: proves no network request was made to the remote route.
    const report = () => {
      const remoteCalls = performance.getEntriesByType('resource')
        .filter((e) => e.name.includes('/remote/navigation/'))
        .map((e) => e.name);
      const stats = window.RemoteComponentsHost?.getStats?.() ?? { served: [], fetched: [] };
      const elements = [...document.querySelectorAll('remote-component')].map((el) => ({
        src: el.getAttribute('src'),
        payloadSource: el.getAttribute('data-payload-source') || 'network',
        hydrated: !!el.shadowRoot?.querySelector('[data-bundle] #enterprise-header-navigation'),
        ssrSnapshotRemaining: el.shadowRoot?.querySelectorAll('div[data-rc-ssr]').length ?? 0,
      }));
      const result = { hostVersion: window.RemoteComponentsHost?.version, servedFromPayload: stats.served.length, networkFallbacks: stats.fetched.length, remoteRouteRequests: remoteCalls, elements };
      window.__PAYLOAD_REPORT__ = result;
      document.getElementById('payload-report').textContent = JSON.stringify(result, null, 2);
    };
    document.addEventListener('load', (e) => { if (e.target.localName === 'remote-component') setTimeout(report, 50); }, true);
    window.addEventListener('load', () => setTimeout(report, 1500));
  </script>
</body>
</html>
`;
}

/**
 * Builds the navigation links between pages.
 * @param {string[]} flavours
 * @param {string} current  'index' or a flavour
 * @param {(target: string) => string} hrefFor  maps 'index' | flavour to a URL
 */
export function renderNav(flavours, current, hrefFor) {
  return ['index', ...flavours]
    .map((f) => {
      const label = f === 'index' ? 'All flavours' : f;
      return `<a href="${escapeHtml(hrefFor(f))}"${current === f ? ' aria-current="page"' : ''}>${escapeHtml(label)}</a>`;
    })
    .join('');
}

/** Ensures all payloads share one React build mode and returns the matching host. */
export function resolveHostForPayloads(manifest, payloads) {
  const modes = new Set(payloads.map((p) => p.mode));
  if (modes.size > 1) throw new Error(`Mixed payload modes from remote: ${[...modes].join(', ')}`);
  return pickHost(manifest, [...modes][0] ?? 'production');
}
