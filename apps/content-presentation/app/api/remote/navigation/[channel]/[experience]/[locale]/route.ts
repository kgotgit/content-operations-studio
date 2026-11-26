import { NextRequest, NextResponse } from 'next/server';
import {
  isSupportedChannel,
  isSupportedExperience,
  isSupportedLocale,
} from '@content-ops/navigation-contract';
import {
  extractSsrMarkup,
  fetchPayload,
  resolveHostForPayloads,
} from '@/scripts/remote-host/payload-page.mjs';
import { getBypassHeaders } from '@/lib/env';

/**
 * Single-fetch JSON envelope for non-Next.js server-side consumers (Drupal/PHP, ASP.NET Core, etc.).
 *
 *   GET /api/remote/navigation/<channel>/<experience>/<locale>
 *
 * Returns one atomic JSON object containing:
 *   - `host`:    versioned ESM host bundle URL, SRI integrity, sha256, mode
 *   - `ssr`:     clean Declarative Shadow DOM markup (stylesheets absolutized, scripts stripped)
 *   - `payload`: raw remote component HTML for client-side hydration via `onRequest`
 *
 * Consumers make 1 HTTP call, do zero HTML parsing, and get guaranteed version consistency
 * across `host`, `ssr`, and `payload` from the same deployment.
 */

async function loadManifest(origin: string, bypassSecret?: string) {
  const url = `${origin}/remote-host/manifest.json`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: bypassSecret ? { 'x-vercel-protection-bypass': bypassSecret } : {},
  });
  if (!res.ok) {
    throw Object.assign(
      new Error(`Host manifest unavailable at ${url} (HTTP ${res.status}). Run \`pnpm build:remote-host\`.`),
      { status: 503 },
    );
  }
  return res.json();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channel: string; experience: string; locale: string }> },
) {
  const { channel, experience, locale } = await params;

  if (
    !isSupportedChannel(channel) ||
    !isSupportedExperience(experience) ||
    !isSupportedLocale(locale)
  ) {
    return NextResponse.json(
      { error: 'Unsupported channel, experience, or locale', channel, experience, locale },
      { status: 404 },
    );
  }

  const env = (name: string) => process.env[name]?.trim() || undefined;
  const remoteOrigin = (env('REMOTE_ORIGIN') ?? request.nextUrl.origin).replace(/\/+$/, '');
  const publicOrigin = (env('REMOTE_PUBLIC_ORIGIN') ?? remoteOrigin).replace(/\/+$/, '');
  const assetOrigin = (env('REMOTE_ASSET_ORIGIN') ?? publicOrigin).replace(/\/+$/, '');
  const bypassSecret = getBypassHeaders()['x-vercel-protection-bypass'];
  const flavour = `${channel}/${experience}/${locale}`;

  try {
    const [manifest, payload] = await Promise.all([
      loadManifest(assetOrigin, bypassSecret),
      fetchPayload({ origin: remoteOrigin, flavour, bypassSecret, init: { cache: 'no-store' } }),
    ]);

    const host = resolveHostForPayloads(manifest, [payload]);
    const ssr = extractSsrMarkup(payload.html, publicOrigin);

    return NextResponse.json(
      {
        version: manifest.version,
        flavour,
        channel,
        experience,
        locale,
        src: `${publicOrigin}/remote/navigation/${flavour}`,
        host: {
          url: `${assetOrigin}/remote-host/${host.file}`,
          file: host.file,
          mode: host.mode,
          integrity: host.integrity,
          sha256: host.sha256 ?? manifest.sha256,
        },
        ssr,
        payload: payload.html,
        generatedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
          'X-Robots-Tag': 'noindex',
        },
      },
    );
  } catch (error) {
    const status = (error as { status?: number }).status ?? 502;
    return NextResponse.json(
      { error: String((error as Error).message ?? error) },
      { status },
    );
  }
}
