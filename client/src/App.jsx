import { RecoilRoot } from 'recoil';
import { DndProvider } from 'react-dnd';
import { RouterProvider } from 'react-router-dom';
import * as RadixToast from '@radix-ui/react-toast';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query';
import { ScreenshotProvider, ThemeProvider, useApiErrorBoundary } from './hooks';
import { ToastProvider } from './Providers';
import Toast from './components/ui/Toast';
import { LiveAnnouncer } from '~/a11y';
import { router } from './routes';
import { useEffect } from 'react';

const App = () => {
  const { setError } = useApiErrorBoundary();

  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (error?.response?.status === 401) {
          setError(error);
        }
      },
    }),
  });

  // Handle external links in PWA - force them to open in Safari while keeping PWA standalone
  useEffect(() => {
    // 🚨 EXTENSIVE DEBUGGING FOR iOS PWA STANDALONE MODE ISSUE 🚨
    console.log('🔥 === PWA DEBUG SESSION START ===');
    console.log('⏰ App Launch Time:', new Date().toISOString());

    // Capture initial app state
    const initialState = {
      timestamp: Date.now(),
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      origin: window.location.origin,
      host: window.location.host,
      protocol: window.location.protocol,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      documentTitle: document.title,
    };

    // Detect platform and display mode
    const platformInfo = {
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      isIOSChrome: /CriOS/.test(navigator.userAgent),
      isIOSFirefox: /FxiOS/.test(navigator.userAgent),
      isIOSSafari: /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent),
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      isFullscreen: window.matchMedia('(display-mode: fullscreen)').matches,
      isMinimalUI: window.matchMedia('(display-mode: minimal-ui)').matches,
      isBrowser: window.matchMedia('(display-mode: browser)').matches,
      isWebAppCapable: window.navigator.standalone,
      hasServiceWorker: 'serviceWorker' in navigator,
    };

    // Check for PWA manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    const manifestInfo = {
      hasManifest: !!manifestLink,
      manifestHref: manifestLink?.href || null,
    };

    // Check for Apple PWA meta tags
    const appleMetaTags = {
      webAppCapable: document.querySelector('meta[name="apple-mobile-web-app-capable"]')?.content,
      webAppTitle: document.querySelector('meta[name="apple-mobile-web-app-title"]')?.content,
      webAppStatusBarStyle: document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.content,
      touchIcon: document.querySelector('link[rel="apple-touch-icon"]')?.href,
    };

    // Log comprehensive initial state
    console.log('🏁 INITIAL APP STATE:', initialState);
    console.log('📱 PLATFORM INFO:', platformInfo);
    console.log('📋 MANIFEST INFO:', manifestInfo);
    console.log('🍎 APPLE META TAGS:', appleMetaTags);

    // Check if this is a problematic launch scenario
    const isPotentialProblemLaunch =
      platformInfo.isIOS &&
      platformInfo.isStandalone &&
      (initialState.url.includes('?') || initialState.url.includes('#') || initialState.referrer);

    if (isPotentialProblemLaunch) {
      console.log('⚠️ POTENTIAL PROBLEM LAUNCH DETECTED!');
      console.log('🔍 This launch pattern may cause Safari redirect');
    }

    // Monitor for navigation events that could break standalone mode
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      console.log('🧭 NAVIGATION: history.pushState called', {
        args,
        currentURL: window.location.href,
        timestamp: Date.now(),
      });
      return originalPushState.apply(this, args);
    };

    history.replaceState = function(...args) {
      console.log('🧭 NAVIGATION: history.replaceState called', {
        args,
        currentURL: window.location.href,
        timestamp: Date.now(),
      });
      return originalReplaceState.apply(this, args);
    };

    // Monitor window.location changes
    let lastURL = window.location.href;
    const urlChangeInterval = setInterval(() => {
      if (window.location.href !== lastURL) {
        console.log('🌐 URL CHANGE DETECTED:', {
          from: lastURL,
          to: window.location.href,
          timestamp: Date.now(),
          method: 'unknown',
        });
        lastURL = window.location.href;
      }
    }, 100);

    // Monitor for display mode changes
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e) => {
      console.log('📺 DISPLAY MODE CHANGE:', {
        matches: e.matches,
        media: e.media,
        timestamp: Date.now(),
        currentURL: window.location.href,
      });
      
      if (!e.matches && platformInfo.isIOS) {
        console.log('🚨 CRITICAL: PWA LOST STANDALONE MODE ON iOS!');
        console.log('🔍 This indicates the app broke out to Safari');
      }
    };
    
    displayModeQuery.addEventListener('change', handleDisplayModeChange);

    // Monitor for page visibility changes
    const handleVisibilityChange = () => {
      console.log('👁️ VISIBILITY CHANGE:', {
        hidden: document.hidden,
        visibilityState: document.visibilityState,
        timestamp: Date.now(),
        currentURL: window.location.href,
      });
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Monitor for beforeunload events
    const handleBeforeUnload = (e) => {
      console.log('🚪 BEFORE UNLOAD:', {
        timestamp: Date.now(),
        currentURL: window.location.href,
        event: e,
      });
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    const handleExternalLinks = (event) => {
      const target = event.target.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      console.log('🔗 LINK CLICK DETECTED:', {
        href,
        target: target.outerHTML.substring(0, 200),
        timestamp: Date.now(),
        currentURL: window.location.href,
      });

      // Skip relative links and internal navigation
      if (href.startsWith('/') || href.startsWith('#') || href.startsWith('?')) {
        console.log('➡️ INTERNAL LINK - allowing default behavior');
        return;
      }

      // Check if it's an absolute URL (has protocol)
      const isAbsoluteUrl = href.startsWith('http://') || href.startsWith('https://');
      
      if (isAbsoluteUrl) {
        try {
          const linkUrl = new URL(href);
          const currentOrigin = window.location.origin;
          const linkOrigin = linkUrl.origin;
          const isExternalDomain = linkOrigin !== currentOrigin;

          console.log('🔍 LINK ANALYSIS:', {
            href,
            currentOrigin,
            linkOrigin,
            isExternalDomain,
            shouldIntercept: isExternalDomain,
            timestamp: Date.now(),
          });

          // Only intercept truly external domains, not same-origin links
          if (isExternalDomain) {
            event.preventDefault();
            console.log('🛑 EXTERNAL LINK INTERCEPTED');

            // Check if we're in a PWA standalone mode (iOS or other platforms)
            const isStandalonePWA = window.matchMedia('(display-mode: standalone)').matches;
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

            console.log('🔍 EXTERNAL LINK DEBUG INFO:', {
              href,
              isIOS,
              isStandalonePWA,
              userAgent: navigator.userAgent,
              displayMode: isStandalonePWA ? 'standalone' : 'browser',
              linkDomain: linkUrl.hostname,
              linkOrigin: linkOrigin,
              currentOrigin: currentOrigin,
              timestamp: Date.now(),
            });

            // For iOS PWA in standalone mode, use dynamic anchor element to force Safari
            if (isStandalonePWA && isIOS) {
              console.log('📱 iOS PWA DETECTED - opening external link in Safari');
              // Use dynamic anchor element workaround for iOS PWA to force Safari opening
              // This is the only reliable method to open external links in Safari from iOS PWA
              const anchor = document.createElement('a');
              anchor.href = href;
              anchor.target = '_blank';
              anchor.rel = 'noopener noreferrer';
              anchor.style.display = 'none';
              document.body.appendChild(anchor);
              anchor.click();
              document.body.removeChild(anchor);
              console.log('✅ External link opened in Safari using dynamic anchor');
            } else {
              console.log('🌐 Non-iOS or browser mode - using window.open');
              // For other platforms/modes, use window.open with security features
              const newWindow = window.open(href, '_blank', 'noopener,noreferrer');

              // Ensure no reference to opener for security
              if (newWindow) {
                newWindow.opener = null;
              }
            }
          }
        } catch (e) {
          // If URL parsing fails, let the default behavior happen
          console.warn('❌ Failed to parse URL:', href, e);
        }
      }
    };

    // Add event listener to document to catch all link clicks
    document.addEventListener('click', handleExternalLinks, true);

    // Log when useEffect completes setup
    console.log('✅ PWA DEBUG MONITORING SETUP COMPLETE');
    console.log('🔥 === END PWA DEBUG SESSION START ===');

    // Cleanup
    return () => {
      console.log('🧹 CLEANING UP PWA DEBUG MONITORING');
      document.removeEventListener('click', handleExternalLinks, true);
      displayModeQuery.removeEventListener('change', handleDisplayModeChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(urlChangeInterval);
      
      // Restore original history methods
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RecoilRoot>
        <LiveAnnouncer>
          <ThemeProvider>
            <RadixToast.Provider>
              <ToastProvider>
                <DndProvider backend={HTML5Backend}>
                  <RouterProvider router={router} />
                  <ReactQueryDevtools initialIsOpen={false} position="top-right" />
                  <Toast />
                  <RadixToast.Viewport className="pointer-events-none fixed inset-0 z-[1000] mx-auto my-2 flex max-w-[560px] flex-col items-stretch justify-start md:pb-5" />
                </DndProvider>
              </ToastProvider>
            </RadixToast.Provider>
          </ThemeProvider>
        </LiveAnnouncer>
      </RecoilRoot>
    </QueryClientProvider>
  );
};

export default () => (
  <ScreenshotProvider>
    <App />
    <iframe
      src="/assets/silence.mp3"
      allow="autoplay"
      id="audio"
      title="audio-silence"
      style={{
        display: 'none',
      }}
    />
  </ScreenshotProvider>
);
