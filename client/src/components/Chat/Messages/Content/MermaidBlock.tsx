import React, { useEffect, useRef, useState } from 'react';

type MermaidBlockProps = {
  code: string;
  className?: string;
};

const MermaidBlock: React.FC<MermaidBlockProps> = ({ code, className }) => {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  // Attempt to auto-correct common Mermaid syntax issues
  function autoCorrectMermaid(raw: string): string {
    let fixed = raw;

    // Replace <br/> and <br> with line breaks
    fixed = fixed.replace(/<br\s*\/?>/gi, '\n');

    // Replace smart quotes with regular quotes
    fixed = fixed.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

    // Remove trailing spaces on each line
    fixed = fixed
      .split('\n')
      .map((line) => line.replace(/\s+$/, ''))
      .join('\n');

    // Remove zero-width spaces and non-breaking spaces
    fixed = fixed.replace(/[\u200B\u00A0]/g, '');

    // Remove HTML tags except for <b>, <i>, <u>
    fixed = fixed.replace(/<(?!b|i|u)[^>]+>/gi, '');

    // Remove leading/trailing blank lines
    fixed = fixed.replace(/^\s*\n/gm, '').replace(/\n\s*$/gm, '');

    return fixed;
  }

  useEffect(() => {
    let isMounted = true;
    let mermaid: any = null;

    // Reset SVG and error on code change to avoid stale state
    setSvg(null);
    setError(null);

    if (typeof window === 'undefined') return;

    const corrected = autoCorrectMermaid(code);

    import('mermaid')
      .then((mod) => {
        mermaid = mod.default || mod;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'default',
        });
        return mermaid.render(idRef.current, corrected);
      })
      .then(({ svg: svgString }) => {
        if (isMounted) setSvg(svgString);
      })
      .catch((_err) => {
        if (isMounted) setError('Failed to render Mermaid diagram');
        // Optionally log error
        // console.error('Mermaid render error:', _err);
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
