import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Uniform recursive Navigation Item used across all levels of a navigationMenu.
 *
 * Derived clickability rule:
 * - Branch (navItems has items): click opens dropdown/submenu; `target` is hidden/disallowed.
 * - Leaf (navItems is empty): clickable & navigable; `target` reference is required.
 */
export const navItem = defineType({
  name: 'navItem',
  title: 'Navigation Item',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Display Label',
      type: 'string',
      description:
        'Required for dropdown/branch items. Optional override for leaf links (defaults to the referenced Navigation Target title).',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { navItems?: unknown[] } | undefined;
          const isBranch = Array.isArray(parent?.navItems) && parent.navItems.length > 0;
          if (isBranch && !value) {
            return 'Display label is required for dropdown/branch navigation items.';
          }
          return true;
        }),
    }),
    defineField({
      name: 'target',
      title: 'Navigation Target (Canonical Destination)',
      type: 'reference',
      to: [{ type: 'navTarget' }],
      description:
        'Required for clickable leaf items (when Child Nav Items is empty). Hidden when this item has child items.',
      hidden: ({ parent }) => Array.isArray(parent?.navItems) && parent.navItems.length > 0,
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { navItems?: unknown[] } | undefined;
          const isBranch = Array.isArray(parent?.navItems) && parent.navItems.length > 0;
          if (!isBranch && !value) {
            return 'A Navigation Target is required when this item has no child nav items.';
          }
          if (isBranch && value) {
            return 'Dropdown/branch items with child nav items should not have a direct Navigation Target.';
          }
          return true;
        }),
    }),
    defineField({
      name: 'description',
      title: 'Contextual Description Override',
      type: 'text',
      rows: 2,
      description: 'Optional menu-specific description overriding the canonical target description.',
    }),
    defineField({
      name: 'badge',
      title: 'Badge',
      type: 'string',
      description: 'Optional pill badge, e.g. "New", "Popular", "Zero Fee".',
    }),
    defineField({
      name: 'icon',
      title: 'Icon Name',
      type: 'string',
      description: 'Optional Lucide icon name.',
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Open in New Tab',
      type: 'boolean',
      initialValue: false,
      hidden: ({ parent }) => Array.isArray(parent?.navItems) && parent.navItems.length > 0,
    }),
    defineField({
      name: 'analyticsTag',
      title: 'Analytics Tag Override',
      type: 'string',
    }),
    defineField({
      name: 'promoCard',
      title: 'Featured Promo Card (Optional)',
      type: 'navPromoCard',
      description: 'Optional promotional card displayed inside a top-level mega-menu dropdown.',
      hidden: ({ parent }) => !Array.isArray(parent?.navItems) || parent.navItems.length === 0,
    }),
    defineField({
      name: 'navItems',
      title: 'Child Nav Items',
      type: 'array',
      description:
        'Add child items to turn this node into a dropdown/group. Leave empty to make it a clickable link.',
      of: [defineArrayMember({ type: 'navItem' })],
    }),
  ],
  preview: {
    select: {
      label: 'label',
      targetTitle: 'target.title',
      targetPath: 'target.canonicalPath',
      children: 'navItems',
      badge: 'badge',
    },
    prepare({ label, targetTitle, targetPath, children, badge }) {
      const childCount = Array.isArray(children) ? children.length : 0;
      const displayTitle = label || targetTitle || 'Untitled Item';
      const badgeText = badge ? ` [${badge}]` : '';
      return {
        title: `${displayTitle}${badgeText}`,
        subtitle:
          childCount > 0
            ? `Dropdown (${childCount} child item${childCount === 1 ? '' : 's'})`
            : `Link → ${targetPath || targetTitle || 'Unlinked'}`,
      };
    },
  },
});
