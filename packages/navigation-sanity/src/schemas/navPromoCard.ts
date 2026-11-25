export const navPromoCard = {
  name: 'navPromoCard',
  title: 'Navigation Promo Card',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Headline',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description Copy',
      type: 'text',
      rows: 2,
    },
    {
      name: 'ctaText',
      title: 'CTA Button Text',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'ctaUrl',
      title: 'CTA Destination URL',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'image',
      title: 'Promo Image',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'badge',
      title: 'Optional Badge (e.g. Featured)',
      type: 'string',
    },
  ],
};
