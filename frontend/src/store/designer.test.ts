import { describe, it, expect, beforeEach } from 'vitest';
import { useDesignerStore } from './designer';
import type { Widget } from '@cli-designer/core';

describe('Designer Store', () => {
  let store: ReturnType<typeof useDesignerStore>;

  beforeEach(() => {
    // Reset store state before each test
    store = useDesignerStore.getState();
    store.clearWidgets();
    store.setSettings({
      dimensions: { width: 40, height: 20 },
      gridSize: 4,
      theme: 'dark',
      refreshRate: 1000
    });
  });

  describe('widgets management', () => {
    const sampleWidget: Widget = {
      id: 'test-widget',
      type: 'text',
      position: { x: 0, y: 0 },
      size: { width: 8, height: 4 },
      title: 'Test Widget',
      properties: {}
    };

    it('should add widgets', () => {
      expect(store.widgets).toHaveLength(0);
      
      store.addWidget(sampleWidget);
      
      expect(store.widgets).toHaveLength(1);
      expect(store.widgets[0]).toEqual(sampleWidget);
    });

    it('should update widget properties', () => {
      store.addWidget(sampleWidget);
      
      store.updateWidget('test-widget', { title: 'Updated Title' });
      
      expect(store.widgets[0].title).toBe('Updated Title');
    });

    it('should update widget position and size', () => {
      store.addWidget(sampleWidget);
      
      const newPosition = { x: 4, y: 4 };
      const newSize = { width: 12, height: 6 };
      
      store.updateWidget('test-widget', { 
        position: newPosition,
        size: newSize
      });
      
      expect(store.widgets[0].position).toEqual(newPosition);
      expect(store.widgets[0].size).toEqual(newSize);
    });

    it('should remove widgets', () => {
      store.addWidget(sampleWidget);
      expect(store.widgets).toHaveLength(1);
      
      store.removeWidget('test-widget');
      
      expect(store.widgets).toHaveLength(0);
    });

    it('should move widgets to new position', () => {
      store.addWidget(sampleWidget);
      
      const newPosition = { x: 8, y: 8 };
      store.moveWidget('test-widget', newPosition);
      
      expect(store.widgets[0].position).toEqual(newPosition);
    });

    it('should clear all widgets', () => {
      store.addWidget(sampleWidget);
      store.addWidget({ ...sampleWidget, id: 'widget-2' });
      expect(store.widgets).toHaveLength(2);
      
      store.clearWidgets();
      
      expect(store.widgets).toHaveLength(0);
    });

    it('should handle non-existent widget updates gracefully', () => {
      expect(() => {
        store.updateWidget('non-existent', { title: 'New Title' });
      }).not.toThrow();
      
      expect(() => {
        store.removeWidget('non-existent');
      }).not.toThrow();
      
      expect(() => {
        store.moveWidget('non-existent', { x: 0, y: 0 });
      }).not.toThrow();
    });
  });

  describe('selection management', () => {
    const widget1: Widget = {
      id: 'widget-1',
      type: 'text',
      position: { x: 0, y: 0 },
      size: { width: 8, height: 4 },
      title: 'Widget 1',
      properties: {}
    };

    beforeEach(() => {
      store.addWidget(widget1);
    });

    it('should select widgets', () => {
      expect(store.selectedWidgetId).toBeNull();
      
      store.selectWidget('widget-1');
      
      expect(store.selectedWidgetId).toBe('widget-1');
    });

    it('should deselect widgets', () => {
      store.selectWidget('widget-1');
      expect(store.selectedWidgetId).toBe('widget-1');
      
      store.selectWidget(null);
      
      expect(store.selectedWidgetId).toBeNull();
    });

    it('should get selected widget', () => {
      store.selectWidget('widget-1');
      
      expect(store.getSelectedWidget()).toEqual(widget1);
    });

    it('should return null for selected widget when none selected', () => {
      expect(store.getSelectedWidget()).toBeNull();
    });

    it('should return null for selected widget when selected widget does not exist', () => {
      store.selectWidget('non-existent');
      
      expect(store.getSelectedWidget()).toBeNull();
    });
  });

  describe('settings management', () => {
    it('should update settings', () => {
      const newSettings = {
        dimensions: { width: 80, height: 40 },
        gridSize: 8,
        theme: 'light' as const,
        refreshRate: 2000
      };
      
      store.setSettings(newSettings);
      
      expect(store.settings).toEqual(newSettings);
    });

    it('should partially update settings', () => {
      const initialSettings = store.settings;
      
      store.setSettings({ gridSize: 8 });
      
      expect(store.settings.gridSize).toBe(8);
      expect(store.settings.dimensions).toEqual(initialSettings.dimensions);
      expect(store.settings.theme).toBe(initialSettings.theme);
    });
  });

  describe('UI state management', () => {
    it('should manage dragging state', () => {
      expect(store.isDragging).toBe(false);
      
      store.setDragging(true);
      expect(store.isDragging).toBe(true);
      
      store.setDragging(false);
      expect(store.isDragging).toBe(false);
    });

    it('should manage hovered cell position', () => {
      expect(store.hoveredCellPosition).toBeNull();
      
      const position = { x: 4, y: 8 };
      store.setHoveredCell(position);
      expect(store.hoveredCellPosition).toEqual(position);
      
      store.setHoveredCell(null);
      expect(store.hoveredCellPosition).toBeNull();
    });

    it('should manage preview and code panel visibility', () => {
      expect(store.showPreview).toBe(true);
      expect(store.showCode).toBe(false);
      
      store.setShowPreview(false);
      store.setShowCode(true);
      
      expect(store.showPreview).toBe(false);
      expect(store.showCode).toBe(true);
    });
  });

  describe('data sources management', () => {
    const sampleDataSource = {
      id: 'test-source',
      name: 'Test Data Source',
      config: {
        type: 'system_metric' as const,
        metric: 'cpu_percent',
        interval: 1000
      }
    };

    it('should add data sources', () => {
      expect(store.dataSources).toHaveLength(0);
      
      store.addDataSource(sampleDataSource);
      
      expect(store.dataSources).toHaveLength(1);
      expect(store.dataSources[0]).toEqual(sampleDataSource);
    });

    it('should update data sources', () => {
      store.addDataSource(sampleDataSource);
      
      store.updateDataSource('test-source', { name: 'Updated Source' });
      
      expect(store.dataSources[0].name).toBe('Updated Source');
    });

    it('should remove data sources', () => {
      store.addDataSource(sampleDataSource);
      expect(store.dataSources).toHaveLength(1);
      
      store.removeDataSource('test-source');
      
      expect(store.dataSources).toHaveLength(0);
    });

    it('should handle non-existent data source operations', () => {
      expect(() => {
        store.updateDataSource('non-existent', { name: 'New Name' });
      }).not.toThrow();
      
      expect(() => {
        store.removeDataSource('non-existent');
      }).not.toThrow();
    });
  });

  describe('dashboard metadata', () => {
    it('should update dashboard metadata', () => {
      const metadata = {
        name: 'My Dashboard',
        description: 'A test dashboard',
        targetFramework: 'textual' as const
      };
      
      store.setMetadata(metadata);
      
      expect(store.metadata).toEqual(metadata);
    });

    it('should partially update metadata', () => {
      store.setMetadata({ name: 'Initial Name' });
      
      store.setMetadata({ description: 'Added description' });
      
      expect(store.metadata.name).toBe('Initial Name');
      expect(store.metadata.description).toBe('Added description');
    });
  });

  describe('state persistence', () => {
    it('should create dashboard design object', () => {
      // Set up a complete dashboard state
      const widget: Widget = {
        id: 'test-widget',
        type: 'metric_card',
        position: { x: 0, y: 0 },
        size: { width: 8, height: 4 },
        title: 'CPU Usage',
        dataSource: 'cpu-source',
        properties: { format: 'percentage' }
      };
      
      const dataSource = {
        id: 'cpu-source',
        name: 'CPU Metrics',
        config: {
          type: 'system_metric' as const,
          metric: 'cpu_percent',
          interval: 1000
        }
      };
      
      store.setMetadata({ 
        name: 'Test Dashboard',
        targetFramework: 'textual'
      });
      store.addWidget(widget);
      store.addDataSource(dataSource);
      
      const design = store.getDashboardDesign();
      
      expect(design.metadata.name).toBe('Test Dashboard');
      expect(design.metadata.targetFramework).toBe('textual');
      expect(design.widgets).toHaveLength(1);
      expect(design.widgets[0]).toEqual(widget);
      expect(design.dataSources).toHaveLength(1);
      expect(design.dataSources[0]).toEqual(dataSource);
      expect(design.settings).toEqual(store.settings);
    });
  });

  describe('complex scenarios', () => {
    it('should handle multiple widgets with different types', () => {
      const widgets: Widget[] = [
        {
          id: 'text-1',
          type: 'text',
          position: { x: 0, y: 0 },
          size: { width: 8, height: 4 },
          title: 'Title',
          properties: { content: 'Hello' }
        },
        {
          id: 'chart-1',
          type: 'bar_chart',
          position: { x: 8, y: 0 },
          size: { width: 12, height: 8 },
          title: 'Chart',
          properties: { orientation: 'vertical' }
        },
        {
          id: 'gauge-1',
          type: 'gauge',
          position: { x: 20, y: 0 },
          size: { width: 8, height: 8 },
          title: 'Gauge',
          properties: { min: 0, max: 100 }
        }
      ];
      
      widgets.forEach(widget => store.addWidget(widget));
      
      expect(store.widgets).toHaveLength(3);
      expect(store.widgets.map(w => w.type)).toEqual(['text', 'bar_chart', 'gauge']);
    });

    it('should maintain referential integrity when updating widgets', () => {
      const widget: Widget = {
        id: 'test-widget',
        type: 'text',
        position: { x: 0, y: 0 },
        size: { width: 8, height: 4 },
        title: 'Original',
        properties: { content: 'Original content' }
      };
      
      store.addWidget(widget);
      const originalWidget = store.widgets[0];
      
      store.updateWidget('test-widget', { title: 'Updated' });
      const updatedWidget = store.widgets[0];
      
      expect(originalWidget).not.toBe(updatedWidget); // Should be immutably updated
      expect(updatedWidget.title).toBe('Updated');
      expect(updatedWidget.properties.content).toBe('Original content');
    });
  });
});