'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, X, ArrowRight, TrendingUp } from 'lucide-react';
import { usePortalContainer } from './usePortalContainer';

const POPULAR_SEARCHES = [
  { label: 'Rollover IRA', category: 'Retirement', href: '/accounts/ira' },
  { label: 'Brokerage Account', category: 'Accounts', href: '/accounts/brokerage' },
  { label: 'Active Trading Desktop', category: 'Platforms', href: '/trading/desktop' },
  { label: 'Zero-Fee ETFs', category: 'Products', href: '/products/etfs' },
  { label: '401(k) Workplace Plans', category: 'Workplace', href: '/workplace/401k' },
  { label: 'Pricing & Rates', category: 'Support', href: '/pricing' },
];

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const portalContainer = usePortalContainer(triggerRef);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const trimmed = query.trim().toLowerCase();
  const matches = trimmed
    ? POPULAR_SEARCHES.filter(
        (item) =>
          item.label.toLowerCase().includes(trimmed) ||
          item.category.toLowerCase().includes(trimmed),
      )
    : POPULAR_SEARCHES;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
    >
      <Dialog.Trigger asChild>
        <button
          ref={triggerRef}
          type="button"
          aria-label="Search site (Cmd+K)"
          className="group inline-flex items-center gap-2 h-9 px-2.5 xl:px-3.5 text-xs text-slate-500 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300 rounded-full transition-all"
        >
          <Search className="w-4 h-4 text-slate-500 group-hover:text-slate-800 transition-colors" />
          <span className="hidden xl:inline text-slate-500 group-hover:text-slate-700 pr-2">
            Search…
          </span>
          <kbd className="hidden xl:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-white border border-slate-200 rounded text-slate-400 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            ⌘K
          </kbd>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal container={portalContainer ?? undefined}>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-[12%] sm:top-[16%] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/10 overflow-hidden focus:outline-none">
          <Dialog.Title className="sr-only">Search site</Dialog.Title>

          {/* Search Input Row */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
            <Search className="w-5 h-5 text-blue-700 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search accounts, ETFs, trading tools, or topics…"
              className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-[11px] font-medium text-slate-400 hover:text-slate-700 px-1.5 py-0.5 rounded"
              >
                Clear
              </button>
            )}
            <Dialog.Close asChild>
              <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Results / Quick Links */}
          <div className="p-3 max-h-[60vh] overflow-y-auto">
            <div className="px-2 pb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{trimmed ? 'Matching Suggestions' : 'Popular Searches'}</span>
            </div>

            <ul className="list-none m-0 p-0 space-y-0.5">
              {matches.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium text-slate-800 group-hover:text-blue-700">
                        {item.label}
                      </span>
                      <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all" />
                  </a>
                </li>
              ))}
            </ul>

            {trimmed && (
              <div className="mt-2 pt-2 border-t border-slate-100">
                <a
                  href={`/search?q=${encodeURIComponent(query.trim())}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-blue-50/70 hover:bg-blue-50 text-blue-800 text-sm font-semibold transition-colors"
                >
                  <span>Search all results for &ldquo;{query.trim()}&rdquo;</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          {/* Subtle Footer */}
          <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-500 font-medium">ESC</kbd> to close</span>
            <span>APEX Search</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
