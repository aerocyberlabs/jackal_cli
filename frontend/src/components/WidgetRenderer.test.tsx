import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WidgetRenderer } from './WidgetRenderer';
import { useDesignerStore } from '../store/designer';
import type { Widget } from '@cli-designer/core';

// Mock the designer store
vi.mock('../store/designer', () => ({
  useDesignerStore: vi.fn()
}));

describe('WidgetRenderer', () => {
  const mockSelectWidget = vi.fn();
  const mockWidget: Widget = {
    id: 'test-widget',
    type: 'text',
    position: { x: 0, y: 0 },
    size: { width: 8, height: 4 },
    title: 'Test Widget',
    properties: {}
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useDesignerStore as any).mockReturnValue({
      selectWidget: mockSelectWidget
    });
  });

  it('should render widget with correct position and size', () => {
    render(
      <WidgetRenderer
        widget={mockWidget}
        isSelected={false}
        canvasWidth={40}
        canvasHeight={20}
      />
    );

    const widgetElement = screen.getByText('Test Widget');
    expect(widgetElement).toBeInTheDocument();
    
    const widgetContainer = widgetElement.closest('.absolute');
    expect(widgetContainer).toHaveClass('absolute');
  });

  it('should show selected state when isSelected is true', () => {
    render(
      <WidgetRenderer
        widget={mockWidget}
        isSelected={true}
        canvasWidth={40}
        canvasHeight={20}
      />
    );

    const widgetContainer = screen.getByText('Test Widget').closest('.absolute');
    expect(widgetContainer).toHaveClass('ring-2', 'ring-blue-500');
  });

  it('should not show selected state when isSelected is false', () => {
    render(
      <WidgetRenderer
        widget={mockWidget}
        isSelected={false}
        canvasWidth={40}
        canvasHeight={20}
      />
    );

    const widgetContainer = screen.getByText('Test Widget').closest('.absolute');
    expect(widgetContainer).not.toHaveClass('ring-2', 'ring-blue-500');
  });

  it('should call selectWidget when clicked', () => {
    render(
      <WidgetRenderer
        widget={mockWidget}
        isSelected={false}
        canvasWidth={40}
        canvasHeight={20}
      />
    );

    const widgetElement = screen.getByText('Test Widget');
    fireEvent.click(widgetElement);

    expect(mockSelectWidget).toHaveBeenCalledWith('test-widget');
  });

  it('should render different widget types with appropriate content', () => {
    const textWidget = { ...mockWidget, type: 'text' as const };
    const { rerender } = render(
      <WidgetRenderer
        widget={textWidget}
        isSelected={false}
        canvasWidth={40}
        canvasHeight={20}
      />
    );

    expect(screen.getByText('Test Widget')).toBeInTheDocument();
    expect(screen.getByText('[T]')).toBeInTheDocument();

    const chartWidget = { ...mockWidget, type: 'bar_chart' as const };
    rerender(
      <WidgetRenderer
        widget={chartWidget}
        isSelected={false}
        canvasWidth={40}
        canvasHeight={20}
      />
    );

    expect(screen.getByText('[BC]')).toBeInTheDocument();
  });

  it('should calculate correct position percentages', () => {
    const widget = {
      ...mockWidget,
      position: { x: 8, y: 4 },
      size: { width: 12, height: 6 }
    };

    render(
      <WidgetRenderer
        widget={widget}
        isSelected={false}
        canvasWidth={40}
        canvasHeight={20}
      />
    );

    const widgetContainer = screen.getByText('Test Widget').closest('.absolute');
    
    // Position should be 8/40 = 20% left, 4/20 = 20% top
    // Size should be 12/40 = 30% width, 6/20 = 30% height
    expect(widgetContainer).toHaveStyle({
      left: '20%',
      top: '20%',
      width: '30%',
      height: '30%'
    });
  });

  it('should handle edge positions correctly', () => {
    const edgeWidget = {
      ...mockWidget,
      position: { x: 0, y: 0 },
      size: { width: 4, height: 4 }
    };

    render(
      <WidgetRenderer
        widget={edgeWidget}
        isSelected={false}
        canvasWidth={40}
        canvasHeight={20}
      />
    );

    const widgetContainer = screen.getByText('Test Widget').closest('.absolute');
    expect(widgetContainer).toHaveStyle({
      left: '0%',
      top: '0%',
      width: '10%',
      height: '20%'
    });
  });

  it('should handle widgets at maximum position', () => {
    const maxPositionWidget = {
      ...mockWidget,
      position: { x: 36, y: 16 },
      size: { width: 4, height: 4 }
    };

    render(
      <WidgetRenderer
        widget={maxPositionWidget}
        isSelected={false}
        canvasWidth={40}
        canvasHeight={20}
      />
    );

    const widgetContainer = screen.getByText('Test Widget').closest('.absolute');
    expect(widgetContainer).toHaveStyle({
      left: '90%',
      top: '80%',
      width: '10%',
      height: '20%'
    });
  });

  it('should render widget content based on type and properties', () => {
    const metricWidget: Widget = {
      id: 'metric-widget',
      type: 'metric_card',
      position: { x: 0, y: 0 },
      size: { width: 8, height: 4 },
      title: 'CPU Usage',
      properties: {
        label: 'CPU',
        format: 'percentage'
      }
    };

    render(
      <WidgetRenderer
        widget={metricWidget}
        isSelected={false}
        canvasWidth={40}
        canvasHeight={20}
      />
    );

    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
    expect(screen.getByText('[MC]')).toBeInTheDocument(); // Metric Card icon
  });

  it('should handle widgets with data sources', () => {
    const widgetWithDataSource: Widget = {
      id: 'data-widget',
      type: 'gauge',
      position: { x: 0, y: 0 },
      size: { width: 8, height: 8 },
      title: 'Memory Usage',
      dataSource: 'memory_metric',
      properties: {
        min: 0,
        max: 100,
        units: '%'
      }
    };

    render(
      <WidgetRenderer
        widget={widgetWithDataSource}
        isSelected={false}
        canvasWidth={40}
        canvasHeight={20}
      />
    );

    expect(screen.getByText('Memory Usage')).toBeInTheDocument();
    expect(screen.getByText('[G]')).toBeInTheDocument(); // Gauge icon
  });

  it('should show hover effects', () => {
    render(
      <WidgetRenderer
        widget={mockWidget}
        isSelected={false}
        canvasWidth={40}
        canvasHeight={20}
      />
    );

    const widgetContainer = screen.getByText('Test Widget').closest('.absolute');
    
    fireEvent.mouseEnter(widgetContainer!);
    expect(widgetContainer).toHaveClass('hover:ring-1', 'hover:ring-gray-400');
  });

  it('should handle click events without propagation', () => {
    const parentClickHandler = vi.fn();
    
    render(
      <div onClick={parentClickHandler}>
        <WidgetRenderer
          widget={mockWidget}
          isSelected={false}
          canvasWidth={40}
          canvasHeight={20}
        />
      </div>
    );

    const widgetElement = screen.getByText('Test Widget');
    fireEvent.click(widgetElement);

    expect(mockSelectWidget).toHaveBeenCalledWith('test-widget');
    expect(parentClickHandler).not.toHaveBeenCalled();
  });

  describe('widget type rendering', () => {
    const widgetTypes = [
      { type: 'text', icon: '[T]' },
      { type: 'line_chart', icon: '[LC]' },
      { type: 'bar_chart', icon: '[BC]' },
      { type: 'table', icon: '[TB]' },
      { type: 'progress_bar', icon: '[PB]' },
      { type: 'sparkline', icon: '[SL]' },
      { type: 'gauge', icon: '[G]' },
      { type: 'log_viewer', icon: '[LV]' },
      { type: 'metric_card', icon: '[MC]' }
    ];

    widgetTypes.forEach(({ type, icon }) => {
      it(`should render ${type} widget with correct icon`, () => {
        const widget = { ...mockWidget, type: type as any };
        
        render(
          <WidgetRenderer
            widget={widget}
            isSelected={false}
            canvasWidth={40}
            canvasHeight={20}
          />
        );

        expect(screen.getByText(icon)).toBeInTheDocument();
      });
    });
  });

  it('should handle zero-sized canvas gracefully', () => {
    render(
      <WidgetRenderer
        widget={mockWidget}
        isSelected={false}
        canvasWidth={0}
        canvasHeight={0}
      />
    );

    // Should not crash and should render the widget
    expect(screen.getByText('Test Widget')).toBeInTheDocument();
  });

  it('should handle very small widgets', () => {
    const smallWidget = {
      ...mockWidget,
      size: { width: 1, height: 1 }
    };

    render(
      <WidgetRenderer
        widget={smallWidget}
        isSelected={false}
        canvasWidth={40}
        canvasHeight={20}
      />
    );

    const widgetContainer = screen.getByText('Test Widget').closest('.absolute');
    expect(widgetContainer).toHaveStyle({
      width: '2.5%',
      height: '5%'
    });
  });

  it('should handle very large widgets', () => {
    const largeWidget = {
      ...mockWidget,
      size: { width: 40, height: 20 }
    };

    render(
      <WidgetRenderer
        widget={largeWidget}
        isSelected={false}
        canvasWidth={40}
        canvasHeight={20}
      />
    );

    const widgetContainer = screen.getByText('Test Widget').closest('.absolute');
    expect(widgetContainer).toHaveStyle({
      width: '100%',
      height: '100%'
    });
  });
});