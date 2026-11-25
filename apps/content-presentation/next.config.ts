import type { NextConfig } from "next";
import { withRemoteComponentsConfig } from "remote-components/config/nextjs";

/**
 * Origin allowed to load the remote navigation cross-origin (e.g. the Drupal site).
 * The navigation is public content, so "*" is the default. Set a single origin to
 * restrict it (multiple origins would need a proxy.ts that echoes the request origin).
 */
const corsOrigin = process.env.REMOTE_CORS_ALLOW_ORIGIN?.trim() || "*";

const corsHeaders = [
  { key: "Access-Control-Allow-Origin", value: corsOrigin },
  { key: "Access-Control-Allow-Methods", value: "GET, HEAD, OPTIONS" },
  { key: "Access-Control-Allow-Headers", value: "Accept, Content-Type" },
  ...(corsOrigin === "*" ? [] : [{ key: "Vary", value: "Origin" }]),
];

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return {
      // beforeFiles: always render at request time, even if a stale static copy exists in public/
      beforeFiles: [
        { source: "/drupal-pages", destination: "/drupal-preview" },
        { source: "/drupal-pages/index.html", destination: "/drupal-preview" },
        {
          // /drupal-pages/web-general-zh-Hant.html -> /drupal-preview/web/general/zh-Hant
          source: "/drupal-pages/:channel([a-z]+)-:experience([a-z]+)-:locale([A-Za-z]+(?:-[A-Za-z]+)?)\\.html",
          destination: "/drupal-preview/:channel/:experience/:locale",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [
      // Remote component HTML (fallback fetch when no inline payload) + isolated stylesheet
      { source: "/remote/:path*", headers: corsHeaders },
      // Hydration chunks/CSS referenced by the payload, loaded from the consumer's origin
      { source: "/_next/static/:path*", headers: corsHeaders },
      // Bundled HTML host: loaded with crossorigin + SRI, so CORS is mandatory
      { source: "/remote-host/:path*", headers: corsHeaders },
      {
        // Content-hashed bundles + maps never change
        source: "/remote-host/:file([^/]+\\.[0-9a-f]{8}\\.js(?:\\.map)?)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // Manifest and the stable alias must pick up new releases quickly
        source: "/remote-host/:file(manifest\\.json|remote-components-host\\.js)",
        headers: [{ key: "Cache-Control", value: "public, max-age=60, s-maxage=300, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default withRemoteComponentsConfig(nextConfig);
