'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-md transition-colors"
        style={{ 
          backgroundColor: 'var(--surface)',
          color: 'var(--text-secondary)'
        }}
        aria-label="Toggle theme"
        disabled
      >
        <div className="w-5 h-5" />
      </button>
    );
  }

  // Cycle through themes: light -> dark -> system -> light
  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  // Get current icon and next theme name
  const getThemeDisplay = () => {
    switch (theme) {
      case 'light':
        return { icon: Sun, label: 'Light', next: 'dark' };
      case 'dark':
        return { icon: Moon, label: 'Dark', next: 'system' };
      case 'system':
        return { icon: Monitor, label: 'System', next: 'light' };
      default:
        return { icon: Monitor, label: 'System', next: 'light' };
    }
  };

  const { icon: Icon, label, next } = getThemeDisplay();

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-md transition-all duration-200 hover:bg-base-blue/10 focus:outline-none focus:ring-2 focus:ring-base-blue focus:ring-offset-2"
      style={{ 
        backgroundColor: 'var(--surface)',
        color: 'var(--text-secondary)'
      }}
      aria-label={`Current theme: ${label}. Click to switch to ${next} mode`}
      title={`Theme: ${label} (click to switch)`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}
