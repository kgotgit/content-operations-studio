import { defineArrayMember, defineField, defineType } from 'sanity';
import { MENU_TYPE_MAX_DEPTH, type MenuType } from '@content-ops/navigation-contract';

interface RawNavNode {
  navItems?: RawNavNode[];
}

function measureMaxDepth(items: RawNavNode[] | undefined, currentDepth = 1): number {
  if (!Array.isArray(items) || items.length === 0) return 0;
  let deepest = currentDepth;
  for (const item of items) {
    if (Array.isArray(item?.navItems) && item.navItems.length > 0) {
      const childDepth = measureMaxDepth(item.navItems, currentDepth + 1);
      if (childDepth > deepest) deepest = childDepth;
    }
  }
  return deepest;
}

export const navigationMenu = defineType({
  name: 'navigationMenu',
  title: 'Navigation Menu',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Internal Admin Title',
      type: 'string',
      description: 'e.g. Web | Retail | Global Header | en-US',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'experience',
      title: 'Experience / Business Line',
      type: 'string',
      options: {
        list: [
          { title: 'Retail (Personal Investing)', value: 'retail' },
          { title: 'Advisor Services', value: 'advisorServices' },
          { title: 'Wealth Management', value: 'wealthManagement' },
          { title: 'Retirement Services', value: 'retirementServices' },
          { title: 'Workplace Services', value: 'workPlaceServices' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'menuType',
      title: 'Menu Type',
      type: 'string',
      initialValue: 'global',
      description:
        'Defines the UI slot, governance ownership, and maximum allowed nesting depth (Global Header: max 3 levels; Section Nav: L3+ handoff).',
      options: {
        list: [
          { title: 'Global Header Navigation (Max 3 Levels)', value: 'global' },
          { title: 'Section / Local Navigation (L3+)', value: 'section' },
          { title: 'Footer Navigation (Max 2 Levels)', value: 'footer' },
          { title: 'Utility Bar Navigation (Max 1 Level)', value: 'utility' },
          { title: 'Contextual Navigation', value: 'contextual' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'channel',
      title: 'Channel',
      type: 'string',
      initialValue: 'web',
      options: {
        list: [
          { title: 'Web', value: 'web' },
          { title: 'Mobile App', value: 'mobile' },
          { title: 'Email', value: 'email' },
          { title: 'Agentic Bot', value: 'agentic' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'locale',
      title: 'Locale',
      type: 'string',
      initialValue: 'en-US',
      options: {
        list: [
          { title: 'United States (English - en-US)', value: 'en-US' },
          { title: 'Hong Kong (English - en-HK)', value: 'en-HK' },
          { title: 'Singapore (English - en-SG)', value: 'en-SG' },
          { title: 'Español (es)', value: 'es' },
          { title: '繁體中文 (Traditional Chinese - zh-Hant)', value: 'zh-Hant' },
          { title: '简体中文 (Simplified Chinese - zh-Hans)', value: 'zh-Hans' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'isCanonical',
      title: 'Is Canonical Source (en-US Master)',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'smartling',
      title: 'Smartling Translation Metadata',
      type: 'smartlingMetadata',
    }),
    defineField({
      name: 'rootTarget',
      title: 'Section Root Target (L3 Anchor)',
      type: 'reference',
      to: [{ type: 'navTarget' }],
      description:
        'Required for Section Navigation: links this local menu to the Level 3 Navigation Target in the Global Header.',
      hidden: ({ document }) => document?.menuType !== 'section',
      validation: (rule) =>
        rule.custom((value, context) => {
          const doc = context.document as { menuType?: string } | undefined;
          if (doc?.menuType === 'section' && !value) {
            return 'Section Navigation menus must reference a Section Root Target (the Level 3 destination).';
          }
          return true;
        }),
    }),
    defineField({
      name: 'navItems',
      title: 'Navigation Items',
      type: 'array',
      of: [defineArrayMember({ type: 'navItem' })],
      validation: (rule) =>
        rule.required().min(1).custom((items, context) => {
          const doc = context.document as { menuType?: MenuType } | undefined;
          const menuType: MenuType = doc?.menuType || 'global';
          const maxDepth = MENU_TYPE_MAX_DEPTH[menuType] ?? 3;
          const actualDepth = measureMaxDepth(items as RawNavNode[] | undefined);
          if (actualDepth > maxDepth) {
            return `Menu type "${menuType}" allows at most ${maxDepth} level(s) of nesting (found ${actualDepth}). Move deeper links into a Section Navigation document.`;
          }
          return true;
        }),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      channel: 'channel',
      experience: 'experience',
      menuType: 'menuType',
      locale: 'locale',
      isCanonical: 'isCanonical',
    },
    prepare({ title, channel, experience, menuType, locale, isCanonical }) {
      return {
        title: title || `${experience} [${menuType || 'global'}] [${locale}]`,
        subtitle: `${channel?.toUpperCase()} | ${experience} | ${menuType || 'global'} | ${locale} ${isCanonical ? '★ Canonical' : ''}`,
      };
    },
  },
});
