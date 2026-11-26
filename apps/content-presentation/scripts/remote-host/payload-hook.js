/**
 * Payload hook for the bundled `remote-components` HTML host.
 *
 * Goal: let a consumer (e.g. Drupal) server-render the remote component's HTML
 * response into the page, so the browser never calls the remote route.
 *
 * How it works:
 *  - The `<remote-component>` element (from `remote-components/host/html`) dispatches a
 *    synchronous, bubbling `beforeload` event right before it calls
 *    `fetchWithHooks(url, init, { onRequest, onResponse })`.
 *  - We listen for that event on `document` (capture phase) and attach an `onRequest`
 *    hook to the element. The library skips `fetch()` when `onRequest` resolves to a
 *    `Response`, and falls back to the network when it resolves to `undefined`.
 *  - The hook looks up the inlined payload in a `<template>`:
 *      1. `<remote-component payload="template-id">`: explicit template id
 *      2. `<template data-remote-component-payload data-src="...">`: matched by resolved src URL
 *      3. `window.RemoteComponentsHost.registerPayload(src, html)`: programmatic registry
 *
 * Because payloads are matched by `src`, a client-side `src` switch to a flavour that
 * wasn't inlined still works: it falls back to a normal network fetch.
 *
 * This module must be imported BEFORE `remote-components/host/html` so the listener
 * exists before the custom element is defined and upgraded.
 */

const PAYLOAD_ATTR = 'data-remote-component-payload';
const registry = new Map();
const stats = { served: [], fetched: [] };

function normalize(src) {
  try {
    return new URL(src, window.location.href).href;
  } catch {
    return String(src);
  }
}

function readTemplate(template) {
  if (!template) return null;
  // <template> content is an inert DocumentFragment; innerHTML serializes it back.
  const html = template.innerHTML;
  return html && html.trim() ? html : null;
}

function findPayload(element, url) {
  const href = normalize(url);

  // 1. Explicit template id on the element. Only honoured while it matches the
  //    current src, so a later src switch falls through to the network.
  const explicitId = element.getAttribute('payload');
  if (explicitId) {
    const template = document.getElementById(explicitId);
    const templateSrc = template?.getAttribute('data-src');
    if (template && (!templateSrc || normalize(templateSrc) === href)) {
      return readTemplate(template);
    }
  }

  // 2. Any payload template whose data-src matches the requested URL
  for (const template of document.querySelectorAll(`template[${PAYLOAD_ATTR}]`)) {
    if (normalize(template.getAttribute('data-src')) === href) {
      return readTemplate(template);
    }
  }

  // 3. Programmatic registry
  return registry.get(href) ?? null;
}

function payloadOnRequest(element) {
  return async (url) => {
    const html = findPayload(element, url);
    if (!html) {
      stats.fetched.push(String(url));
      return undefined; // let the library perform its normal fetch
    }
    stats.served.push(String(url));
    element.setAttribute('data-payload-source', 'inline');
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  };
}

/*
 * Declarative Shadow DOM handoff.
 *
 * The consumer may server-render the header into `<template shadowrootmode="open">` (real,
 * crawlable, styled DOM before any JS). Two things would otherwise go wrong at hydration:
 *  1. The library calls `attachShadow()`, which on a declarative shadow root removes all
 *     children: the header would blink out until the hydrated copy is rendered.
 *  2. Without cleanup, the snapshot and the hydrated component would both be visible.
 * So for hosts with a `data-rc-ssr` snapshot we return the existing root untouched, and
 * remove the snapshot in the same microtask the library inserts the live component
 * (MutationObserver callbacks run before the next paint, so there's no flash or layout shift).
 */
const SSR_ATTR = 'data-rc-ssr';

function watchHandoff(root) {
  if (root.__rcHandoff) return;
  root.__rcHandoff = true;
  const observer = new MutationObserver((mutations) => {
    const arrived = mutations.some((m) =>
      [...m.addedNodes].some(
        (n) =>
          n.nodeType === 1 &&
          !n.hasAttribute(SSR_ATTR) &&
          (n.matches('[data-bundle]') || n.querySelector('[data-bundle], #enterprise-header-navigation')),
      ),
    );
    if (!arrived) return;
    // Keep the snapshot's <link data-rc-ssr> stylesheets: same URLs as the library's, so no FOUC.
    root.querySelectorAll(`div[${SSR_ATTR}]`).forEach((n) => n.remove());
    observer.disconnect();
  });
  observer.observe(root, { childList: true, subtree: true });
}

if (typeof Element !== 'undefined' && !Element.prototype.attachShadow.__rcPatched) {
  const nativeAttachShadow = Element.prototype.attachShadow;
  const patched = function attachShadow(init) {
    const existing = this.shadowRoot;
    if (this.localName === 'remote-component' && existing && existing.querySelector(`[${SSR_ATTR}]`)) {
      watchHandoff(existing);
      return existing;
    }
    return nativeAttachShadow.call(this, init);
  };
  patched.__rcPatched = true;
  Element.prototype.attachShadow = patched;
}

if (typeof document !== 'undefined') {
  document.addEventListener(
    'beforeload',
    (event) => {
      const element = event.target;
      if (!element || element.localName !== 'remote-component') return;
      // Respect a consumer-supplied hook; otherwise install ours.
      if (typeof element.onRequest !== 'function' || element.onRequest.__payloadHook) {
        const hook = payloadOnRequest(element);
        hook.__payloadHook = true;
        element.onRequest = hook;
      }
    },
    true,
  );
}

export function registerPayload(src, html) {
  registry.set(normalize(src), html);
}

export function getStats() {
  return { served: [...stats.served], fetched: [...stats.fetched] };
}
