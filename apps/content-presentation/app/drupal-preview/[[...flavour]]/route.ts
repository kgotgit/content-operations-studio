import { NextRequest } from 'next/server';
import {
  DEFAULT_FLAVOURS,
  fetchPayload,
  isValidFlavour,
  renderEmbed,
  renderNav,
  renderPage,
  resolveHostForPayloads,
} from '../../../scripts/remote-host/payload-page.mjs';
import { getBypassHeaders } from '@/lib/env';

/**
 * Simulated Drupal page, rendered on request (works on Vercel, where the static
 * `public/drupal-pages/*` output of generate-remote-payload-pages.mjs isn't produced).
 *
 *   /drupal-preview                       all default flavours on one page
 *   /drupal-preview/web/general/en-US     a single flavour
 *
 * The payload is fetched server-side from REMOTE_ORIGIN (default: this deployment, so
 * the payload's chunk hashes always match the assets this deployment serves) and
 * inlined into a <template>. The browser makes no request to /remote/navigation/*.
 *
 * The host manifest is read over HTTP at request time (like Drupal would), not imported,
 * so a missing or rebuilding public/remote-host/ yields a 503 instead of a compile error.
 */

async function loadManifest(origin: string, bypassSecret?: string) {
  const url = `${origin}/remote-host/manifest.json`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: bypassSecret ? { 'x-vercel-protection-bypass': bypassSecret } : {},
  });
  if (!res.ok) {
    throw Object.assign(new Error(`Host manifest unavailable at ${url} (HTTP ${res.status}). Run \`pnpm build:remote-host\`.`), {
      status: 503,
    });
  }
  return res.json();
}
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ flavour?: string[] }> },
) {
  const { flavour: segments } = await params;
  const single = segments?.length ? segments.join('/') : null;
  if (single && !isValidFlavour(single)) {
    return new Response('Unknown flavour. Expected /drupal-preview/<channel>/<experience>/<locale>', { status: 404 });
  }

  const env = (name: string) => process.env[name]?.trim() || undefined;
  const remoteOrigin = (env('REMOTE_ORIGIN') ?? request.nextUrl.origin).replace(/\/+$/, '');
  const publicOrigin = (env('REMOTE_PUBLIC_ORIGIN') ?? remoteOrigin).replace(/\/+$/, '');
  const assetOrigin = env('REMOTE_ASSET_ORIGIN') ?? '';
  const bypassSecret = getBypassHeaders()['x-vercel-protection-bypass'];
  const flavours = single ? [single] : (env('REMOTE_FLAVOURS')?.split(',').map((f) => f.trim()) ?? DEFAULT_FLAVOURS);

  try {
    const manifest = await loadManifest((assetOrigin || remoteOrigin).replace(/\/+$/, ''), bypassSecret);
    const payloads = await Promise.all(
      flavours.map((flavour) =>
        fetchPayload({ origin: remoteOrigin, flavour, bypassSecret, init: { cache: 'no-store' } }),
      ),
    );
    const host = resolveHostForPayloads(manifest, payloads);
    const base = '/drupal-preview';
    const hrefFor = (f: string) => (f === 'index' ? base : `${base}/${f}`);
    const allFlavours = env('REMOTE_FLAVOURS')?.split(',').map((f) => f.trim()) ?? DEFAULT_FLAVOURS;

    const embeds = payloads
      .map((payload) =>
        (single ? '' : `  <div class="embed-label">${payload.flavour}</div>\n`) + renderEmbed({ payload, publicOrigin }),
      )
      .join('\n');

    const html = renderPage({
      title: single ? `Remote navigation · ${single}` : 'Remote navigation · all flavours',
      manifest,
      host,
      assetOrigin,
      embeds,
      nav: renderNav(allFlavours, single ?? 'index', hrefFor),
      generator: 'app/drupal-preview route',
    });

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // Like Drupal's page cache: payloads re-fetched at most every 5 minutes per region
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (error) {
    return new Response(`Failed to render payload preview: ${String((error as Error).message ?? error)}`, {
      status: (error as { status?: number }).status ?? 502,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
