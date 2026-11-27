import React from 'react';
import Link from 'next/link';
import {
  EXPERIENCES,
  EXPERIENCE_METADATA,
  LOCALES,
} from '@content-ops/navigation-contract';
import { ArrowRight, Layers, Sparkles, Terminal } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 sm:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs font-semibold text-blue-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Apex Content Operations Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
            Apex Enterprise Navigation Hub
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
            Scoped multi-experience, multi-channel navigation powered by Next.js App Router, Sanity Studio (uniform{' '}
            <code>navItem</code> + canonical <code>navTarget</code> registry), and Smartling localization.
          </p>
        </div>

        {/* Section 1: Native App Router Experiences */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-xl font-bold text-white border-b border-slate-800 pb-3">
            <Layers className="w-5 h-5 text-blue-400" />
            <span>Native Next.js Experiences (App Router SSR)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {EXPERIENCES.map((exp) => {
              const meta = EXPERIENCE_METADATA[exp];
              return (
                <div
                  key={exp}
                  className="bg-slate-800/80 rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 transition-colors flex flex-col justify-between space-y-4"
                >
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{meta.label}</h3>
                    <p className="text-xs text-slate-400 mb-2">{meta.description}</p>
                    <p className="text-xs text-slate-400">
                      Experience slug: <code className="text-blue-300">{exp}</code>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Select Locale:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {LOCALES.map((loc) => (
                        <Link
                          key={loc}
                          href={`/${loc}/${exp}`}
                          className="px-2.5 py-1 text-xs bg-slate-700/80 hover:bg-blue-600 text-slate-200 hover:text-white rounded transition-colors"
                        >
                          {loc}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={`/en-US/${exp}`}
                    className="inline-flex items-center justify-between text-xs font-bold text-blue-400 hover:text-blue-300 pt-2 border-t border-slate-700/60"
                  >
                    <span>Launch {meta.shortLabel} (en-US Default)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Remote Components for Legacy CMS */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-xl font-bold text-white border-b border-slate-800 pb-3">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <span>Path-Based Vercel Remote Components (For Legacy CMS Ingestion)</span>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-700 space-y-4">
            <p className="text-sm text-slate-300 leading-relaxed">
              Pre-rendered at build time with <code>generateStaticParams()</code> and cached globally on Vercel Edge CDN for micro-frontend ingestion into legacy CMS pages.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { exp: 'retail', loc: 'en-US', name: 'Retail - en-US (Canonical)' },
                { exp: 'retail', loc: 'zh-Hant', name: 'Retail - zh-Hant (Traditional Chinese)' },
                { exp: 'retail', loc: 'es', name: 'Retail - es (Spanish)' },
                { exp: 'advisorServices', loc: 'en-US', name: 'Advisor Services - en-US' },
                { exp: 'wealthManagement', loc: 'en-US', name: 'Wealth Management - en-US' },
                { exp: 'retirementServices', loc: 'en-US', name: 'Retirement Services - en-US' },
                { exp: 'workPlaceServices', loc: 'en-US', name: 'Workplace Services - en-US' },
              ].map((item) => (
                <a
                  key={`${item.exp}-${item.loc}`}
                  href={`/remote/navigation/web/${item.exp}/${item.loc}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-slate-900/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-xs font-mono text-emerald-300 hover:text-white transition-colors"
                >
                  <span>{item.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
