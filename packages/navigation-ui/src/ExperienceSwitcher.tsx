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
    <nav aria-label="Organizational Experiences" className="flex items-center space-x-1">
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
            className={`px-3 py-1 text-xs font-semibold rounded-t-md transition-colors ${
              isActive
                ? 'bg-white text-blue-900 border-t-2 border-blue-700 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            {option.title}
          </a>
        );
      })}
    </nav>
  );
}
