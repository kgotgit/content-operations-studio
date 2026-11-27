import React from 'react';
import { ChevronRight, Layers } from 'lucide-react';
import {
  isNavBranch,
  resolveTargetHref,
  type NavItem,
  type NavigationDocument,
} from '@content-ops/navigation-contract';
import { resolveNavigationUrls } from '@content-ops/navigation-adapters';

export interface SectionNavigationProps {
  data: NavigationDocument;
  activeHref?: string;
  isRemote?: boolean;
  className?: string;
}

/**
 * Renders Level 3+ Section / Local Navigation anchored to a Level 3 rootTarget.
 */
export function SectionNavigation({
  data,
  activeHref,
  isRemote = false,
  className = '',
}: SectionNavigationProps) {
  const normalized = resolveNavigationUrls(data, { isRemote });
  const rootHref = resolveTargetHref(normalized.rootTarget, normalized.locale);

  const renderItems = (items: NavItem[], depth = 0): React.ReactNode => (
    <ul className={`list-none m-0 p-0 space-y-1 ${depth > 0 ? 'pl-3 mt-1 border-l border-slate-200' : ''}`}>
      {items.map((item) => {
        if (isNavBranch(item)) {
          return (
            <li key={item.id} className="pt-2 first:pt-0">
              <p className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {item.label}
              </p>
              {renderItems(item.navItems || [], depth + 1)}
            </li>
          );
        }

        const isActive = Boolean(activeHref && item.href === activeHref);
        return (
          <li key={item.id}>
            <a
              href={item.href || '#'}
              data-analytics={item.analyticsTag}
              aria-current={isActive ? 'page' : undefined}
              className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-800 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <span className="truncate">{item.label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700 shrink-0" />
            </a>
          </li>
        );
      })}
    </ul>
  );

  return (
    <nav
      aria-label={normalized.rootTarget?.title ? `${normalized.rootTarget.title} Section Navigation` : 'Section Navigation'}
      className={`bg-white rounded-xl border border-slate-200 p-4 shadow-sm ${className}`}
    >
      <div className="pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">
          <Layers className="w-3 h-3" />
          <span>Section Navigation (L3 → L4+)</span>
        </div>
        {normalized.rootTarget && (
          <a
            href={rootHref || '#'}
            className="text-sm font-bold text-slate-900 hover:text-blue-700 transition-colors"
          >
            {normalized.rootTarget.title}
          </a>
        )}
        {rootHref && (
          <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">{rootHref}</p>
        )}
      </div>

      {renderItems(normalized.navItems)}
    </nav>
  );
}
