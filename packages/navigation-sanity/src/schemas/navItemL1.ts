export const navItemL1 = {
  name: 'navItemL1',
  title: 'Level 1 Top Nav Item',
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
      title: 'Nav Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'href',
      title: 'Direct Link (if not a Mega Menu)',
      type: 'string',
    },
    {
      name: 'isMegaMenu',
      title: 'Enable Mega Menu Dropdown',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'sections',
      title: 'Level 2 Columns',
      type: 'array',
      of: [{ type: 'navItemL2' }],
      hidden: ({ parent }: any) => !parent?.isMegaMenu,
    },
    {
      name: 'promoCard',
      title: 'Featured Promo Card',
      type: 'navPromoCard',
      hidden: ({ parent }: any) => !parent?.isMegaMenu,
    },
  ],
  preview: {
    select: {
      title: 'title',
      isMegaMenu: 'isMegaMenu',
      sections: 'sections.length',
    },
    prepare({ title, isMegaMenu, sections }: { title: string; isMegaMenu: boolean; sections?: number }) {
      return {
        title,
        subtitle: isMegaMenu ? `Mega Menu (${sections || 0} columns)` : 'Direct Link',
      };
    },
  },
};
