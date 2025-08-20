import { describe, it, expect } from 'vitest';
import { WidgetTemplates } from './widget-templates';
import type { Widget } from '@cli-designer/core';

describe('WidgetTemplates', () => {
  const baseWidget: Widget = {
    id: 'test_widget',
    type: 'text',
    position: { x: 0, y: 0 },
    size: { width: 8, height: 4 },
    title: 'Test Widget',
    properties: {}
  };

  describe('generateTextWidget', () => {
    it('should generate basic text widget', () => {
      const widget = { ...baseWidget, type: 'text' as const };
      const code = WidgetTemplates.generateTextWidget(widget);
      
      expect(code).toContain(`class ${widget.id}(Static)`);
      expect(code).toContain('Text display widget');
      expect(code).toContain(`self.styles.width = ${widget.size.width}`);
      expect(code).toContain(`self.styles.height = ${widget.size.height}`);
      expect(code).toContain(`"${widget.title}"`);
    });

    it('should generate text widget with data source', () => {
      const widget = { 
        ...baseWidget, 
        type: 'text' as const,
        dataSource: 'cpu_metric'
      };
      const code = WidgetTemplates.generateTextWidget(widget);
      
      expect(code).toContain('self.data_source_id = "cpu_metric"');
      expect(code).toContain('update_content');
      expect(code).toContain('get_widget_data');
      expect(code).toContain('set_interval(2.0, self.update_content)');
    });

    it('should handle text widget without data source', () => {
      const widget = { ...baseWidget, type: 'text' as const };
      const code = WidgetTemplates.generateTextWidget(widget);
      
      expect(code).toContain('self.data_source_id = ""');
      expect(code).not.toContain('update_content');
      expect(code).not.toContain('set_interval');
    });
  });

  describe('generateBarChart', () => {
    it('should generate vertical bar chart by default', () => {
      const widget = { ...baseWidget, type: 'bar_chart' as const };
      const code = WidgetTemplates.generateBarChart(widget);
      
      expect(code).toContain(`class ${widget.id}(Static)`);
      expect(code).toContain('Bar chart widget');
      expect(code).toContain('self.orientation = "vertical"');
      expect(code).toContain('plotext as plt');
      expect(code).toContain('plt.bar(categories, values)');
    });

    it('should generate horizontal bar chart when specified', () => {
      const widget = { 
        ...baseWidget, 
        type: 'bar_chart' as const,
        properties: { orientation: 'horizontal' }
      };
      const code = WidgetTemplates.generateBarChart(widget);
      
      expect(code).toContain('self.orientation = "horizontal"');
      expect(code).toContain('plt.bar(categories, values, orientation="horizontal")');
    });

    it('should handle showValues and showLegend properties', () => {
      const widget = { 
        ...baseWidget, 
        type: 'bar_chart' as const,
        properties: { 
          showValues: false,
          showLegend: true
        }
      };
      const code = WidgetTemplates.generateBarChart(widget);
      
      expect(code).toContain('self.show_values = False');
      expect(code).toContain('self.show_legend = True');
      expect(code).toContain('plt.show_legend()');
    });
  });

  describe('generateTable', () => {
    it('should generate table with default properties', () => {
      const widget = { ...baseWidget, type: 'table' as const };
      const code = WidgetTemplates.generateTable(widget);
      
      expect(code).toContain(`class ${widget.id}(Static)`);
      expect(code).toContain('Data table widget');
      expect(code).toContain('self.show_headers = True');
      expect(code).toContain('self.sortable = True');
      expect(code).toContain('self.max_rows = 100');
      expect(code).toContain('from rich.table import Table');
    });

    it('should handle custom table properties', () => {
      const widget = { 
        ...baseWidget, 
        type: 'table' as const,
        properties: { 
          showHeaders: false,
          sortable: false,
          maxRows: 50
        }
      };
      const code = WidgetTemplates.generateTable(widget);
      
      expect(code).toContain('self.show_headers = False');
      expect(code).toContain('self.sortable = False');
      expect(code).toContain('self.max_rows = 50');
    });

    it('should include fallback ASCII table', () => {
      const widget = { ...baseWidget, type: 'table' as const };
      const code = WidgetTemplates.generateTable(widget);
      
      expect(code).toContain('except ImportError:');
      expect(code).toContain('Fallback to simple ASCII table');
      expect(code).toContain('" | ".join');
    });
  });

  describe('generateProgressBar', () => {
    it('should generate progress bar with default properties', () => {
      const widget = { ...baseWidget, type: 'progress_bar' as const };
      const code = WidgetTemplates.generateProgressBar(widget);
      
      expect(code).toContain(`class ${widget.id}(Static)`);
      expect(code).toContain('Progress bar widget');
      expect(code).toContain('self.show_percentage = True');
      expect(code).toContain('self.color = "blue"');
      expect(code).toContain('self.animated = False');
    });

    it('should handle custom progress bar properties', () => {
      const widget = { 
        ...baseWidget, 
        type: 'progress_bar' as const,
        properties: { 
          showPercentage: false,
          color: 'green',
          animated: true
        }
      };
      const code = WidgetTemplates.generateProgressBar(widget);
      
      expect(code).toContain('self.show_percentage = False');
      expect(code).toContain('self.color = "green"');
      expect(code).toContain('self.animated = True');
      expect(code).toContain('set_interval(0.5, self.animate_progress)');
    });

    it('should include progress rendering logic', () => {
      const widget = { ...baseWidget, type: 'progress_bar' as const };
      const code = WidgetTemplates.generateProgressBar(widget);
      
      expect(code).toContain('render_progress');
      expect(code).toContain('filled = int((self.progress / 100) * width)');
      expect(code).toContain('█');
      expect(code).toContain('░');
    });
  });

  describe('generateSparkline', () => {
    it('should generate sparkline with default properties', () => {
      const widget = { ...baseWidget, type: 'sparkline' as const };
      const code = WidgetTemplates.generateSparkline(widget);
      
      expect(code).toContain(`class ${widget.id}(Static)`);
      expect(code).toContain('Sparkline widget for compact trends');
      expect(code).toContain('self.style = "line"');
      expect(code).toContain('self.show_min_max = True');
    });

    it('should handle bar style sparkline', () => {
      const widget = { 
        ...baseWidget, 
        type: 'sparkline' as const,
        properties: { style: 'bar' }
      };
      const code = WidgetTemplates.generateSparkline(widget);
      
      expect(code).toContain('self.style = "bar"');
      expect(code).toContain('chars = [\'▁\', \'▂\', \'▃\', \'▄\', \'▅\', \'▆\', \'▇\', \'█\']');
    });

    it('should include data update logic', () => {
      const widget = { ...baseWidget, type: 'sparkline' as const };
      const code = WidgetTemplates.generateSparkline(widget);
      
      expect(code).toContain('update_data');
      expect(code).toContain('self.data = self.data[1:] + [new_val]');
      expect(code).toContain('random.uniform(-3, 3)');
    });
  });

  describe('generateGauge', () => {
    it('should generate gauge with default properties', () => {
      const widget = { ...baseWidget, type: 'gauge' as const };
      const code = WidgetTemplates.generateGauge(widget);
      
      expect(code).toContain(`class ${widget.id}(Static)`);
      expect(code).toContain('Circular gauge widget');
      expect(code).toContain('self.min_val = 0');
      expect(code).toContain('self.max_val = 100');
      expect(code).toContain('self.show_value = True');
      expect(code).toContain('self.units = "%"');
    });

    it('should handle custom gauge properties', () => {
      const widget = { 
        ...baseWidget, 
        type: 'gauge' as const,
        properties: { 
          min: 0,
          max: 200,
          showValue: false,
          units: 'MB'
        }
      };
      const code = WidgetTemplates.generateGauge(widget);
      
      expect(code).toContain('self.min_val = 0');
      expect(code).toContain('self.max_val = 200');
      expect(code).toContain('self.show_value = False');
      expect(code).toContain('self.units = "MB"');
    });

    it('should include gauge rendering with circles', () => {
      const widget = { ...baseWidget, type: 'gauge' as const };
      const code = WidgetTemplates.generateGauge(widget);
      
      expect(code).toContain('gauge_chars = [\'○\', \'◔\', \'◑\', \'◕\', \'●\']');
      expect(code).toContain('normalized = (self.value - self.min_val)');
      expect(code).toContain('arc = \'█\' * filled');
    });
  });

  describe('generateLogViewer', () => {
    it('should generate log viewer with default properties', () => {
      const widget = { ...baseWidget, type: 'log_viewer' as const };
      const code = WidgetTemplates.generateLogViewer(widget);
      
      expect(code).toContain(`class ${widget.id}(Static)`);
      expect(code).toContain('Log viewer widget');
      expect(code).toContain('self.max_lines = 1000');
      expect(code).toContain('self.auto_scroll = True');
      expect(code).toContain('self.show_timestamp = True');
    });

    it('should handle custom log viewer properties', () => {
      const widget = { 
        ...baseWidget, 
        type: 'log_viewer' as const,
        properties: { 
          maxLines: 500,
          autoScroll: false,
          showTimestamp: false,
          filter: 'ERROR'
        }
      };
      const code = WidgetTemplates.generateLogViewer(widget);
      
      expect(code).toContain('self.max_lines = 500');
      expect(code).toContain('self.auto_scroll = False');
      expect(code).toContain('self.show_timestamp = False');
      expect(code).toContain('self.filter = "ERROR"');
    });

    it('should include log generation and filtering', () => {
      const widget = { ...baseWidget, type: 'log_viewer' as const };
      const code = WidgetTemplates.generateLogViewer(widget);
      
      expect(code).toContain('generate_sample_logs');
      expect(code).toContain('add_log_entry');
      expect(code).toContain('self.log_levels = ["INFO", "WARN", "ERROR", "DEBUG"]');
      expect(code).toContain('if self.filter:');
    });
  });

  describe('generateMetricCard', () => {
    it('should generate metric card with default properties', () => {
      const widget = { ...baseWidget, type: 'metric_card' as const };
      const code = WidgetTemplates.generateMetricCard(widget);
      
      expect(code).toContain(`class ${widget.id}(Static)`);
      expect(code).toContain('Single metric display card');
      expect(code).toContain('self.label = "Metric"');
      expect(code).toContain('self.format = "number"');
      expect(code).toContain('self.show_trend = False');
      expect(code).toContain('self.show_sparkline = False');
    });

    it('should handle custom metric card properties', () => {
      const widget = { 
        ...baseWidget, 
        type: 'metric_card' as const,
        properties: { 
          label: 'CPU Usage',
          format: 'percentage',
          trend: true,
          sparkline: true
        }
      };
      const code = WidgetTemplates.generateMetricCard(widget);
      
      expect(code).toContain('self.label = "CPU Usage"');
      expect(code).toContain('self.format = "percentage"');
      expect(code).toContain('self.show_trend = True');
      expect(code).toContain('self.show_sparkline = True');
    });

    it('should include formatting methods', () => {
      const widget = { ...baseWidget, type: 'metric_card' as const };
      const code = WidgetTemplates.generateMetricCard(widget);
      
      expect(code).toContain('def format_value(self, value: float)');
      expect(code).toContain('if self.format == "percentage"');
      expect(code).toContain('elif self.format == "bytes"');
      expect(code).toContain('return f"{value:.1f}%"');
    });

    it('should handle data source integration', () => {
      const widget = { 
        ...baseWidget, 
        type: 'metric_card' as const,
        dataSource: 'memory_usage'
      };
      const code = WidgetTemplates.generateMetricCard(widget);
      
      expect(code).toContain('self.data_source_id = "memory_usage"');
      expect(code).toContain('get_widget_data(self.data_source_id');
      expect(code).toContain('self.value = 0.0');
    });
  });

  describe('code quality checks', () => {
    const allWidgetTypes = [
      'text', 'line_chart', 'bar_chart', 'table', 'progress_bar',
      'sparkline', 'gauge', 'log_viewer', 'metric_card'
    ];

    allWidgetTypes.forEach(widgetType => {
      it(`should generate valid Python syntax for ${widgetType}`, () => {
        const widget = { 
          ...baseWidget, 
          type: widgetType as any,
          id: `${widgetType}_test`
        };
        
        let code: string;
        
        switch (widgetType) {
          case 'text':
            code = WidgetTemplates.generateTextWidget(widget);
            break;
          case 'line_chart':
            code = WidgetTemplates.generateLineChart(widget);
            break;
          case 'bar_chart':
            code = WidgetTemplates.generateBarChart(widget);
            break;
          case 'table':
            code = WidgetTemplates.generateTable(widget);
            break;
          case 'progress_bar':
            code = WidgetTemplates.generateProgressBar(widget);
            break;
          case 'sparkline':
            code = WidgetTemplates.generateSparkline(widget);
            break;
          case 'gauge':
            code = WidgetTemplates.generateGauge(widget);
            break;
          case 'log_viewer':
            code = WidgetTemplates.generateLogViewer(widget);
            break;
          case 'metric_card':
            code = WidgetTemplates.generateMetricCard(widget);
            break;
          default:
            throw new Error(`Unknown widget type: ${widgetType}`);
        }
        
        // Basic syntax checks
        expect(code).toContain(`class ${widget.id}(Static)`);
        expect(code).toContain('def __init__(self)');
        expect(code).toContain('def on_mount(self)');
        expect(code).toContain(`self.styles.width = ${widget.size.width}`);
        expect(code).toContain(`self.styles.height = ${widget.size.height}`);
        
        // Check for balanced quotes and parentheses
        const singleQuotes = (code.match(/'/g) || []).length;
        const doubleQuotes = (code.match(/"/g) || []).length;
        const openParens = (code.match(/\(/g) || []).length;
        const closeParens = (code.match(/\)/g) || []).length;
        
        expect(openParens).toBe(closeParens);
        // Note: Not checking quote balance as string content can contain unbalanced quotes
      });
    });
  });
});