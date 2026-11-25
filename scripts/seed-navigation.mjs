import { createClient } from '@sanity/client';
import { MOCK_NAVIGATION_DOCUMENTS } from '../packages/navigation-sanity/src/mockData';

const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '2wl7t8z4';
const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'dev';
const token = process.env.SANITY_AUTH_TOKEN;

async function seed() {
  console.log(`[Seed Navigation] Target: Project ID "${projectId}", Dataset "${dataset}"`);

  if (!token) {
    console.log(
      `[Seed Navigation] Notice: SANITY_AUTH_TOKEN is not set in environment.`,
    );
    console.log(
      `[Seed Navigation] Reference documents are already available in-memory via @content-ops/navigation-sanity and written to sample-data/navigation-mock.ndjson.`,
    );
    console.log(
      `[Seed Navigation] You can import directly with Sanity CLI when ready:`,
    );
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

  console.log(`[Seed Navigation] Uploading ${MOCK_NAVIGATION_DOCUMENTS.length} reference documents...`);

  for (const doc of MOCK_NAVIGATION_DOCUMENTS) {
    const sanityDoc = {
      _type: 'navigationMenu',
      ...doc,
    };
    await client.createOrReplace(sanityDoc);
    console.log(`  -> Synced: ${doc._id} (${doc.experience} - ${doc.locale})`);
  }

  console.log(`[Seed Navigation] Successfully completed!`);
}

seed().catch((err) => {
  console.error(`[Seed Navigation] Failed:`, err);
  process.exit(1);
});
