'use client';

import { ReactNode } from 'react';
import { useIsSignedIn } from '@coinbase/cdp-hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
  loadingComponent?: ReactNode;
}

/**
 * AuthGuard component for protecting authenticated routes.
 * 
 * Use this ONLY for pages that truly require authentication.
 * Most pages should be public and use wallet hooks directly.
 * 
 * @example
 * ```tsx
 * export default function ProfilePage() {
 *   return (
 *     <AuthGuard redirectTo="/">
 *       <div>Your authenticated content here</div>
 *     </AuthGuard>
 *   );
 * }
 * ```
 */
export function AuthGuard({ 
  children, 
  fallback,
  redirectTo = '/',
  loadingComponent
}: AuthGuardProps) {
  const { isSignedIn } = useIsSignedIn();
  const router = useRouter();

  // Redirect if not signed in
  useEffect(() => {
    if (!isSignedIn && redirectTo) {
      router.push(redirectTo);
    }
  }, [isSignedIn, redirectTo, router]);

  // Show fallback or nothing if not signed in
  if (!isSignedIn) {
    return fallback ? <>{fallback}</> : null;
  }

  // Render protected content
  return <>{children}</>;
}
