import {
  DEFAULT_LOCALE,
  resolveTargetHref,
  type ExperienceType,
  type MenuType,
  type NavItem,
  type NavPromoCard,
  type NavTarget,
  type NavigationDocument,
  type SupportedLocale,
  type UtilityItem,
} from '@content-ops/navigation-contract';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const TARGET_REGISTRY = new Map<string, NavTarget>();

function registerTarget(
  id: string,
  title: string,
  canonicalPath: string,
  owningExperience: ExperienceType | 'enterprise',
  opts?: {
    description?: string;
    analyticsId?: string;
    destinationType?: NavTarget['destinationType'];
    internalPageSlug?: string;
    localizedUrlOverrides?: NavTarget['localizedUrlOverrides'];
  },
): NavTarget {
  const existing = TARGET_REGISTRY.get(id);
  if (existing) return existing;

  const target: NavTarget = {
    _id: `navTarget-${id}`,
    title,
    owningExperience,
    destinationType: opts?.destinationType ?? 'legacy',
    canonicalPath,
    legacyId: `legacy-${id}`,
    internalPageSlug: opts?.internalPageSlug,
    localizedUrlOverrides: opts?.localizedUrlOverrides,
    description: opts?.description,
    analyticsId: opts?.analyticsId ?? `nav:${owningExperience}:${id}`,
    status: 'active',
  };
  TARGET_REGISTRY.set(id, target);
  return target;
}

function leaf(
  target: NavTarget,
  locale: SupportedLocale = DEFAULT_LOCALE,
  opts?: { label?: string; badge?: string; description?: string; openInNewTab?: boolean },
): NavItem {
  return {
    id: `${target._id}-${slugify(opts?.label || target.title)}`,
    label: opts?.label || target.title,
    target,
    href: resolveTargetHref(target, locale),
    description: opts?.description || target.description,
    badge: opts?.badge,
    openInNewTab: opts?.openInNewTab,
    analyticsTag: target.analyticsId,
  };
}

function branch(
  id: string,
  label: string,
  navItems: NavItem[],
  opts?: { promoCard?: NavPromoCard; badge?: string },
): NavItem {
  return {
    id,
    label,
    badge: opts?.badge,
    promoCard: opts?.promoCard,
    navItems,
  };
}

// ============================================================================
// Shared Enterprise Canonical Targets (referenced across multiple experiences)
// ============================================================================
const T_SHARED_PLEDGED_ASSET_LINE = registerTarget(
  'shared-pledged-asset-line',
  'Pledged Asset Line',
  '/lending/pledged-asset-line',
  'enterprise',
  {
    description: 'Non-purpose securities-backed credit lines with flexible draw and repayment terms.',
    localizedUrlOverrides: [{ locale: 'es', url: '/es/prestamos/linea-activos-pignorados' }],
  },
);

const T_SHARED_DONOR_ADVISED_FUNDS = registerTarget(
  'shared-donor-advised-funds',
  'Donor-Advised Funds',
  '/charitable/donor-advised-funds',
  'enterprise',
  {
    description: 'Tax-efficient charitable giving with appreciated securities and multi-generational grantmaking.',
  },
);

const T_SHARED_DIRECT_INDEXING = registerTarget(
  'shared-direct-indexing',
  'Direct Indexing & Tax-Loss Harvesting',
  '/investing/direct-indexing',
  'enterprise',
  {
    description: 'Personalized index portfolios with automated daily tax-loss harvesting and custom tilts.',
  },
);

const T_SHARED_SECURITY_GUARANTEE = registerTarget(
  'shared-security-guarantee',
  'Security & Account Protection',
  '/why-apex/security-guarantee',
  'enterprise',
  {
    description: 'Apex Security Guarantee, SIPC & excess coverage, and multi-factor protection.',
    destinationType: 'sanityPage',
    internalPageSlug: '/why-apex/security-guarantee',
  },
);

// ============================================================================
// 1. RETAIL Targets & Menus (L1 -> L2 -> L3 Global + L3 -> L4 Section Nav)
// ============================================================================
const T_RETAIL_BROKERAGE = registerTarget(
  'retail-brokerage',
  'Brokerage Account',
  '/retail/accounts/brokerage',
  'retail',
  {
    description: 'Open an individual brokerage with $0 online US equity trades and margin features.',
    localizedUrlOverrides: [{ locale: 'es', url: '/es/retail/cuentas/corretaje' }],
  },
);
const T_RETAIL_JOINT_BROKERAGE = registerTarget(
  'retail-joint-brokerage',
  'Joint Brokerage Account',
  '/retail/accounts/joint-brokerage',
  'retail',
  { description: 'JTWROS, Tenants in Common, and Community Property accounts.' },
);
const T_RETAIL_CUSTODIAL = registerTarget(
  'retail-custodial',
  'Custodial Accounts (UGMA/UTMA)',
  '/retail/accounts/custodial',
  'retail',
  { description: 'Invest for a minor with flexible gifting and age-of-majority transfers.' },
);
const T_RETAIL_TRUST = registerTarget(
  'retail-trust-estate',
  'Trust & Estate Accounts',
  '/retail/accounts/trust-estate',
  'retail',
  { description: 'Revocable living trusts, irrevocable trusts, and estate settlement support.' },
);
const T_RETAIL_IRA = registerTarget(
  'retail-ira',
  'Traditional & Roth IRAs',
  '/retail/retirement/ira',
  'retail',
  { description: 'Tax-advantaged retirement savings with deductible or tax-free growth.' },
);
const T_RETAIL_ROLLOVER = registerTarget(
  'retail-rollover-ira',
  'Rollover IRA',
  '/retail/retirement/rollover-ira',
  'retail',
  { description: 'Consolidate old employer 401(k) plans with direct rollover guidance.' },
);
const T_RETAIL_SMALL_BIZ = registerTarget(
  'retail-small-biz-retirement',
  'Small Business Retirement (SEP / SIMPLE)',
  '/retail/retirement/small-business',
  'retail',
  { description: 'SEP IRA, SIMPLE IRA, and Individual 401(k) plans for entrepreneurs.' },
);
const T_RETAIL_STOCKS = registerTarget(
  'retail-stocks',
  'Stocks & Equities',
  '/retail/products/stocks',
  'retail',
  { description: 'US & international equities, fractional shares, and DRIP.' },
);
const T_RETAIL_ETFS = registerTarget(
  'retail-etfs',
  'ETFs & Mutual Funds',
  '/retail/products/etfs-mutual-funds',
  'retail',
  { description: 'Apex ETFs, Select List, and no-transaction-fee mutual funds.' },
);
const T_RETAIL_BONDS = registerTarget(
  'retail-bonds',
  'Bonds & Fixed Income',
  '/retail/products/bonds',
  'retail',
  { description: 'US Treasuries, municipal & corporate bonds, and Bond Ladder Builder.' },
);
const T_RETAIL_CHECKING = registerTarget(
  'retail-checking',
  'Investor Checking',
  '/retail/banking/investor-checking',
  'retail',
  { description: 'Unlimited ATM fee rebates and no foreign transaction fees.' },
);
const T_RETAIL_INTELLIGENT = registerTarget(
  'retail-intelligent-portfolios',
  'Apex Intelligent Portfolios',
  '/retail/advice/intelligent-portfolios',
  'retail',
  { description: 'Automated rebalancing, tax-loss harvesting, and goal tracking.' },
);
const T_RETAIL_WEALTH_ADV = registerTarget(
  'retail-wealth-advisory',
  'Apex Wealth Advisory',
  '/retail/advice/wealth-advisory',
  'retail',
  { description: 'Dedicated wealth advisor, custom portfolio construction, and tax coordination.' },
);
const T_RETAIL_CALC = registerTarget(
  'retail-retirement-calculator',
  'Retirement Calculator',
  '/retail/planning/retirement-calculator',
  'retail',
  { description: 'Savings gap estimator, Social Security timing, and RMD calculator.' },
);
const T_RETAIL_EQUITY_FEES = registerTarget(
  'retail-equity-pricing',
  'Online Equity & ETF Trades',
  '/retail/pricing/equities-etfs',
  'retail',
  { description: '$0 online US stock & ETF commissions with transparent execution.' },
);
const T_RETAIL_ADVISORY_FEES = registerTarget(
  'retail-advisory-pricing',
  'Advisory Fees',
  '/retail/pricing/advisory-fees',
  'retail',
  { description: '$0 automated advisory fee details and tiered wealth advisory schedules.' },
);
const T_RETAIL_MARGIN_RATES = registerTarget(
  'retail-margin-rates',
  'Margin Rates',
  '/retail/pricing/margin-rates',
  'retail',
  { description: 'Current base & tiered margin rates and maintenance requirements.' },
);
const T_RETAIL_GUARANTEE = registerTarget(
  'retail-satisfaction-guarantee',
  'Satisfaction Guarantee',
  '/retail/why-apex/satisfaction-guarantee',
  'retail',
  { description: 'Fee refund promise and eligible advisory & account types.' },
);
const T_RETAIL_PRO_DESKTOP = registerTarget(
  'retail-pro-desktop',
  'Apex Pro Desktop & Web',
  '/retail/platforms/apex-pro',
  'retail',
  { description: 'Advanced charting, simulated paper trading, and custom scripts.' },
);
const T_RETAIL_SUPPORT = registerTarget(
  'retail-247-support',
  '24/7 Live Support',
  '/retail/support/live-support',
  'retail',
  { description: 'Phone & live chat support with dedicated trading specialists.' },
);
const T_RETAIL_DAILY_MARKET = registerTarget(
  'retail-daily-commentary',
  'Daily Market Commentary',
  '/retail/learn/daily-market-commentary',
  'retail',
  { description: 'Pre-market briefings, midday updates, and weekly trader outlook.' },
);
const T_RETAIL_GETTING_STARTED = registerTarget(
  'retail-getting-started',
  'Getting Started',
  '/retail/learn/getting-started',
  'retail',
  { description: 'How to invest your first $1,000 and build a diversified portfolio.' },
);
const T_RETAIL_WORKSHOPS = registerTarget(
  'retail-live-workshops',
  'Live Workshops',
  '/retail/learn/live-workshops',
  'retail',
  { description: 'Options trading foundations, technical analysis labs, and retirement workshops.' },
);

// Retail L4 targets for Section Nav under Brokerage Account
const T_RETAIL_BROKERAGE_OPEN = registerTarget(
  'retail-brokerage-open',
  'Open an Individual Brokerage',
  '/retail/accounts/brokerage/open',
  'retail',
  { description: 'Step-by-step online account opening in minutes.' },
);
const T_RETAIL_BROKERAGE_MARGIN = registerTarget(
  'retail-brokerage-margin',
  'Margin Trading Features',
  '/retail/accounts/brokerage/margin-trading',
  'retail',
  { description: 'Borrow against eligible securities with competitive tiered rates.' },
);
const T_RETAIL_BROKERAGE_FUNDING = registerTarget(
  'retail-brokerage-funding',
  'Account Funding & Transfers',
  '/retail/accounts/brokerage/funding-transfers',
  'retail',
  { description: 'ACH transfers, wire instructions, and automated ACATS account transfers.' },
);

// ============================================================================
// 2. ADVISOR SERVICES Targets
// ============================================================================
const T_ADV_READINESS = registerTarget(
  'adv-readiness',
  'Independence Readiness Assessment',
  '/advisor-services/going-independent/readiness',
  'advisorServices',
  { description: 'Self-assessment questionnaire, portability guide, and launch timeline.' },
);
const T_ADV_ECONOMIC = registerTarget(
  'adv-economic',
  'Economic & Equity Benefits',
  '/advisor-services/going-independent/economic-benefits',
  'advisorServices',
  { description: 'Revenue & payout comparisons, enterprise value, and operating cost modeling.' },
);
const T_ADV_TRANSITION = registerTarget(
  'adv-transition-consulting',
  'Transition Consulting & Planning',
  '/advisor-services/going-independent/transition-consulting',
  'advisorServices',
  { description: 'Dedicated transition manager, launch checklist, and client communication playbook.' },
);
const T_ADV_STARTING_RIA = registerTarget(
  'adv-starting-ria',
  'Starting an RIA',
  '/advisor-services/going-independent/starting-an-ria',
  'advisorServices',
  { description: 'Standalone firm blueprint, entity formation, and custodian onboarding.' },
);
const T_ADV_CUSTODIAN = registerTarget(
  'adv-custodian-advantage',
  'Our Custodian Advantage',
  '/advisor-services/why-apex/custodian-advantage',
  'advisorServices',
  { description: 'No proprietary product conflicts and long-term independent RIA advocacy.' },
);
const T_ADV_CENTER = registerTarget(
  'adv-advisor-center',
  'Apex Advisor Center',
  '/advisor-services/trading/advisor-center',
  'advisorServices',
  { description: 'Customizable advisor dashboard, workflow alerts, and role-based entitlements.' },
);
const T_ADV_REBALANCING = registerTarget(
  'adv-rebalancing',
  'Rebalancing & Block Trading',
  '/advisor-services/trading/rebalancing-block-trading',
  'advisorServices',
  { description: 'Apex Cloud Rebalancing, model portfolios, and block trade allocation.' },
);
const T_ADV_INST_FUNDS = registerTarget(
  'adv-institutional-funds',
  'Institutional Mutual Funds & ETFs',
  '/advisor-services/serving-clients/institutional-funds',
  'advisorServices',
  { description: 'Institutional share classes, ETF model marketplaces, and NTF platforms.' },
);
const T_ADV_PORTAL = registerTarget(
  'adv-client-portal',
  'Client Portal & Mobile Access',
  '/advisor-services/serving-clients/client-portal',
  'advisorServices',
  { description: 'Apex Alliance Client Portal, document vault, and real-time performance.' },
);
const T_ADV_BENCHMARK = registerTarget(
  'adv-benchmarking',
  'Benchmarking Studies',
  '/advisor-services/managing-business/benchmarking',
  'advisorServices',
  { description: 'Annual RIA Benchmarking Study, compensation reports, and peer scorecards.' },
);
const T_ADV_INTEGRATIONS = registerTarget(
  'adv-integrated-office',
  'Apex Integrated Office',
  '/advisor-services/managing-business/integrated-office',
  'advisorServices',
  { description: 'Pre-built CRM, portfolio accounting, and financial planning partner integrations.' },
);
const T_ADV_SEC_INSIGHTS = registerTarget(
  'adv-sec-insights',
  'SEC & Fiduciary Insights',
  '/advisor-services/risk-regulations/sec-fiduciary',
  'advisorServices',
  { description: 'Exam priority briefings, Marketing Rule guidance, and fiduciary best practices.' },
);
// Advisor L4 targets for Section Nav under Independence Readiness Assessment
const T_ADV_READINESS_Q = registerTarget(
  'adv-readiness-questionnaire',
  'Self-Assessment Questionnaire',
  '/advisor-services/going-independent/readiness/questionnaire',
  'advisorServices',
);
const T_ADV_READINESS_PORT = registerTarget(
  'adv-readiness-portability',
  'Portability & Client Retention Guide',
  '/advisor-services/going-independent/readiness/portability',
  'advisorServices',
);
const T_ADV_READINESS_TIME = registerTarget(
  'adv-readiness-timeline',
  'Timeline & Milestone Estimator',
  '/advisor-services/going-independent/readiness/timeline',
  'advisorServices',
);

// ============================================================================
// 3. WEALTH MANAGEMENT Targets
// ============================================================================
const T_WM_PWA = registerTarget(
  'wm-private-wealth-advisor',
  'Private Wealth Advisor',
  '/wealth-management/services/private-wealth-advisor',
  'wealthManagement',
  { description: 'Single point of accountability coordinating investments, CPAs, and attorneys.' },
);
const T_WM_FAMILY_OFFICE = registerTarget(
  'wm-family-office',
  'Multi-Generational Planning',
  '/wealth-management/family-office/multi-generational',
  'wealthManagement',
  { description: 'Next-gen financial education, family charters, and legacy transition plans.' },
);
const T_WM_CONSOLIDATED = registerTarget(
  'wm-consolidated-reporting',
  'Consolidated Reporting',
  '/wealth-management/family-office/consolidated-reporting',
  'wealthManagement',
  { description: 'Aggregated multi-custodian views and private asset performance tracking.' },
);
const T_WM_MUNI_LADDERS = registerTarget(
  'wm-muni-ladders',
  'Municipal & Corporate Bond Ladders',
  '/wealth-management/investments/bond-ladders',
  'wealthManagement',
  { description: 'State-specific muni ladders and tax-equivalent yield optimization.' },
);
const T_WM_ALTS = registerTarget(
  'wm-alternatives',
  'Alternative Investments',
  '/wealth-management/investments/alternatives',
  'wealthManagement',
  { description: 'Private equity, private credit, real estate, and manager due diligence.' },
);
const T_WM_TRUST = registerTarget(
  'wm-personal-trust',
  'Personal Trust Services',
  '/wealth-management/trust-estate/personal-trust',
  'wealthManagement',
  { description: 'GRATs, dynasty trusts, corporate trustee administration, and wealth transfer.' },
);
const T_WM_MORTGAGES = registerTarget(
  'wm-mortgages',
  'Mortgages & Home Lending',
  '/wealth-management/lending/mortgages',
  'wealthManagement',
  { description: 'Jumbo & super-jumbo mortgages, HELOCs, and relationship rate discounts.' },
);
const T_WM_PRIVATE_BANKING = registerTarget(
  'wm-private-banking',
  'Private Banking Services',
  '/wealth-management/lending/private-banking',
  'wealthManagement',
  { description: 'Dedicated banking concierge, high-limit wires, and global FX support.' },
);
const T_WM_RESEARCH = registerTarget(
  'wm-market-tax-outlook',
  'Market & Tax Outlooks',
  '/wealth-management/insights/market-tax-outlooks',
  'wealthManagement',
  { description: 'Quarterly Private Wealth Outlook and legislative tax policy briefs.' },
);
// Wealth L4 targets for Section Nav under Private Wealth Advisor
const T_WM_PWA_ACCOUNTABILITY = registerTarget(
  'wm-pwa-accountability',
  'Single Point of Accountability',
  '/wealth-management/services/private-wealth-advisor/accountability',
  'wealthManagement',
);
const T_WM_PWA_REVIEWS = registerTarget(
  'wm-pwa-reviews',
  'Proactive Strategy Reviews',
  '/wealth-management/services/private-wealth-advisor/strategy-reviews',
  'wealthManagement',
);
const T_WM_PWA_CPA = registerTarget(
  'wm-pwa-cpa-coordination',
  'Coordination with CPAs & Attorneys',
  '/wealth-management/services/private-wealth-advisor/cpa-coordination',
  'wealthManagement',
);

// ============================================================================
// 4. RETIREMENT SERVICES Targets
// ============================================================================
const T_RET_401K = registerTarget(
  'ret-401k-plans',
  '401(k) Plans',
  '/retirement-services/plans/401k',
  'retirementServices',
  { description: 'Safe Harbor designs, auto-enrollment, auto-escalation, and Roth 401(k) features.' },
);
const T_RET_NONQUAL = registerTarget(
  'ret-deferred-comp',
  'Deferred Compensation Plans',
  '/retirement-services/plans/deferred-compensation',
  'retirementServices',
  { description: '409A plan design, Rabbi Trusts, and executive distribution elections.' },
);
const T_RET_PEPS = registerTarget(
  'ret-peps',
  'Pooled Employer Plans (PEPs)',
  '/retirement-services/plans/peps',
  'retirementServices',
  { description: 'Turnkey employer adoption with reduced fiduciary and audit burden.' },
);
const T_RET_RECORDKEEPING = registerTarget(
  'ret-recordkeeping',
  'Recordkeeping & Payroll Integration',
  '/retirement-services/sponsor/recordkeeping',
  'retirementServices',
  { description: '180/360-degree payroll feeds, automated loans, and plan health dashboards.' },
);
const T_RET_FIDUCIARY = registerTarget(
  'ret-fiduciary',
  '3(16) & 3(38) Fiduciary Solutions',
  '/retirement-services/sponsor/fiduciary',
  'retirementServices',
  { description: 'Administrative and investment manager fiduciary delegation with quarterly packets.' },
);
const T_RET_TDF = registerTarget(
  'ret-target-date-funds',
  'Target Date Funds',
  '/retirement-services/investing/target-date-funds',
  'retirementServices',
  { description: 'Active, passive, hybrid, and custom glidepaths with QDIA monitoring.' },
);
const T_RET_MANAGED = registerTarget(
  'ret-managed-accounts',
  'Workplace Managed Accounts',
  '/retirement-services/investing/managed-accounts',
  'retirementServices',
  { description: 'Personalized portfolio management and retirement income drawdown strategies.' },
);
const T_RET_READINESS = registerTarget(
  'ret-readiness-dashboard',
  'Retirement Readiness Dashboard',
  '/retirement-services/participant/readiness-dashboard',
  'retirementServices',
  { description: 'Projected monthly retirement income, peer comparisons, and what-if sliders.' },
);
const T_RET_SECURE2 = registerTarget(
  'ret-secure-2-guidance',
  'SECURE 2.0 Guidance',
  '/retirement-services/insights/secure-2',
  'retirementServices',
  { description: 'Mandatory Roth catch-up rules, LTPT tracking, and emergency distribution provisions.' },
);
// Retirement L4 targets for Section Nav under 401(k) Plans
const T_RET_401K_SAFE = registerTarget(
  'ret-401k-safe-harbor',
  'Safe Harbor 401(k) Designs',
  '/retirement-services/plans/401k/safe-harbor',
  'retirementServices',
);
const T_RET_401K_AUTO = registerTarget(
  'ret-401k-auto-enroll',
  'Auto-Enrollment & Auto-Escalation',
  '/retirement-services/plans/401k/auto-enrollment',
  'retirementServices',
);
const T_RET_401K_ROTH = registerTarget(
  'ret-401k-roth',
  'Roth 401(k) & After-Tax Features',
  '/retirement-services/plans/401k/roth-after-tax',
  'retirementServices',
);

// ============================================================================
// 5. WORKPLACE SERVICES Targets
// ============================================================================
const T_WP_RSUS = registerTarget(
  'wp-rsus-psus',
  'RSUs & Performance Shares',
  '/workplace-services/stock-plans/rsus-psus',
  'workPlaceServices',
  { description: 'Automated vesting, tax withholding, PSU metric tracking, and dividend equivalents.' },
);
const T_WP_OPTIONS = registerTarget(
  'wp-stock-options',
  'Stock Options (ISOs & NSOs)',
  '/workplace-services/stock-plans/stock-options',
  'workPlaceServices',
  { description: 'Same-day sale, exercise-and-hold, AMT tracking, and blackout alerts.' },
);
const T_WP_ESPP = registerTarget(
  'wp-espp',
  'Employee Stock Purchase Plans (ESPP)',
  '/workplace-services/stock-plans/espp',
  'workPlaceServices',
  { description: 'Offering period administration, payroll reconciliation, and disposition tracking.' },
);
const T_WP_SEC16 = registerTarget(
  'wp-section-16',
  'Section 16 & 10b5-1 Trading Plans',
  '/workplace-services/stock-plans/section-16-10b5-1',
  'workPlaceServices',
  { description: 'Automated Form 4 filing, Rule 10b5-1 cooling-off compliance, and pre-clearance.' },
);
const T_WP_INTEGRATED = registerTarget(
  'wp-integrated-benefits',
  '401(k) & Equity Plan Integration',
  '/workplace-services/retirement/integrated-benefits',
  'workPlaceServices',
  { description: 'Single-login total rewards experience uniting equity and workplace retirement.' },
);
const T_WP_HSA = registerTarget(
  'wp-hsa',
  'Health Savings Accounts (HSA)',
  '/workplace-services/retirement/hsa',
  'workPlaceServices',
  { description: 'HSA investment sweeps and triple-tax-advantaged healthcare planning tools.' },
);
const T_WP_WELLNESS = registerTarget(
  'wp-financial-wellness',
  'Financial Health Assessments',
  '/workplace-services/wellness/assessments',
  'workPlaceServices',
  { description: 'Personalized wellness scores, prioritized action plans, and employer insights.' },
);
const T_WP_SPONSOR_PORTAL = registerTarget(
  'wp-sponsor-portal',
  'Sponsor Administration Portal',
  '/workplace-services/employer/sponsor-portal',
  'workPlaceServices',
  { description: 'Real-time grant & vesting dashboards, ad-hoc reporting, and HRIS connectors.' },
);
const T_WP_COMPLIANCE = registerTarget(
  'wp-global-compliance',
  'Global Regulatory Compliance',
  '/workplace-services/employer/global-compliance',
  'workPlaceServices',
  { description: 'Local securities filings, GDPR privacy, and ASC 718 / IFRS 2 reporting.' },
);
const T_WP_TAX_HELP = registerTarget(
  'wp-tax-1099',
  'Tax Reporting & Form 1099 Help',
  '/workplace-services/resources/tax-reporting',
  'workPlaceServices',
  { description: 'Cost basis guides and Form 1099-B / 3921 / 3922 walkthroughs.' },
);
// Workplace L4 targets for Section Nav under RSUs & Performance Shares
const T_WP_RSU_VESTING = registerTarget(
  'wp-rsu-vesting',
  'Automated Vesting & Tax Withholding',
  '/workplace-services/stock-plans/rsus-psus/vesting-withholding',
  'workPlaceServices',
);
const T_WP_RSU_PSU = registerTarget(
  'wp-rsu-psu-tracking',
  'Performance Metric Tracking (PSUs)',
  '/workplace-services/stock-plans/rsus-psus/psu-tracking',
  'workPlaceServices',
);
const T_WP_RSU_DIV = registerTarget(
  'wp-rsu-dividend-equivalents',
  'Dividend Equivalent Administration',
  '/workplace-services/stock-plans/rsus-psus/dividend-equivalents',
  'workPlaceServices',
);

// ============================================================================
// Utility Menu Canonical Targets (per-experience utilitiesMenu)
// ============================================================================
const T_UTIL_BRANCH = registerTarget(
  'util-find-branch',
  'Find a Branch',
  '/retail/support/branches',
  'retail',
  { description: 'Locate an Apex branch or schedule an in-person consultation.' },
);
const T_UTIL_CONTACT = registerTarget(
  'util-contact-us',
  'Contact Us',
  '/support/contact',
  'enterprise',
  { description: '24/7 phone, live chat, and specialist support desks.' },
);
const T_UTIL_ADV_CENTER = registerTarget(
  'util-advisor-center',
  'Advisor Center',
  '/advisor-services/login',
  'advisorServices',
  { description: 'Sign in to Apex Advisor Center.' },
);
const T_UTIL_ADV_DESK = registerTarget(
  'util-advisor-desk',
  'Trading Desk',
  '/advisor-services/trading-desk',
  'advisorServices',
  { description: 'Dedicated institutional block trading and fixed income desk.' },
);
const T_UTIL_WM_CONCIERGE = registerTarget(
  'util-wm-concierge',
  'Private Concierge',
  '/wealth-management/concierge',
  'wealthManagement',
  { description: 'Direct line to Apex Private Banking & Wealth Concierge.' },
);
const T_UTIL_RET_SPONSOR = registerTarget(
  'util-ret-sponsor-portal',
  'Plan Sponsor Portal',
  '/retirement-services/sponsor-portal',
  'retirementServices',
  { description: 'Employer plan administration and Form 5500 dashboard.' },
);
const T_UTIL_WP_EQUITY = registerTarget(
  'util-wp-equity-center',
  'Equity Award Center',
  '/workplace-services/equity-center',
  'workPlaceServices',
  { description: 'Manage RSUs, stock options, and ESPP enrollments.' },
);

export const MOCK_NAV_TARGETS: NavTarget[] = Array.from(TARGET_REGISTRY.values());

function buildUtilityMenu(
  experience: ExperienceType,
  locale: SupportedLocale = DEFAULT_LOCALE,
): NavigationDocument {
  const isEs = locale === 'es';
  const isZhHant = locale === 'zh-Hant';
  const l = (en: string, es: string, zh: string) => (isEs ? es : isZhHant ? zh : en);

  const base = {
    _id: `nav-${experience}-utility-web-${locale}`,
    title: `Web | ${experience} | Utilities Menu | ${locale}`,
    channel: 'web' as const,
    experience,
    menuType: 'utility' as const,
    locale,
    isCanonical: locale === DEFAULT_LOCALE,
    smartling: { status: (locale === DEFAULT_LOCALE ? 'source' : 'translated') as 'source' | 'translated' },
    utilityLinks: [],
  };

  switch (experience) {
    case 'advisorServices':
      return {
        ...base,
        navItems: [
          leaf(T_UTIL_ADV_CENTER, locale),
          leaf(T_ADV_READINESS, locale, { label: 'Go Independent' }),
          leaf(T_UTIL_ADV_DESK, locale),
        ],
      };
    case 'wealthManagement':
      return {
        ...base,
        navItems: [
          leaf(T_UTIL_WM_CONCIERGE, locale),
          leaf(T_WM_PWA, locale, { label: 'Find a Wealth Advisor' }),
          leaf(T_UTIL_CONTACT, locale),
        ],
      };
    case 'retirementServices':
      return {
        ...base,
        navItems: [
          leaf(T_UTIL_RET_SPONSOR, locale),
          leaf(T_RET_READINESS, locale, { label: 'Participant Portal' }),
          leaf(T_UTIL_CONTACT, locale),
        ],
      };
    case 'workPlaceServices':
      return {
        ...base,
        navItems: [
          leaf(T_UTIL_WP_EQUITY, locale),
          leaf(T_WP_SPONSOR_PORTAL, locale, { label: 'Sponsor Admin' }),
          leaf(T_WP_TAX_HELP, locale, { label: 'Tax Help' }),
        ],
      };
    case 'retail':
    default:
      return {
        ...base,
        navItems: [
          leaf(T_UTIL_BRANCH, locale, { label: l('Find a Branch', 'Buscar Sucursal', '尋找分行') }),
          leaf(T_UTIL_CONTACT, locale, { label: l('Contact Us', 'Contáctenos', '聯絡我們') }),
          leaf(T_SHARED_SECURITY_GUARANTEE, locale, {
            label: l('Security', 'Seguridad', '安全保障'),
          }),
        ],
      };
  }
}

function buildUtilityLinks(_experience: ExperienceType): UtilityItem[] {
  return [];
}

function buildRetailGlobalNav(locale: SupportedLocale = DEFAULT_LOCALE): NavigationDocument {
  const isEs = locale === 'es';
  const isZhHant = locale === 'zh-Hant';
  const l = (en: string, es: string, zh: string) => (isEs ? es : isZhHant ? zh : en);

  return {
    _id: `nav-retail-global-web-${locale}`,
    title: `Web | Retail | Global Header | ${locale}`,
    channel: 'web',
    experience: 'retail',
    menuType: 'global',
    locale,
    isCanonical: locale === DEFAULT_LOCALE,
    smartling:
      locale === DEFAULT_LOCALE
        ? { status: 'source' }
        : { jobId: `SM-RETAIL-${locale}`, status: 'translated', lastSyncedAt: '2026-11-26T10:00:00Z' },
    utilityLinks: buildUtilityLinks('retail'),
    navItems: [
      branch(
        'retail-accounts-products',
        l('Accounts & Products', 'Cuentas y Productos', '帳戶與投資產品'),
        [
          branch('retail-inv-accounts', l('Investment Accounts', 'Cuentas de Inversión', '投資帳戶'), [
            leaf(T_RETAIL_BROKERAGE, locale, {
              label: l('Brokerage Account', 'Cuenta de Corretaje', '證券經紀帳戶'),
              badge: l('Popular', 'Popular', '熱門'),
            }),
            leaf(T_RETAIL_JOINT_BROKERAGE, locale, {
              label: l('Joint Brokerage Account', 'Cuenta Conjunta', '聯名經紀帳戶'),
            }),
            leaf(T_RETAIL_CUSTODIAL, locale, {
              label: l('Custodial Accounts (UGMA/UTMA)', 'Cuentas de Custodia', '監護人帳戶'),
            }),
            leaf(T_RETAIL_TRUST, locale, {
              label: l('Trust & Estate Accounts', 'Fideicomisos y Sucesiones', '信託與遺產帳戶'),
            }),
          ]),
          branch('retail-ret-accounts', l('Retirement Accounts', 'Cuentas de Jubilación', '退休帳戶'), [
            leaf(T_RETAIL_IRA, locale, { label: l('Traditional & Roth IRAs', 'IRA Tradicional y Roth', '傳統與羅斯 IRA') }),
            leaf(T_RETAIL_ROLLOVER, locale, { label: l('Rollover IRA', 'IRA de Reinversión', '轉存 IRA') }),
            leaf(T_RETAIL_SMALL_BIZ, locale, { label: l('Small Business Retirement', 'Jubilación para Pequeñas Empresas', '小型企業退休計劃') }),
          ]),
          branch('retail-products', l('Investment Products', 'Productos de Inversión', '投資產品'), [
            leaf(T_RETAIL_STOCKS, locale, { label: l('Stocks & Equities', 'Acciones', '股票與證券') }),
            leaf(T_RETAIL_ETFS, locale, { label: l('ETFs & Mutual Funds', 'ETFs y Fondos Mutuos', 'ETF 與共同基金'), badge: '$0' }),
            leaf(T_RETAIL_BONDS, locale, { label: l('Bonds & Fixed Income', 'Bonos y Renta Fija', '債券與固定收益') }),
            leaf(T_RETAIL_CHECKING, locale, { label: l('Investor Checking', 'Cuenta Corriente', '投資人支票帳戶') }),
          ]),
        ],
        {
          promoCard: {
            title: l('Open an Apex Brokerage Account', 'Abra una Cuenta Apex', '開設 Apex 經紀帳戶'),
            description: l(
              'Trade US equities and ETFs with $0 online commissions and 24/7 specialist support.',
              'Opere acciones y ETFs en EE. UU. sin comisiones en línea.',
              '享有線上美股與 ETF 零佣金及全天候專員支援。',
            ),
            ctaText: l('Open Account', 'Abrir Cuenta', '立即開戶'),
            ctaUrl: resolveTargetHref(T_RETAIL_BROKERAGE, locale) || '/retail/accounts/brokerage',
            badge: l('Featured', 'Destacado', '精選'),
          },
        },
      ),
      branch('retail-advice', l('Advice', 'Asesoría', '理財建議'), [
        branch('retail-auto-advice', l('Automated & Guided Advice', 'Asesoría Automatizada y Guiada', '自動化與顧問理財'), [
          leaf(T_RETAIL_INTELLIGENT, locale, { label: l('Apex Intelligent Portfolios', 'Portafolios Inteligentes Apex', 'Apex 智慧投資組合') }),
          leaf(T_RETAIL_WEALTH_ADV, locale, { label: l('Apex Wealth Advisory', 'Asesoría Patrimonial Apex', 'Apex 財富顧問') }),
          leaf(T_SHARED_DIRECT_INDEXING, locale, { label: l('Direct Indexing & Tax-Loss Harvesting', 'Indexación Directa', '直接指數與稅損收割') }),
        ]),
        branch('retail-planning', l('Planning & Charitable', 'Planificación y Filantropía', '財務規劃與慈善'), [
          leaf(T_RETAIL_CALC, locale, { label: l('Retirement Calculator', 'Calculadora de Jubilación', '退休計算機') }),
          leaf(T_SHARED_DONOR_ADVISED_FUNDS, locale, { label: l('Donor-Advised Funds', 'Fondos Asesorados por Donantes', '捐贈者建議基金') }),
        ]),
      ]),
      branch('retail-pricing', l('Pricing', 'Tarifas', '收費標準'), [
        branch('retail-fees', l('Commissions, Advisory & Lending', 'Comisiones y Tasas', '佣金、顧問費與借貸利率'), [
          leaf(T_RETAIL_EQUITY_FEES, locale, { label: l('Online Equity & ETF Trades', 'Operaciones de Acciones y ETFs', '線上股票與 ETF 交易'), badge: '$0' }),
          leaf(T_RETAIL_ADVISORY_FEES, locale, { label: l('Advisory Fees', 'Tarifas de Asesoría', '顧問費用') }),
          leaf(T_RETAIL_MARGIN_RATES, locale, { label: l('Margin Rates', 'Tasas de Margen', '融資利率') }),
          leaf(T_SHARED_PLEDGED_ASSET_LINE, locale, { label: l('Pledged Asset Line Rates', 'Línea de Activos Pignorados', '質押資產信貸額度') }),
        ]),
      ]),
      branch('retail-why-apex', l('Why Apex', 'Por Qué Apex', '為何選擇 Apex'), [
        branch('retail-commitment', l('Our Commitment', 'Nuestro Compromiso', '我們的承諾'), [
          leaf(T_RETAIL_GUARANTEE, locale, { label: l('Satisfaction Guarantee', 'Garantía de Satisfacción', '滿意度保證') }),
          leaf(T_SHARED_SECURITY_GUARANTEE, locale, { label: l('Security & Account Protection', 'Seguridad y Protección', '安全與帳戶保障') }),
        ]),
        branch('retail-platforms', l('Platforms & Support', 'Plataformas y Soporte', '交易平台與支援'), [
          leaf(T_RETAIL_PRO_DESKTOP, locale, { label: l('Apex Pro Desktop & Web', 'Apex Pro Escritorio y Web', 'Apex Pro 桌面與網頁版'), badge: 'Pro' }),
          leaf(T_RETAIL_SUPPORT, locale, { label: l('24/7 Live Support', 'Soporte en Vivo 24/7', '24/7 即時客服') }),
        ]),
      ]),
      branch('retail-learn', l('Learn', 'Aprender', '投資學習'), [
        branch('retail-education', l('Insights & Education', 'Perspectivas y Educación', '市場洞察與課程'), [
          leaf(T_RETAIL_DAILY_MARKET, locale, { label: l('Daily Market Commentary', 'Comentario Diario del Mercado', '每日市場評論') }),
          leaf(T_RETAIL_GETTING_STARTED, locale, { label: l('Getting Started', 'Primeros Pasos', '投資入門') }),
          leaf(T_RETAIL_WORKSHOPS, locale, { label: l('Live Workshops', 'Talleres en Vivo', '線上即時工作坊') }),
        ]),
      ]),
    ],
  };
}

function buildAdvisorGlobalNav(locale: SupportedLocale = DEFAULT_LOCALE): NavigationDocument {
  return {
    _id: `nav-advisorServices-global-web-${locale}`,
    title: `Web | Advisor Services | Global Header | ${locale}`,
    channel: 'web',
    experience: 'advisorServices',
    menuType: 'global',
    locale,
    isCanonical: locale === DEFAULT_LOCALE,
    smartling: { status: locale === DEFAULT_LOCALE ? 'source' : 'translated' },
    utilityLinks: buildUtilityLinks('advisorServices'),
    navItems: [
      branch(
        'adv-going-independent',
        'Going Independent',
        [
          branch('adv-advantages', 'Understand Advantages', [
            leaf(T_ADV_READINESS, locale, { badge: 'Assessment' }),
            leaf(T_ADV_ECONOMIC, locale),
          ]),
          branch('adv-paths', 'Support & Transition Paths', [
            leaf(T_ADV_TRANSITION, locale),
            leaf(T_ADV_STARTING_RIA, locale),
          ]),
        ],
        {
          promoCard: {
            title: 'Independent RIA Transition Playbook',
            description: 'Step-by-step launch checklists, compliance guidance, and dedicated transition managers.',
            ctaText: 'Start Readiness Assessment',
            ctaUrl: resolveTargetHref(T_ADV_READINESS, locale) || '/advisor-services/going-independent/readiness',
            badge: 'RIA Guide',
          },
        },
      ),
      branch('adv-why-apex', 'Why Apex', [
        branch('adv-overview', 'Custodian Advantage', [
          leaf(T_ADV_CUSTODIAN, locale),
          leaf(T_SHARED_SECURITY_GUARANTEE, locale, { label: 'Scale, Stability & Security' }),
        ]),
        branch('adv-trading-wealth', 'Trading & Wealth Services', [
          leaf(T_ADV_CENTER, locale),
          leaf(T_ADV_REBALANCING, locale),
          leaf(T_SHARED_PLEDGED_ASSET_LINE, locale, { label: 'Pledged Asset Line for Clients' }),
        ]),
      ]),
      branch('adv-serving-clients', 'Serving Your Clients', [
        branch('adv-inv-solutions', 'Investment Solutions', [
          leaf(T_ADV_INST_FUNDS, locale),
          leaf(T_SHARED_DIRECT_INDEXING, locale, { label: 'Fixed Income & Direct Indexing' }),
        ]),
        branch('adv-client-exp', 'Client Experience', [
          leaf(T_ADV_PORTAL, locale),
          leaf(T_SHARED_DONOR_ADVISED_FUNDS, locale, { label: 'Philanthropic & Donor-Advised Funds' }),
        ]),
      ]),
      branch('adv-managing-business', 'Managing Your Business', [
        branch('adv-practice-tech', 'Practice & Technology', [
          leaf(T_ADV_BENCHMARK, locale, { badge: 'Annual Study' }),
          leaf(T_ADV_INTEGRATIONS, locale),
        ]),
      ]),
      leaf(T_ADV_SEC_INSIGHTS, locale, { label: 'Risk & Regulations' }),
    ],
  };
}

function buildWealthGlobalNav(locale: SupportedLocale = DEFAULT_LOCALE): NavigationDocument {
  return {
    _id: `nav-wealthManagement-global-web-${locale}`,
    title: `Web | Wealth Management | Global Header | ${locale}`,
    channel: 'web',
    experience: 'wealthManagement',
    menuType: 'global',
    locale,
    isCanonical: locale === DEFAULT_LOCALE,
    smartling: { status: locale === DEFAULT_LOCALE ? 'source' : 'translated' },
    utilityLinks: buildUtilityLinks('wealthManagement'),
    navItems: [
      branch('wm-private-wealth', 'Private Wealth Services', [
        branch('wm-advisory-team', 'Dedicated Advisory & Family Office', [
          leaf(T_WM_PWA, locale),
          leaf(T_WM_FAMILY_OFFICE, locale),
          leaf(T_WM_CONSOLIDATED, locale),
        ]),
      ]),
      branch('wm-investments', 'Investment Management', [
        branch('wm-custom-portfolios', 'Custom Portfolios & Specialized Assets', [
          leaf(T_SHARED_DIRECT_INDEXING, locale),
          leaf(T_WM_MUNI_LADDERS, locale),
          leaf(T_WM_ALTS, locale),
        ]),
      ]),
      branch('wm-trust-estate', 'Trust, Estate & Philanthropy', [
        branch('wm-estate-charitable', 'Estate & Charitable Giving', [
          leaf(T_WM_TRUST, locale),
          leaf(T_SHARED_DONOR_ADVISED_FUNDS, locale),
        ]),
      ]),
      branch('wm-lending', 'Lending & Cash Management', [
        branch('wm-liquidity-cash', 'Liquidity & Private Banking', [
          leaf(T_SHARED_PLEDGED_ASSET_LINE, locale),
          leaf(T_WM_MORTGAGES, locale),
          leaf(T_WM_PRIVATE_BANKING, locale),
        ]),
      ]),
      leaf(T_WM_RESEARCH, locale, { label: 'Insights & Perspectives' }),
    ],
  };
}

function buildRetirementGlobalNav(locale: SupportedLocale = DEFAULT_LOCALE): NavigationDocument {
  return {
    _id: `nav-retirementServices-global-web-${locale}`,
    title: `Web | Retirement Services | Global Header | ${locale}`,
    channel: 'web',
    experience: 'retirementServices',
    menuType: 'global',
    locale,
    isCanonical: locale === DEFAULT_LOCALE,
    smartling: { status: locale === DEFAULT_LOCALE ? 'source' : 'translated' },
    utilityLinks: buildUtilityLinks('retirementServices'),
    navItems: [
      branch('ret-plans', 'Retirement Plans', [
        branch('ret-plan-types', 'Defined Contribution, Nonqualified & Pooled', [
          leaf(T_RET_401K, locale, { badge: 'Core' }),
          leaf(T_RET_NONQUAL, locale),
          leaf(T_RET_PEPS, locale),
        ]),
      ]),
      branch('ret-sponsor', 'Plan Sponsor Services', [
        branch('ret-admin-fiduciary', 'Administration & Fiduciary Support', [
          leaf(T_RET_RECORDKEEPING, locale),
          leaf(T_RET_FIDUCIARY, locale),
        ]),
      ]),
      branch('ret-inst-inv', 'Institutional Investing', [
        branch('ret-lineup', 'Lineup & Managed Accounts', [
          leaf(T_RET_TDF, locale),
          leaf(T_RET_MANAGED, locale),
        ]),
      ]),
      leaf(T_RET_READINESS, locale, { label: 'Participant Experience' }),
      leaf(T_RET_SECURE2, locale, { label: 'Insights & Research' }),
    ],
  };
}

function buildWorkplaceGlobalNav(locale: SupportedLocale = DEFAULT_LOCALE): NavigationDocument {
  return {
    _id: `nav-workPlaceServices-global-web-${locale}`,
    title: `Web | Workplace Services | Global Header | ${locale}`,
    channel: 'web',
    experience: 'workPlaceServices',
    menuType: 'global',
    locale,
    isCanonical: locale === DEFAULT_LOCALE,
    smartling: { status: locale === DEFAULT_LOCALE ? 'source' : 'translated' },
    utilityLinks: buildUtilityLinks('workPlaceServices'),
    navItems: [
      branch('wp-stock-plans', 'Stock Plan Services', [
        branch('wp-equity-admin', 'Equity Compensation Administration', [
          leaf(T_WP_RSUS, locale, { badge: 'Popular' }),
          leaf(T_WP_OPTIONS, locale),
          leaf(T_WP_ESPP, locale),
          leaf(T_WP_SEC16, locale),
        ]),
      ]),
      branch('wp-retirement', 'Workplace Retirement', [
        branch('wp-benefits', 'Integrated Benefits', [
          leaf(T_WP_INTEGRATED, locale),
          leaf(T_WP_HSA, locale),
        ]),
      ]),
      leaf(T_WP_WELLNESS, locale, { label: 'Financial Wellness' }),
      branch('wp-employer', 'Employer Solutions', [
        branch('wp-admin-gov', 'Platform & Governance', [
          leaf(T_WP_SPONSOR_PORTAL, locale),
          leaf(T_WP_COMPLIANCE, locale),
        ]),
      ]),
      leaf(T_WP_TAX_HELP, locale, { label: 'Resources & Support' }),
    ],
  };
}

function buildSectionNavsForExperience(
  experience: ExperienceType,
  locale: SupportedLocale = DEFAULT_LOCALE,
): NavigationDocument[] {
  const base = {
    channel: 'web' as const,
    experience,
    menuType: 'section' as const,
    locale,
    isCanonical: locale === DEFAULT_LOCALE,
    smartling: { status: (locale === DEFAULT_LOCALE ? 'source' : 'translated') as 'source' | 'translated' },
    utilityLinks: [],
  };

  switch (experience) {
    case 'retail':
      return [
        {
          ...base,
          _id: `nav-retail-section-brokerage-web-${locale}`,
          title: `Web | Retail | Section Nav: Brokerage Account | ${locale}`,
          rootTarget: T_RETAIL_BROKERAGE,
          navItems: [
            leaf(T_RETAIL_BROKERAGE_OPEN, locale),
            leaf(T_RETAIL_BROKERAGE_MARGIN, locale),
            leaf(T_RETAIL_BROKERAGE_FUNDING, locale),
          ],
        },
      ];
    case 'advisorServices':
      return [
        {
          ...base,
          _id: `nav-advisorServices-section-readiness-web-${locale}`,
          title: `Web | Advisor Services | Section Nav: Independence Readiness | ${locale}`,
          rootTarget: T_ADV_READINESS,
          navItems: [
            leaf(T_ADV_READINESS_Q, locale),
            leaf(T_ADV_READINESS_PORT, locale),
            leaf(T_ADV_READINESS_TIME, locale),
          ],
        },
      ];
    case 'wealthManagement':
      return [
        {
          ...base,
          _id: `nav-wealthManagement-section-pwa-web-${locale}`,
          title: `Web | Wealth Management | Section Nav: Private Wealth Advisor | ${locale}`,
          rootTarget: T_WM_PWA,
          navItems: [
            leaf(T_WM_PWA_ACCOUNTABILITY, locale),
            leaf(T_WM_PWA_REVIEWS, locale),
            leaf(T_WM_PWA_CPA, locale),
          ],
        },
      ];
    case 'retirementServices':
      return [
        {
          ...base,
          _id: `nav-retirementServices-section-401k-web-${locale}`,
          title: `Web | Retirement Services | Section Nav: 401(k) Plans | ${locale}`,
          rootTarget: T_RET_401K,
          navItems: [
            leaf(T_RET_401K_SAFE, locale),
            leaf(T_RET_401K_AUTO, locale),
            leaf(T_RET_401K_ROTH, locale),
          ],
        },
      ];
    case 'workPlaceServices':
      return [
        {
          ...base,
          _id: `nav-workPlaceServices-section-rsus-web-${locale}`,
          title: `Web | Workplace Services | Section Nav: RSUs & Performance Shares | ${locale}`,
          rootTarget: T_WP_RSUS,
          navItems: [
            leaf(T_WP_RSU_VESTING, locale),
            leaf(T_WP_RSU_PSU, locale),
            leaf(T_WP_RSU_DIV, locale),
          ],
        },
      ];
  }
}

export const MOCK_NAVIGATION_DOCUMENTS: NavigationDocument[] = [
  // Global Header Menus (L1 -> L2 -> L3)
  buildRetailGlobalNav('en-US'),
  buildRetailGlobalNav('es'),
  buildRetailGlobalNav('zh-Hant'),
  buildAdvisorGlobalNav('en-US'),
  buildWealthGlobalNav('en-US'),
  buildRetirementGlobalNav('en-US'),
  buildWorkplaceGlobalNav('en-US'),
  // Per-Experience Utilities Menus (menuType: 'utility', max depth 1)
  buildUtilityMenu('retail', 'en-US'),
  buildUtilityMenu('retail', 'es'),
  buildUtilityMenu('retail', 'zh-Hant'),
  buildUtilityMenu('advisorServices', 'en-US'),
  buildUtilityMenu('wealthManagement', 'en-US'),
  buildUtilityMenu('retirementServices', 'en-US'),
  buildUtilityMenu('workPlaceServices', 'en-US'),
  // Section Navigation Menus (L3 -> L4+)
  ...buildSectionNavsForExperience('retail', 'en-US'),
  ...buildSectionNavsForExperience('advisorServices', 'en-US'),
  ...buildSectionNavsForExperience('wealthManagement', 'en-US'),
  ...buildSectionNavsForExperience('retirementServices', 'en-US'),
  ...buildSectionNavsForExperience('workPlaceServices', 'en-US'),
];

export function getMockNavigationDocument(params: {
  channel?: string;
  experience?: string;
  menuType?: MenuType;
  locale?: string;
}): NavigationDocument {
  const experience = (params.experience || 'retail') as ExperienceType;
  const locale = (params.locale || DEFAULT_LOCALE) as SupportedLocale;
  const channel = (params.channel || 'web') as NavigationDocument['channel'];
  const menuType: MenuType = params.menuType || 'global';

  if (menuType === 'utility') {
    return { ...buildUtilityMenu(experience, locale), channel };
  }

  if (menuType === 'section') {
    const sections = buildSectionNavsForExperience(experience, locale);
    return { ...sections[0], channel };
  }

  let doc: NavigationDocument;
  switch (experience) {
    case 'advisorServices':
      doc = buildAdvisorGlobalNav(locale);
      break;
    case 'wealthManagement':
      doc = buildWealthGlobalNav(locale);
      break;
    case 'retirementServices':
      doc = buildRetirementGlobalNav(locale);
      break;
    case 'workPlaceServices':
      doc = buildWorkplaceGlobalNav(locale);
      break;
    case 'retail':
    default:
      doc = buildRetailGlobalNav(locale);
      break;
  }

  return {
    ...doc,
    channel,
  };
}

export function getMockSectionNavigations(params: {
  channel?: string;
  experience?: string;
  locale?: string;
}): NavigationDocument[] {
  const experience = (params.experience || 'retail') as ExperienceType;
  const locale = (params.locale || DEFAULT_LOCALE) as SupportedLocale;
  const channel = (params.channel || 'web') as NavigationDocument['channel'];

  return buildSectionNavsForExperience(experience, locale).map((doc) => ({
    ...doc,
    channel,
  }));
}

/**
 * Helper to inspect which mock menus reference a given canonical navTarget ID
 * ("Also Used In" visibility across experiences).
 */
export function getMockTargetUsage(targetId: string): Array<{
  _id: string;
  title: string;
  experience: ExperienceType;
  menuType: MenuType;
  locale: SupportedLocale;
}> {
  const containsTarget = (items: NavItem[]): boolean =>
    items.some(
      (item) =>
        item.target?._id === targetId ||
        (Array.isArray(item.navItems) && containsTarget(item.navItems)),
    );

  return MOCK_NAVIGATION_DOCUMENTS.filter(
    (doc) => doc.rootTarget?._id === targetId || containsTarget(doc.navItems),
  ).map((doc) => ({
    _id: doc._id || doc.title,
    title: doc.title,
    experience: doc.experience,
    menuType: doc.menuType,
    locale: doc.locale,
  }));
}
