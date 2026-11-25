import React from 'react';
import type {
  NavigationDocument,
  ExperienceType,
  SupportedLocale,
  ChannelType,
} from '@content-ops/navigation-contract';
import {
  resolveHref,
  resolveNavigationUrls,
  withExperienceAndLocaleOptions,
} from '@content-ops/navigation-adapters';
import { UtilityBar } from './UtilityBar';
import { MegaMenu } from './MegaMenu';
import { MobileDrawer } from './MobileDrawer';
import { SkipToContent } from './SkipToContent';

export interface HeaderNavigationProps {
  data: NavigationDocument;
  currentExperience?: ExperienceType;
  currentLocale?: SupportedLocale;
  currentChannel?: ChannelType;
  isRemote?: boolean;
  brandName?: string;
  brandLogoUrl?: string;
  className?: string;
}

export function HeaderNavigation({
  data,
  currentExperience = data.experience || 'general',
  currentLocale = data.locale || 'en-US',
  currentChannel = data.channel || 'web',
  isRemote = false,
  brandName = 'APEX',
  brandLogoUrl = '/',
  className = '',
}: HeaderNavigationProps) {
  // 1. Resolve URLs based on experience domain mapping & foreign host context
  const normalizedDoc = resolveNavigationUrls(data, { isRemote });

  // 2. Augment with active experience switcher and locale options
  const finalDoc = withExperienceAndLocaleOptions(
    normalizedDoc,
    currentExperience,
    currentLocale,
    undefined,
    isRemote,
  );

  return (
    <div
      id="enterprise-header-navigation"
      className={`remote-nav-scope relative z-40 w-full bg-white text-slate-900 border-b border-slate-200 antialiased font-sans ${className}`}
      data-channel={currentChannel}
      data-experience={currentExperience}
      data-locale={currentLocale}
    >
      <SkipToContent />

      {/* Top Utility Bar with Experience Switcher, Locale Dropdown, and Auth Island */}
      <UtilityBar
        currentExperience={currentExperience}
        currentLocale={currentLocale}
        utilityLinks={finalDoc.utilityLinks}
        experienceOptions={finalDoc.experienceSwitcherLinks}
        localeOptions={finalDoc.localeOptions}
        isRemote={isRemote}
      />

      {/* Main Brand & Mega Menu Header */}
      <header className="relative w-full bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand Identity & Desktop Navigation */}
          <div className="flex items-center space-x-6 sm:space-x-8">
            <a
              href={brandLogoUrl}
              className="flex items-center space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
              aria-label={`${brandName} Homepage`}
            >
              <div className="w-8 h-8 rounded bg-blue-900 flex items-center justify-center font-black text-white text-sm tracking-wider">
                A
              </div>
              <span className="font-extrabold text-xl tracking-tight text-blue-950 hidden sm:inline-block">
                {brandName}
              </span>
            </a>

            {/* Desktop Navigation (L1, L2, L3) */}
            <div className="hidden lg:flex items-center">
              <MegaMenu items={finalDoc.items} isRemote={isRemote} />
            </div>
          </div>

          {/* Right: Quick Action CTA (Desktop) + Mobile Drawer Trigger */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2">
              <a
                href={isRemote ? resolveHref('/open-account', currentExperience, undefined, true) : '/open-account'}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-sm transition-colors"
                data-analytics="nav:cta:open-account"
              >
                Open an Account
              </a>
            </div>

            {/* Mobile Hamburger Drawer */}
            <MobileDrawer
              items={finalDoc.items}
              currentExperience={currentExperience}
              currentLocale={currentLocale}
              experienceOptions={finalDoc.experienceSwitcherLinks}
              localeOptions={finalDoc.localeOptions}
            />
          </div>
        </div>
      </header>
    </div>
  );
}
