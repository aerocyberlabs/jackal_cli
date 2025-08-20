import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WidgetLibrary } from './WidgetLibrary';
import { useDesignerStore } from '../store/designer';
import { WIDGET_DEFINITIONS } from '@cli-designer/core';

// Mock the designer store
vi.mock('../store/designer', () => ({
  useDesignerStore: vi.fn()
}));

describe('WidgetLibrary', () => {
  const mockSetDragging = vi.fn();
  const mockAddWidget = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useDesignerStore as any).mockReturnValue({
      setDragging: mockSetDragging,
      addWidget: mockAddWidget
    });
  });

  it('should render all widget types', () => {
    render(<WidgetLibrary />);

    // Check that all widget types from WIDGET_DEFINITIONS are rendered
    Object.entries(WIDGET_DEFINITIONS).forEach(([type, definition]) => {
      expect(screen.getByText(definition.name)).toBeInTheDocument();
      expect(screen.getByText(definition.icon)).toBeInTheDocument();
    });
  });

  it('should render widget library title', () => {
    render(<WidgetLibrary />);
    expect(screen.getByText('Widget Library')).toBeInTheDocument();
  });

  it('should handle drag start events', () => {
    render(<WidgetLibrary />);

    const textWidget = screen.getByText('Text');
    const dragStartEvent = new Event('dragstart', { bubbles: true });
    Object.defineProperty(dragStartEvent, 'dataTransfer', {
      value: {
        setData: vi.fn(),
        effectAllowed: null
      },
      writable: false
    });

    fireEvent(textWidget, dragStartEvent);

    expect(mockSetDragging).toHaveBeenCalledWith(true);
    expect(dragStartEvent.dataTransfer?.setData).toHaveBeenCalledWith('widgetType', 'text');
    expect(dragStartEvent.dataTransfer?.effectAllowed).toBe('copy');
  });

  it('should handle drag end events', () => {
    render(<WidgetLibrary />);

    const textWidget = screen.getByText('Text');
    fireEvent.dragEnd(textWidget);

    expect(mockSetDragging).toHaveBeenCalledWith(false);
  });

  it('should handle click to add widgets', () => {
    render(<WidgetLibrary />);

    const textWidget = screen.getByText('Text');
    fireEvent.click(textWidget);

    expect(mockAddWidget).toHaveBeenCalled();
    
    const addedWidget = mockAddWidget.mock.calls[0][0];
    expect(addedWidget.type).toBe('text');
    expect(addedWidget.id).toMatch(/^widget_\d+$/);
    expect(addedWidget.title).toBe('Text');
    expect(addedWidget.position).toEqual({ x: 0, y: 0 });
    expect(addedWidget.size).toEqual(WIDGET_DEFINITIONS.text.defaultSize);
  });

  it('should set widget properties with defaults when adding via click', () => {
    render(<WidgetLibrary />);

    const barChartWidget = screen.getByText('Bar Chart');
    fireEvent.click(barChartWidget);

    expect(mockAddWidget).toHaveBeenCalled();
    
    const addedWidget = mockAddWidget.mock.calls[0][0];
    expect(addedWidget.type).toBe('bar_chart');
    expect(addedWidget.properties).toBeDefined();
    
    // Check that default properties are set
    const barChartDef = WIDGET_DEFINITIONS.bar_chart;
    Object.entries(barChartDef.properties).forEach(([key, prop]) => {
      if (prop.default !== undefined) {
        expect(addedWidget.properties[key]).toBe(prop.default);
      }
    });
  });

  it('should render widgets in a grid layout', () => {
    render(<WidgetLibrary />);

    const widgetGrid = screen.getByText('Widget Library').nextElementSibling;
    expect(widgetGrid).toHaveClass('grid', 'grid-cols-2', 'gap-2');
  });

  it('should make widget items draggable', () => {
    render(<WidgetLibrary />);

    Object.keys(WIDGET_DEFINITIONS).forEach(widgetType => {
      const definition = WIDGET_DEFINITIONS[widgetType as keyof typeof WIDGET_DEFINITIONS];
      const widgetElement = screen.getByText(definition.name).closest('div');
      expect(widgetElement).toHaveAttribute('draggable', 'true');
    });
  });

  it('should show proper cursor styles', () => {
    render(<WidgetLibrary />);

    Object.keys(WIDGET_DEFINITIONS).forEach(widgetType => {
      const definition = WIDGET_DEFINITIONS[widgetType as keyof typeof WIDGET_DEFINITIONS];
      const widgetElement = screen.getByText(definition.name).closest('div');
      expect(widgetElement).toHaveClass('cursor-grab');
    });
  });

  it('should have hover effects', () => {
    render(<WidgetLibrary />);

    Object.keys(WIDGET_DEFINITIONS).forEach(widgetType => {
      const definition = WIDGET_DEFINITIONS[widgetType as keyof typeof WIDGET_DEFINITIONS];
      const widgetElement = screen.getByText(definition.name).closest('div');
      expect(widgetElement).toHaveClass('hover:bg-gray-600');
    });
  });

  it('should display widget icons and names correctly', () => {
    render(<WidgetLibrary />);

    Object.entries(WIDGET_DEFINITIONS).forEach(([type, definition]) => {
      const iconElement = screen.getByText(definition.icon);
      const nameElement = screen.getByText(definition.name);
      
      expect(iconElement).toBeInTheDocument();
      expect(nameElement).toBeInTheDocument();
      
      // Check that they are in the same widget item
      const widgetItem = iconElement.closest('.p-3');
      expect(widgetItem).toContain(nameElement);
    });
  });

  describe('individual widget types', () => {
    const testWidgetAddition = (widgetName: string, widgetType: string) => {
      render(<WidgetLibrary />);
      
      const widget = screen.getByText(widgetName);
      fireEvent.click(widget);
      
      expect(mockAddWidget).toHaveBeenCalled();
      
      const addedWidget = mockAddWidget.mock.calls[0][0];
      expect(addedWidget.type).toBe(widgetType);
      expect(addedWidget.title).toBe(widgetName);
      expect(addedWidget.size).toEqual(WIDGET_DEFINITIONS[widgetType as keyof typeof WIDGET_DEFINITIONS].defaultSize);
    };

    it('should add text widgets correctly', () => {
      testWidgetAddition('Text', 'text');
    });

    it('should add line chart widgets correctly', () => {
      testWidgetAddition('Line Chart', 'line_chart');
    });

    it('should add bar chart widgets correctly', () => {
      testWidgetAddition('Bar Chart', 'bar_chart');
    });

    it('should add table widgets correctly', () => {
      testWidgetAddition('Table', 'table');
    });

    it('should add progress bar widgets correctly', () => {
      testWidgetAddition('Progress Bar', 'progress_bar');
    });

    it('should add sparkline widgets correctly', () => {
      testWidgetAddition('Sparkline', 'sparkline');
    });

    it('should add gauge widgets correctly', () => {
      testWidgetAddition('Gauge', 'gauge');
    });

    it('should add log viewer widgets correctly', () => {
      testWidgetAddition('Log Viewer', 'log_viewer');
    });

    it('should add metric card widgets correctly', () => {
      testWidgetAddition('Metric Card', 'metric_card');
    });
  });

  it('should generate unique IDs for widgets added via click', () => {
    render(<WidgetLibrary />);

    const textWidget = screen.getByText('Text');
    
    // Add multiple widgets
    fireEvent.click(textWidget);
    fireEvent.click(textWidget);
    fireEvent.click(textWidget);

    expect(mockAddWidget).toHaveBeenCalledTimes(3);

    const addedWidgetIds = mockAddWidget.mock.calls.map(call => call[0].id);
    
    // All IDs should be unique
    const uniqueIds = new Set(addedWidgetIds);
    expect(uniqueIds.size).toBe(3);
    
    // All IDs should follow the pattern widget_<timestamp>
    addedWidgetIds.forEach(id => {
      expect(id).toMatch(/^widget_\d+$/);
    });
  });

  it('should handle rapid consecutive clicks', () => {
    render(<WidgetLibrary />);

    const textWidget = screen.getByText('Text');
    
    // Simulate rapid clicks
    for (let i = 0; i < 5; i++) {
      fireEvent.click(textWidget);
    }

    expect(mockAddWidget).toHaveBeenCalledTimes(5);
  });

  it('should maintain widget library state during interactions', () => {
    const { rerender } = render(<WidgetLibrary />);

    // Verify initial state
    expect(screen.getByText('Widget Library')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();

    // Interact with a widget
    const textWidget = screen.getByText('Text');
    fireEvent.click(textWidget);

    // Rerender and verify state is maintained
    rerender(<WidgetLibrary />);
    expect(screen.getByText('Widget Library')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });
});