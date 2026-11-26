'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, X, ArrowRight } from 'lucide-react';
import { usePortalContainer } from './usePortalContainer';

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const portalContainer = usePortalContainer(triggerRef);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          ref={triggerRef}
          type="button"
          aria-label="Search site (Cmd+K)"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden md:inline-block ml-1 px-1 text-[10px] bg-white border border-slate-300 rounded text-slate-400">
            ⌘K
          </kbd>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal container={portalContainer ?? undefined}>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[20%] z-50 w-full max-w-lg -translate-x-1/2 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 focus:outline-none">
          <Dialog.Title className="sr-only">Search site</Dialog.Title>
          <div className="flex items-center border-b border-slate-200 pb-3">
            <Search className="w-5 h-5 text-slate-400 mr-2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, accounts, research, or ticker symbols..."
              className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              autoFocus
            />
            <Dialog.Close asChild>
              <button
                type="button"
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="py-3 text-xs text-slate-500">
            {query.length > 0 ? (
              <div className="space-y-1">
                <p className="font-semibold text-slate-700">Quick Results</p>
                <a
                  href={`/search?q=${encodeURIComponent(query)}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 text-blue-600 font-medium"
                >
                  <span>See all results for &ldquo;{query}&rdquo;</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-medium text-slate-400 uppercase tracking-wider text-[10px]">
                  Popular Searches
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Rollover IRA', 'Active Trader', 'Brokerage fees', '401k Plans', 'Form 5500', 'RIA Custody'].map(
                    (tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setQuery(tag)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-xs transition-colors"
                      >
                        {tag}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
