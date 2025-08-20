import { Widget } from '../dashboard-schema';

// Layout utilities for grid management
export class LayoutUtils {
  // Snap position to grid
  static snapToGrid(x: number, y: number, gridSize: number): { x: number; y: number } {
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  }

  // Find nearest free space for a widget
  static findFreeSpace(
    widgets: Widget[],
    newWidget: { size: { width: number; height: number } },
    preferredPos: { x: number; y: number },
    bounds: { width: number; height: number }
  ): { x: number; y: number } | null {
    // Try preferred position first
    if (this.canPlaceWidget(widgets, preferredPos, newWidget.size, bounds)) {
      return preferredPos;
    }

    // Search in expanding circles from preferred position
    const maxRadius = Math.max(bounds.width, bounds.height);
    
    for (let radius = 1; radius < maxRadius; radius++) {
      for (let angle = 0; angle < 360; angle += 45) {
        const x = Math.round(preferredPos.x + radius * Math.cos(angle * Math.PI / 180));
        const y = Math.round(preferredPos.y + radius * Math.sin(angle * Math.PI / 180));
        
        if (this.canPlaceWidget(widgets, { x, y }, newWidget.size, bounds)) {
          return { x, y };
        }
      }
    }
    
    return null;
  }
  // Check if a widget can be placed at position
  private static canPlaceWidget(
    widgets: Widget[],
    position: { x: number; y: number },
    size: { width: number; height: number },
    bounds: { width: number; height: number }
  ): boolean {
    // Check bounds
    if (position.x < 0 || position.y < 0) return false;
    if (position.x + size.width > bounds.width) return false;
    if (position.y + size.height > bounds.height) return false;

    // Check collisions with existing widgets
    const testWidget = {
      position,
      size
    };

    for (const widget of widgets) {
      if (this.rectanglesOverlap(testWidget, widget)) {
        return false;
      }
    }

    return true;
  }

  // Check if two rectangles overlap
  private static rectanglesOverlap(
    r1: { position: { x: number; y: number }; size: { width: number; height: number } },
    r2: { position: { x: number; y: number }; size: { width: number; height: number } }
  ): boolean {
    return !(r1.position.x + r1.size.width <= r2.position.x ||
             r2.position.x + r2.size.width <= r1.position.x ||
             r1.position.y + r1.size.height <= r2.position.y ||
             r2.position.y + r2.size.height <= r1.position.y);
  }
}