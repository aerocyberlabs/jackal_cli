import React, { useCallback, useEffect, useState } from 'react';
import { useDesignerStore } from '../store/designer';
import { WIDGET_DEFINITIONS } from '@cli-designer/core';

export const PropertiesPanel: React.FC = () => {
  const { selectedWidgetId, widgets, updateWidget, settings, updateSettings, dataSources } = useDesignerStore();
  const selectedWidget = widgets.find(w => w.id === selectedWidgetId);
  const [localProperties, setLocalProperties] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedWidget) {
      setLocalProperties(selectedWidget.properties || {});
    }
  }, [selectedWidget]);

  const handlePropertyChange = useCallback((key: string, value: any) => {
    if (!selectedWidget) return;
    
    const newProperties = { ...localProperties, [key]: value };
    setLocalProperties(newProperties);
    updateWidget(selectedWidget.id, { properties: newProperties });
  }, [selectedWidget, localProperties, updateWidget]);

  const handleTitleChange = useCallback((value: string) => {
    if (!selectedWidget) return;
    updateWidget(selectedWidget.id, { title: value });
  }, [selectedWidget, updateWidget]);

  const handlePositionChange = useCallback((axis: 'x' | 'y', value: number) => {
    if (!selectedWidget) return;
    const newPosition = { ...selectedWidget.position, [axis]: value };
    updateWidget(selectedWidget.id, { position: newPosition });
  }, [selectedWidget, updateWidget]);
  const handleSizeChange = useCallback((dimension: 'width' | 'height', value: number) => {
    if (!selectedWidget) return;
    const newSize = { ...selectedWidget.size, [dimension]: value };
    updateWidget(selectedWidget.id, { size: newSize });
  }, [selectedWidget, updateWidget]);

  const handleDataSourceChange = useCallback((dataSourceId: string) => {
    if (!selectedWidget) return;
    updateWidget(selectedWidget.id, { dataSource: dataSourceId || undefined });
  }, [selectedWidget, updateWidget]);

  if (!selectedWidget) {
    return (
      <div className="h-full p-4">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Properties</h2>
        <div className="text-gray-400 text-sm">
          Select a widget to edit its properties
        </div>
        
        {/* Dashboard Settings */}
        <div className="mt-8 space-y-4">
          <h3 className="text-md font-semibold text-gray-300">Dashboard Settings</h3>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">Theme</label>
            <select
              className="w-full bg-gray-700 text-gray-200 rounded px-2 py-1 text-sm"
              value={settings.theme}
              onChange={(e) => updateSettings({ theme: e.target.value as 'dark' | 'light' })}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">Grid Size</label>
            <input
              type="number"
              className="w-full bg-gray-700 text-gray-200 rounded px-2 py-1 text-sm"
              value={settings.gridSize}
              onChange={(e) => updateSettings({ gridSize: parseInt(e.target.value) })}
              min="1"
              max="10"
            />
          </div>
        </div>
      </div>
    );
  }
  const widgetDefinition = WIDGET_DEFINITIONS[selectedWidget.type];

  return (
    <div className="h-full p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 text-gray-200">Properties</h2>
      
      {/* Widget Info */}
      <div className="mb-6 p-3 bg-gray-700 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-xl">{widgetDefinition.icon}</span>
          <span className="font-medium text-gray-200">{widgetDefinition.name}</span>
        </div>
        <div className="text-xs text-gray-400">ID: {selectedWidget.id}</div>
      </div>

      {/* Basic Properties */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Title</label>
          <input
            type="text"
            className="w-full bg-gray-700 text-gray-200 rounded px-2 py-1 text-sm"
            value={selectedWidget.title || ''}
            onChange={(e) => handleTitleChange(e.target.value)}
          />
        </div>

        {/* Position */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">X Position</label>
            <input
              type="number"
              className="w-full bg-gray-700 text-gray-200 rounded px-2 py-1 text-sm"
              value={selectedWidget.position.x}
              onChange={(e) => handlePositionChange('x', parseInt(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Y Position</label>
            <input
              type="number"
              className="w-full bg-gray-700 text-gray-200 rounded px-2 py-1 text-sm"
              value={selectedWidget.position.y}
              onChange={(e) => handlePositionChange('y', parseInt(e.target.value))}
            />
          </div>
        </div>
        {/* Size */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Width</label>
            <input
              type="number"
              className="w-full bg-gray-700 text-gray-200 rounded px-2 py-1 text-sm"
              value={selectedWidget.size.width}
              onChange={(e) => handleSizeChange('width', parseInt(e.target.value))}
              min={widgetDefinition.minSize.width}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Height</label>
            <input
              type="number"
              className="w-full bg-gray-700 text-gray-200 rounded px-2 py-1 text-sm"
              value={selectedWidget.size.height}
              onChange={(e) => handleSizeChange('height', parseInt(e.target.value))}
              min={widgetDefinition.minSize.height}
            />
          </div>
        </div>

        {/* Data Source */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Data Source</label>
          <select
            className="w-full bg-gray-700 text-gray-200 rounded px-2 py-1 text-sm"
            value={selectedWidget.dataSource || ''}
            onChange={(e) => handleDataSourceChange(e.target.value)}
          >
            <option value="">No Data Source</option>
            {dataSources.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.name} ({ds.config.type})
              </option>
            ))}
          </select>
          {selectedWidget.dataSource && (
            <div className="mt-1 text-xs text-gray-500">
              Connected to: {dataSources.find(ds => ds.id === selectedWidget.dataSource)?.name}
            </div>
          )}
        </div>

        {/* Widget-specific Properties */}
        <div className="pt-4 border-t border-gray-600">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Widget Properties</h3>
          {Object.entries(widgetDefinition.properties).map(([key, prop]) => (
            <div key={key} className="mb-3">
              <label className="block text-xs text-gray-400 mb-1 capitalize">
                {key.replace(/_/g, ' ')}
              </label>
              {prop.type === 'boolean' ? (
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={localProperties[key] ?? prop.default}
                  onChange={(e) => handlePropertyChange(key, e.target.checked)}
                />
              ) : prop.type === 'select' ? (
                <select
                  className="w-full bg-gray-700 text-gray-200 rounded px-2 py-1 text-sm"
                  value={localProperties[key] ?? prop.default}
                  onChange={(e) => handlePropertyChange(key, e.target.value)}
                >
                  {prop.options.map((option: string) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={prop.type === 'number' ? 'number' : 'text'}
                  className="w-full bg-gray-700 text-gray-200 rounded px-2 py-1 text-sm"
                  value={localProperties[key] ?? prop.default}
                  onChange={(e) => handlePropertyChange(key, prop.type === 'number' ? parseInt(e.target.value) : e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};