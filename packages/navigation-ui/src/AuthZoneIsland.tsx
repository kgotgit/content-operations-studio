'use client';

import React, { useState, useEffect } from 'react';
import { User, LogOut, ExternalLink, ChevronDown } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

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

  useEffect(() => {
    // Check for enterprise session cookie or global session event
    try {
      const hasSessionCookie = document.cookie.includes('user_session=') || document.cookie.includes('auth_token=');
      if (hasSessionCookie) {
        setIsAuthenticated(true);
        setUser({ name: 'Client Account', accountType: 'Brokerage Platinum' });
      }

      // Listen for custom auth events from foreign hosts (like Drupal or Next.js)
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
      // In SSR or restricted environments, default to unauthenticated
    }
  }, []);

  if (isAuthenticated && user) {
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-md transition-colors"
          >
            <User className="w-3.5 h-3.5 text-blue-200" />
            <span className="truncate max-w-[120px]">{user.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-blue-200" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            className="z-50 min-w-[200px] bg-white rounded-lg p-1.5 shadow-xl border border-slate-200 text-xs focus:outline-none"
          >
            <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
              <p className="font-semibold text-slate-800">{user.name}</p>
              <p className="text-[10px] text-slate-500">{user.accountType}</p>
            </div>
            <DropdownMenu.Item asChild>
              <a
                href="/client-portal"
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <span>Accounts Dashboard</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <a
                href="/client-portal/transfers"
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <span>Move Money & Transfers</span>
              </a>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <a
                href="/client-portal/statements"
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <span>Statements & Tax Forms</span>
              </a>
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="h-px bg-slate-100 my-1" />
            <DropdownMenu.Item
              onSelect={() => {
                document.cookie = 'user_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                setIsAuthenticated(false);
                setUser(null);
              }}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-red-50 text-red-600 font-medium cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Log Out</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={loginUrl}
        className="px-3 py-1 text-xs font-semibold text-blue-900 hover:text-blue-700 hover:bg-blue-50 border border-blue-900/30 rounded-md transition-colors"
      >
        Log In
      </a>
      <a
        href={openAccountUrl}
        className="px-3 py-1 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-sm transition-colors"
      >
        Open an Account
      </a>
    </div>
  );
}
