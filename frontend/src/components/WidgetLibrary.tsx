import React, { useCallback } from 'react';
import { WIDGET_DEFINITIONS } from '@cli-designer/core';
import { useDesignerStore } from '../store/designer';

export const WidgetLibrary: React.FC = () => {
  const { addWidget, setDragging } = useDesignerStore();

  const handleDragStart = useCallback((e: React.DragEvent, widgetType: string) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('widgetType', widgetType);
    setDragging(true);
  }, [setDragging]);

  const handleDragEnd = useCallback(() => {
    setDragging(false);
  }, [setDragging]);

  const handleAddWidget = useCallback((type: keyof typeof WIDGET_DEFINITIONS) => {
    const definition = WIDGET_DEFINITIONS[type];
    const newWidget = {
      id: `widget_${Date.now()}`,
      type,
      position: { x: 0, y: 0 },
      size: definition.defaultSize,
      title: definition.name,
      properties: {}
    };
    
    // Get default properties
    for (const [key, prop] of Object.entries(definition.properties)) {
      newWidget.properties[key] = prop.default;
    }
    
    addWidget(newWidget);
  }, [addWidget]);
  return (
    <div className="h-full p-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-200">Widget Library</h2>
      
      <div className="space-y-2">
        {Object.values(WIDGET_DEFINITIONS).map((widget) => (
          <div
            key={widget.type}
            className="bg-gray-700 rounded-lg p-3 cursor-move hover:bg-gray-600 transition-colors"
            draggable
            onDragStart={(e) => handleDragStart(e, widget.type)}
            onDragEnd={handleDragEnd}
            onClick={() => handleAddWidget(widget.type as keyof typeof WIDGET_DEFINITIONS)}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{widget.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-200">{widget.name}</div>
                <div className="text-xs text-gray-400">{widget.description}</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Size: {widget.defaultSize.width} × {widget.defaultSize.height}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-3 bg-gray-800 rounded-lg">
        <p className="text-xs text-gray-400">
          [TIP] <strong>Tip:</strong> Drag widgets to the canvas or click to add at origin
        </p>
      </div>
    </div>
  );
};