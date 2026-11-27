import fs from 'fs';
import path from 'path';
import {
  MOCK_NAV_TARGETS,
  MOCK_NAVIGATION_DOCUMENTS,
} from '../packages/navigation-sanity/src/mockData.ts';

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

const outputPath = path.resolve('apps/content-studio/sample-data/navigation-mock.ndjson');
const records = [
  ...MOCK_NAV_TARGETS.map((target) =>
    JSON.stringify({
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
    }),
  ),
  ...MOCK_NAVIGATION_DOCUMENTS.map((doc) =>
    JSON.stringify({
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
    }),
  ),
];

fs.writeFileSync(outputPath, records.join('\n') + '\n', 'utf-8');
console.log(
  `Wrote ${MOCK_NAV_TARGETS.length} navTarget + ${MOCK_NAVIGATION_DOCUMENTS.length} navigationMenu NDJSON records to ${outputPath}`,
);
