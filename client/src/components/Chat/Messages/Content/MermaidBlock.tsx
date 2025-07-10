import React, { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { useMermaid } from '../../../../hooks/useMermaid';
import { dompurifyConfig } from '../../../../utils/mermaid.config';
import { hashId } from '~/utils/hash';

type MermaidBlockProps = {
  code: string;
  className?: string;
};

const MermaidBlock: React.FC<MermaidBlockProps> = ({ code, className }) => {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef(`mermaid-${hashId(code)}`);
  const getMermaid = useMermaid();

  // Attempt to auto-correct common Mermaid syntax issues
  function autoCorrectMermaid(raw: string): string {
    let fixed = raw;

    // Replace <br/> and <br> with line breaks
    fixed = fixed.replace(/<br\s*\/?>/gi, '\n');

    // Replace smart quotes with regular quotes
    fixed = fixed.replace(/[""]/g, '"').replace(/['']/g, "'");

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

    // Reset SVG and error on code change to avoid stale state
    setSvg(null);
    setError(null);

    if (typeof window === 'undefined') return;

    const corrected = autoCorrectMermaid(code);

    getMermaid()
      .then((mermaid) => mermaid.render(idRef.current, corrected))
      .then(({ svg: rawSvg }) => {
        if (isMounted) {
          const titledSvg = rawSvg.replace(
            /<svg([^>]*)>/,
            '<svg$1 role="img" aria-labelledby="title-' +
              idRef.current +
              '"><title id="title-' +
              idRef.current +
              '">Mermaid diagram</title>',
          );
          const cleanSvg = DOMPurify.sanitize(titledSvg, dompurifyConfig);
          setSvg(cleanSvg);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err && (err.message || err.toString())
              ? `Mermaid render error: ${err.message || err.toString()}`
              : 'Failed to render Mermaid diagram',
          );
        }
        console.error('Mermaid render error:', err, '\nSanitized code:', corrected);
      });

    return () => {
      isMounted = false;
    };
  }, [code, getMermaid]);

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
    return <div className={`${className || 'mermaid'} min-h-[40px]`} />;
  }

  // Main diagram with click-to-zoom
  return (
    <>
      <div
        className={`${className || 'mermaid'} max-w-full cursor-zoom-in overflow-x-auto`}
        role="img"
        aria-label="Mermaid diagram"
        tabIndex={0}
        dangerouslySetInnerHTML={{ __html: svg }}
        onClick={() => setModalOpen(true)}
        title="Click to zoom"
      />
      {modalOpen && (
        <div
          className="fixed inset-0 z-[10000] flex h-screen w-screen cursor-grab items-center justify-center bg-black bg-opacity-70"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] cursor-default overflow-auto rounded-lg bg-white p-4 shadow-[0_2px_16px_rgba(0,0,0,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center gap-2">
              <button
                onClick={() => setZoom((z) => Math.max(0.2, z - 0.2))}
                style={{ fontSize: 18, padding: '2px 8px' }}
                aria-label="Zoom out"
              >
                −
              </button>
              <span className="min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
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
              className="relative h-[70vh] w-[80vw] cursor-grab overflow-auto rounded border border-gray-200 bg-gray-50"
              onMouseDown={handleMouseDown}
              onWheel={handleWheel}
            >
              <div
                className="pointer-events-auto h-fit w-fit origin-top-left transition-transform duration-100"
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
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
