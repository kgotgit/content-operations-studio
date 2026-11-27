import {
  DEFAULT_LOCALE,
  EXPERIENCES,
  EXPERIENCE_METADATA,
  LOCALES,
  LOCALE_METADATA,
  isNavBranch,
  resolveTargetHref,
  type ExperienceOption,
  type ExperienceType,
  type LocaleOption,
  type NavItem,
  type NavigationDocument,
  type SupportedLocale,
} from '@content-ops/navigation-contract';

declare const process: any;

export interface DomainConfig {
  retail: string;
  advisorServices: string;
  wealthManagement: string;
  retirementServices: string;
  workPlaceServices: string;
}

function getEnv(key: string, fallback: string): string {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || fallback;
  }
  return fallback;
}

export const DEFAULT_DOMAINS: DomainConfig = {
  retail: getEnv('NEXT_PUBLIC_RETAIL_DOMAIN', getEnv('NEXT_PUBLIC_GENERAL_DOMAIN', 'https://www.apex.example.com')),
  advisorServices: getEnv('NEXT_PUBLIC_ADVISOR_DOMAIN', 'https://advisorservices.apex.example.com'),
  wealthManagement: getEnv('NEXT_PUBLIC_WEALTH_DOMAIN', 'https://wealth.apex.example.com'),
  retirementServices: getEnv('NEXT_PUBLIC_RETIREMENT_DOMAIN', 'https://retirement.apex.example.com'),
  workPlaceServices: getEnv('NEXT_PUBLIC_WORKPLACE_DOMAIN', 'https://workplace.apex.example.com'),
};

/**
 * Applies the locale prefix ("/es/...", "/zh-hant/...") to relative paths when locale !== en-US.
 */
export function localizeRelativeHref(href: string, locale: SupportedLocale = DEFAULT_LOCALE): string {
  if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
    return href;
  }
  const normalized = href.startsWith('/') ? href : `/${href}`;
  if (locale === DEFAULT_LOCALE) return normalized;

  const prefix = `/${locale.toLowerCase()}`;
  if (normalized.toLowerCase().startsWith(`${prefix}/`) || normalized.toLowerCase() === prefix) {
    return normalized;
  }
  return `${prefix}${normalized}`;
}

/**
 * Resolves a relative URL against an experience domain when rendering inside
 * a remote component or foreign host (like a legacy CMS).
 */
export function resolveHref(
  href: string,
  experience: ExperienceType,
  domains: DomainConfig = DEFAULT_DOMAINS,
  isRemote = false,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  if (!href) return '#';
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
    return href;
  }

  const localized = localizeRelativeHref(href, locale);

  if (isRemote) {
    const base = domains[experience] || domains.retail;
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${cleanBase}${localized}`;
  }

  return localized;
}

function resolveNavItemsRecursive(
  items: NavItem[],
  experience: ExperienceType,
  locale: SupportedLocale,
  domains: DomainConfig,
  isRemote: boolean,
): NavItem[] {
  return items.map((item) => {
    const branchNode = isNavBranch(item);
    const rawHref = branchNode ? undefined : item.href || resolveTargetHref(item.target, locale);

    return {
      ...item,
      href: rawHref ? resolveHref(rawHref, experience, domains, isRemote, locale) : undefined,
      promoCard: item.promoCard
        ? {
            ...item.promoCard,
            ctaUrl: resolveHref(item.promoCard.ctaUrl, experience, domains, isRemote, locale),
          }
        : undefined,
      navItems: branchNode
        ? resolveNavItemsRecursive(item.navItems!, experience, locale, domains, isRemote)
        : undefined,
    };
  });
}

/**
 * Traverses a NavigationDocument and normalizes all URLs according to locale & runtime context.
 */
export function resolveNavigationUrls(
  doc: NavigationDocument,
  options: { isRemote?: boolean; domains?: DomainConfig } = {},
): NavigationDocument {
  const { isRemote = false, domains = DEFAULT_DOMAINS } = options;
  const locale = doc.locale || DEFAULT_LOCALE;

  return {
    ...doc,
    utilityLinks: doc.utilityLinks.map((link) => ({
      ...link,
      href: resolveHref(link.href, doc.experience, domains, isRemote, locale),
    })),
    navItems: resolveNavItemsRecursive(doc.navItems, doc.experience, locale, domains, isRemote),
  };
}

/**
 * Augments the navigation document with experience switcher and locale switcher options.
 */
export function withExperienceAndLocaleOptions(
  doc: NavigationDocument,
  currentExperience: ExperienceType,
  currentLocale: SupportedLocale,
  domains: DomainConfig = DEFAULT_DOMAINS,
  isRemote = false,
): NavigationDocument {
  const experienceSwitcherLinks: ExperienceOption[] = EXPERIENCES.map((exp) => ({
    id: exp,
    title: EXPERIENCE_METADATA[exp].shortLabel,
    href: isRemote
      ? `${domains[exp] || domains.retail}/${currentLocale}/${exp}`
      : `/${currentLocale}/${exp}`,
    current: exp === currentExperience,
  }));

  const localeOptions: LocaleOption[] = LOCALES.map((loc) => ({
    code: loc,
    label: LOCALE_METADATA[loc].label,
    direction: LOCALE_METADATA[loc].direction,
    current: loc === currentLocale,
  }));

  return {
    ...doc,
    experienceSwitcherLinks,
    localeOptions,
  };
}

/**
 * Agentic Bot Transformer: Recursively extracts flat intent-route leaves with breadcrumb paths
 * suitable for LLMs and function-calling search / navigation tools.
 */
export function toAgenticBotContext(doc: NavigationDocument) {
  const intents: Array<{
    path: string[];
    action: string;
    url: string;
    description: string;
    badge?: string;
    targetId?: string;
  }> = [];

  const walk = (items: NavItem[], trail: string[]) => {
    for (const item of items) {
      if (isNavBranch(item)) {
        walk(item.navItems!, [...trail, item.label]);
      } else {
        intents.push({
          path: trail,
          action: item.label,
          url: item.href || resolveTargetHref(item.target, doc.locale) || '#',
          description:
            item.description ||
            item.target?.description ||
            `${item.label}${trail.length ? ` under ${trail.join(' > ')}` : ''}`,
          badge: item.badge,
          targetId: item.target?._id,
        });
      }
    }
  };

  walk(doc.navItems, []);

  return {
    experience: doc.experience,
    menuType: doc.menuType,
    channel: doc.channel,
    locale: doc.locale,
    totalIntents: intents.length,
    navigationIntents: intents,
  };
}

/**
 * Mobile-optimized payload omitting heavy desktop promo cards.
 */
export function toMobilePayload(doc: NavigationDocument) {
  const strip = (items: NavItem[]): Array<Record<string, unknown>> =>
    items.map((item) => ({
      id: item.id,
      label: item.label,
      ...(item.href ? { href: item.href } : {}),
      ...(item.badge ? { badge: item.badge } : {}),
      ...(isNavBranch(item) ? { navItems: strip(item.navItems!) } : {}),
    }));

  return {
    experience: doc.experience,
    menuType: doc.menuType,
    locale: doc.locale,
    channel: 'mobile',
    utility: doc.utilityLinks,
    tree: strip(doc.navItems),
  };
}
