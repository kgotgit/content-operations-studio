'use client';

import React from 'react';
import type {
  UtilityItem,
  ExperienceOption,
  LocaleOption,
  ExperienceType,
  SupportedLocale,
} from '@content-ops/navigation-contract';
import { ExperienceSwitcher } from './ExperienceSwitcher';
import { LocaleSelector } from './LocaleSelector';
import { SearchDialog } from './SearchDialog';
import { AuthZoneIsland } from './AuthZoneIsland';

export interface UtilityBarProps {
  currentExperience: ExperienceType;
  currentLocale: SupportedLocale;
  utilityLinks?: UtilityItem[];
  experienceOptions?: ExperienceOption[];
  localeOptions?: LocaleOption[];
  loginUrl?: string;
  openAccountUrl?: string;
  isRemote?: boolean;
}

export function UtilityBar({
  currentExperience,
  currentLocale,
  utilityLinks = [],
  experienceOptions,
  localeOptions,
  loginUrl,
  openAccountUrl,
  isRemote = false,
}: UtilityBarProps) {
  return (
    <div className="w-full bg-slate-100 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-9">
        {/* Left: Flavors / Experiences (Personal, Workplace, Advisor) */}
        <div className="flex items-center h-full pt-1">
          <ExperienceSwitcher
            currentExperience={currentExperience}
            options={experienceOptions}
          />
        </div>

        {/* Right: Utility Links, Locale, Search & Auth Island */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Static Utility Links */}
          <div className="hidden md:flex items-center space-x-3">
            {utilityLinks
              .filter((link) => !link.requiresAuth && link.id !== 'u4' && link.id !== 'u5')
              .map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  className="text-xs text-slate-600 hover:text-slate-900 transition-colors"
                  data-analytics={link.analyticsTag}
                >
                  {link.title}
                </a>
              ))}
          </div>

          {/* Smartling Locale Selector */}
          <LocaleSelector
            currentLocale={currentLocale}
            localeOptions={localeOptions}
            isRemote={isRemote}
          />

          {/* Global Search Dialog */}
          <SearchDialog />

          {/* Dynamic Client Auth Island */}
          <AuthZoneIsland
            loginUrl={loginUrl}
            openAccountUrl={openAccountUrl}
            isRemote={isRemote}
          />
        </div>
      </div>
    </div>
  );
}
