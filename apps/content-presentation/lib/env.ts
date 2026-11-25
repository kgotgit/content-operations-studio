/**
 * Server-side environment configuration for content-presentation.
 *
 * All Vercel / Sanity / remote-delivery settings are read here so route handlers and
 * config share one source of truth. See `.env.example` for the full list.
 *
 * Never import this file from a Client Component: it reads server-only secrets.
 */

function read(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

const stripSlash = (url: string) => url.replace(/\/+$/, '');
const withProtocol = (host: string) => (/^https?:\/\//.test(host) ? host : `https://${host}`);

export const isProduction = process.env.NODE_ENV === 'production';
/** `production` | `preview` | `development` (Vercel sets VERCEL_ENV). */
export const vercelEnv = read('VERCEL_ENV') ?? (isProduction ? 'production' : 'development');

/**
 * Public origin of this deployment, used for absolute URLs (remote `src`, host bundle).
 * Order: explicit NEXT_PUBLIC_SITE_URL, then the Vercel production domain (production
 * deployments), then the per-deployment Vercel URL, then localhost.
 */
export function getSiteOrigin(): string {
  const explicit = read('NEXT_PUBLIC_SITE_URL');
  if (explicit) return stripSlash(withProtocol(explicit));
  const productionHost = read('VERCEL_PROJECT_PRODUCTION_URL');
  if (vercelEnv === 'production' && productionHost) return stripSlash(withProtocol(productionHost));
  const deploymentHost = read('VERCEL_URL');
  if (deploymentHost) return stripSlash(withProtocol(deploymentHost));
  return `http://localhost:${read('PORT') ?? '3000'}`;
}

/**
 * Origin the remote navigation payload is fetched from server-side.
 * Defaults to this deployment, so previews fetch their own matching build.
 */
export function getRemoteOrigin(): string {
  const explicit = read('REMOTE_ORIGIN');
  return explicit ? stripSlash(explicit) : getSiteOrigin();
}

/**
 * Vercel Deployment Protection bypass for server-to-server calls (Protection Bypass for
 * Automation). The `remote-components` library also reads this same variable.
 */
export function getBypassHeaders(): Record<string, string> {
  const secret = read('VERCEL_AUTOMATION_BYPASS_SECRET');
  return secret ? { 'x-vercel-protection-bypass': secret } : {};
}

/** Shared secret for the Sanity/Smartling revalidation webhook. */
export function getRevalidationSecret(): string | undefined {
  const secret = read('REVALIDATION_SECRET');
  if (secret) return secret;
  // A predictable default is acceptable locally only.
  return vercelEnv === 'development' && !read('VERCEL') ? 'local-dev-revalidation-secret' : undefined;
}
