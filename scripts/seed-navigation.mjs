import { createClient } from '@sanity/client';
import {
  MOCK_NAV_TARGETS,
  MOCK_NAVIGATION_DOCUMENTS,
} from '../packages/navigation-sanity/src/mockData';

const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '2wl7t8z4';
const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'dev';
const token = process.env.SANITY_AUTH_TOKEN;

function toSanityNavItems(items) {
  return items.map((item) => {
    const hasChildren = Array.isArray(item.navItems) && item.navItems.length > 0;
    const node = {
      _type: 'navItem',
      _key: item._key || item.id,
      label: item.label,
      ...(item.description ? { description: item.description } : {}),
      ...(item.badge ? { badge: item.badge } : {}),
      ...(item.icon ? { icon: item.icon } : {}),
      ...(item.openInNewTab ? { openInNewTab: item.openInNewTab } : {}),
      ...(item.analyticsTag ? { analyticsTag: item.analyticsTag } : {}),
      ...(item.promoCard ? { promoCard: item.promoCard } : {}),
    };
    if (hasChildren) {
      node.navItems = toSanityNavItems(item.navItems);
    } else if (item.target?._id) {
      node.target = { _type: 'reference', _ref: item.target._id };
    }
    return node;
  });
}

async function seed() {
  console.log(`[Seed Navigation] Target: Project ID "${projectId}", Dataset "${dataset}"`);

  if (!token) {
    console.log(`[Seed Navigation] Notice: SANITY_AUTH_TOKEN is not set in environment.`);
    console.log(
      `[Seed Navigation] Reference documents are already available in-memory via @content-ops/navigation-sanity and can be exported to sample-data/navigation-mock.ndjson.`,
    );
    console.log(`[Seed Navigation] You can import directly with Sanity CLI when ready:`);
    console.log(
      `  cd apps/content-studio && sanity dataset import ./sample-data/navigation-mock.ndjson ${dataset}`,
    );
    return;
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    token,
    useCdn: false,
  });

  console.log(`[Seed Navigation] Uploading ${MOCK_NAV_TARGETS.length} canonical navTarget documents...`);
  for (const target of MOCK_NAV_TARGETS) {
    await client.createOrReplace({
      _type: 'navTarget',
      ...target,
      ...(target.localizedUrlOverrides
        ? {
            localizedUrlOverrides: target.localizedUrlOverrides.map((o) => ({
              _type: 'localizedUrlOverride',
              _key: o.locale,
              ...o,
            })),
          }
        : {}),
    });
  }

  console.log(`[Seed Navigation] Uploading ${MOCK_NAVIGATION_DOCUMENTS.length} navigationMenu documents...`);
  for (const doc of MOCK_NAVIGATION_DOCUMENTS) {
    const sanityDoc = {
      _type: 'navigationMenu',
      _id: doc._id,
      title: doc.title,
      channel: doc.channel,
      experience: doc.experience,
      menuType: doc.menuType,
      locale: doc.locale,
      isCanonical: doc.isCanonical,
      smartling: doc.smartling,
      ...(doc.rootTarget?._id ? { rootTarget: { _type: 'reference', _ref: doc.rootTarget._id } } : {}),
      navItems: toSanityNavItems(doc.navItems),
    };
    await client.createOrReplace(sanityDoc);
    console.log(`  -> Synced: ${doc._id} (${doc.experience} / ${doc.menuType} / ${doc.locale})`);
  }

  console.log(`[Seed Navigation] Successfully completed!`);
}

seed().catch((err) => {
  console.error(`[Seed Navigation] Failed:`, err);
  process.exit(1);
});
