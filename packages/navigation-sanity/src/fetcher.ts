import { createClient } from '@sanity/client';
import {
  DEFAULT_LOCALE,
  NavigationDocumentSchema,
  resolveTargetHref,
  type MenuType,
  type NavItem,
  type NavigationDocument,
  type SupportedLocale,
} from '@content-ops/navigation-contract';
import { GET_NAVIGATION_QUERY, GET_SECTION_NAVIGATIONS_QUERY } from './queries';
import { getMockNavigationDocument, getMockSectionNavigations } from './mockData';

declare const process: any;

function getEnv(key: string, fallback: string): string {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || fallback;
  }
  return fallback;
}

const projectId = getEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', getEnv('SANITY_PROJECT_ID', '2wl7t8z4'));
const dataset = getEnv('NEXT_PUBLIC_SANITY_DATASET', getEnv('SANITY_DATASET', 'dev'));
const apiVersion = getEnv('NEXT_PUBLIC_SANITY_API_VERSION', '2024-01-01');
// Optional server-only read token (required for private datasets). Never prefix with NEXT_PUBLIC_.
const token = getEnv('SANITY_API_READ_TOKEN', '') || undefined;

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  perspective: 'published',
  // The API CDN does not serve authenticated requests; Next's data cache handles caching.
  useCdn: !token && getEnv('NODE_ENV', '') === 'production',
});

function stripNulls<T>(value: T): T {
  if (value === null || value === undefined) return undefined as T;
  if (Array.isArray(value)) {
    return value.map((item) => stripNulls(item)).filter((item) => item !== undefined) as T;
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== null && v !== undefined) {
        out[k] = stripNulls(v);
      }
    }
    return out as T;
  }
  return value;
}

function hydrateNavItemHrefs(items: NavItem[], locale: SupportedLocale): NavItem[] {
  return items.map((item) => {
    const hasChildren = Array.isArray(item.navItems) && item.navItems.length > 0;
    return {
      ...item,
      href: hasChildren ? undefined : item.href || resolveTargetHref(item.target, locale),
      navItems: hasChildren ? hydrateNavItemHrefs(item.navItems!, locale) : undefined,
    };
  });
}

/**
 * Fetches a scoped navigation menu document from Sanity using GROQ and tagged Next.js ISR.
 * Resiliently falls back to the Apex reference dataset if Sanity is offline, empty, or unseeded.
 */
export async function getNavigationData(params: {
  channel?: string;
  experience?: string;
  menuType?: MenuType;
  locale?: string;
  useFallback?: boolean;
}): Promise<NavigationDocument> {
  const channel = params.channel || 'web';
  const experience = params.experience || 'retail';
  const menuType: MenuType = params.menuType || 'global';
  const locale = (params.locale || DEFAULT_LOCALE) as SupportedLocale;

  try {
    if (projectId && dataset) {
      const data = await sanityClient.fetch(
        GET_NAVIGATION_QUERY,
        { channel, experience, menuType, locale },
        {
          next: {
            tags: ['navigation', `nav-${experience}-${menuType}-${locale}`, `channel-${channel}`],
            revalidate: 86400, // 24 hours ISR, invalidated by webhook
          },
        } as any,
      );

      if (data && Array.isArray(data.navItems) && data.navItems.length > 0) {
        const parsed = NavigationDocumentSchema.safeParse(stripNulls(data));
        if (parsed.success) {
          return {
            ...parsed.data,
            navItems: hydrateNavItemHrefs(parsed.data.navItems, locale),
          };
        }
        console.warn('[getNavigationData] Sanity document failed schema validation:', parsed.error.issues);
      }
    }
  } catch (error) {
    console.warn(`[getNavigationData] Sanity query skipped or failed, using reference mock:`, error);
  }

  return getMockNavigationDocument({ channel, experience, menuType, locale });
}

/**
 * Fetches Section Navigation menus (L3 -> L4/L5) for a given experience and locale.
 */
export async function getSectionNavigations(params: {
  channel?: string;
  experience?: string;
  locale?: string;
}): Promise<NavigationDocument[]> {
  const channel = params.channel || 'web';
  const experience = params.experience || 'retail';
  const locale = (params.locale || DEFAULT_LOCALE) as SupportedLocale;

  try {
    if (projectId && dataset) {
      const data = await sanityClient.fetch(
        GET_SECTION_NAVIGATIONS_QUERY,
        { channel, experience, locale },
        {
          next: {
            tags: ['navigation', `nav-${experience}-section-${locale}`, `channel-${channel}`],
            revalidate: 86400,
          },
        } as any,
      );

      if (Array.isArray(data) && data.length > 0) {
        const valid: NavigationDocument[] = [];
        for (const item of data) {
          const parsed = NavigationDocumentSchema.safeParse(stripNulls(item));
          if (parsed.success) {
            valid.push({
              ...parsed.data,
              navItems: hydrateNavItemHrefs(parsed.data.navItems, locale),
            });
          } else {
            console.warn('[getSectionNavigations] Sanity document failed schema validation:', parsed.error.issues);
          }
        }
        if (valid.length > 0) return valid;
      }
    }
  } catch (error) {
    console.warn(`[getSectionNavigations] Sanity query skipped or failed, using reference mock:`, error);
  }

  return getMockSectionNavigations({ channel, experience, locale });
}
