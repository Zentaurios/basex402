'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get background color based on theme
  const backgroundColor = resolvedTheme === 'dark' ? '#0a0b0d' : '#ffffff';
  const textColor = resolvedTheme === 'dark' ? '#ffffff' : '#0a0b0d';

  return (
    <div 
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{ 
        backgroundColor: mounted ? backgroundColor : '#ffffff',
        color: mounted ? textColor : '#0a0b0d'
      }}
    >
      {children}
    </div>
  );
}
