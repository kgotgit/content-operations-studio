export const navItemL2 = {
  name: 'navItemL2',
  title: 'Level 2 Section Column',
  type: 'object',
  fields: [
    {
      name: 'id',
      title: 'Section Identifier',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'sectionTitle',
      title: 'Section Column Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'href',
      title: 'Section Overview Link (Optional)',
      type: 'string',
    },
    {
      name: 'items',
      title: 'Level 3 Links',
      type: 'array',
      of: [{ type: 'navItemL3' }],
      validation: (Rule: any) => Rule.required().min(1),
    },
  ],
  preview: {
    select: {
      title: 'sectionTitle',
      itemCount: 'items.length',
    },
    prepare({ title, itemCount }: { title: string; itemCount?: number }) {
      return {
        title,
        subtitle: `${itemCount || 0} links`,
      };
    },
  },
};
