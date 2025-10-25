'use client';

import { ReactNode, useEffect, useState } from 'react';

interface LoadingBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  delay?: number;
}

/**
 * Loading boundary that shows a fallback UI while Web3 providers initialize.
 * This prevents the 30+ second blank page issue by rendering content immediately
 * and allowing providers to initialize in the background.
 */
export function LoadingBoundary({ 
  children, 
  fallback,
  delay = 100 
}: LoadingBoundaryProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Show fallback briefly, then render children
  // This allows React to commit the initial render quickly
  if (!mounted && fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
