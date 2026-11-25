import { NextResponse } from 'next/server';

const ISOLATED_CSS = `
/* Remote Navigation Stylesheet for Legacy Drupal Embedding */
.remote-nav-scope {
  --nav-primary: #1e3a8a;
  --nav-primary-hover: #172554;
  --nav-accent: #2563eb;
  --nav-bg: #ffffff;
  --nav-text: #0f172a;
  --nav-border: #e2e8f0;

  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  line-height: 1.5;
  box-sizing: border-box;
}

.remote-nav-scope *,
.remote-nav-scope *::before,
.remote-nav-scope *::after {
  box-sizing: inherit;
}
`;

export async function GET() {
  return new NextResponse(ISOLATED_CSS, {
    status: 200,
    headers: {
      'Content-Type': 'text/css; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
