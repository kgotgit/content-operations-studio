import {
  EXPERIENCES,
  LOCALES,
  LOCALE_METADATA,
  type ExperienceType,
  type SupportedLocale,
  type NavigationDocument,
  type ExperienceOption,
  type LocaleOption,
} from '@content-ops/navigation-contract';

declare const process: any;

export interface DomainConfig {
  general: string;
  retirement: string;
  advisorservices: string;
}

function getEnv(key: string, fallback: string): string {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || fallback;
  }
  return fallback;
}

export const DEFAULT_DOMAINS: DomainConfig = {
  general: getEnv('NEXT_PUBLIC_GENERAL_DOMAIN', 'https://www.company.com'),
  retirement: getEnv('NEXT_PUBLIC_RETIREMENT_DOMAIN', 'https://workplace.company.com'),
  advisorservices: getEnv('NEXT_PUBLIC_ADVISOR_DOMAIN', 'https://advisorservices.company.com'),
};

/**
 * Resolves a relative URL against an experience domain when rendering inside
 * a remote component or foreign host (like legacy Drupal).
 */
export function resolveHref(
  href: string,
  experience: ExperienceType,
  domains: DomainConfig = DEFAULT_DOMAINS,
  isRemote = false,
): string {
  if (!href) return '#';
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
    return href;
  }

  // If in remote mode (Drupal), always prefix with the appropriate micro-frontend domain
  if (isRemote) {
    const base = domains[experience] || domains.general;
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanHref = href.startsWith('/') ? href : `/${href}`;
    return `${cleanBase}${cleanHref}`;
  }

  return href;
}

/**
 * Traverses a NavigationDocument and normalizes all URLs according to the runtime context.
 */
export function resolveNavigationUrls(
  doc: NavigationDocument,
  options: { isRemote?: boolean; domains?: DomainConfig } = {},
): NavigationDocument {
  const { isRemote = false, domains = DEFAULT_DOMAINS } = options;

  return {
    ...doc,
    utilityLinks: doc.utilityLinks.map((link) => ({
      ...link,
      href: resolveHref(link.href, doc.experience, domains, isRemote),
    })),
    items: doc.items.map((item) => ({
      ...item,
      href: item.href ? resolveHref(item.href, doc.experience, domains, isRemote) : undefined,
      sections: item.sections?.map((section) => ({
        ...section,
        href: section.href ? resolveHref(section.href, doc.experience, domains, isRemote) : undefined,
        items: section.items.map((subItem) => ({
          ...subItem,
          href: resolveHref(subItem.href, doc.experience, domains, isRemote),
        })),
      })),
      promoCard: item.promoCard
        ? {
            ...item.promoCard,
            ctaUrl: resolveHref(item.promoCard.ctaUrl, doc.experience, domains, isRemote),
          }
        : undefined,
    })),
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
  const experienceTitles: Record<ExperienceType, string> = {
    general: 'Personal / Investing',
    retirement: 'Workplace & Retirement',
    advisorservices: 'Advisor Services',
  };

  const experienceSwitcherLinks: ExperienceOption[] = EXPERIENCES.map((exp) => ({
    id: exp,
    title: experienceTitles[exp],
    href: isRemote
      ? `${domains[exp] || domains.general}/${currentLocale}/${exp}`
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
 * Agentic Bot Transformer: Extracts a flat intent-route structure with descriptions
 * suitable for LLMs and function-calling search / navigation tools.
 */
export function toAgenticBotContext(doc: NavigationDocument) {
  const intents: Array<{
    category: string;
    section: string;
    action: string;
    url: string;
    description: string;
    badge?: string;
  }> = [];

  for (const l1 of doc.items) {
    if (l1.sections) {
      for (const l2 of l1.sections) {
        for (const l3 of l2.items) {
          intents.push({
            category: l1.title,
            section: l2.sectionTitle,
            action: l3.title,
            url: l3.href,
            description: l3.description || `${l3.title} under ${l2.sectionTitle}`,
            badge: l3.badge,
          });
        }
      }
    }
  }

  return {
    experience: doc.experience,
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
  return {
    experience: doc.experience,
    locale: doc.locale,
    channel: 'mobile',
    utility: doc.utilityLinks,
    tree: doc.items.map((l1) => ({
      title: l1.title,
      href: l1.href,
      sections: l1.sections?.map((l2) => ({
        title: l2.sectionTitle,
        items: l2.items.map((l3) => ({
          title: l3.title,
          href: l3.href,
          badge: l3.badge,
        })),
      })),
    })),
  };
}
