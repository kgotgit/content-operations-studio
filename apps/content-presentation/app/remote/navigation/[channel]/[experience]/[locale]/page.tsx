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
  isSupportedExperience,
  isSupportedLocale,
} from '@content-ops/navigation-contract';
import { getNavigationData } from '@content-ops/navigation-sanity';
import { HeaderNavigation } from '@content-ops/navigation-ui';
import { ExposeRemoteComponent } from 'remote-components/remote/nextjs/app';

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
  const { channel, experience, locale } = await params;

  if (
    !isSupportedChannel(channel) ||
    !isSupportedExperience(experience) ||
    !isSupportedLocale(locale)
  ) {
    notFound();
  }

  // Fetch navigation data (with Smartling fallback to canonical en-US if unseeded)
  const navData = await getNavigationData({
    channel: channel as ChannelType,
    experience: experience as ExperienceType,
    locale: locale as SupportedLocale,
  });

  return (
    <ExposeRemoteComponent name="header-navigation">
      <div id="remote-navigation-root" className="nav-isolated-scope w-full">
        <HeaderNavigation
          data={navData}
          currentExperience={experience as ExperienceType}
          currentLocale={locale as SupportedLocale}
          currentChannel={channel as ChannelType}
          isRemote={true}
        />
      </div>
    </ExposeRemoteComponent>
  );
}
