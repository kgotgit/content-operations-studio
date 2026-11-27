'use client';

import React, { useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Accordion from '@radix-ui/react-accordion';
import { Menu, X, ChevronDown, ArrowRight } from 'lucide-react';
import type {
  ExperienceOption,
  ExperienceType,
  LocaleOption,
  NavItem,
  SupportedLocale,
} from '@content-ops/navigation-contract';

const hasChildren = (item: NavItem) => Array.isArray(item.navItems) && item.navItems.length > 0;
import { LocaleSelector } from './LocaleSelector';
import { usePortalContainer } from './usePortalContainer';

export interface MobileDrawerProps {
  items: NavItem[];
  currentExperience: ExperienceType;
  currentLocale: SupportedLocale;
  experienceOptions?: ExperienceOption[];
  localeOptions?: LocaleOption[];
}

export function MobileDrawer({
  items,
  currentExperience,
  currentLocale,
  experienceOptions,
  localeOptions,
}: MobileDrawerProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const portalContainer = usePortalContainer(triggerRef);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          ref={triggerRef}
          type="button"
          aria-label="Open mobile navigation menu"
          className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal container={portalContainer ?? undefined}>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl p-5 overflow-y-auto focus:outline-none flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <Dialog.Title className="font-bold text-lg text-blue-950">Navigation</Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            {/* Experience Switcher */}
            <div className="py-3 border-b border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Experience
              </p>
              <div className="flex flex-col space-y-1">
                {experienceOptions?.map((exp) => (
                  <a
                    key={exp.id}
                    href={exp.href}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md ${
                      exp.id === currentExperience
                        ? 'bg-blue-900 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {exp.title}
                  </a>
                ))}
              </div>
            </div>

            {/* Uniform NavItem Accordion (L1 -> L2 -> L3) */}
            <div className="py-4">
              <Accordion.Root type="multiple" className="space-y-2">
                {items.map((l1) => {
                  if (!hasChildren(l1)) {
                    return (
                      <div key={l1.id} className="py-2 border-b border-slate-100">
                        <a
                          href={l1.href || '#'}
                          className="text-sm font-bold text-slate-900 hover:text-blue-700"
                        >
                          {l1.label}
                        </a>
                      </div>
                    );
                  }

                  return (
                    <Accordion.Item
                      key={l1.id}
                      value={l1.id}
                      className="border-b border-slate-100 pb-2"
                    >
                      <Accordion.Header>
                        <Accordion.Trigger className="w-full flex items-center justify-between py-2 text-sm font-bold text-slate-900 hover:text-blue-700 focus:outline-none">
                          <span>{l1.label}</span>
                          <ChevronDown className="w-4 h-4 text-slate-400 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                        </Accordion.Trigger>
                      </Accordion.Header>

                      <Accordion.Content className="pt-2 pl-2 space-y-4">
                        {(l1.navItems || []).map((l2) => {
                          if (!hasChildren(l2)) {
                            return (
                              <a
                                key={l2.id}
                                href={l2.href || '#'}
                                className="block py-1 text-xs font-semibold text-slate-700 hover:text-blue-700"
                              >
                                {l2.label}
                              </a>
                            );
                          }

                          return (
                            <div key={l2.id} className="space-y-2">
                              <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                                {l2.label}
                              </p>
                              <ul className="space-y-1 list-none p-0 m-0 pl-2">
                                {(l2.navItems || []).map((l3) => (
                                  <li key={l3.id}>
                                    <a
                                      href={l3.href || '#'}
                                      data-analytics={l3.analyticsTag}
                                      className="flex items-center justify-between py-1 text-xs text-slate-700 hover:text-blue-700"
                                    >
                                      <span>{l3.label}</span>
                                      {l3.badge && (
                                        <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-blue-100 text-blue-800 rounded">
                                          {l3.badge}
                                        </span>
                                      )}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}

                        {l1.promoCard && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-xs font-bold text-blue-950 mb-1">
                              {l1.promoCard.title}
                            </p>
                            <p className="text-[11px] text-slate-600 mb-2">
                              {l1.promoCard.description}
                            </p>
                            <a
                              href={l1.promoCard.ctaUrl}
                              className="text-xs font-bold text-blue-800 hover:underline inline-flex items-center gap-1"
                            >
                              <span>{l1.promoCard.ctaText}</span>
                              <ArrowRight className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </Accordion.Content>
                    </Accordion.Item>
                  );
                })}
              </Accordion.Root>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Region & Language</span>
              <LocaleSelector
                currentLocale={currentLocale}
                localeOptions={localeOptions}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <a
                href="/login"
                className="py-2 text-center text-xs font-bold text-blue-900 border border-blue-900/30 rounded-lg hover:bg-blue-50"
              >
                Log In
              </a>
              <a
                href="/open-account"
                className="py-2 text-center text-xs font-bold text-white bg-blue-700 rounded-lg shadow-sm hover:bg-blue-800"
              >
                Open Account
              </a>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
