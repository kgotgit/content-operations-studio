'use client';

import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Globe, ChevronDown, Check } from 'lucide-react';
import type { LocaleOption, SupportedLocale } from '@content-ops/navigation-contract';

export interface LocaleSelectorProps {
  currentLocale: SupportedLocale;
  localeOptions?: LocaleOption[];
  onSelectLocale?: (locale: SupportedLocale) => void;
  isRemote?: boolean;
}

export function LocaleSelector({
  currentLocale,
  localeOptions,
  onSelectLocale,
  isRemote = false,
}: LocaleSelectorProps) {
  const currentOption = localeOptions?.find((l) => l.code === currentLocale) || {
    code: currentLocale,
    label: currentLocale,
  };

  const handleSelect = (code: SupportedLocale) => {
    if (onSelectLocale) {
      onSelectLocale(code);
      return;
    }

    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const parts = pathname.split('/').filter(Boolean);

      if (isRemote) {
        // In remote mode (/remote/navigation/[channel]/[experience]/[locale])
        if (parts[0] === 'remote' && parts[1] === 'navigation' && parts[4]) {
          parts[4] = code;
          window.location.href = `/${parts.join('/')}`;
          return;
        }
      }

      // In native mode (/[locale]/[experience]/...)
      if (parts[0] && ['en-US', 'en-HK', 'en-SG', 'es', 'zh-Hant', 'zh-Hans'].includes(parts[0])) {
        parts[0] = code;
        window.location.href = `/${parts.join('/')}`;
        return;
      }

      // Fallback: reload with new locale param
      window.location.href = `/${code}`;
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Select international region and language"
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-medium">{currentOption.label.split(' ')[0]}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="z-50 min-w-[220px] bg-white rounded-lg p-1.5 shadow-xl border border-slate-200 text-xs focus:outline-none"
        >
          <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Smartling Translated Locales
          </div>
          {localeOptions?.map((loc) => {
            const isSelected = loc.code === currentLocale;
            return (
              <DropdownMenu.Item
                key={loc.code}
                onSelect={() => handleSelect(loc.code as SupportedLocale)}
                className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{loc.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
