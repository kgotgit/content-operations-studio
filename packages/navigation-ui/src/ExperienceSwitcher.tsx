'use client';

import React from 'react';
import type { ExperienceOption, ExperienceType } from '@content-ops/navigation-contract';

export interface ExperienceSwitcherProps {
  currentExperience: ExperienceType;
  options?: ExperienceOption[];
  onSelectExperience?: (experience: ExperienceType) => void;
}

export function ExperienceSwitcher({
  currentExperience,
  options,
  onSelectExperience,
}: ExperienceSwitcherProps) {
  if (!options || options.length === 0) return null;

  return (
    <nav aria-label="Organizational Experiences" className="flex items-center h-full gap-4 sm:gap-5">
      {options.map((option) => {
        const isActive = option.id === currentExperience;
        return (
          <a
            key={option.id}
            href={option.href}
            onClick={(e) => {
              if (onSelectExperience) {
                e.preventDefault();
                onSelectExperience(option.id);
              }
            }}
            aria-current={isActive ? 'page' : undefined}
            className={`relative h-full inline-flex items-center text-[11.5px] tracking-tight transition-colors ${
              isActive
                ? 'font-semibold text-slate-950 after:absolute after:bottom-0 after:inset-x-0 after:h-[2px] after:bg-blue-700 after:rounded-full'
                : 'font-medium text-slate-500 hover:text-slate-900'
            }`}
          >
            {option.title}
          </a>
        );
      })}
    </nav>
  );
}
