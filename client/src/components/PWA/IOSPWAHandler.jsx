import React, { useEffect, useState, useCallback } from 'react';

/**
 * iOS PWA Handler Component
 * Addresses common iOS PWA issues including:
 * - Script error handling
 * - Eruda debugging tool management
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
  const [debugMode, setDebugMode] = useState(false);
  const [scriptErrors, setScriptErrors] = useState([]);

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

  // Enhanced error handler for iOS PWA
  const handleScriptError = useCallback((error, source, lineno, colno, errorObj) => {
    const errorInfo = {
      message: error || 'Unknown script error',
      source: source || 'Unknown source',
      line: lineno || 0,
      column: colno || 0,
      stack: errorObj?.stack || 'No stack trace available',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Log to console for debugging
    console.error('iOS PWA Script Error:', errorInfo);

    // Store error for display
    setScriptErrors((prev) => [...prev.slice(-4), errorInfo]); // Keep last 5 errors

    // Handle specific eruda errors
    if (error && error.includes('eruda')) {
      console.warn('Eruda debugging tool error detected. Attempting to reinitialize...');
      handleErudaError();
    }

    return true; // Prevent default browser error handling
  }, []);

  // Handle eruda-specific errors
  const handleErudaError = useCallback(() => {
    try {
      // Clear any existing eruda instances
      if (window.eruda) {
        window.eruda.destroy();
        delete window.eruda;
      }

      // Remove eruda script if it exists
      const erudaScript = document.querySelector('script[src*="eruda"]');
      if (erudaScript) {
        erudaScript.remove();
      }

      // Only reinitialize in development mode
      if (process.env.NODE_ENV === 'development' && debugMode) {
        setTimeout(() => {
          initializeEruda();
        }, 1000);
      }
    } catch (err) {
      console.warn('Failed to handle eruda error:', err);
    }
  }, [debugMode]);

  // Initialize eruda debugging tool safely
  const initializeEruda = useCallback(() => {
    if (!isIOS || !debugMode || process.env.NODE_ENV !== 'development') {
      return;
    }

    try {
      // Check if eruda is already loaded
      if (window.eruda) {
        console.log('Eruda already initialized');
        return;
      }

      // Load eruda script dynamically
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/eruda@3.0.1/eruda.min.js';
      script.onload = () => {
        try {
          if (window.eruda) {
            window.eruda.init({
              container: document.body,
              tool: ['console', 'elements', 'network', 'resources'],
              autoScale: true,
              useShadowDom: true,
            });
            console.log('Eruda initialized successfully');
          }
        } catch (err) {
          console.error('Failed to initialize eruda:', err);
        }
      };
      script.onerror = (err) => {
        console.error('Failed to load eruda script:', err);
      };
      document.head.appendChild(script);
    } catch (err) {
      console.error('Error setting up eruda:', err);
    }
  }, [isIOS, debugMode]);

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

    // Set up error handling
    window.addEventListener('error', handleScriptError);
    window.addEventListener('unhandledrejection', (event) => {
      handleScriptError(
        event.reason?.message || 'Unhandled promise rejection',
        '',
        0,
        0,
        event.reason,
      );
    });

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

    // Enable debug mode in development
    if (process.env.NODE_ENV === 'development') {
      setDebugMode(true);
    }

    return () => {
      window.removeEventListener('error', handleScriptError);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      clearInterval(updateInterval);
    };
  }, [detectIOS, detectPWA, handleScriptError, handleOnlineStatus, checkForUpdates]);

  // Initialize eruda when debug mode is enabled
  useEffect(() => {
    if (debugMode && isIOS) {
      initializeEruda();
    }
  }, [debugMode, isIOS, initializeEruda]);

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

      {/* Error Display (Development Only) */}
      {debugMode && scriptErrors.length > 0 && (
        <div className="ios-pwa-error">
          <h4>Script Errors Detected</h4>
          {scriptErrors.slice(-2).map((error, index) => (
            <div key={index} style={{ marginBottom: '8px', fontSize: '12px', textAlign: 'left' }}>
              <strong>{error.message}</strong>
              <br />
              <small>
                {error.source}:{error.line}:{error.column}
              </small>
            </div>
          ))}
          <button onClick={clearCacheAndReload} className="ios-pwa-refresh-button">
            Clear Cache & Reload
          </button>
          <button
            onClick={() => setScriptErrors([])}
            style={{ marginLeft: '8px' }}
            className="ios-pwa-refresh-button"
          >
            Clear Errors
          </button>
        </div>
      )}

      {/* Debug Toggle (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ position: 'fixed', bottom: '10px', left: '10px', zIndex: 9999 }}>
          <button
            onClick={() => setDebugMode(!debugMode)}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              background: debugMode ? '#10b981' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            Debug: {debugMode ? 'ON' : 'OFF'}
          </button>
        </div>
      )}
    </>
  );
};

export default IOSPWAHandler;