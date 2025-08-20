import React, { useMemo } from 'react';
import { useDesignerStore } from '../store/designer';

export const PreviewPanel: React.FC = () => {
  const { widgets, settings, metadata } = useDesignerStore();

  // Create a terminal-style grid representation
  const terminalGrid = useMemo(() => {
    const { width, height } = settings.dimensions;
    const grid = Array(height).fill(null).map(() => Array(width).fill(' '));

    // Fill grid with widget representations
    widgets.forEach(widget => {
      const { position, size, title, type } = widget;
      const startX = Math.max(0, Math.min(position.x, width - 1));
      const startY = Math.max(0, Math.min(position.y, height - 1));
      const endX = Math.min(position.x + size.width, width);
      const endY = Math.min(position.y + size.height, height);

      // Get widget character representation
      const getWidgetChar = (widgetType: string) => {
        switch (widgetType) {
          case 'text': return '█';
          case 'line_chart': return '╱';
          case 'bar_chart': return '▓';
          case 'table': return '▒';
          case 'progress_bar': return '━';
          case 'sparkline': return '·';
          case 'gauge': return '○';
          case 'log_viewer': return '≡';
          case 'metric_card': return '▢';
          default: return '?';
        }
      };

      const char = getWidgetChar(type);

      // Fill the widget area
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          // Draw border for first/last row/col, fill for interior
          if (y === startY || y === endY - 1 || x === startX || x === endX - 1) {
            grid[y][x] = '│─┌┐└┘'[Math.floor(Math.random() * 6)]; // Border chars
          } else {
            grid[y][x] = char;
          }
        }
      }

      // Add widget title if there's space
      if (title && title.length < size.width - 2) {
        const titleY = startY;
        const titleX = startX + 1;
        for (let i = 0; i < Math.min(title.length, size.width - 2); i++) {
          if (titleX + i < width) {
            grid[titleY][titleX + i] = title[i];
          }
        }
      }
    });

    return grid;
  }, [widgets, settings.dimensions]);

  // Convert grid to display string
  const terminalDisplay = terminalGrid.map(row => row.join('')).join('\n');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-600">
        <h3 className="text-sm font-semibold text-gray-200">Terminal Preview</h3>
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <span>{metadata.framework}</span>
          <span>•</span>
          <span>{settings.dimensions.width}×{settings.dimensions.height}</span>
        </div>
      </div>

      {/* Terminal Display */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="bg-black rounded-lg p-4 h-full">
          {/* Terminal Header */}
          <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-gray-700">
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <span className="text-sm text-gray-400">{metadata.name || 'Dashboard'}</span>
          </div>

          {/* Dashboard Content */}
          <div className="text-green-400 text-xs leading-tight overflow-hidden">
            {widgets.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                <div className="mb-2">No widgets added yet</div>
                <div className="text-xs">Add widgets from the library to see preview</div>
              </div>
            ) : (
              <pre className="whitespace-pre font-mono text-xs leading-tight">
                {terminalDisplay}
              </pre>
            )}
          </div>

          {/* Status Bar */}
          <div className="mt-4 pt-2 border-t border-gray-700 flex justify-between text-xs text-gray-500">
            <span>Widgets: {widgets.length}</span>
            <span>Theme: {settings.theme}</span>
            <span>Refresh: {settings.refreshRate}ms</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-3 border-t border-gray-600 bg-gray-750">
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
            Live Preview
          </button>
          <button className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors">
            Full Screen
          </button>
          <button className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors">
            Export Image
          </button>
        </div>
      </div>
    </div>
  );
};