import React, { useCallback, useState } from 'react';
import { Widget } from '../store/designer';
import { useDesignerStore } from '../store/designer';
import { WIDGET_DEFINITIONS } from '@cli-designer/core';

interface WidgetRendererProps {
  widget: Widget;
  isSelected: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  widget,
  isSelected,
  canvasWidth,
  canvasHeight
}) => {
  const { selectWidget, moveWidget, resizeWidget } = useDesignerStore();
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const definition = WIDGET_DEFINITIONS[widget.type];

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    selectWidget(widget.id);
  }, [widget.id, selectWidget]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('widgetId', widget.id);
    setIsDragging(true);
  }, [widget.id]);
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const style = {
    position: 'absolute' as const,
    left: `${(widget.position.x / canvasWidth) * 100}%`,
    top: `${(widget.position.y / canvasHeight) * 100}%`,
    width: `${(widget.size.width / canvasWidth) * 100}%`,
    height: `${(widget.size.height / canvasHeight) * 100}%`,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      className={`
        absolute border-2 rounded-md cursor-move transition-all
        ${isSelected 
          ? 'border-blue-500 bg-blue-950 bg-opacity-50' 
          : 'border-gray-600 bg-gray-800 bg-opacity-50 hover:border-gray-500'
        }
      `}
      style={style}
      onClick={handleClick}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between px-2 py-1 bg-gray-700 bg-opacity-50 rounded-t-md">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{definition.icon}</span>
          <span className="text-xs text-gray-300 font-medium">
            {widget.title || definition.name}
          </span>
        </div>
      </div>
      {/* Widget Content Preview */}
      <div className="p-2 text-xs text-gray-400">
        <div className="text-center opacity-50">
          {definition.description}
        </div>
        {widget.dataSource && (
          <div className="mt-1 text-center text-xs text-blue-400">
            📊 {widget.dataSource}
          </div>
        )}
      </div>

      {/* Resize Handle */}
      {isSelected && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-tl-md cursor-se-resize"
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsResizing(true);
          }}
        />
      )}
    </div>
  );
};