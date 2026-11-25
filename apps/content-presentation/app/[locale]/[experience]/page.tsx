import React from 'react';
import {
  ExperienceType,
  SupportedLocale,
  LOCALE_METADATA,
} from '@content-ops/navigation-contract';
import { getNavigationData } from '@content-ops/navigation-sanity';
import { ArrowRight, CheckCircle, Globe, Layers, ShieldCheck, Sparkles, Terminal } from 'lucide-react';

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ locale: string; experience: string }>;
}) {
  const { locale, experience } = await params;
  const navData = await getNavigationData({ channel: 'web', experience, locale });

  const experienceNames: Record<ExperienceType, string> = {
    general: 'Personal & Retail Investing (General)',
    retirement: 'Workplace & Retirement Plans',
    advisorservices: 'Institutional Advisor & RIA Services',
  };

  const experienceDescriptions: Record<ExperienceType, string> = {
    general: 'Direct-to-consumer prospect & client portal with $0 commission brokerage, IRAs, flagship active desktop platforms, and comprehensive wealth guidance.',
    retirement: 'Enterprise corporate 401(k) management, stock plan equity administration, executive deferred compensation, and financial wellness coaching.',
    advisorservices: 'Institutional custodian solutions for independent Registered Investment Advisors (RIAs), block trading technology, and practice consulting.',
  };

  const currentLocaleMeta = LOCALE_METADATA[locale as SupportedLocale] || {
    label: locale,
    direction: 'ltr',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Hero Showcase */}
      <section className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white rounded-2xl p-8 sm:p-12 shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-800/60 border border-blue-400/30 rounded-full text-xs font-semibold text-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Modernized from Legacy Drupal to Decoupled Next.js</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {experienceNames[experience as ExperienceType] || experience}
          </h1>

          <p className="text-base sm:text-lg text-blue-200 leading-relaxed">
            {experienceDescriptions[experience as ExperienceType] || ''}
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
            <code>{locale}</code>). English content is authored centrally and converted into target locales via automated Smartling translation jobs.
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
            This header functions both natively in App Router layouts and remotely via{' '}
            <code>@vercel/remote-components</code>. Legacy Drupal pages embed the exact same navigation via Edge CDN.
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
          <h2 className="text-base font-bold text-slate-900">Enterprise Ready</h2>
          <ul className="text-xs text-slate-600 space-y-1.5 list-none p-0 m-0">
            <li className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Full Radix ARIA keyboard navigation</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Cross-domain relative/absolute URL resolution</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Dynamic client-side Auth Island</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
