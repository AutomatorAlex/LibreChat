import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { TPlugin } from 'librechat-data-provider';
import ToolItem from './ToolItem';

type ToolGroupProps = {
  serverName: string;
  tools: TPlugin[];
  isInstalled: (pluginKey: string) => boolean;
  onAddTool: (pluginKey: string) => void;
  onRemoveTool: (pluginKey: string) => void;
};

function ToolGroup({ serverName, tools, isInstalled, onAddTool, onRemoveTool }: ToolGroupProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg bg-surface-tertiary px-4 py-2 text-left text-lg font-semibold text-text-primary"
      >
        <span>{serverName}</span>
        {isOpen ? <ChevronDown className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
      </button>
      {isOpen && (
        <div className="grid grid-cols-1 grid-rows-2 gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tools.map((tool, index) => (
            <ToolItem
              key={index}
              tool={tool}
              isInstalled={isInstalled(tool.pluginKey)}
              onAddTool={() => onAddTool(tool.pluginKey)}
              onRemoveTool={() => onRemoveTool(tool.pluginKey)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ToolGroup;
