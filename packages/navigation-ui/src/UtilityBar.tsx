'use client';

import React from 'react';
import type {
  NavItem,
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
  /** Primary: uniform NavItem[] from the experience's dedicated utilitiesMenu (menuType: 'utility') */
  items?: NavItem[];
  /** Legacy fallback if utilityLinks are still passed directly */
  utilityLinks?: UtilityItem[];
  experienceOptions?: ExperienceOption[];
  localeOptions?: LocaleOption[];
  isRemote?: boolean;
}

export function UtilityBar({
  currentExperience,
  currentLocale,
  items,
  utilityLinks = [],
  experienceOptions,
  localeOptions,
  isRemote = false,
}: UtilityBarProps) {
  const renderedLinks: Array<{ id: string; label: string; href: string; analyticsTag?: string }> =
    items && items.length > 0
      ? items.slice(0, 4).map((item) => ({
          id: item.id,
          label: item.label,
          href: item.href || '#',
          analyticsTag: item.analyticsTag,
        }))
      : utilityLinks
          .filter((link) => !link.requiresAuth && link.id !== 'u4' && link.id !== 'u5')
          .slice(0, 4)
          .map((link) => ({
            id: link.id,
            label: link.title,
            href: link.href,
            analyticsTag: link.analyticsTag,
          }));

  return (
    <div className="w-full bg-slate-50/90 border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-9">
        {/* Left: Experience Switcher */}
        <div className="flex items-center h-full">
          <ExperienceSwitcher
            currentExperience={currentExperience}
            options={experienceOptions}
          />
        </div>

        {/* Right: Per-Experience Utilities Menu + Locale Selector */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            {renderedLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                className="text-[11.5px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
                data-analytics={link.analyticsTag}
              >
                {link.label}
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
