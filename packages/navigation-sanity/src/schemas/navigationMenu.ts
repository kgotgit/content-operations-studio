export const navigationMenu = {
  name: 'navigationMenu',
  title: 'Navigation Menu',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Internal Admin Title',
      type: 'string',
      description: 'e.g. Web - General/Prospects - en-US',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'channel',
      title: 'Channel',
      type: 'string',
      options: {
        list: [
          { title: 'Web', value: 'web' },
          { title: 'Mobile App', value: 'mobile' },
          { title: 'Email', value: 'email' },
          { title: 'Agentic Bot', value: 'agentic' },
        ],
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'experience',
      title: 'Experience / Flavor',
      type: 'string',
      options: {
        list: [
          { title: 'General / Prospects (Retail)', value: 'general' },
          { title: 'Workplace & Retirement', value: 'retirement' },
          { title: 'Advisor Services', value: 'advisorservices' },
        ],
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'locale',
      title: 'Locale',
      type: 'string',
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
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'isCanonical',
      title: 'Is Canonical Source (en-US Master)',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'smartling',
      title: 'Smartling Translation Metadata',
      type: 'smartlingMetadata',
    },
    {
      name: 'utilityLinks',
      title: 'Top Utility Links',
      type: 'array',
      of: [{ type: 'utilityLink' }],
    },
    {
      name: 'items',
      title: 'Level 1 Navigation Items',
      type: 'array',
      of: [{ type: 'navItemL1' }],
      validation: (Rule: any) => Rule.required().min(1),
    },
  ],
  preview: {
    select: {
      title: 'title',
      channel: 'channel',
      experience: 'experience',
      locale: 'locale',
      isCanonical: 'isCanonical',
    },
    prepare({ title, channel, experience, locale, isCanonical }: any) {
      return {
        title: title || `${experience} [${locale}]`,
        subtitle: `${channel?.toUpperCase()} | ${experience} | ${locale} ${isCanonical ? '★ Canonical' : ''}`,
      };
    },
  },
};
