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

  // Handle external links in PWA - force them to open in Safari
  useEffect(() => {
    const handleExternalLinks = (event) => {
      const target = event.target.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // Check if it's an external link (different domain or protocol)
      const isExternal = href.startsWith('http://') || href.startsWith('https://');
      const currentDomain = window.location.hostname;
      
      if (isExternal) {
        try {
          const linkUrl = new URL(href);
          const isExternalDomain = linkUrl.hostname !== currentDomain;
          
          // If it's an external domain or if target="_blank" is already set
          if (isExternalDomain || target.getAttribute('target') === '_blank') {
            event.preventDefault();
            
            // For iOS PWA, this will force the link to open in Safari
            // The key is using window.open with '_blank' and then closing the reference
            const newWindow = window.open(href, '_blank', 'noopener,noreferrer');
            
            // On iOS PWA, this pattern helps ensure it opens in Safari
            if (newWindow) {
              newWindow.opener = null;
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
