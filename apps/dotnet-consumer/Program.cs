using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;

var builder = WebApplication.CreateBuilder(args);

var remoteOrigin = (
    Environment.GetEnvironmentVariable("REMOTE_ORIGIN")
    ?? builder.Configuration["RemoteNavigation:Origin"]
    ?? "http://localhost:3000"
).TrimEnd('/');

var bypassSecret = (
    Environment.GetEnvironmentVariable("VERCEL_AUTOMATION_BYPASS_SECRET")
    ?? builder.Configuration["RemoteNavigation:BypassSecret"]
    ?? string.Empty
).Trim();

var cacheTtlSeconds = int.TryParse(
    Environment.GetEnvironmentVariable("CACHE_TTL_SECONDS")
    ?? builder.Configuration["RemoteNavigation:CacheTtlSeconds"],
    out var parsedTtl) && parsedTtl >= 0
    ? parsedTtl
    : 300;

builder.Services.AddMemoryCache();
builder.Services.AddHttpClient("RemoteNav", client =>
{
    client.BaseAddress = new Uri(remoteOrigin + "/");
    client.Timeout = TimeSpan.FromSeconds(5);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
    client.DefaultRequestHeaders.Add("User-Agent", "dotnet-consumer/1.0");
    if (!string.IsNullOrEmpty(bypassSecret))
    {
        client.DefaultRequestHeaders.Add("x-vercel-protection-bypass", bypassSecret);
    }
});

var app = builder.Build();

var supportedChannels = new HashSet<string>(StringComparer.Ordinal) { "web", "mobile", "email", "agentic" };
var supportedExperiences = new HashSet<string>(StringComparer.Ordinal) { "retail", "advisorServices", "wealthManagement", "retirementServices", "workPlaceServices" };
var supportedLocales = new[] { "en-US", "en-HK", "en-SG", "es", "zh-Hant", "zh-Hans" };
var supportedLocaleSet = new HashSet<string>(supportedLocales, StringComparer.Ordinal);

var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    runtime = RuntimeInformation.FrameworkDescription,
    remoteOrigin,
    cacheTtlSeconds,
}));

app.MapGet("/", (HttpContext ctx, IHttpClientFactory httpFactory, IMemoryCache cache) =>
    HandlePageAsync(ctx, "web", "retail", "en-US", httpFactory, cache));

app.MapGet("/{experience}/{locale}", (
    string experience,
    string locale,
    HttpContext ctx,
    IHttpClientFactory httpFactory,
    IMemoryCache cache) =>
    HandlePageAsync(ctx, "web", experience, locale, httpFactory, cache));

app.MapGet("/{channel}/{experience}/{locale}", (
    string channel,
    string experience,
    string locale,
    HttpContext ctx,
    IHttpClientFactory httpFactory,
    IMemoryCache cache) =>
    HandlePageAsync(ctx, channel, experience, locale, httpFactory, cache));

app.Run();

async Task<IResult> HandlePageAsync(
    HttpContext ctx,
    string channel,
    string experience,
    string locale,
    IHttpClientFactory httpFactory,
    IMemoryCache cache)
{
    if (!supportedChannels.Contains(channel)
        || !supportedExperiences.Contains(experience)
        || !supportedLocaleSet.Contains(locale))
    {
        return Results.Text(
            "Unsupported route. Expected /{experience}/{locale} or /{channel}/{experience}/{locale}.\n"
            + "Examples: /general/en-US, /general/zh-Hant, /retirement/en-US\n",
            "text/plain; charset=utf-8",
            statusCode: 404);
    }

    var cacheKey = $"remote-nav:{channel}:{experience}:{locale}";
    var cacheHit = true;
    var sw = Stopwatch.StartNew();

    RemoteNavEnvelope? nav = null;
    if (cacheTtlSeconds > 0)
    {
        cache.TryGetValue(cacheKey, out nav);
    }

    if (nav is null)
    {
        cacheHit = false;
        var client = httpFactory.CreateClient("RemoteNav");
        var endpoint = $"api/remote/navigation/{channel}/{experience}/{locale}";

        try
        {
            using var response = await client.GetAsync(endpoint, ctx.RequestAborted);
            if (!response.IsSuccessStatusCode)
            {
                var statusCode = (int)response.StatusCode;
                var hint = statusCode is 401 or 403
                    ? " (Vercel Deployment Protection? Set VERCEL_AUTOMATION_BYPASS_SECRET)"
                    : string.Empty;
                return RenderError($"Remote returned HTTP {statusCode}{hint}", $"{remoteOrigin}/{endpoint}");
            }

            nav = await response.Content.ReadFromJsonAsync<RemoteNavEnvelope>(jsonOptions, ctx.RequestAborted);
            if (nav is null || string.IsNullOrEmpty(nav.Host?.Url) || string.IsNullOrEmpty(nav.Ssr) || string.IsNullOrEmpty(nav.Payload))
            {
                return RenderError("Invalid JSON envelope from remote navigation endpoint", $"{remoteOrigin}/{endpoint}");
            }

            if (cacheTtlSeconds > 0)
            {
                cache.Set(cacheKey, nav, TimeSpan.FromSeconds(cacheTtlSeconds));
            }
        }
        catch (Exception ex)
        {
            return RenderError($"Fetch failed: {ex.Message}", $"{remoteOrigin}/{endpoint}");
        }
    }

    sw.Stop();

    var robots = Environment.GetEnvironmentVariable("ROBOTS_DIRECTIVE")?.Trim();
    if (string.IsNullOrEmpty(robots))
    {
        robots = app.Environment.IsProduction() ? "index, follow" : "noindex";
    }

    var selfOrigin = $"{ctx.Request.Scheme}://{ctx.Request.Host}";
    var canonical = $"{selfOrigin}/{experience}/{locale}";
    var payloadId = $"rc-payload-{channel}-{experience}-{locale}";
    var escapedTitle = WebUtility.HtmlEncode($"APEX {experience} ({locale}) · ASP.NET Core Consumer");
    var escapedDesc = WebUtility.HtmlEncode(
        $"Server-rendered ASP.NET Core 8 consumer embedding APEX {experience} navigation ({locale}) via Declarative Shadow DOM.");

    var alternates = new StringBuilder();
    foreach (var alt in supportedLocales)
    {
        alternates.AppendLine(
            $"  <link rel=\"alternate\" hreflang=\"{WebUtility.HtmlEncode(alt)}\" href=\"{WebUtility.HtmlEncode($"{selfOrigin}/{experience}/{alt}")}\" />");
    }
    alternates.AppendLine(
        $"  <link rel=\"alternate\" hreflang=\"x-default\" href=\"{WebUtility.HtmlEncode($"{selfOrigin}/{experience}/en-US")}\" />");

    var quickLinks = new (string Label, string Href)[]
    {
        ("Retail (en-US)", "/retail/en-US"),
        ("Retail (zh-Hant)", "/retail/zh-Hant"),
        ("Retail (es)", "/retail/es"),
        ("Advisor Services (en-US)", "/advisorServices/en-US"),
        ("Wealth Management (en-US)", "/wealthManagement/en-US"),
        ("Retirement Services (en-US)", "/retirementServices/en-US"),
        ("Workplace Services (en-US)", "/workPlaceServices/en-US"),
    };

    var switcherHtml = new StringBuilder();
    foreach (var (label, href) in quickLinks)
    {
        var current = string.Equals(href, $"/{experience}/{locale}", StringComparison.Ordinal)
            ? " aria-current=\"page\""
            : string.Empty;
        switcherHtml.AppendLine($"      <a href=\"{WebUtility.HtmlEncode(href)}\"{current}>{WebUtility.HtmlEncode(label)}</a>");
    }

    var frameworkDesc = RuntimeInformation.FrameworkDescription;
    var experienceTitle = char.ToUpperInvariant(experience[0]) + experience[1..];
    var cacheLabel = cacheHit ? "IMemoryCache HIT" : $"1 JSON fetch ({sw.ElapsedMilliseconds}ms)";

    var html = $$"""
<!DOCTYPE html>
<html lang="{{WebUtility.HtmlEncode(locale)}}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="{{WebUtility.HtmlEncode(robots)}}" />
  <meta name="description" content="{{escapedDesc}}" />
  <link rel="canonical" href="{{WebUtility.HtmlEncode(canonical)}}" />
{{alternates}}  <title>{{escapedTitle}}</title>

  <!-- Prebuilt remote-components HTML host bundle (from single JSON envelope) -->
  <link rel="modulepreload"
        href="{{WebUtility.HtmlEncode(nav.Host.Url)}}"
        integrity="{{WebUtility.HtmlEncode(nav.Host.Integrity)}}"
        crossorigin="anonymous" />
  <script type="module"
          src="{{WebUtility.HtmlEncode(nav.Host.Url)}}"
          integrity="{{WebUtility.HtmlEncode(nav.Host.Integrity)}}"
          crossorigin="anonymous"></script>

  <style>
    body { margin: 0; font-family: Georgia, 'Times New Roman', serif; background: #f4f4f2; color: #1e293b; }
    .cms-bar { background: #1e1b4b; color: #e0e7ff; padding: 7px 18px; font: 12px/1.4 ui-sans-serif, system-ui, sans-serif; display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; }
    .cms-badge { display: inline-block; padding: 3px 8px; border-radius: 4px; background: #512bd4; color: #fff; font: 700 11px/1 ui-sans-serif, system-ui, sans-serif; letter-spacing: .04em; }
    main { max-width: 1100px; margin: 32px auto; padding: 32px; background: #fff; border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .switcher { display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0; }
    .switcher a { padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 6px; text-decoration: none; color: #0f172a; font: 600 13px/1.2 ui-sans-serif, system-ui, sans-serif; background: #f8fafc; }
    .switcher a[aria-current="page"] { background: #512bd4; color: #fff; border-color: #512bd4; }
    pre { font: 12px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace; background: #0f172a; color: #e2e8f0; padding: 14px 16px; border-radius: 6px; overflow-x: auto; }
  </style>
</head>
<body>
  <div class="cms-bar">
    <span>ASP.NET Core ({{WebUtility.HtmlEncode(frameworkDesc)}}) Consumer &bull; {{WebUtility.HtmlEncode(cacheLabel)}} &bull; Zero HTML parsing</span>
    <span>Host {{WebUtility.HtmlEncode(nav.Version)}} ({{WebUtility.HtmlEncode(nav.Host.Mode)}})</span>
  </div>

  <!-- 1. Inert hydration payload (consumed by payload-hook.js via onRequest; zero browser fetch) -->
  <template id="{{WebUtility.HtmlEncode(payloadId)}}"
            data-remote-component-payload
            data-src="{{WebUtility.HtmlEncode(nav.Src)}}">{{nav.Payload}}</template>

  <!-- 2. Real, crawlable Declarative Shadow DOM header (0ms CLS, works without JS) -->
  <remote-component src="{{WebUtility.HtmlEncode(nav.Src)}}" payload="{{WebUtility.HtmlEncode(payloadId)}}"><template shadowrootmode="open">{{nav.Ssr}}</template></remote-component>

  <main id="main-content">
    <div class="cms-badge">.NET 8 &bull; ASP.NET CORE CONSUMER</div>
    <h1 style="margin: 12px 0 8px;">APEX {{WebUtility.HtmlEncode(experienceTitle)}} ({{WebUtility.HtmlEncode(locale)}})</h1>
    <p style="line-height: 1.6;">
      This page is rendered server-side by <strong>ASP.NET Core 8</strong> (<code>apps/dotnet-consumer/Program.cs</code>).
      It makes a single HTTP call to <code>/api/remote/navigation/{{WebUtility.HtmlEncode($"{channel}/{experience}/{locale}")}}</code>,
      caches the typed JSON envelope in <code>IMemoryCache</code>, and writes the host bundle, Declarative Shadow DOM markup,
      and hydration payload directly into the HTML response with zero HTML parsing.
    </p>

    <nav class="switcher" aria-label="Test flavours and locales">
{{switcherHtml}}    </nav>

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
        consumer: 'aspnet-core',
        runtime: {{JsonSerializer.Serialize(frameworkDesc)}},
        cacheHit: {{(cacheHit ? "true" : "false")}},
        serverFetchMs: {{sw.ElapsedMilliseconds}},
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
""";

    ctx.Response.Headers["Content-Language"] = locale;
    ctx.Response.Headers["Cache-Control"] = "public, s-maxage=300, stale-while-revalidate=3600";
    return Results.Content(html, "text/html; charset=utf-8");
}

IResult RenderError(string message, string endpoint)
{
    var html = $"""
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Navigation Unavailable</title></head>
<body style="font-family:sans-serif;padding:32px;max-width:720px;margin:0 auto;">
  <h1>Remote Navigation Unavailable</h1>
  <p><strong>Error:</strong> {WebUtility.HtmlEncode(message)}</p>
  <p><strong>Endpoint:</strong> <code>{WebUtility.HtmlEncode(endpoint)}</code></p>
  <p>Check <code>REMOTE_ORIGIN</code> and (for protected preview deployments) <code>VERCEL_AUTOMATION_BYPASS_SECRET</code>.</p>
</body>
</html>
""";
    return Results.Content(html, "text/html; charset=utf-8", statusCode: 502);
}

sealed record RemoteNavHost(
    [property: JsonPropertyName("url")] string Url,
    [property: JsonPropertyName("file")] string File,
    [property: JsonPropertyName("mode")] string Mode,
    [property: JsonPropertyName("integrity")] string Integrity,
    [property: JsonPropertyName("sha256")] string Sha256);

sealed record RemoteNavEnvelope(
    [property: JsonPropertyName("version")] string Version,
    [property: JsonPropertyName("flavour")] string Flavour,
    [property: JsonPropertyName("src")] string Src,
    [property: JsonPropertyName("host")] RemoteNavHost Host,
    [property: JsonPropertyName("ssr")] string Ssr,
    [property: JsonPropertyName("payload")] string Payload);
