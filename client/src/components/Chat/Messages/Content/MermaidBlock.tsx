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

    // Remove leading/trailing blank lines and all surrounding whitespace
    fixed = fixed.replace(/^\s*\n/gm, '').replace(/\n\s*$/gm, '');
    fixed = fixed.trim();

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
        // Use proven config from Artifacts/Mermaid.tsx for robust rendering
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          securityLevel: 'sandbox',
          suppressErrorRendering: true,
          themeVariables: {
            background: '#282C34',
            primaryColor: '#333842',
            secondaryColor: '#333842',
            tertiaryColor: '#333842',
            primaryTextColor: '#ABB2BF',
            secondaryTextColor: '#ABB2BF',
            lineColor: '#636D83',
            fontSize: '16px',
            nodeBorder: '#636D83',
            mainBkg: '#282C34',
            altBackground: '#282C34',
            textColor: '#ABB2BF',
            edgeLabelBackground: '#282C34',
            clusterBkg: '#282C34',
            clusterBorder: '#636D83',
            labelBoxBkgColor: '#333842',
            labelBoxBorderColor: '#636D83',
            labelTextColor: '#ABB2BF',
          },
          flowchart: {
            curve: 'basis',
            nodeSpacing: 50,
            rankSpacing: 50,
            diagramPadding: 8,
            htmlLabels: true,
            useMaxWidth: true,
            padding: 15,
            wrappingWidth: 200,
          },
        });
        // Remove custom parseError handler to avoid blocking rendering
        return mermaid.render(idRef.current, corrected);
      })
      .then(({ svg: svgString }) => {
        if (isMounted) setSvg(svgString);
      })
      .catch((err) => {
        // Surface the actual error for diagnosis
        if (isMounted) {
          setError(
            err && (err.message || err.toString())
              ? `Mermaid render error: ${err.message || err.toString()}`
              : 'Failed to render Mermaid diagram',
          );
        }
        // Also log the error and the sanitized code for developer debugging
        // eslint-disable-next-line no-console
        console.error('Mermaid render error:', err, '\nSanitized code:', corrected);
      });

    return () => {
      isMounted = false;
    };
  }, [code]);

  const [modalOpen, setModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef<{ x: number; y: number } | null>(null);

  // Reset zoom/pan when modal closes or svg changes
  useEffect(() => {
    if (!modalOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [modalOpen, svg]);

  // Mouse drag for panning
  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    // Store pan and mouse start position in a type-safe way
    panRef.current = {
      x: pan.x,
      y: pan.y,
      mouseStartX: e.clientX,
      mouseStartY: e.clientY,
    } as any;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }
  function handleMouseMove(e: MouseEvent) {
    if (!panRef.current) return;
    setPan({
      x: (panRef.current as any).x + (e.clientX - (panRef.current as any).mouseStartX),
      y: (panRef.current as any).y + (e.clientY - (panRef.current as any).mouseStartY),
    });
  }
  function handleMouseUp() {
    panRef.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }

  // Wheel zoom
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom((z) => Math.max(0.2, Math.min(5, z - e.deltaY * 0.001)));
  }

  // Keyboard ESC to close modal
  useEffect(() => {
    if (!modalOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setModalOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen]);

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

  // Main diagram with click-to-zoom
  return (
    <>
      <div
        className={className || 'mermaid'}
        dangerouslySetInnerHTML={{ __html: svg }}
        aria-label="Mermaid diagram"
        tabIndex={0}
        style={{ overflowX: 'auto', maxWidth: '100%', cursor: 'zoom-in' }}
        onClick={() => setModalOpen(true)}
        title="Click to zoom"
      />
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            zIndex: 10000,
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'grab',
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{
              position: 'relative',
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
              padding: 16,
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
              cursor: 'default',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => setZoom((z) => Math.max(0.2, z - 0.2))}
                style={{ fontSize: 18, padding: '2px 8px' }}
                aria-label="Zoom out"
              >
                −
              </button>
              <span style={{ minWidth: 40, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(5, z + 0.2))}
                style={{ fontSize: 18, padding: '2px 8px' }}
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                style={{ marginLeft: 12, fontSize: 14 }}
                aria-label="Reset zoom"
              >
                {/* i18n: Reset */}
                {'Reset'}
              </button>
              <button
                onClick={() => setModalOpen(false)}
                style={{ marginLeft: 'auto', fontSize: 16 }}
                aria-label="Close"
              >
                {/* i18n: Close */}
                {'✕'}
              </button>
            </div>
            <div
              style={{
                width: '80vw',
                height: '70vh',
                overflow: 'auto',
                background: '#fafafa',
                border: '1px solid #eee',
                borderRadius: 4,
                position: 'relative',
                cursor: 'grab',
              }}
              onMouseDown={handleMouseDown}
              onWheel={handleWheel}
            >
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: '0 0',
                  transition: 'transform 0.1s',
                  width: 'fit-content',
                  height: 'fit-content',
                  pointerEvents: 'auto',
                }}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MermaidBlock;
