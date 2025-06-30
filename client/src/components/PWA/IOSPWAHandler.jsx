import React, { useEffect, useState, useCallback } from 'react';

/**
 * iOS PWA Handler Component
 * Addresses common iOS PWA issues including:
 * - Network connectivity monitoring
 * - Cache management
 * - Installation prompts
 */
const IOSPWAHandler = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  // Detect iOS device
  const detectIOS = useCallback(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /ipad|iphone|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);
    return isIOSDevice;
  }, []);

  // Detect PWA mode
  const detectPWA = useCallback(() => {
    const isPWAMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');
    setIsPWA(isPWAMode);
    return isPWAMode;
  }, []);

  // Handle network status changes
  const handleOnlineStatus = useCallback(() => {
    setIsOnline(navigator.onLine);
  }, []);

  // Check for app updates
  const checkForUpdates = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          if (registration.waiting) {
            setShowUpdateNotification(true);
          }
        }
      } catch (err) {
        console.error('Failed to check for updates:', err);
      }
    }
  }, []);

  // Apply update
  const applyUpdate = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
    setShowUpdateNotification(false);
  }, []);

  // Clear cache and reload
  const clearCacheAndReload = useCallback(async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }

      window.location.reload(true);
    } catch (err) {
      console.error('Failed to clear cache:', err);
      window.location.reload();
    }
  }, []);

  // Initialize component
  useEffect(() => {
    const isIOSDevice = detectIOS();
    const isPWAMode = detectPWA();

    // Set up network monitoring
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // Check for updates periodically
    const updateInterval = setInterval(checkForUpdates, 60000); // Check every minute

    // Show install prompt for iOS users not in PWA mode
    if (isIOSDevice && !isPWAMode) {
      const hasSeenPrompt = localStorage.getItem('ios-install-prompt-seen');
      if (!hasSeenPrompt) {
        setTimeout(() => setShowInstallPrompt(true), 3000);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      clearInterval(updateInterval);
    };
  }, [detectIOS, detectPWA, handleOnlineStatus, checkForUpdates]);

  if (!isIOS) {
    return null; // Only render for iOS devices
  }

  return (
    <>
      {/* Network Status Indicator */}
      <div className={`ios-network-status ${!isOnline ? 'offline' : ''}`}>
        {!isOnline && 'No internet connection. Some features may not work.'}
      </div>

      {/* Install Prompt */}
      {showInstallPrompt && !isPWA && (
        <div className="ios-install-prompt">
          <h3>Install LibreChat</h3>
          <p>Add LibreChat to your home screen for the best experience!</p>
          <div className="ios-install-steps">
            <ol>
              <li>
                Tap the Share button <span style={{ fontSize: '16px' }}>⬆️</span>
              </li>
              <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
              <li>Tap &quot;Add&quot; to install</li>
            </ol>
          </div>
          <button
            onClick={() => {
              setShowInstallPrompt(false);
              localStorage.setItem('ios-install-prompt-seen', 'true');
            }}
            className="ios-pwa-refresh-button"
          >
            Got it!
          </button>
        </div>
      )}

      {/* Update Notification */}
      {showUpdateNotification && (
        <div className="ios-update-notification show">
          <p>A new version is available!</p>
          <button onClick={applyUpdate} className="ios-pwa-refresh-button">
            Update Now
          </button>
          <button
            onClick={() => setShowUpdateNotification(false)}
            style={{ marginLeft: '8px', background: 'transparent', border: '1px solid white' }}
            className="ios-pwa-refresh-button"
          >
            Later
          </button>
        </div>
      )}
    </>
  );
};

export default IOSPWAHandler;
