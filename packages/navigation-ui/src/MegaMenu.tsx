'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ArrowRight, Sparkles, ExternalLink } from 'lucide-react';
import type { NavItemLevel1 } from '@content-ops/navigation-contract';

export interface MegaMenuProps {
  items: NavItemLevel1[];
  isRemote?: boolean;
  /** Maximum top-level items displayed on desktop to keep the bar sleek and uncluttered. */
  maxItems?: number;
}

export function MegaMenu({ items, maxItems = 4 }: MegaMenuProps) {
  const visibleItems = maxItems > 0 ? items.slice(0, maxItems) : items;
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activePath, setActivePath] = useState<string>('');
  const menuRef = useRef<HTMLElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActivePath(window.location.pathname);
    }

    // Close on click outside (supporting Shadow DOM retargeting via composedPath)
    const handleClickOutside = (event: MouseEvent) => {
      const path = event.composedPath ? event.composedPath() : [];
      if (menuRef.current && !path.includes(menuRef.current) && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };

    // Close on Escape key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = (id: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setActiveMenuId(id);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveMenuId(null);
    }, 200); // 200ms grace period for smooth navigation
  };

  const handleTriggerClick = (id: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setActiveMenuId((prev) => (prev === id ? null : id));
  };

  return (
    <nav
      ref={menuRef}
      aria-label="Main Navigation"
      className="flex items-center"
      onMouseLeave={handleMouseLeave}
    >
      <ul className="flex items-center list-none m-0 p-0 gap-1">
        {visibleItems.map((l1) => {
          const isOpen = activeMenuId === l1.id;
          const isDirectLink = !l1.isMegaMenu || !l1.sections || l1.sections.length === 0;

          // Direct link without mega menu
          if (isDirectLink) {
            const isCurrent = activePath === l1.href;
            return (
              <li key={l1.id}>
                <a
                  href={l1.href || '#'}
                  className={`inline-flex items-center px-3.5 py-2 text-[13.5px] font-medium rounded-full transition-colors whitespace-nowrap ${
                    isCurrent
                      ? 'text-slate-950 bg-slate-100 font-semibold'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/80'
                  }`}
                >
                  {l1.title}
                </a>
              </li>
            );
          }

          // Mega menu item with click + hover support
          return (
            <li
              key={l1.id}
              onMouseEnter={() => handleMouseEnter(l1.id)}
            >
              <button
                type="button"
                onClick={() => handleTriggerClick(l1.id)}
                aria-expanded={isOpen}
                aria-controls={`mega-menu-${l1.id}`}
                className={`group inline-flex items-center gap-1 px-3.5 py-2 text-[13.5px] font-medium rounded-full transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isOpen
                    ? 'text-slate-950 bg-slate-100 font-semibold'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/80'
                }`}
              >
                <span>{l1.title}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-blue-700' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                  aria-hidden="true"
                />
              </button>

              {/* Full-bleed Mega Menu Dropdown Shelf */}
              <div
                id={`mega-menu-${l1.id}`}
                role="region"
                aria-label={`${l1.title} Submenu`}
                aria-hidden={!isOpen}
                data-state={isOpen ? 'open' : 'closed'}
                className={`absolute left-0 right-0 top-full bg-white border-t border-b border-slate-200/90 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.18)] z-50 animate-in fade-in-0 slide-in-from-top-1 duration-150 ${
                  isOpen ? 'block' : 'hidden'
                }`}
                onMouseEnter={() => {
                  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                }}
              >
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                      {/* Sections (L2 & L3) */}
                      <div
                        className={`${
                          l1.promoCard ? 'md:col-span-8' : 'md:col-span-12'
                        } grid grid-cols-1 sm:grid-cols-2 gap-8`}
                      >
                        {l1.sections?.map((l2) => (
                          <div key={l2.id} className="space-y-3">
                            {/* L2 Section Header */}
                            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                {l2.sectionTitle}
                              </h3>
                              {l2.href && (
                                <a
                                  href={l2.href}
                                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 group/more"
                                  onClick={() => setActiveMenuId(null)}
                                >
                                  <span>View all</span>
                                  <ArrowRight className="w-3 h-3 group-hover/more:translate-x-0.5 transition-transform" />
                                </a>
                              )}
                            </div>

                            {/* L3 Link Cards */}
                            <ul className="space-y-1 list-none p-0 m-0">
                              {l2.items.map((l3) => (
                                <li key={l3.id}>
                                  <a
                                    href={l3.href}
                                    data-analytics={l3.analyticsTag}
                                    onClick={() => setActiveMenuId(null)}
                                    className="group/link flex items-start justify-between p-2.5 -mx-1.5 rounded-xl hover:bg-slate-50 transition-all duration-150"
                                  >
                                    <div className="space-y-0.5 pr-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-slate-900 group-hover/link:text-blue-700 transition-colors">
                                          {l3.title}
                                        </span>
                                        {l3.badge && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-blue-50 text-blue-700 border border-blue-200/60 uppercase">
                                            {l3.badge}
                                          </span>
                                        )}
                                        {l3.isExternal && (
                                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover/link:text-slate-600" />
                                        )}
                                      </div>
                                      {l3.description && (
                                        <p className="text-xs text-slate-500 group-hover/link:text-slate-600 line-clamp-2 leading-relaxed">
                                          {l3.description}
                                        </p>
                                      )}
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 -translate-x-1 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all shrink-0 mt-0.5" />
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      {/* Promo Card Slot */}
                      {l1.promoCard && (
                        <div className="md:col-span-4 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between border border-slate-800 min-h-[260px]">
                          {/* Ambient soft glow */}
                          <div className="absolute -top-12 -right-12 w-44 h-44 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

                          <div className="relative z-10">
                            {l1.promoCard.badge && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded-full mb-3 backdrop-blur-sm">
                                <Sparkles className="w-3 h-3 text-blue-300" />
                                {l1.promoCard.badge}
                              </span>
                            )}
                            <h4 className="text-lg font-bold text-white tracking-tight leading-snug">
                              {l1.promoCard.title}
                            </h4>
                            <p className="text-xs text-slate-300 leading-relaxed mt-2.5">
                              {l1.promoCard.description}
                            </p>
                          </div>

                          <div className="relative z-10 pt-6">
                            <a
                              href={l1.promoCard.ctaUrl}
                              onClick={() => setActiveMenuId(null)}
                              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 text-xs font-bold text-slate-950 bg-white hover:bg-slate-100 rounded-xl shadow transition-colors"
                            >
                              <span>{l1.promoCard.ctaText}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Utility Strip */}
                    <div className="mt-8 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>
                          Questions? Licensed specialists available 24/7 at{' '}
                          <strong className="text-slate-700">1-800-555-0199</strong>
                        </span>
                      </div>
                      <div className="flex items-center space-x-6 font-medium">
                        <a href="/pricing" className="hover:text-blue-700 transition-colors">
                          Pricing & Rates
                        </a>
                        <a href="/security" className="hover:text-blue-700 transition-colors">
                          Security Guarantee
                        </a>
                        <a href="/branch" className="hover:text-blue-700 transition-colors">
                          Find a Branch
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
