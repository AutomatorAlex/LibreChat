import { useRef } from 'react';
import { mermaidConfig } from '~/utils/mermaid.config';

/**
 * Hook to initialize Mermaid with shared configuration and provide a function to retrieve the Mermaid instance.
 * Initializes Mermaid only once during the app lifecycle.
 * @returns A function that returns a promise resolving to the Mermaid instance.
 */
export function useMermaid(): () => Promise<any> {
  const initedRef = useRef<boolean>(false);
  const getMermaidRef = useRef<() => Promise<any>>();

  if (!getMermaidRef.current) {
    getMermaidRef.current = async () => {
      const mod = await import('mermaid');
      const m = (mod.default || mod) as any;
      if (!initedRef.current) {
        m.initialize(mermaidConfig);
        initedRef.current = true;
      }
      return m;
    };
  }

  return getMermaidRef.current;
}
