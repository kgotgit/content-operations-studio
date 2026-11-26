'use client';

import { useEffect, useState, type RefObject } from 'react';

/**
 * Resolves the nearest `.remote-nav-scope` element (inside the Shadow Root when embedded
 * via `<remote-component>`), so Radix UI Portals (MobileDrawer, SearchDialog, LocaleSelector)
 * render inside the Shadow DOM where Tailwind CSS is loaded rather than escaping to `document.body`.
 */
export function usePortalContainer(triggerRef: RefObject<HTMLElement | null>): HTMLElement | null {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;

    const scope = el.closest<HTMLElement>('.remote-nav-scope');
    if (scope) {
      setContainer(scope);
      return;
    }

    const root = el.getRootNode();
    if (root instanceof ShadowRoot && root.firstElementChild instanceof HTMLElement) {
      setContainer(root.firstElementChild);
    }
  }, [triggerRef]);

  return container;
}
