import React from 'react';

export interface SkipToContentProps {
  targetId?: string;
  label?: string;
}

export function SkipToContent({
  targetId = 'main-content',
  label = 'Skip to main content',
}: SkipToContentProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-700 focus:text-white focus:rounded focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
    >
      {label}
    </a>
  );
}
