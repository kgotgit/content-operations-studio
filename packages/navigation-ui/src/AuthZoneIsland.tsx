'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, LogOut, ExternalLink, ChevronDown } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { usePortalContainer } from './usePortalContainer';

export interface AuthZoneIslandProps {
  loginUrl?: string;
  openAccountUrl?: string;
  isRemote?: boolean;
}

export function AuthZoneIsland({
  loginUrl = '/login',
  openAccountUrl = '/open-account',
}: AuthZoneIslandProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ name: string; accountType: string } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const portalContainer = usePortalContainer(triggerRef);

  useEffect(() => {
    try {
      const hasSessionCookie =
        document.cookie.includes('user_session=') || document.cookie.includes('auth_token=');
      if (hasSessionCookie) {
        setIsAuthenticated(true);
        setUser({ name: 'Client Account', accountType: 'Brokerage Platinum' });
      }

      const handleAuthEvent = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail?.user) {
          setIsAuthenticated(true);
          setUser(customEvent.detail.user);
        } else if (customEvent.detail?.loggedOut) {
          setIsAuthenticated(false);
          setUser(null);
        }
      };

      window.addEventListener('company:auth:change', handleAuthEvent);
      return () => window.removeEventListener('company:auth:change', handleAuthEvent);
    } catch {
      // Default to unauthenticated in SSR or restricted environments
    }
  }, []);

  if (isAuthenticated && user) {
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            ref={triggerRef}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-full transition-colors"
          >
            <User className="w-3.5 h-3.5 text-slate-300" />
            <span className="truncate max-w-[120px]">{user.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal container={portalContainer ?? undefined}>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className="z-50 min-w-[210px] bg-white rounded-xl p-1.5 shadow-xl border border-slate-200/90 text-xs focus:outline-none"
          >
            <div className="px-2.5 py-2 border-b border-slate-100 mb-1">
              <p className="font-semibold text-slate-900">{user.name}</p>
              <p className="text-[11px] text-slate-500">{user.accountType}</p>
            </div>
            <DropdownMenu.Item asChild>
              <a
                href="/client-portal"
                className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <span>Accounts Dashboard</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <a
                href="/client-portal/transfers"
                className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <span>Move Money &amp; Transfers</span>
              </a>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <a
                href="/client-portal/statements"
                className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <span>Statements &amp; Tax Forms</span>
              </a>
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="h-px bg-slate-100 my-1" />
            <DropdownMenu.Item
              onSelect={() => {
                document.cookie = 'user_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                setIsAuthenticated(false);
                setUser(null);
              }}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-red-50 text-red-600 font-medium cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  }

  return (
    <div className="hidden md:flex items-center gap-2">
      <a
        href={loginUrl}
        className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full transition-colors"
        data-analytics="nav:cta:login"
      >
        Log In
      </a>
      <a
        href={openAccountUrl}
        className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-full shadow-sm transition-colors"
        data-analytics="nav:cta:open-account"
      >
        Open an Account
      </a>
    </div>
  );
}
