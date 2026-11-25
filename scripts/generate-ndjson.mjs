import fs from 'fs';
import path from 'path';
import { MOCK_NAVIGATION_DOCUMENTS } from '../packages/navigation-sanity/src/mockData.ts';

const outputPath = path.resolve('apps/content-studio/sample-data/navigation-mock.ndjson');
const ndjsonContent = MOCK_NAVIGATION_DOCUMENTS.map((doc) =>
  JSON.stringify({ _type: 'navigationMenu', ...doc }),
).join('\n');

fs.writeFileSync(outputPath, ndjsonContent, 'utf-8');
console.log(`Wrote ${MOCK_NAVIGATION_DOCUMENTS.length} NDJSON records to ${outputPath}`);
