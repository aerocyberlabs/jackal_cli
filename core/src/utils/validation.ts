import { DashboardDesign, Widget } from '../dashboard-schema';

// Validation utilities
export class ValidationUtils {
  // Check if widgets overlap
  static checkCollisions(widgets: Widget[]): string[] {
    const errors: string[] = [];
    
    for (let i = 0; i < widgets.length; i++) {
      for (let j = i + 1; j < widgets.length; j++) {
        if (this.widgetsOverlap(widgets[i], widgets[j])) {
          errors.push(`Widget ${widgets[i].id} overlaps with ${widgets[j].id}`);
        }
      }
    }
    
    return errors;
  }

  // Check if two widgets overlap
  static widgetsOverlap(w1: Widget, w2: Widget): boolean {
    const w1Right = w1.position.x + w1.size.width;
    const w1Bottom = w1.position.y + w1.size.height;
    const w2Right = w2.position.x + w2.size.width;
    const w2Bottom = w2.position.y + w2.size.height;

    return !(w1Right <= w2.position.x || 
             w2Right <= w1.position.x || 
             w1Bottom <= w2.position.y || 
             w2Bottom <= w1.position.y);
  }

  // Check if widgets fit within dashboard dimensions
  static checkBounds(widgets: Widget[], width: number, height: number): string[] {
    const errors: string[] = [];
    
    for (const widget of widgets) {
      if (widget.position.x < 0 || widget.position.y < 0) {
        errors.push(`Widget ${widget.id} has negative position`);
      }
      
      if (widget.position.x + widget.size.width > width) {
        errors.push(`Widget ${widget.id} exceeds dashboard width`);
      }
      
      if (widget.position.y + widget.size.height > height) {
        errors.push(`Widget ${widget.id} exceeds dashboard height`);
      }
    }
    
    return errors;
  }

  // Validate complete dashboard design
  static validateDashboard(design: DashboardDesign): string[] {
    const errors: string[] = [];
    
    // Check for widget collisions
    errors.push(...this.checkCollisions(design.widgets));
    
    // Check bounds
    errors.push(...this.checkBounds(
      design.widgets,
      design.settings.dimensions.width,
      design.settings.dimensions.height
    ));
    
    return errors;
  }
}