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
import { SearchDialog } from './SearchDialog';
import { AuthZoneIsland } from './AuthZoneIsland';

export interface HeaderNavigationProps {
  data: NavigationDocument;
  /** Dedicated per-experience utilities menu (menuType: 'utility') */
  utilitiesMenu?: NavigationDocument;
  currentExperience?: ExperienceType;
  currentLocale?: SupportedLocale;
  currentChannel?: ChannelType;
  isRemote?: boolean;
  brandName?: string;
  brandLogoUrl?: string;
  /** Maximum top-level nav items shown in the desktop header bar. Defaults to 5. */
  maxDesktopItems?: number;
  className?: string;
}

export function HeaderNavigation({
  data,
  utilitiesMenu,
  currentExperience = data.experience || 'retail',
  currentLocale = data.locale || 'en-US',
  currentChannel = data.channel || 'web',
  isRemote = false,
  brandName = 'APEX',
  brandLogoUrl = '/',
  maxDesktopItems = 5,
  className = '',
}: HeaderNavigationProps) {
  // 1. Resolve URLs based on locale prefix, experience domain mapping & foreign host context
  const normalizedDoc = resolveNavigationUrls(data, { isRemote });
  const normalizedUtilities = utilitiesMenu
    ? resolveNavigationUrls(utilitiesMenu, { isRemote })
    : undefined;

  // 2. Augment with active experience switcher and locale options
  const finalDoc = withExperienceAndLocaleOptions(
    normalizedDoc,
    currentExperience,
    currentLocale,
    undefined,
    isRemote,
  );

  const loginUrl = resolveHref('/login', currentExperience, undefined, isRemote, currentLocale);
  const openAccountUrl = resolveHref('/open-account', currentExperience, undefined, isRemote, currentLocale);

  return (
    <div
      id="enterprise-header-navigation"
      className={`remote-nav-scope relative z-40 w-full bg-white text-slate-900 antialiased font-sans ${className}`}
      data-channel={currentChannel}
      data-experience={currentExperience}
      data-menu-type={finalDoc.menuType || 'global'}
      data-locale={currentLocale}
    >
      <SkipToContent />

      {/* Top Utility Bar: Experience Switcher + Per-Experience Utilities Menu & Locale */}
      <UtilityBar
        currentExperience={currentExperience}
        currentLocale={currentLocale}
        items={normalizedUtilities?.navItems}
        utilityLinks={finalDoc.utilityLinks}
        experienceOptions={finalDoc.experienceSwitcherLinks}
        localeOptions={finalDoc.localeOptions}
        isRemote={isRemote}
      />

      {/* Main Brand, Sleek L1 Navigation, Search & Single Primary CTA */}
      <header className="relative z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand Identity + Desktop L1 Navigation */}
          <div className="flex items-center gap-6 lg:gap-8 min-w-0">
            <a
              href={brandLogoUrl}
              className="flex items-center gap-2.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg"
              aria-label={`${brandName} Homepage`}
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center font-black text-white text-sm tracking-wider shadow-sm">
                A
              </div>
              <span className="font-extrabold text-lg tracking-tight text-slate-950 hidden sm:inline-block">
                {brandName}
              </span>
            </a>

            {/* Desktop Navigation (L1 -> L2 -> L3, capped at maxDesktopItems) */}
            <div className="hidden lg:flex items-center">
              <MegaMenu
                items={finalDoc.navItems}
                isRemote={isRemote}
                maxItems={maxDesktopItems}
              />
            </div>
          </div>

          {/* Right: Sleek Search + Single Auth/CTA Zone + Mobile Drawer */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <SearchDialog />

            <AuthZoneIsland
              loginUrl={loginUrl}
              openAccountUrl={openAccountUrl}
              isRemote={isRemote}
            />

            <MobileDrawer
              items={finalDoc.navItems}
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
