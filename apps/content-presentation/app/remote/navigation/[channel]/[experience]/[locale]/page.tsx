import React from 'react';
import { notFound } from 'next/navigation';
import {
  CHANNELS,
  EXPERIENCES,
  LOCALES,
  ChannelType,
  ExperienceType,
  SupportedLocale,
  isSupportedChannel,
  isSupportedLocale,
  normalizeExperience,
} from '@content-ops/navigation-contract';
import { getNavigationData } from '@content-ops/navigation-sanity';
import { HeaderNavigation } from '@content-ops/navigation-ui';
import { ExposeRemoteComponent } from 'remote-components/remote/nextjs/app';
import type { Metadata } from 'next';

/**
 * These routes are fragments consumed by hosts (Next.js, Drupal), not pages for search.
 * `follow` keeps link discovery; `noindex` keeps the bare fragment out of results.
 */
export const metadata: Metadata = {
  title: 'Header navigation fragment',
  robots: { index: false, follow: true },
};

/**
 * Pre-render all valid combinations of Channel x Experience x Locale at build time
 * so Vercel Edge CDN caches clean paths with zero dynamic cold-start latency.
 */
export async function generateStaticParams() {
  const paths: Array<{ channel: string; experience: string; locale: string }> = [];

  for (const channel of CHANNELS) {
    for (const experience of EXPERIENCES) {
      for (const locale of LOCALES) {
        paths.push({ channel, experience, locale });
      }
    }
  }

  return paths;
}

export default async function RemoteNavigationPage({
  params,
}: {
  params: Promise<{ channel: string; experience: string; locale: string }>;
}) {
  const { channel, experience: rawExperience, locale } = await params;
  const experience = normalizeExperience(rawExperience);

  if (
    !isSupportedChannel(channel) ||
    !experience ||
    !isSupportedLocale(locale)
  ) {
    notFound();
  }

  // Fetch Global Header + Per-Experience Utilities Menu in parallel
  const [navData, utilitiesMenu] = await Promise.all([
    getNavigationData({
      channel: channel as ChannelType,
      experience: experience as ExperienceType,
      menuType: 'global',
      locale: locale as SupportedLocale,
    }),
    getNavigationData({
      channel: channel as ChannelType,
      experience: experience as ExperienceType,
      menuType: 'utility',
      locale: locale as SupportedLocale,
    }),
  ]);

  return (
    <ExposeRemoteComponent name="header-navigation">
      <div id="remote-navigation-root" className="nav-isolated-scope w-full">
        <HeaderNavigation
          data={navData}
          utilitiesMenu={utilitiesMenu}
          currentExperience={experience as ExperienceType}
          currentLocale={locale as SupportedLocale}
          currentChannel={channel as ChannelType}
          isRemote={true}
        />
      </div>
    </ExposeRemoteComponent>
  );
}
