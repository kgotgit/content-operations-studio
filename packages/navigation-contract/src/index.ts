import { z } from 'zod';

export const EXPERIENCES = [
  'retail',
  'advisorServices',
  'wealthManagement',
  'retirementServices',
  'workPlaceServices',
] as const;
export type ExperienceType = (typeof EXPERIENCES)[number];

export const EXPERIENCE_METADATA: Record<
  ExperienceType,
  { label: string; shortLabel: string; description: string }
> = {
  retail: {
    label: 'Personal & Retail Investing',
    shortLabel: 'Retail',
    description:
      'Direct-to-consumer brokerage, IRAs, automated & advisor-guided investing, cash management, and investor education.',
  },
  advisorServices: {
    label: 'Advisor Services',
    shortLabel: 'Advisor Services',
    description:
      'Custodial platform, transition consulting, block trading, wealth services, and practice management for independent RIAs.',
  },
  wealthManagement: {
    label: 'Private Wealth Management',
    shortLabel: 'Wealth Management',
    description:
      'Dedicated private wealth advisory, family office solutions, custom portfolios, trust & estate planning, and liquidity facilities.',
  },
  retirementServices: {
    label: 'Retirement Plan Services',
    shortLabel: 'Retirement Services',
    description:
      'Institutional 401(k), 403(b), nonqualified & pooled plans, fiduciary oversight, recordkeeping, and participant engagement.',
  },
  workPlaceServices: {
    label: 'Workplace Financial Services',
    shortLabel: 'Workplace Services',
    description:
      'Equity compensation administration, integrated workplace benefits, financial wellness programs, and global plan compliance.',
  },
};

export const MENU_TYPES = ['global', 'section', 'footer', 'utility', 'contextual'] as const;
export type MenuType = (typeof MENU_TYPES)[number];

export const MENU_TYPE_LABELS: Record<MenuType, string> = {
  global: 'Global Header Navigation',
  section: 'Section / Local Navigation',
  footer: 'Footer Navigation',
  utility: 'Utility Bar Navigation',
  contextual: 'Contextual Navigation',
};

/**
 * Enforced maximum nesting depth per menuType.
 * Global Header is capped at 3 levels (L1 -> L2 -> L3); Level 3 hands off to Section Nav.
 */
export const MENU_TYPE_MAX_DEPTH: Record<MenuType, number> = {
  global: 3,
  section: 3,
  footer: 2,
  utility: 1,
  contextual: 3,
};

export const CHANNELS = ['web', 'mobile', 'email', 'agentic'] as const;
export type ChannelType = (typeof CHANNELS)[number];

export const DEFAULT_LOCALE = 'en-US' as const;
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

export const DESTINATION_TYPES = ['legacy', 'sanityPage', 'external'] as const;
export type DestinationType = (typeof DESTINATION_TYPES)[number];

export const NAV_TARGET_STATUSES = ['active', 'deprecated', 'redirected'] as const;
export type NavTargetStatus = (typeof NAV_TARGET_STATUSES)[number];

export const LocalizedUrlOverrideSchema = z.object({
  locale: z.enum(LOCALES),
  url: z.string(),
});
export type LocalizedUrlOverride = z.infer<typeof LocalizedUrlOverrideSchema>;

/**
 * Canonical Destination Registry ("Strangler Fig" layer).
 * Menus reference a NavTarget so migrating a page from legacy CMS to Sanity Pages
 * requires updating only this single document.
 */
export const NavTargetSchema = z.object({
  _id: z.string(),
  title: z.string(),
  owningExperience: z.enum([...EXPERIENCES, 'enterprise'] as const).default('enterprise'),
  destinationType: z.enum(DESTINATION_TYPES).default('legacy'),
  /** Locale-agnostic canonical path, e.g. "/retail/accounts/brokerage" */
  canonicalPath: z.string().optional(),
  legacyId: z.string().optional(),
  /** Resolved slug when destinationType === 'sanityPage' */
  internalPageSlug: z.string().optional(),
  externalUrl: z.string().optional(),
  localizedUrlOverrides: z.array(LocalizedUrlOverrideSchema).optional(),
  description: z.string().optional(),
  analyticsId: z.string().optional(),
  status: z.enum(NAV_TARGET_STATUSES).default('active'),
});
export type NavTarget = z.infer<typeof NavTargetSchema>;

export const NavPromoCardSchema = z.object({
  title: z.string(),
  description: z.string(),
  ctaText: z.string(),
  ctaUrl: z.string(),
  imageUrl: z.string().optional(),
  badge: z.string().optional(),
});
export type NavPromoCard = z.infer<typeof NavPromoCardSchema>;

export interface NavItem {
  id: string;
  _key?: string;
  label: string;
  /** Canonical destination (present on leaf nodes when navItems is empty) */
  target?: NavTarget;
  /** Resolved localized href (computed from target + locale) */
  href?: string;
  description?: string;
  badge?: string;
  icon?: string;
  openInNewTab?: boolean;
  analyticsTag?: string;
  promoCard?: NavPromoCard;
  /** Child items. Presence => click opens dropdown/group; absence => clickable navigable link. */
  navItems?: NavItem[];
}

export interface NavItemInput {
  id: string;
  _key?: string;
  label: string;
  target?: z.input<typeof NavTargetSchema>;
  href?: string;
  description?: string;
  badge?: string;
  icon?: string;
  openInNewTab?: boolean;
  analyticsTag?: string;
  promoCard?: z.input<typeof NavPromoCardSchema>;
  navItems?: NavItemInput[];
}

export const NavItemSchema: z.ZodType<NavItem, z.ZodTypeDef, NavItemInput> = z.lazy(() =>
  z.object({
    id: z.string(),
    _key: z.string().optional(),
    label: z.string(),
    target: NavTargetSchema.optional(),
    href: z.string().optional(),
    description: z.string().optional(),
    badge: z.string().optional(),
    icon: z.string().optional(),
    openInNewTab: z.boolean().optional(),
    analyticsTag: z.string().optional(),
    promoCard: NavPromoCardSchema.optional(),
    navItems: z.array(NavItemSchema).optional(),
  }),
);

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
  menuType: z.enum(MENU_TYPES).default('global'),
  locale: z.enum(LOCALES),
  isCanonical: z.boolean().optional(),
  smartling: SmartlingMetadataSchema.optional(),
  /** Required when menuType === 'section': anchors L3 leaf in Global Header to L4/L5 Section Nav */
  rootTarget: NavTargetSchema.optional(),
  utilityLinks: z.array(UtilityItemSchema).optional().default([]),
  navItems: z.array(NavItemSchema).default([]),
  experienceSwitcherLinks: z.array(ExperienceOptionSchema).optional(),
  localeOptions: z.array(LocaleOptionSchema).optional(),
});
export type NavigationDocument = z.infer<typeof NavigationDocumentSchema>;

/** Derived clickability rule: branch if navItems is non-empty, leaf otherwise. */
export function isNavBranch(item: Pick<NavItem, 'navItems'>): boolean {
  return Array.isArray(item.navItems) && item.navItems.length > 0;
}

export function isNavLeaf(item: Pick<NavItem, 'navItems'>): boolean {
  return !isNavBranch(item);
}

/**
 * Resolves a canonical NavTarget into a localized URL.
 * - Default locale (en-US): no prefix (e.g. "/retail/accounts/brokerage")
 * - Non-default locales: auto-prefix with "/{locale.toLowerCase()}" (e.g. "/es/retail/accounts/brokerage", "/zh-hant/...")
 * - Explicit localizedUrlOverrides on the target take precedence.
 * - External URLs are returned as-is.
 */
export function resolveTargetHref(
  target: NavTarget | undefined,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string | undefined {
  if (!target) return undefined;

  // 1. Explicit per-locale override (e.g., translated legacy slug)
  const override = target.localizedUrlOverrides?.find((o) => o.locale === locale);
  if (override?.url) {
    return override.url;
  }

  // 2. External destination
  if (target.destinationType === 'external' && target.externalUrl) {
    return target.externalUrl;
  }

  // 3. Strangler Fig resolution: Sanity Page slug if migrated, otherwise canonical legacy path
  const rawPath =
    target.destinationType === 'sanityPage' && target.internalPageSlug
      ? target.internalPageSlug
      : target.canonicalPath || target.externalUrl;

  if (!rawPath) return undefined;
  if (rawPath.startsWith('http://') || rawPath.startsWith('https://') || rawPath.startsWith('#')) {
    return rawPath;
  }

  const normalized = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  if (locale === DEFAULT_LOCALE) {
    return normalized;
  }

  const prefix = `/${locale.toLowerCase()}`;
  if (normalized.toLowerCase().startsWith(`${prefix}/`) || normalized.toLowerCase() === prefix) {
    return normalized;
  }

  return `${prefix}${normalized}`;
}

const LEGACY_EXPERIENCE_ALIASES: Record<string, ExperienceType> = {
  general: 'retail',
  retail: 'retail',
  retirement: 'retirementServices',
  retirementservices: 'retirementServices',
  advisorservices: 'advisorServices',
  wealthmanagement: 'wealthManagement',
  workplaceservices: 'workPlaceServices',
};

/**
 * Resolves a canonical ExperienceType from either the exact slug or a legacy/lowercase alias
 * (e.g. "general" -> "retail", "advisorservices" -> "advisorServices", "retirement" -> "retirementServices").
 */
export function normalizeExperience(val: string): ExperienceType | null {
  if (EXPERIENCES.includes(val as ExperienceType)) {
    return val as ExperienceType;
  }
  return LEGACY_EXPERIENCE_ALIASES[val.toLowerCase()] ?? null;
}

export function isSupportedExperience(val: string): val is ExperienceType {
  return EXPERIENCES.includes(val as ExperienceType);
}

export function isSupportedMenuType(val: string): val is MenuType {
  return MENU_TYPES.includes(val as MenuType);
}

export function isSupportedChannel(val: string): val is ChannelType {
  return CHANNELS.includes(val as ChannelType);
}

export function isSupportedLocale(val: string): val is SupportedLocale {
  return LOCALES.includes(val as SupportedLocale);
}
