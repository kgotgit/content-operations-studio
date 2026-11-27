<?php
declare(strict_types=1);

/**
 * True PHP 8.x consumer demonstrating Drupal-style server-side rendering of the
 * decoupled Next.js remote navigation component.
 *
 * Flow:
 *   1. Makes ONE server-side HTTP call to:
 *        GET {REMOTE_ORIGIN}/api/remote/navigation/{channel}/{experience}/{locale}
 *      with optional `x-vercel-protection-bypass` header.
 *   2. Receives `{ host, ssr, payload, src, version }` as JSON (zero HTML parsing in PHP).
 *   3. Emits:
 *        - `<script type="module" src="{host.url}" integrity="{host.integrity}" crossorigin="anonymous">`
 *        - `<template id="rc-payload-..." data-remote-component-payload data-src="{src}">{payload}</template>`
 *        - `<remote-component src="{src}" payload="rc-payload-..."><template shadowrootmode="open">{ssr}</template></remote-component>`
 *   4. Sets `Cache-Control: public, s-maxage=300, stale-while-revalidate=3600` for edge caching.
 */

const SUPPORTED_CHANNELS = ['web', 'mobile', 'email', 'agentic'];
const SUPPORTED_EXPERIENCES = ['retail', 'advisorServices', 'wealthManagement', 'retirementServices', 'workPlaceServices'];
const SUPPORTED_LOCALES = ['en-US', 'en-HK', 'en-SG', 'es', 'zh-Hant', 'zh-Hans'];

function env_str(string $key, string $default = ''): string {
    $val = getenv($key);
    if ($val === false) {
        return $default;
    }
    $trimmed = trim($val);
    return $trimmed !== '' ? $trimmed : $default;
}

function h(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Parse /{experience}/{locale} or /{channel}/{experience}/{locale} or query params.
 * @return array{channel: string, experience: string, locale: string}
 */
function resolve_route(): array {
    $channel = env_str('DEFAULT_CHANNEL', 'web');
    $experience = env_str('DEFAULT_EXPERIENCE', 'retail');
    $locale = env_str('DEFAULT_LOCALE', 'en-US');

    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $segments = array_values(array_filter(explode('/', trim($path, '/')), static fn(string $s): bool => $s !== ''));

    // Strip leading "api/index.php" if invoked directly
    if (count($segments) >= 2 && $segments[0] === 'api' && $segments[1] === 'index.php') {
        $segments = array_slice($segments, 2);
    }

    if (count($segments) === 2) {
        [$experience, $locale] = $segments;
    } elseif (count($segments) >= 3) {
        [$channel, $experience, $locale] = $segments;
    }

    if (isset($_GET['channel']) && is_string($_GET['channel'])) {
        $channel = $_GET['channel'];
    }
    if (isset($_GET['experience']) && is_string($_GET['experience'])) {
        $experience = $_GET['experience'];
    }
    if (isset($_GET['locale']) && is_string($_GET['locale'])) {
        $locale = $_GET['locale'];
    }

    return [
        'channel' => $channel,
        'experience' => $experience,
        'locale' => $locale,
    ];
}

/**
 * Fetch the single JSON envelope from the Next.js remote app.
 * @return array{ok: bool, status: int, data: ?array, error: ?string, elapsedMs: int, url: string}
 */
function fetch_navigation_envelope(string $remoteOrigin, string $channel, string $experience, string $locale, string $bypassSecret): array {
    $url = rtrim($remoteOrigin, '/') . "/api/remote/navigation/{$channel}/{$experience}/{$locale}";
    $headers = [
        'Accept: application/json',
        'User-Agent: drupal-php-consumer/1.0',
    ];
    if ($bypassSecret !== '') {
        $headers[] = "x-vercel-protection-bypass: {$bypassSecret}";
    }

    $started = microtime(true);

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 5,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_HTTPHEADER => $headers,
        ]);
        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        $elapsedMs = (int) round((microtime(true) - $started) * 1000);
        if ($body === false) {
            return ['ok' => false, 'status' => 502, 'data' => null, 'error' => "cURL error: {$curlErr}", 'elapsedMs' => $elapsedMs, 'url' => $url];
        }
    } else {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => 5,
                'ignore_errors' => true,
                'header' => implode("\r\n", $headers) . "\r\n",
            ],
        ]);
        $body = @file_get_contents($url, false, $context);
        $status = 0;
        if (isset($http_response_header[0]) && preg_match('/HTTP\/\S+\s+(\d+)/', $http_response_header[0], $m)) {
            $status = (int) $m[1];
        }
        $elapsedMs = (int) round((microtime(true) - $started) * 1000);
        if ($body === false) {
            return ['ok' => false, 'status' => 502, 'data' => null, 'error' => 'HTTP stream fetch failed', 'elapsedMs' => $elapsedMs, 'url' => $url];
        }
    }

    if ($status < 200 || $status >= 300) {
        $hint = ($status === 401 || $status === 403)
            ? ' (Vercel Deployment Protection? Set VERCEL_AUTOMATION_BYPASS_SECRET)'
            : '';
        return ['ok' => false, 'status' => $status ?: 502, 'data' => null, 'error' => "Remote returned HTTP {$status}{$hint}", 'elapsedMs' => $elapsedMs, 'url' => $url];
    }

    $decoded = json_decode($body, true);
    if (!is_array($decoded) || !isset($decoded['host']['url'], $decoded['ssr'], $decoded['payload'], $decoded['src'])) {
        return ['ok' => false, 'status' => 502, 'data' => null, 'error' => 'Invalid JSON envelope from remote navigation endpoint', 'elapsedMs' => $elapsedMs, 'url' => $url];
    }

    return ['ok' => true, 'status' => $status, 'data' => $decoded, 'error' => null, 'elapsedMs' => $elapsedMs, 'url' => $url];
}

// ── Main request handler ───────────────────────────────────────────────────────

$route = resolve_route();
$channel = $route['channel'];
$experience = $route['experience'];
$locale = $route['locale'];

if (
    !in_array($channel, SUPPORTED_CHANNELS, true) ||
    !in_array($experience, SUPPORTED_EXPERIENCES, true) ||
    !in_array($locale, SUPPORTED_LOCALES, true)
) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Unsupported route. Expected /{experience}/{locale} or /{channel}/{experience}/{locale}.\n";
    echo "Example: /retail/en-US, /retail/zh-Hant, /advisorServices/en-US\n";
    exit;
}

$remoteOrigin = env_str('REMOTE_ORIGIN', 'http://localhost:3000');
$bypassSecret = env_str('VERCEL_AUTOMATION_BYPASS_SECRET', '');
$robots = env_str('ROBOTS_DIRECTIVE', (env_str('VERCEL_ENV') === 'production') ? 'index, follow' : 'noindex');

$result = fetch_navigation_envelope($remoteOrigin, $channel, $experience, $locale, $bypassSecret);

if (!$result['ok']) {
    http_response_code(502);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    echo '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Navigation Unavailable</title></head><body style="font-family:sans-serif;padding:32px;max-width:720px;margin:0 auto;">';
    echo '<h1>Remote Navigation Unavailable</h1>';
    echo '<p><strong>Error:</strong> ' . h((string) $result['error']) . '</p>';
    echo '<p><strong>Endpoint:</strong> <code>' . h($result['url']) . '</code></p>';
    echo '<p>Check <code>REMOTE_ORIGIN</code> and (for protected preview deployments) <code>VERCEL_AUTOMATION_BYPASS_SECRET</code>.</p>';
    echo '</body></html>';
    exit;
}

$nav = $result['data'];
$flavourSlug = "{$channel}-{$experience}-{$locale}";
$payloadId = "rc-payload-{$flavourSlug}";

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https') ? 'https' : 'http';
$hostHeader = $_SERVER['HTTP_HOST'] ?? 'localhost:8080';
$selfOrigin = "{$scheme}://{$hostHeader}";
$canonicalUrl = "{$selfOrigin}/{$experience}/{$locale}";

header('Content-Type: text/html; charset=utf-8');
header("Content-Language: {$locale}");
header('Cache-Control: public, s-maxage=300, stale-while-revalidate=3600');

$quickLinks = [
    ['label' => 'Retail (en-US)', 'href' => '/retail/en-US'],
    ['label' => 'Retail (zh-Hant)', 'href' => '/retail/zh-Hant'],
    ['label' => 'Retail (es)', 'href' => '/retail/es'],
    ['label' => 'Advisor Services (en-US)', 'href' => '/advisorServices/en-US'],
    ['label' => 'Wealth Management (en-US)', 'href' => '/wealthManagement/en-US'],
    ['label' => 'Retirement Services (en-US)', 'href' => '/retirementServices/en-US'],
    ['label' => 'Workplace Services (en-US)', 'href' => '/workPlaceServices/en-US'],
];
?>
<!DOCTYPE html>
<html lang="<?= h($locale) ?>">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="<?= h($robots) ?>" />
  <meta name="description" content="<?= h("Server-rendered PHP / Drupal consumer embedding APEX {$experience} navigation ({$locale}) via Declarative Shadow DOM.") ?>" />
  <link rel="canonical" href="<?= h($canonicalUrl) ?>" />
<?php foreach (SUPPORTED_LOCALES as $altLocale): ?>
  <link rel="alternate" hreflang="<?= h($altLocale) ?>" href="<?= h("{$selfOrigin}/{$experience}/{$altLocale}") ?>" />
<?php endforeach; ?>
  <link rel="alternate" hreflang="x-default" href="<?= h("{$selfOrigin}/{$experience}/en-US") ?>" />
  <title><?= h("APEX {$experience} ({$locale}) · Drupal PHP Consumer") ?></title>

  <!-- Prebuilt remote-components HTML host bundle (from single JSON envelope) -->
  <link rel="modulepreload"
        href="<?= h($nav['host']['url']) ?>"
        integrity="<?= h($nav['host']['integrity']) ?>"
        crossorigin="anonymous" />
  <script type="module"
          src="<?= h($nav['host']['url']) ?>"
          integrity="<?= h($nav['host']['integrity']) ?>"
          crossorigin="anonymous"></script>

  <style>
    body { margin: 0; font-family: Georgia, 'Times New Roman', serif; background: #f4f4f2; color: #1e293b; }
    .cms-bar { background: #0f172a; color: #e2e8f0; padding: 7px 18px; font: 12px/1.4 ui-sans-serif, system-ui, sans-serif; display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; }
    .cms-badge { display: inline-block; padding: 3px 8px; border-radius: 4px; background: #0073aa; color: #fff; font: 700 11px/1 ui-sans-serif, system-ui, sans-serif; letter-spacing: .04em; }
    main { max-width: 1100px; margin: 32px auto; padding: 32px; background: #fff; border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .switcher { display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0; }
    .switcher a { padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 6px; text-decoration: none; color: #0f172a; font: 600 13px/1.2 ui-sans-serif, system-ui, sans-serif; background: #f8fafc; }
    .switcher a[aria-current="page"] { background: #1d4ed8; color: #fff; border-color: #1d4ed8; }
    pre { font: 12px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace; background: #0f172a; color: #e2e8f0; padding: 14px 16px; border-radius: 6px; overflow-x: auto; }
  </style>
</head>
<body>
  <div class="cms-bar">
    <span>Drupal / PHP <?= h(PHP_VERSION) ?> Server-Side Consumer &bull; 1 JSON fetch (<?= h((string) $result['elapsedMs']) ?>ms) &bull; Zero HTML parsing</span>
    <span>Host <?= h((string) ($nav['version'] ?? 'unknown')) ?> (<?= h((string) ($nav['host']['mode'] ?? 'production')) ?>)</span>
  </div>

  <!-- 1. Inert hydration payload (consumed by payload-hook.js via onRequest; zero browser fetch) -->
  <template id="<?= h($payloadId) ?>"
            data-remote-component-payload
            data-src="<?= h($nav['src']) ?>"><?= $nav['payload'] ?></template>

  <!-- 2. Real, crawlable Declarative Shadow DOM header (0ms CLS, works without JS) -->
  <remote-component src="<?= h($nav['src']) ?>" payload="<?= h($payloadId) ?>"><template shadowrootmode="open"><?= $nav['ssr'] ?></template></remote-component>

  <main id="main-content">
    <div class="cms-badge">PHP <?= h(PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION) ?> &bull; DRUPAL CONSUMER</div>
    <h1 style="margin: 12px 0 8px;">APEX <?= h(ucfirst($experience)) ?> (<?= h($locale) ?>)</h1>
    <p style="line-height: 1.6;">
      This page is rendered server-side by <strong>true PHP</strong> (<code>apps/drupal-consumer/api/index.php</code>).
      PHP made a single HTTP request to <code>/api/remote/navigation/<?= h("{$channel}/{$experience}/{$locale}") ?></code>,
      received the host bundle URL, clean Declarative Shadow DOM markup, and hydration payload in one JSON response,
      and echoed them directly with zero HTML parsing.
    </p>

    <nav class="switcher" aria-label="Test flavours and locales">
<?php foreach ($quickLinks as $link): ?>
      <a href="<?= h($link['href']) ?>"<?= ($link['href'] === "/{$experience}/{$locale}") ? ' aria-current="page"' : '' ?>><?= h($link['label']) ?></a>
<?php endforeach; ?>
    </nav>

    <h2 style="font-size: 16px; margin-top: 24px;">Runtime Verification Report</h2>
    <pre id="runtime-report">Waiting for hydration…</pre>
  </main>

  <script type="module">
    const report = () => {
      const remoteCalls = performance.getEntriesByType('resource')
        .filter((e) => e.name.includes('/remote/navigation/'))
        .map((e) => e.name);
      const stats = window.RemoteComponentsHost?.getStats?.() ?? { served: [], fetched: [] };
      const el = document.querySelector('remote-component');
      const output = {
        consumer: 'php-drupal',
        phpVersion: <?= json_encode(PHP_VERSION) ?>,
        serverFetchMs: <?= json_encode($result['elapsedMs']) ?>,
        hostVersion: window.RemoteComponentsHost?.version ?? null,
        servedFromPayload: stats.served.length,
        networkFallbacks: stats.fetched.length,
        browserRemoteRouteRequests: remoteCalls,
        payloadSource: el?.getAttribute('data-payload-source') ?? 'pending',
        hydrated: !!el?.shadowRoot?.querySelector('#enterprise-header-navigation'),
        ssrSnapshotsRemaining: el?.shadowRoot?.querySelectorAll('div[data-rc-ssr]').length ?? 0,
      };
      window.__PAYLOAD_REPORT__ = output;
      document.getElementById('runtime-report').textContent = JSON.stringify(output, null, 2);
    };
    document.addEventListener('load', (e) => { if (e.target.localName === 'remote-component') setTimeout(report, 50); }, true);
    window.addEventListener('load', () => setTimeout(report, 1200));
  </script>
</body>
</html>
