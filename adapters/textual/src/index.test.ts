import { describe, it, expect } from 'vitest';
import { TextualAdapter } from './index';
import type { DashboardDesign, CodeGenOptions } from '@cli-designer/core';

describe('TextualAdapter', () => {
  let adapter: TextualAdapter;

  beforeEach(() => {
    adapter = new TextualAdapter();
  });

  describe('constructor', () => {
    it('should initialize with correct framework name', () => {
      expect(adapter['frameworkName']).toBe('textual');
    });
  });

  describe('getDependencies', () => {
    it('should return required Python packages', () => {
      const deps = adapter.getDependencies();
      
      expect(deps).toContain('textual>=0.40.0');
      expect(deps).toContain('plotext>=5.2.8');
      expect(deps).toContain('psutil>=5.9.0');
      expect(deps).toContain('rich>=13.0.0');
      expect(deps).toContain('aiohttp>=3.8.0');
      expect(deps).toContain('aiofiles>=22.0.0');
    });
  });

  describe('validateDesign', () => {
    it('should return no errors for valid design', () => {
      const validDesign: DashboardDesign = {
        metadata: {
          name: 'Test Dashboard',
          targetFramework: 'textual'
        },
        settings: {
          dimensions: { width: 40, height: 20 },
          gridSize: 4
        },
        widgets: [
          {
            id: 'widget1',
            type: 'text',
            position: { x: 0, y: 0 },
            size: { width: 8, height: 4 },
            title: 'Test Widget',
            properties: {}
          }
        ],
        dataSources: []
      };

      const errors = adapter.validateDesign(validDesign);
      expect(errors).toEqual([]);
    });

    it('should return errors for unsupported widget types', () => {
      const invalidDesign: DashboardDesign = {
        metadata: {
          name: 'Test Dashboard',
          targetFramework: 'textual'
        },
        settings: {
          dimensions: { width: 40, height: 20 },
          gridSize: 4
        },
        widgets: [
          {
            id: 'widget1',
            type: 'unsupported_widget' as any,
            position: { x: 0, y: 0 },
            size: { width: 8, height: 4 },
            title: 'Test Widget',
            properties: {}
          }
        ],
        dataSources: []
      };

      const errors = adapter.validateDesign(invalidDesign);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('unsupported_widget');
      expect(errors[0]).toContain('not supported');
    });

    it('should validate all supported widget types', () => {
      const supportedTypes = [
        'text', 'line_chart', 'bar_chart', 'table', 'progress_bar',
        'sparkline', 'gauge', 'log_viewer', 'metric_card'
      ];

      supportedTypes.forEach(widgetType => {
        const design: DashboardDesign = {
          metadata: {
            name: 'Test Dashboard',
            targetFramework: 'textual'
          },
          settings: {
            dimensions: { width: 40, height: 20 },
            gridSize: 4
          },
          widgets: [
            {
              id: 'widget1',
              type: widgetType as any,
              position: { x: 0, y: 0 },
              size: { width: 8, height: 4 },
              title: 'Test Widget',
              properties: {}
            }
          ],
          dataSources: []
        };

        const errors = adapter.validateDesign(design);
        expect(errors).toEqual([]);
      });
    });
  });

  describe('generate', () => {
    const sampleDesign: DashboardDesign = {
      metadata: {
        name: 'Sample Dashboard',
        targetFramework: 'textual'
      },
      settings: {
        dimensions: { width: 40, height: 20 },
        gridSize: 4,
        theme: 'dark',
        refreshRate: 1000
      },
      widgets: [
        {
          id: 'text_widget',
          type: 'text',
          position: { x: 0, y: 0 },
          size: { width: 8, height: 4 },
          title: 'Welcome',
          properties: {
            content: 'Hello World'
          }
        },
        {
          id: 'chart_widget',
          type: 'bar_chart',
          position: { x: 8, y: 0 },
          size: { width: 12, height: 8 },
          title: 'Sample Chart',
          properties: {
            orientation: 'vertical'
          }
        }
      ],
      dataSources: [
        {
          id: 'cpu_metric',
          name: 'CPU Usage',
          config: {
            type: 'system_metric',
            metric: 'cpu_percent',
            interval: 1000
          }
        }
      ]
    };

    describe('single file output', () => {
      it('should generate single Python file with all components', () => {
        const options: CodeGenOptions = {
          outputFormat: 'single',
          includeComments: true
        };

        const result = adapter.generate(sampleDesign, options);

        expect(result.framework).toBe('textual');
        expect(result.files).toHaveLength(2); // dashboard.py + requirements.txt
        
        const mainFile = result.files.find(f => f.filename === 'dashboard.py');
        expect(mainFile).toBeDefined();
        expect(mainFile?.executable).toBe(true);
        expect(mainFile?.language).toBe('python');
        expect(mainFile?.content).toContain('class DashboardApp(App)');
        expect(mainFile?.content).toContain('class text_widget(Static)');
        expect(mainFile?.content).toContain('class chart_widget(Static)');
        expect(mainFile?.content).toContain('SystemMetricsCollector');

        const reqFile = result.files.find(f => f.filename === 'requirements.txt');
        expect(reqFile).toBeDefined();
        expect(reqFile?.content).toContain('textual>=');
        expect(reqFile?.content).toContain('psutil>=');
      });
    });

    describe('modular output', () => {
      it('should generate multiple Python files', () => {
        const options: CodeGenOptions = {
          outputFormat: 'modular',
          includeComments: true
        };

        const result = adapter.generate(sampleDesign, options);

        expect(result.framework).toBe('textual');
        expect(result.files.length).toBeGreaterThan(2);
        
        const appFile = result.files.find(f => f.filename === 'app.py');
        const widgetsFile = result.files.find(f => f.filename === 'widgets.py');
        const dataSourcesFile = result.files.find(f => f.filename === 'data_sources.py');
        const reqFile = result.files.find(f => f.filename === 'requirements.txt');

        expect(appFile).toBeDefined();
        expect(widgetsFile).toBeDefined();
        expect(dataSourcesFile).toBeDefined();
        expect(reqFile).toBeDefined();

        expect(appFile?.content).toContain('class DashboardApp(App)');
        expect(widgetsFile?.content).toContain('class text_widget(Static)');
        expect(dataSourcesFile?.content).toContain('SystemMetricsCollector');
      });
    });

    it('should include system requirements and instructions', () => {
      const options: CodeGenOptions = {
        outputFormat: 'single',
        includeComments: true
      };

      const result = adapter.generate(sampleDesign, options);

      expect(result.dependencies.systemRequirements).toContain('Python 3.8+');
      expect(result.dependencies.packages).toEqual(adapter.getDependencies());
      expect(result.instructions).toContain('python -m venv');
      expect(result.instructions).toContain('pip install -r requirements.txt');
      expect(result.instructions).toContain('python dashboard.py');
    });

    it('should handle empty design', () => {
      const emptyDesign: DashboardDesign = {
        metadata: {
          name: 'Empty Dashboard',
          targetFramework: 'textual'
        },
        settings: {
          dimensions: { width: 40, height: 20 },
          gridSize: 4
        },
        widgets: [],
        dataSources: []
      };

      const options: CodeGenOptions = {
        outputFormat: 'single',
        includeComments: true
      };

      const result = adapter.generate(emptyDesign, options);
      
      expect(result.files).toHaveLength(2); // dashboard.py + requirements.txt
      const mainFile = result.files.find(f => f.filename === 'dashboard.py');
      expect(mainFile?.content).toContain('class DashboardApp(App)');
      expect(mainFile?.content).not.toContain('update_data_sources');
    });
  });
});