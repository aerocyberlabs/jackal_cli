import React, { useCallback, useRef, useState } from 'react';
import { useDesignerStore } from '../store/designer';
import { WidgetRenderer } from './WidgetRenderer';
import { WIDGET_DEFINITIONS, LayoutUtils } from '@cli-designer/core';

export const DesignCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedWidgetType, setDraggedWidgetType] = useState<keyof typeof WIDGET_DEFINITIONS | null>(null);
  const {
    widgets,
    settings,
    selectedWidgetId,
    isDragging,
    hoveredCellPosition,
    selectWidget,
    moveWidget,
    setHoveredCell,
    setDragging,
    addWidget
  } = useDesignerStore();

  const gridSize = settings.gridSize || 4;
  const { width: canvasWidth, height: canvasHeight } = settings.dimensions;

  const getCellPosition = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return null;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvasWidth);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvasHeight);
    
    return {
      x: Math.floor(x / gridSize) * gridSize,
      y: Math.floor(y / gridSize) * gridSize
    };
  }, [canvasWidth, canvasHeight, gridSize]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const position = getCellPosition(e);
      setHoveredCell(position);
    }
  }, [getCellPosition, setHoveredCell, isDragging]);

  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null);
  }, [setHoveredCell]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      selectWidget(null);
    }
  }, [selectWidget]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const widgetType = e.dataTransfer.getData('widgetType') as keyof typeof WIDGET_DEFINITIONS;
    const preferredPosition = getCellPosition(e);
    
    if (widgetType && preferredPosition && WIDGET_DEFINITIONS[widgetType]) {
      const definition = WIDGET_DEFINITIONS[widgetType];
      
      // Find free space for the widget to avoid collisions
      const freePosition = LayoutUtils.findFreeSpace(
        widgets,
        { size: definition.defaultSize },
        preferredPosition,
        { width: canvasWidth, height: canvasHeight }
      );
      
      if (freePosition) {
        const newWidget = {
          id: `widget_${Date.now()}`,
          type: widgetType,
          position: freePosition,
          size: definition.defaultSize,
          title: definition.name,
          properties: {} as Record<string, any>
        };
        
        // Set default properties
        for (const [key, prop] of Object.entries(definition.properties)) {
          newWidget.properties[key] = prop.default;
        }
        
        addWidget(newWidget);
        console.log('Added widget:', widgetType, 'at', freePosition);
      } else {
        console.warn('No free space found for widget:', widgetType);
        // Could show a toast notification here
      }
    }
    
    setDragging(false);
    setDraggedWidgetType(null);
  }, [getCellPosition, setDragging, addWidget, widgets, canvasWidth, canvasHeight]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    // Track the dragged widget type for visual feedback
    const widgetType = e.dataTransfer.types.includes('widgetType') 
      ? e.dataTransfer.getData('widgetType') as keyof typeof WIDGET_DEFINITIONS
      : null;
    
    if (widgetType && draggedWidgetType !== widgetType) {
      setDraggedWidgetType(widgetType);
    }
  }, [draggedWidgetType]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const widgetType = e.dataTransfer.getData('widgetType') as keyof typeof WIDGET_DEFINITIONS;
    if (widgetType) {
      setDraggedWidgetType(widgetType);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're actually leaving the canvas area
    if (!canvasRef.current?.contains(e.relatedTarget as Node)) {
      setDraggedWidgetType(null);
    }
  }, []);
  // Calculate cell size based on canvas dimensions
  const cellWidth = 100 / canvasWidth;
  const cellHeight = 100 / canvasHeight;

  return (
    <div className="h-full p-4 overflow-auto bg-gray-900">
      <div className="relative mx-auto" style={{ maxWidth: '1200px' }}>
        {/* Grid Background */}
        <div
          ref={canvasRef}
          className="relative bg-gray-800 border-2 border-gray-700 rounded-lg overflow-hidden"
          style={{
            aspectRatio: `${canvasWidth} / ${canvasHeight}`,
            backgroundImage: `
              repeating-linear-gradient(0deg, #374151 0, transparent 1px, transparent ${100/canvasHeight * gridSize}%, #374151 ${100/canvasHeight * gridSize}%),
              repeating-linear-gradient(90deg, #374151 0, transparent 1px, transparent ${100/canvasWidth * gridSize}%, #374151 ${100/canvasWidth * gridSize}%)
            `,
            backgroundSize: '100% 100%'
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleCanvasClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >
          {/* Hover Indicator */}
          {hoveredCellPosition && isDragging && draggedWidgetType && (
            (() => {
              const definition = WIDGET_DEFINITIONS[draggedWidgetType];
              const widgetSize = definition ? definition.defaultSize : { width: gridSize, height: gridSize };
              
              return (
                <div
                  className="absolute bg-blue-500 bg-opacity-30 pointer-events-none border-2 border-blue-400"
                  style={{
                    left: `${(hoveredCellPosition.x / canvasWidth) * 100}%`,
                    top: `${(hoveredCellPosition.y / canvasHeight) * 100}%`,
                    width: `${(widgetSize.width / canvasWidth) * 100}%`,
                    height: `${(widgetSize.height / canvasHeight) * 100}%`
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-blue-200 font-semibold">
                    {definition?.name || draggedWidgetType}
                  </div>
                </div>
              );
            })()
          )}
          {/* Render Widgets */}
          {widgets.map((widget) => (
            <WidgetRenderer
              key={widget.id}
              widget={widget}
              isSelected={widget.id === selectedWidgetId}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
            />
          ))}
        </div>
        
        {/* Canvas Info */}
        <div className="mt-2 text-xs text-gray-500 text-center">
          {canvasWidth} × {canvasHeight} cells | Grid: {gridSize}
        </div>
      </div>
    </div>
  );
};