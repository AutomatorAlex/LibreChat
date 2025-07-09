import React, { useEffect, useRef, useState } from 'react';

type MermaidBlockProps = {
  code: string;
  className?: string;
};

const MermaidBlock: React.FC<MermaidBlockProps> = ({ code, className }) => {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    let isMounted = true;
    let mermaid: any = null;

    // Only run on client
    if (typeof window === 'undefined') return;

    // Dynamic import to avoid SSR issues
    import('mermaid')
      .then((mod) => {
        mermaid = mod.default || mod;
        // Initialize with strict security
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'default',
        });
        // Render SVG
        return mermaid.render(idRef.current, code);
      })
      .then(({ svg: svgString }) => {
        if (isMounted) setSvg(svgString);
      })
      .catch((err) => {
        if (isMounted) setError('Failed to render Mermaid diagram');
        // Optionally log error
        // console.error('Mermaid render error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [code]);

  if (error) {
    return (
      <pre className={className || 'mermaid'}>
        {error}
        {'\n'}
        {code}
      </pre>
    );
  }

  if (!svg) {
    // Avoid SSR/hydration mismatch: render nothing until client
    return <div className={className || 'mermaid'} style={{ minHeight: 40 }} />;
  }

  // eslint-disable-next-line react/no-danger
  return (
    <div
      className={className || 'mermaid'}
      dangerouslySetInnerHTML={{ __html: svg }}
      aria-label="Mermaid diagram"
      tabIndex={0}
      style={{ overflowX: 'auto', maxWidth: '100%' }}
    />
  );
};

export default MermaidBlock;
