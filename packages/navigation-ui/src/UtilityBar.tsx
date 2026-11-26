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

export interface UtilityBarProps {
  currentExperience: ExperienceType;
  currentLocale: SupportedLocale;
  utilityLinks?: UtilityItem[];
  experienceOptions?: ExperienceOption[];
  localeOptions?: LocaleOption[];
  isRemote?: boolean;
}

export function UtilityBar({
  currentExperience,
  currentLocale,
  utilityLinks = [],
  experienceOptions,
  localeOptions,
  isRemote = false,
}: UtilityBarProps) {
  return (
    <div className="w-full bg-slate-50/90 border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-9">
        {/* Left: Experience Switcher (Personal, Workplace, Advisor) */}
        <div className="flex items-center h-full">
          <ExperienceSwitcher
            currentExperience={currentExperience}
            options={experienceOptions}
          />
        </div>

        {/* Right: Quiet Utility Links + Locale Selector */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            {utilityLinks
              .filter((link) => !link.requiresAuth && link.id !== 'u4' && link.id !== 'u5')
              .slice(0, 3)
              .map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  className="text-[11.5px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
                  data-analytics={link.analyticsTag}
                >
                  {link.title}
                </a>
              ))}
          </div>

          <span className="hidden md:inline-block h-3.5 w-px bg-slate-200" aria-hidden="true" />

          <LocaleSelector
            currentLocale={currentLocale}
            localeOptions={localeOptions}
            isRemote={isRemote}
          />
        </div>
      </div>
    </div>
  );
}
