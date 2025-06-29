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
import IOSPWAHandler from './components/PWA/IOSPWAHandler';

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
    const handleExternalLinks = (event) => {
      const target = event.target.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // Skip relative links and internal navigation
      if (href.startsWith('/') || href.startsWith('#') || href.startsWith('?')) {
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

          // Only intercept truly external domains, not same-origin links
          if (isExternalDomain) {
            event.preventDefault();

            // Check if we're in a PWA standalone mode (iOS or other platforms)
            const isStandalonePWA = window.matchMedia('(display-mode: standalone)').matches;
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

            // For iOS PWA in standalone mode, use dynamic anchor element to force Safari
            if (isStandalonePWA && isIOS) {
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
            } else {
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
          console.warn('Failed to parse URL:', href, e);
        }
      }
    };

    // Add event listener to document to catch all link clicks
    document.addEventListener('click', handleExternalLinks, true);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleExternalLinks, true);
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
                  <IOSPWAHandler />
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
