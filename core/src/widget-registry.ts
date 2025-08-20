export const WIDGET_DEFINITIONS = {
  text: {
    type: 'text',
    name: 'Text',
    icon: '[T]',
    description: 'Static or dynamic text display',
    defaultSize: { width: 20, height: 5 },
    minSize: { width: 10, height: 3 },
    properties: {
      content: { type: 'string', default: 'Text content' },
      align: { type: 'select', options: ['left', 'center', 'right'], default: 'left' },
      wrap: { type: 'boolean', default: true }
    }
  },
  line_chart: {
    type: 'line_chart',
    name: 'Line Chart',
    icon: '[/]',
    description: 'Line graph for time-series data',
    defaultSize: { width: 40, height: 15 },
    minSize: { width: 20, height: 10 },
    properties: {
      xLabel: { type: 'string', default: 'Time' },
      yLabel: { type: 'string', default: 'Value' },
      showGrid: { type: 'boolean', default: true },
      showLegend: { type: 'boolean', default: true }
    }
  },
  bar_chart: {
    type: 'bar_chart',
    name: 'Bar Chart',
    icon: '[|]',
    description: 'Horizontal or vertical bar charts',
    defaultSize: { width: 40, height: 15 },
    minSize: { width: 20, height: 10 },    properties: {
      orientation: { type: 'select', options: ['vertical', 'horizontal'], default: 'vertical' },
      showValues: { type: 'boolean', default: true },
      showLegend: { type: 'boolean', default: true }
    }
  },
  table: {
    type: 'table',
    name: 'Table',
    icon: '[#]',
    description: 'Data tables with sorting/filtering',
    defaultSize: { width: 40, height: 20 },
    minSize: { width: 20, height: 10 },
    properties: {
      showHeaders: { type: 'boolean', default: true },
      sortable: { type: 'boolean', default: true },
      filterable: { type: 'boolean', default: false },
      maxRows: { type: 'number', default: 100 }
    }
  },
  progress_bar: {
    type: 'progress_bar',
    name: 'Progress Bar',
    icon: '[=]',
    description: 'Progress indicators',
    defaultSize: { width: 30, height: 3 },
    minSize: { width: 15, height: 3 },
    properties: {
      showPercentage: { type: 'boolean', default: true },
      color: { type: 'select', options: ['blue', 'green', 'yellow', 'red'], default: 'blue' },
      animated: { type: 'boolean', default: false }
    }
  },
  sparkline: {
    type: 'sparkline',
    name: 'Sparkline',
    icon: '[.]',
    description: 'Compact trend indicators',
    defaultSize: { width: 20, height: 5 },
    minSize: { width: 10, height: 3 },
    properties: {
      style: { type: 'select', options: ['line', 'bar'], default: 'line' },
      showMinMax: { type: 'boolean', default: true }
    }
  },
  gauge: {
    type: 'gauge',
    name: 'Gauge',
    icon: '[O]',
    description: 'Circular progress indicators',
    defaultSize: { width: 15, height: 10 },
    minSize: { width: 10, height: 8 },
    properties: {
      min: { type: 'number', default: 0 },
      max: { type: 'number', default: 100 },
      showValue: { type: 'boolean', default: true },
      units: { type: 'string', default: '%' }
    }
  },
  log_viewer: {
    type: 'log_viewer',
    name: 'Log Viewer',
    icon: '[L]',
    description: 'Scrollable log display',
    defaultSize: { width: 50, height: 20 },
    minSize: { width: 30, height: 10 },
    properties: {
      maxLines: { type: 'number', default: 1000 },
      autoScroll: { type: 'boolean', default: true },
      showTimestamp: { type: 'boolean', default: true },
      filter: { type: 'string', default: '' }
    }
  },
  metric_card: {
    type: 'metric_card',
    name: 'Metric Card',
    icon: '[M]',
    description: 'Single metric display',
    defaultSize: { width: 15, height: 8 },
    minSize: { width: 10, height: 6 },
    properties: {
      label: { type: 'string', default: 'Metric' },
      format: { type: 'select', options: ['number', 'percentage', 'bytes'], default: 'number' },
      trend: { type: 'boolean', default: false },
      sparkline: { type: 'boolean', default: false }
    }
  }
} as const;

export type WidgetType = keyof typeof WIDGET_DEFINITIONS;

export class WidgetRegistry {
  static getWidget(type: WidgetType) {
    return WIDGET_DEFINITIONS[type];
  }

  static getAllWidgets() {
    return Object.values(WIDGET_DEFINITIONS);
  }

  static getDefaultProperties(type: WidgetType) {
    const widget = this.getWidget(type);
    const properties: Record<string, any> = {};
    
    for (const [key, prop] of Object.entries(widget.properties)) {
      properties[key] = prop.default;
    }
    
    return properties;
  }
}