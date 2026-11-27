import React from 'react';
import {
  EXPERIENCE_METADATA,
  LOCALE_METADATA,
  normalizeExperience,
  resolveTargetHref,
  type ExperienceType,
  type SupportedLocale,
} from '@content-ops/navigation-contract';
import {
  MOCK_NAV_TARGETS,
  getMockTargetUsage,
  getNavigationData,
  getSectionNavigations,
} from '@content-ops/navigation-sanity';
import { SectionNavigation } from '@content-ops/navigation-ui';
import { ArrowRight, CheckCircle, Globe, Layers, Link2, ShieldCheck, Sparkles, Terminal } from 'lucide-react';

export const instant = false;

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ locale: string; experience: string }>;
}) {
  const { locale, experience: rawExperience } = await params;
  const experience = normalizeExperience(rawExperience) ?? 'retail';
  const typedExp = experience as ExperienceType;
  const typedLocale = locale as SupportedLocale;

  const [navData, sectionNavs] = await Promise.all([
    getNavigationData({ channel: 'web', experience: typedExp, menuType: 'global', locale: typedLocale }),
    getSectionNavigations({ channel: 'web', experience: typedExp, locale: typedLocale }),
  ]);

  const expMeta = EXPERIENCE_METADATA[typedExp] || {
    label: experience,
    shortLabel: experience,
    description: '',
  };

  const currentLocaleMeta = LOCALE_METADATA[typedLocale] || {
    label: locale,
    direction: 'ltr',
  };

  // Highlight canonical enterprise targets shared across multiple experiences
  const sharedTargets = MOCK_NAV_TARGETS.filter((t) => t.owningExperience === 'enterprise');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Hero Showcase */}
      <section className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white rounded-2xl p-8 sm:p-12 shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-800/60 border border-blue-400/30 rounded-full text-xs font-semibold text-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Apex Scoped Navigation &bull; Uniform navItem + Canonical navTarget</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {expMeta.label}
          </h1>

          <p className="text-base sm:text-lg text-blue-200 leading-relaxed">
            {expMeta.description}
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <a
              href={`/remote/navigation/web/${experience}/${locale}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-md transition-colors"
            >
              <Terminal className="w-4 h-4" />
              <span>Inspect Remote Component Endpoint</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="/open-account"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-950 hover:bg-slate-100 text-xs font-bold rounded-lg shadow-md transition-colors"
            >
              <span>Get Started</span>
            </a>
          </div>
        </div>
      </section>

      {/* Live Section Navigation (L3 -> L4+) + Canonical Target Reuse */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Section Navigation (L3 Handoff) */}
        <div className="lg:col-span-4 space-y-4">
          {sectionNavs.map((sectionDoc) => (
            <SectionNavigation key={sectionDoc._id || sectionDoc.title} data={sectionDoc} />
          ))}
        </div>

        {/* Right: Canonical navTarget Reuse ("Also Used In") */}
        <div className="lg:col-span-8 bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                <Link2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Canonical <code>navTarget</code> Reuse &amp; Localized URLs
                </h2>
                <p className="text-xs text-slate-500">
                  Single source of truth for legacy CMS → Sanity Page migration, auto-prefixed for <code>{locale}</code>.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {sharedTargets.map((target) => {
              const resolvedUrl = resolveTargetHref(target, typedLocale);
              const usages = getMockTargetUsage(target._id);
              return (
                <div key={target._id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900">{target.title}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-slate-100 text-slate-700">
                      {target.destinationType === 'sanityPage' ? 'Sanity Page' : 'Legacy CMS'}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-blue-700">{resolvedUrl}</p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[11px] text-slate-400">Also used in:</span>
                    {usages.map((u) => (
                      <span
                        key={u._id}
                        className="px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-800 rounded-md border border-blue-100"
                      >
                        {u.experience} ({u.menuType} · {u.locale})
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Architecture Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Smartling Localization Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
              <Globe className="w-5 h-5" />
            </div>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                navData.isCanonical
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {navData.isCanonical ? 'Canonical Source' : 'Smartling Translated'}
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Smartling Automated Localization</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Current locale is <strong className="text-slate-900">{currentLocaleMeta.label}</strong> (
            <code>{locale}</code>). Canonical paths automatically receive localized prefixes (e.g.{' '}
            <code>/es/</code>, <code>/zh-hant/</code>) with optional per-locale slug overrides.
          </p>
          <div className="text-[11px] font-mono bg-slate-50 p-2 rounded text-slate-600 border border-slate-200">
            Smartling Job: {navData.smartling?.jobId || 'N/A (Canonical Source)'}
            <br />
            Status: {navData.smartling?.status || 'source'}
          </div>
        </div>

        {/* Card 2: Dual Delivery (Native + Remote) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-blue-100 text-blue-800">
              Dual Compatible
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Vercel Remote Components</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            This header renders both natively in App Router layouts and remotely via{' '}
            <code>@vercel/remote-components</code> for legacy CMS pages via Edge CDN.
          </p>
          <div className="text-[11px] font-mono bg-slate-50 p-2 rounded text-slate-600 border border-slate-200">
            Route: /remote/navigation/web/{experience}/{locale}
            <br />
            Cache: Edge CDN ISR (s-maxage=86400)
          </div>
        </div>

        {/* Card 3: Enterprise Hardening */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-100 text-emerald-800">
              WCAG 2.1 AA
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Domain Governance &amp; Depth Guard</h2>
          <ul className="text-xs text-slate-600 space-y-1.5 list-none p-0 m-0">
            <li className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Global Header strictly capped at 3 levels (L1–L3)</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Derived clickability: leaf = link, branch = dropdown</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Independent editorial workflows per experience</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
