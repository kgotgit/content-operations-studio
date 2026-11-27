import React from 'react';
import { notFound } from 'next/navigation';
import {
  EXPERIENCES,
  LOCALES,
  type ExperienceType,
  type SupportedLocale,
  isSupportedLocale,
  normalizeExperience,
} from '@content-ops/navigation-contract';
import { getNavigationData } from '@content-ops/navigation-sanity';
import { HeaderNavigation } from '@content-ops/navigation-ui';

export async function generateStaticParams() {
  const params: Array<{ locale: string; experience: string }> = [];
  for (const locale of LOCALES) {
    for (const experience of EXPERIENCES) {
      params.push({ locale, experience });
    }
  }
  return params;
}

export default async function ExperienceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; experience: string }>;
}) {
  const { locale, experience: rawExperience } = await params;
  const experience = normalizeExperience(rawExperience);

  if (!isSupportedLocale(locale) || !experience) {
    notFound();
  }

  // Server-side render Global Header (L1 -> L3) + Per-Experience Utilities Menu in parallel
  const [navData, utilitiesMenu] = await Promise.all([
    getNavigationData({
      channel: 'web',
      experience,
      menuType: 'global',
      locale,
    }),
    getNavigationData({
      channel: 'web',
      experience,
      menuType: 'utility',
      locale,
    }),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <HeaderNavigation
        data={navData}
        utilitiesMenu={utilitiesMenu}
        currentExperience={experience as ExperienceType}
        currentLocale={locale as SupportedLocale}
        currentChannel="web"
        isRemote={false}
      />

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-xs space-y-4">
          <p className="font-semibold text-slate-300">
            Apex Decoupled Content Operations &bull; Next.js 16 + React 19 + Sanity Studio + Vercel Remote Components
          </p>
          <p>
            Brokerage and investment products are offered by Apex Financial Services. Not FDIC insured. No bank guarantee. May lose value.
          </p>
          <p className="text-slate-500">
            Active Experience: <span className="text-slate-300 font-medium">{experience}</span> | Menu Type:{' '}
            <span className="text-slate-300 font-medium">{navData.menuType}</span> | Active Locale:{' '}
            <span className="text-slate-300 font-medium">{locale}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
