#!/usr/bin/env node
/**
 * Generates static "consumer" HTML pages (simulating Drupal server-side rendering) that
 * embed the remote navigation WITHOUT any client-side call to the remote route.
 *
 * For each flavour, this script:
 *   1. Fetches the remote component HTML server-side, the same way Drupal PHP would
 *      (`GET /remote/navigation/<channel>/<experience>/<locale>`, `Accept: text/html`,
 *      plus `x-vercel-protection-bypass` when deployment protection is enabled).
 *   2. Inlines the response into an inert `<template data-remote-component-payload data-src="...">`.
 *   3. Renders `<remote-component src="..." payload="<template-id>">`. The bundled host's
 *      `onRequest` hook (scripts/remote-host/payload-hook.js) serves the template as the
 *      Response, so the library hydrates without calling `fetch()`.
 *   4. Adds a `<noscript>` link list, because crawlers do not index `<template>` contents.
 *
 * Environment (CLI flags take precedence):
 *   REMOTE_ORIGIN                    --origin=         where payloads are fetched from (server side)
 *   REMOTE_PUBLIC_ORIGIN             --public-origin=  origin written into `src`/`data-src` (default REMOTE_ORIGIN)
 *   REMOTE_ASSET_ORIGIN              --asset-origin=   origin serving /remote-host/* ('' = same origin as page)
 *   VERCEL_AUTOMATION_BYPASS_SECRET                    Vercel Deployment Protection bypass for the fetch
 *   REMOTE_FLAVOURS                  --flavours=       comma-separated list (default 4 flavours)
 *                                    --out=            output dir (default dist-drupal-pages/, gitignored)
 *
 * The host bundle comes from public/remote-host/manifest.json, so run
 * `node scripts/build-remote-host.mjs` first. Payloads are tied to the remote's build:
 * regenerate after every remote deploy.
 *
 * The app itself serves these pages at request time (/drupal-pages/*.html, rewritten to
 * app/drupal-preview/[[...flavour]]/route.ts). This CLI is for static snapshots, e.g. Drupal QA.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_FLAVOURS,
  fetchPayload,
  extractLinks,
  renderEmbed,
  renderNav,
  renderPage,
  resolveHostForPayloads,
  slug,
  stripSlash,
} from './remote-host/payload-page.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');
const publicDir = path.join(appRoot, 'public');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.join('=') || 'true'];
  }),
);
const env = (name) => process.env[name]?.trim() || undefined;

const REMOTE_ORIGIN = stripSlash(args.origin || env('REMOTE_ORIGIN') || 'http://localhost:3000');
const PUBLIC_ORIGIN = stripSlash(args['public-origin'] || env('REMOTE_PUBLIC_ORIGIN') || REMOTE_ORIGIN);
const ASSET_ORIGIN = stripSlash(args['asset-origin'] ?? env('REMOTE_ASSET_ORIGIN') ?? '');
const BYPASS_SECRET = env('VERCEL_AUTOMATION_BYPASS_SECRET');
const FLAVOURS = (args.flavours || env('REMOTE_FLAVOURS'))
  ? (args.flavours || env('REMOTE_FLAVOURS')).split(',').map((f) => f.trim()).filter(Boolean)
  : DEFAULT_FLAVOURS;
// Not under public/: the /drupal-pages/* URLs are rendered at request time (see next.config.ts rewrites).
const OUT_DIR = path.resolve(appRoot, args.out || 'dist-drupal-pages');

async function loadManifest() {
  try {
    return JSON.parse(await readFile(path.join(publicDir, 'remote-host', 'manifest.json'), 'utf8'));
  } catch {
    throw new Error('public/remote-host/manifest.json not found. Run `node scripts/build-remote-host.mjs` first.');
  }
}

async function main() {
  const manifest = await loadManifest();
  console.log(
    `[payload-pages] fetching from ${REMOTE_ORIGIN}${BYPASS_SECRET ? ' (with Vercel protection bypass)' : ''}`,
  );

  const payloads = [];
  for (const flavour of FLAVOURS) {
    const payload = await fetchPayload({ origin: REMOTE_ORIGIN, flavour, bypassSecret: BYPASS_SECRET });
    payloads.push(payload);
    const links = extractLinks(payload.html).length;
    console.log(
      `  ✓ ${flavour.padEnd(26)} ${String(payload.bytes).padStart(7)} B  ${links} links  ${payload.ms}ms  (${payload.mode})`,
    );
  }

  const host = resolveHostForPayloads(manifest, payloads);
  console.log(`[payload-pages] using ${host.mode} host ${ASSET_ORIGIN || '(same origin)'}/remote-host/${host.file}`);

  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const hrefFor = (f) => (f === 'index' ? 'index.html' : `${slug(f)}.html`);
  const common = { manifest, host, assetOrigin: ASSET_ORIGIN, generator: 'generate-remote-payload-pages.mjs' };

  for (const payload of payloads) {
    await writeFile(
      path.join(OUT_DIR, `${slug(payload.flavour)}.html`),
      renderPage({
        ...common,
        title: `Remote navigation · ${payload.flavour}`,
        embeds: renderEmbed({ payload, publicOrigin: PUBLIC_ORIGIN }),
        nav: renderNav(FLAVOURS, payload.flavour, hrefFor),
      }),
    );
  }

  const combined = payloads
    .map((p) => `  <div class="embed-label">${p.flavour}</div>\n${renderEmbed({ payload: p, publicOrigin: PUBLIC_ORIGIN })}`)
    .join('\n');
  await writeFile(
    path.join(OUT_DIR, 'index.html'),
    renderPage({ ...common, title: 'Remote navigation · all flavours', embeds: combined, nav: renderNav(FLAVOURS, 'index', hrefFor) }),
  );

  await writeFile(
    path.join(OUT_DIR, 'pages.json'),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        remoteOrigin: REMOTE_ORIGIN,
        publicOrigin: PUBLIC_ORIGIN,
        assetOrigin: ASSET_ORIGIN || null,
        host: { file: host.file, mode: host.mode, version: manifest.version, integrity: host.integrity },
        pages: payloads.map((p) => ({ flavour: p.flavour, file: `${slug(p.flavour)}.html`, payloadBytes: p.bytes, mode: p.mode })),
      },
      null,
      2,
    )}\n`,
  );

  console.log(`[payload-pages] wrote ${payloads.length + 1} pages to ${path.relative(appRoot, OUT_DIR)}/`);
}

main().catch((err) => {
  console.error('[payload-pages] failed:', err.message);
  process.exit(1);
});
