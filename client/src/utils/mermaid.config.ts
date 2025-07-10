import type { MermaidConfig } from 'mermaid';
import type { Config as DOMPurifyConfig } from 'dompurify';

export const mermaidConfig: MermaidConfig = {
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
};

export const dompurifyConfig: DOMPurifyConfig = {
  USE_PROFILES: { svg: true },
};
