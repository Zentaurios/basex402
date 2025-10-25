'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

export function PWAUpdateNotifier() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return;
    }

    // Check for updates every 60 seconds
    const checkForUpdates = () => {
      navigator.serviceWorker.ready.then((reg) => {
        reg.update().catch((error) => {
          console.log('[PWA Update] Check failed:', error);
        });
      });
    };

    const updateInterval = setInterval(checkForUpdates, 60000);

    // Listen for new service worker waiting to activate
    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);

      // Check if there's already an update waiting
      if (reg.waiting) {
        console.log('[PWA Update] Update available');
        setShowUpdate(true);
      }

      // Listen for new service worker installing
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        console.log('[PWA Update] New version found, installing...');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is installed but waiting to activate
            console.log('[PWA Update] New version installed, waiting to activate');
            setShowUpdate(true);
          }
        });
      });
    });

    // Listen for controlling service worker change (update activated)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      console.log('[PWA Update] New version activated, reloading...');
      refreshing = true;
      window.location.reload();
    });

    return () => {
      clearInterval(updateInterval);
    };
  }, []);

  const handleUpdate = () => {
    if (!registration || !registration.waiting) return;

    console.log('[PWA Update] Activating new version...');

    // Tell the waiting service worker to skip waiting and activate
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    setShowUpdate(false);
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    // Will show again on next update check if still available
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[200] animate-in slide-in-from-top-5 duration-300">
      <div className="bg-base-blue text-white rounded-lg shadow-xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Update Available</h3>
              <p className="text-sm text-white/90">A new version of x402is ready</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white transition-colors p-1"
            aria-label="Dismiss update notification"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2 rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors font-medium text-sm"
          >
            Later
          </button>
          <button
            onClick={handleUpdate}
            className="flex-1 px-4 py-2 rounded-lg bg-white text-base-blue hover:bg-white/90 transition-colors font-medium text-sm"
          >
            Update Now
          </button>
        </div>
      </div>
    </div>
  );
}
