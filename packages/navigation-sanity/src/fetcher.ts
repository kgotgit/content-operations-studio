import { createClient } from '@sanity/client';
import { type NavigationDocument, NavigationDocumentSchema } from '@content-ops/navigation-contract';
import { GET_NAVIGATION_QUERY } from './queries';
import { getMockNavigationDocument } from './mockData';

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

/**
 * Fetches the navigation menu document from Sanity using GROQ and tagged Next.js ISR.
 * Resiliently falls back to mock reference data if Sanity is offline, empty, or unseeded.
 */
export async function getNavigationData(params: {
  channel?: string;
  experience?: string;
  locale?: string;
  useFallback?: boolean;
}): Promise<NavigationDocument> {
  const channel = params.channel || 'web';
  const experience = params.experience || 'general';
  const locale = params.locale || 'en-US';

  try {
    // Only attempt live fetch if Sanity is configured
    if (projectId && dataset) {
      const data = await sanityClient.fetch(
        GET_NAVIGATION_QUERY,
        { channel, experience, locale },
        {
          next: {
            tags: ['navigation', `nav-${experience}-${locale}`, `channel-${channel}`],
            revalidate: 86400, // 24 hours ISR, invalidated by webhook
          },
        } as any,
      );

      if (data && data.items && data.items.length > 0) {
        const parsed = NavigationDocumentSchema.safeParse(data);
        if (parsed.success) {
          return parsed.data;
        }
      }
    }
  } catch (error) {
    console.warn(`[getNavigationData] Sanity query skipped or failed, using reference mock:`, error);
  }

  // Resilient fallback to high-fidelity reference dataset
  return getMockNavigationDocument({ channel, experience, locale });
}
