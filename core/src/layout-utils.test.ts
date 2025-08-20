import { describe, it, expect } from 'vitest';
import { LayoutUtils } from './utils/layout';
import type { Widget } from './dashboard-schema';

describe('LayoutUtils', () => {
  const mockWidgets: Widget[] = [
    {
      id: 'widget1',
      type: 'text',
      position: { x: 0, y: 0 },
      size: { width: 8, height: 4 },
      title: 'Widget 1'
    },
    {
      id: 'widget2', 
      type: 'bar_chart',
      position: { x: 12, y: 0 },
      size: { width: 8, height: 6 },
      title: 'Widget 2'
    }
  ];

  describe('snapToGrid', () => {
    it('should snap position to grid correctly', () => {
      const result = LayoutUtils.snapToGrid(7, 9, 4);
      expect(result).toEqual({ x: 8, y: 8 });
    });

    it('should handle exact grid positions', () => {
      const result = LayoutUtils.snapToGrid(8, 12, 4);
      expect(result).toEqual({ x: 8, y: 12 });
    });
  });

  describe('findFreeSpace', () => {
    const canvasBounds = { width: 40, height: 20 };
    const newWidgetSpec = { size: { width: 4, height: 4 } };

    it('should return preferred position when free', () => {
      const preferredPosition = { x: 24, y: 0 };
      const result = LayoutUtils.findFreeSpace(mockWidgets, newWidgetSpec, preferredPosition, canvasBounds);
      
      expect(result).toEqual(preferredPosition);
    });

    it('should find alternative position when preferred is occupied', () => {
      const preferredPosition = { x: 0, y: 0 }; // Occupied by widget1
      const result = LayoutUtils.findFreeSpace(mockWidgets, newWidgetSpec, preferredPosition, canvasBounds);
      
      expect(result).not.toBeNull();
      expect(result).not.toEqual(preferredPosition);
      
      if (result) {
        expect(result.x).toBeGreaterThanOrEqual(0);
        expect(result.y).toBeGreaterThanOrEqual(0);
        expect(result.x + newWidgetSpec.size.width).toBeLessThanOrEqual(canvasBounds.width);
        expect(result.y + newWidgetSpec.size.height).toBeLessThanOrEqual(canvasBounds.height);
      }
    });

    it('should return null when no space available', () => {
      const tinyCanvas = { width: 4, height: 4 };
      const largeWidget = { size: { width: 8, height: 8 } };
      const preferredPosition = { x: 0, y: 0 };
      
      const result = LayoutUtils.findFreeSpace([], largeWidget, preferredPosition, tinyCanvas);
      expect(result).toBeNull();
    });
  });
});