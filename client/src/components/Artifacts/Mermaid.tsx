import React, { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { useMermaid } from '~/hooks/useMermaid';
import { dompurifyConfig } from '~/utils/mermaid.config';
import { hashId } from '~/utils/hash';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { Button } from '~/components/ui/Button';
import { ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

interface MermaidDiagramProps {
  content: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ content }) => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const [isRendered, setIsRendered] = useState(false);
  const idRef = useRef(`mermaid-${hashId(content)}`);
  const getMermaid = useMermaid();

  useEffect(() => {
    let isMounted = true;
    getMermaid()
      .then((m) => m.render(idRef.current, content))
      .then(({ svg: rawSvg }) => {
        if (!isMounted || !mermaidRef.current) return;
        // inject title into SVG for accessibility
        const titledSvg = rawSvg.replace(/<svg([^>]*)>/, '<svg$1><title>Mermaid diagram</title>');
        const cleanSvg = DOMPurify.sanitize(titledSvg, dompurifyConfig);
        mermaidRef.current.innerHTML = cleanSvg;
        setIsRendered(true);
      })
      .catch((error) => {
        console.error('Mermaid rendering error:', error);
        if (isMounted && mermaidRef.current) {
          mermaidRef.current.innerHTML = 'Error rendering diagram';
        }
      });
    return () => {
      isMounted = false;
    };
  }, [content, getMermaid]);

  const centerAndFitDiagram = () => {
    if (transformRef.current && mermaidRef.current) {
      const { centerView, zoomToElement } = transformRef.current;
      zoomToElement(mermaidRef.current as HTMLElement);
      centerView(1, 0);
    }
  };

  useEffect(() => {
    if (isRendered) {
      centerAndFitDiagram();
    }
  }, [isRendered]);

  return (
    <div className="relative h-screen w-screen cursor-move bg-[#282C34] p-5">
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={0.1}
        maxScale={4}
        limitToBounds={false}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
      >
        {({ zoomIn, zoomOut }) => (
          <>
            <TransformComponent
              wrapperStyle={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
              }}
            >
              <div ref={mermaidRef} className="h-full w-full" />
            </TransformComponent>
            <div className="absolute bottom-2 right-2 flex space-x-2">
              <Button onClick={() => zoomIn(0.1)} variant="outline" size="icon">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button onClick={() => zoomOut(0.1)} variant="outline" size="icon">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button onClick={centerAndFitDiagram} variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};

export default MermaidDiagram;
