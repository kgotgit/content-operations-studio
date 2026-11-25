export const utilityLink = {
  name: 'utilityLink',
  title: 'Utility Link',
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
      title: 'Link Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'href',
      title: 'URL / Path',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'icon',
      title: 'Icon Name (Lucide)',
      type: 'string',
    },
    {
      name: 'requiresAuth',
      title: 'Requires Authentication',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'analyticsTag',
      title: 'Analytics Tag',
      type: 'string',
    },
  ],
};
