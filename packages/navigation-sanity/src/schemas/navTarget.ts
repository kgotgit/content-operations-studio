import { defineArrayMember, defineField, defineType } from 'sanity';

const EXPERIENCE_OPTIONS = [
  { title: 'Enterprise (Shared Across Experiences)', value: 'enterprise' },
  { title: 'Retail (Personal Investing)', value: 'retail' },
  { title: 'Advisor Services', value: 'advisorServices' },
  { title: 'Wealth Management', value: 'wealthManagement' },
  { title: 'Retirement Services', value: 'retirementServices' },
  { title: 'Workplace Services', value: 'workPlaceServices' },
];

const LOCALE_OPTIONS = [
  { title: 'United States (English - en-US)', value: 'en-US' },
  { title: 'Hong Kong (English - en-HK)', value: 'en-HK' },
  { title: 'Singapore (English - en-SG)', value: 'en-SG' },
  { title: 'Español (es)', value: 'es' },
  { title: '繁體中文 (Traditional Chinese - zh-Hant)', value: 'zh-Hant' },
  { title: '简体中文 (Simplified Chinese - zh-Hans)', value: 'zh-Hans' },
];

export const navTarget = defineType({
  name: 'navTarget',
  title: 'Navigation Target (Canonical Destination)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Canonical Title (en-US)',
      type: 'string',
      description: 'Default display label used when a menu item does not specify a contextual override.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'owningExperience',
      title: 'Owning Experience / Governance Scope',
      type: 'string',
      initialValue: 'enterprise',
      options: {
        list: EXPERIENCE_OPTIONS,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'destinationType',
      title: 'Destination Source',
      type: 'string',
      initialValue: 'legacy',
      description:
        'Strangler Fig switch: start with Legacy CMS URL, then flip to Sanity Page once migrated — without editing any navigation menus.',
      options: {
        list: [
          { title: 'Legacy CMS Path', value: 'legacy' },
          { title: 'Sanity Page (Internal Reference)', value: 'sanityPage' },
          { title: 'External URL', value: 'external' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'canonicalPath',
      title: 'Canonical Path (Locale-Agnostic)',
      type: 'string',
      description:
        'Default-locale path without locale prefix (e.g. /retail/accounts/brokerage). Non-default locales automatically receive /es/, /zh-hant/, etc.',
      hidden: ({ document }) => document?.destinationType === 'external',
      validation: (rule) =>
        rule.custom(async (value, context) => {
          const doc = context.document as { destinationType?: string; _id?: string } | undefined;
          if (doc?.destinationType === 'legacy' && !value) {
            return 'Canonical path is required for Legacy CMS destinations.';
          }
          if (!value) return true;
          if (!value.startsWith('/')) {
            return 'Canonical path must start with "/" (e.g. /retail/accounts/brokerage).';
          }
          const client = context.getClient({ apiVersion: '2024-01-01' });
          const rawId = (doc?._id || '').replace(/^drafts\./, '');
          const existing = await client.fetch<string | null>(
            `*[_type == "navTarget" && canonicalPath == $path && !(_id in [$draftId, $publishedId])][0]._id`,
            {
              path: value,
              draftId: `drafts.${rawId}`,
              publishedId: rawId,
            },
          );
          if (existing) {
            return `A Navigation Target already exists for "${value}" (${existing}). Reuse the existing target instead of creating a duplicate.`;
          }
          return true;
        }),
    }),
    defineField({
      name: 'legacyId',
      title: 'Legacy CMS Identifier',
      type: 'string',
      description: 'Optional legacy node/page ID for migration traceability.',
      hidden: ({ document }) => document?.destinationType !== 'legacy',
    }),
    defineField({
      name: 'internalPage',
      title: 'Sanity Page Reference',
      type: 'reference',
      to: [{ type: 'post' }],
      description: 'Reference to the migrated Sanity page/document (Phase 2).',
      hidden: ({ document }) => document?.destinationType !== 'sanityPage',
      validation: (rule) =>
        rule.custom((value, context) => {
          const doc = context.document as { destinationType?: string } | undefined;
          if (doc?.destinationType === 'sanityPage' && !value) {
            return 'Select a Sanity page reference when Destination Source is Sanity Page.';
          }
          return true;
        }),
    }),
    defineField({
      name: 'externalUrl',
      title: 'External URL',
      type: 'url',
      hidden: ({ document }) => document?.destinationType !== 'external',
      validation: (rule) =>
        rule.custom((value, context) => {
          const doc = context.document as { destinationType?: string } | undefined;
          if (doc?.destinationType === 'external' && !value) {
            return 'External URL is required when Destination Source is External URL.';
          }
          return true;
        }),
    }),
    defineField({
      name: 'localizedUrlOverrides',
      title: 'Localized URL Overrides (Optional)',
      type: 'array',
      description:
        'Only needed if a specific locale uses a translated legacy slug instead of the automatic /{locale}{canonicalPath} prefix.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'localizedUrlOverride',
          fields: [
            defineField({
              name: 'locale',
              title: 'Locale',
              type: 'string',
              options: { list: LOCALE_OPTIONS },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'Override Path or URL',
              type: 'string',
              description: 'e.g. /es/cuentas/corretaje',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: { title: 'locale', subtitle: 'url' },
          },
        }),
      ],
    }),
    defineField({
      name: 'description',
      title: 'Default Description',
      type: 'text',
      rows: 2,
      description: 'Short summary surfaced in mega-menus, search, and agentic bot context.',
    }),
    defineField({
      name: 'analyticsId',
      title: 'Analytics Identifier',
      type: 'string',
      description: 'e.g. nav:retail:brokerage',
    }),
    defineField({
      name: 'status',
      title: 'Lifecycle Status',
      type: 'string',
      initialValue: 'active',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Deprecated', value: 'deprecated' },
          { title: 'Redirected', value: 'redirected' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      path: 'canonicalPath',
      externalUrl: 'externalUrl',
      owningExperience: 'owningExperience',
      destinationType: 'destinationType',
      status: 'status',
    },
    prepare({ title, path, externalUrl, owningExperience, destinationType, status }) {
      const dest = destinationType === 'external' ? externalUrl : path;
      const statusBadge = status && status !== 'active' ? ` [${status.toUpperCase()}]` : '';
      return {
        title: `${title || 'Untitled Target'}${statusBadge}`,
        subtitle: `${owningExperience || 'enterprise'} • ${destinationType || 'legacy'} • ${dest || 'no path'}`,
      };
    },
  },
});
