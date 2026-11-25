import { z } from 'zod';

export const EXPERIENCES = ['general', 'retirement', 'advisorservices'] as const;
export type ExperienceType = (typeof EXPERIENCES)[number];

export const CHANNELS = ['web', 'mobile', 'email', 'agentic'] as const;
export type ChannelType = (typeof CHANNELS)[number];

export const LOCALES = ['en-US', 'en-HK', 'en-SG', 'es', 'zh-Hant', 'zh-Hans'] as const;
export type SupportedLocale = (typeof LOCALES)[number];

export const LOCALE_METADATA: Record<
  SupportedLocale,
  { label: string; language: string; region: string; direction: 'ltr' | 'rtl' }
> = {
  'en-US': { label: 'United States (English)', language: 'en', region: 'US', direction: 'ltr' },
  'en-HK': { label: 'Hong Kong (English)', language: 'en', region: 'HK', direction: 'ltr' },
  'en-SG': { label: 'Singapore (English)', language: 'en', region: 'SG', direction: 'ltr' },
  es: { label: 'Español', language: 'es', region: 'US', direction: 'ltr' },
  'zh-Hant': { label: '繁體中文 (Traditional Chinese)', language: 'zh', region: 'Hant', direction: 'ltr' },
  'zh-Hans': { label: '简体中文 (Simplified Chinese)', language: 'zh', region: 'Hans', direction: 'ltr' },
};

export const SmartlingMetadataSchema = z.object({
  jobId: z.string().optional(),
  status: z.enum(['source', 'in_progress', 'translated']).default('source'),
  lastSyncedAt: z.string().optional(),
});
export type SmartlingMetadata = z.infer<typeof SmartlingMetadataSchema>;

export const NavItemLevel3Schema = z.object({
  id: z.string(),
  title: z.string(),
  href: z.string(),
  badge: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  isExternal: z.boolean().optional(),
  analyticsTag: z.string().optional(),
});
export type NavItemLevel3 = z.infer<typeof NavItemLevel3Schema>;

export const NavItemLevel2Schema = z.object({
  id: z.string(),
  sectionTitle: z.string(),
  href: z.string().optional(),
  items: z.array(NavItemLevel3Schema).optional().default([]),
});
export type NavItemLevel2 = z.infer<typeof NavItemLevel2Schema>;

export const NavPromoCardSchema = z.object({
  title: z.string(),
  description: z.string(),
  ctaText: z.string(),
  ctaUrl: z.string(),
  imageUrl: z.string().optional(),
  badge: z.string().optional(),
});
export type NavPromoCard = z.infer<typeof NavPromoCardSchema>;

export const NavItemLevel1Schema = z.object({
  id: z.string(),
  title: z.string(),
  href: z.string().optional(),
  isMegaMenu: z.boolean().optional(),
  sections: z.array(NavItemLevel2Schema).optional(),
  promoCard: NavPromoCardSchema.optional(),
});
export type NavItemLevel1 = z.infer<typeof NavItemLevel1Schema>;

export const UtilityItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  href: z.string(),
  icon: z.string().optional(),
  requiresAuth: z.boolean().optional(),
  analyticsTag: z.string().optional(),
});
export type UtilityItem = z.infer<typeof UtilityItemSchema>;

export const ExperienceOptionSchema = z.object({
  id: z.enum(EXPERIENCES),
  title: z.string(),
  href: z.string(),
  current: z.boolean().optional(),
});
export type ExperienceOption = z.infer<typeof ExperienceOptionSchema>;

export const LocaleOptionSchema = z.object({
  code: z.enum(LOCALES),
  label: z.string(),
  direction: z.enum(['ltr', 'rtl']).optional(),
  current: z.boolean().optional(),
});
export type LocaleOption = z.infer<typeof LocaleOptionSchema>;

export const NavigationDocumentSchema = z.object({
  _id: z.string().optional(),
  title: z.string(),
  channel: z.enum(CHANNELS),
  experience: z.enum(EXPERIENCES),
  locale: z.enum(LOCALES),
  isCanonical: z.boolean().optional(),
  smartling: SmartlingMetadataSchema.optional(),
  utilityLinks: z.array(UtilityItemSchema).optional().default([]),
  items: z.array(NavItemLevel1Schema).default([]),
  experienceSwitcherLinks: z.array(ExperienceOptionSchema).optional(),
  localeOptions: z.array(LocaleOptionSchema).optional(),
});
export type NavigationDocument = z.infer<typeof NavigationDocumentSchema>;

export function isSupportedExperience(val: string): val is ExperienceType {
  return EXPERIENCES.includes(val as ExperienceType);
}

export function isSupportedChannel(val: string): val is ChannelType {
  return CHANNELS.includes(val as ChannelType);
}

export function isSupportedLocale(val: string): val is SupportedLocale {
  return LOCALES.includes(val as SupportedLocale);
}
