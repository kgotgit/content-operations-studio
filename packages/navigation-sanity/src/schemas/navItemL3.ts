export const navItemL3 = {
  name: 'navItemL3',
  title: 'Level 3 Nav Link',
  type: 'object',
  fields: [
    {
      name: 'id',
      title: 'Identifier',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'href',
      title: 'URL Path',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'badge',
      title: 'Badge (e.g. New, Popular)',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Short Description',
      type: 'string',
    },
    {
      name: 'icon',
      title: 'Lucide Icon Name',
      type: 'string',
    },
    {
      name: 'isExternal',
      title: 'Is External Link',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'analyticsTag',
      title: 'Analytics Identifier',
      type: 'string',
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'href',
      badge: 'badge',
    },
    prepare({ title, subtitle, badge }: { title: string; subtitle: string; badge?: string }) {
      return {
        title: badge ? `[${badge}] ${title}` : title,
        subtitle,
      };
    },
  },
};
