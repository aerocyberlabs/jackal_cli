import { describe, it, expect, beforeEach } from 'vitest';
import { BlessedAdapter } from './index';
import type { DashboardDesign, CodeGenOptions } from '@cli-designer/core';

describe('BlessedAdapter', () => {
  let adapter: BlessedAdapter;

  beforeEach(() => {
    adapter = new BlessedAdapter();
  });

  describe('constructor', () => {
    it('should initialize with correct framework name', () => {
      expect(adapter['frameworkName']).toBe('blessed');
    });
  });

  describe('getDependencies', () => {
    it('should return required npm packages', () => {
      const deps = adapter.getDependencies();
      
      expect(deps).toContain('blessed@^0.1.81');
      expect(deps).toContain('blessed-contrib@^4.11.0');
      expect(deps).toContain('systeminformation@^5.21.15');
      expect(deps).toContain('axios@^1.6.0');
    });
  });

  describe('validateDesign', () => {
    it('should return no errors for valid design', () => {
      const validDesign: DashboardDesign = {
        metadata: {
          name: 'Test Dashboard',
          targetFramework: 'blessed'
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
          targetFramework: 'blessed'
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
            targetFramework: 'blessed'
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
        targetFramework: 'blessed'
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
      it('should generate single JavaScript file with all components', () => {
        const options: CodeGenOptions = {
          outputFormat: 'single',
          includeComments: true
        };

        const result = adapter.generate(sampleDesign, options);

        expect(result.framework).toBe('blessed');
        expect(result.files).toHaveLength(2); // dashboard.js + package.json
        
        const mainFile = result.files.find(f => f.filename === 'dashboard.js');
        expect(mainFile).toBeDefined();
        expect(mainFile?.executable).toBe(true);
        expect(mainFile?.language).toBe('javascript');
        expect(mainFile?.content).toContain("const blessed = require('blessed')");
        expect(mainFile?.content).toContain('class Dashboard');
        expect(mainFile?.content).toContain('class Text_widgetWidget');
        expect(mainFile?.content).toContain('class Chart_widgetWidget');
        expect(mainFile?.content).toContain('SystemMetricsCollector');

        const packageFile = result.files.find(f => f.filename === 'package.json');
        expect(packageFile).toBeDefined();
        expect(packageFile?.content).toContain('"blessed"');
      });
    });

    describe('modular output', () => {
      it('should generate multiple JavaScript files', () => {
        const options: CodeGenOptions = {
          outputFormat: 'modular',
          includeComments: true
        };

        const result = adapter.generate(sampleDesign, options);

        expect(result.framework).toBe('blessed');
        expect(result.files.length).toBeGreaterThanOrEqual(4);
        
        const appFile = result.files.find(f => f.filename === 'app.js');
        const widgetsFile = result.files.find(f => f.filename === 'widgets.js');
        const dataSourcesFile = result.files.find(f => f.filename === 'datasources.js');
        const packageFile = result.files.find(f => f.filename === 'package.json');

        expect(appFile).toBeDefined();
        expect(widgetsFile).toBeDefined();
        expect(dataSourcesFile).toBeDefined();
        expect(packageFile).toBeDefined();

        expect(appFile?.content).toContain('class Dashboard');
        expect(widgetsFile?.content).toContain('class Text_widgetWidget');
        expect(dataSourcesFile?.content).toContain('SystemMetricsCollector');
      });
    });

    it('should include system requirements and instructions', () => {
      const options: CodeGenOptions = {
        outputFormat: 'single',
        includeComments: true
      };

      const result = adapter.generate(sampleDesign, options);

      expect(result.dependencies.systemRequirements).toContain('Node.js 18+');
      expect(result.dependencies.systemRequirements).toContain('npm');
      expect(result.dependencies.packages).toEqual(adapter.getDependencies());
      expect(result.instructions).toContain('npm install');
      expect(result.instructions).toContain('npm start');
    });

    it('should handle empty design', () => {
      const emptyDesign: DashboardDesign = {
        metadata: {
          name: 'Empty Dashboard',
          targetFramework: 'blessed'
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
      
      expect(result.files).toHaveLength(2); // dashboard.js + package.json
      const mainFile = result.files.find(f => f.filename === 'dashboard.js');
      expect(mainFile?.content).toContain('class Dashboard');
      expect(mainFile?.content).not.toContain('startDataCollection');
    });

    it('should generate JavaScript code with proper syntax', () => {
      const options: CodeGenOptions = {
        outputFormat: 'single',
        includeComments: true
      };

      const result = adapter.generate(sampleDesign, options);
      const mainFile = result.files.find(f => f.filename === 'dashboard.js');
      
      expect(mainFile?.content).toContain("const blessed = require('blessed')");
      expect(mainFile?.content).toContain('class Dashboard {');
      expect(mainFile?.content).toContain('constructor() {');
      expect(mainFile?.content).toContain('this.screen = blessed.screen');
      expect(mainFile?.content).not.toContain('undefined');
      expect(mainFile?.content).not.toContain('null');
    });
  });

  describe('Node.js-specific features', () => {
    it('should generate proper require statements', () => {
      const design: DashboardDesign = {
        metadata: { name: 'Test', targetFramework: 'blessed' },
        settings: { dimensions: { width: 40, height: 20 }, gridSize: 4 },
        widgets: [],
        dataSources: [
          {
            id: 'cpu',
            name: 'CPU',
            config: { type: 'system_metric', metric: 'cpu_percent', interval: 1000 }
          }
        ]
      };

      const result = adapter.generate(design, { outputFormat: 'single' });
      const mainFile = result.files.find(f => f.filename === 'dashboard.js');
      
      expect(mainFile?.content).toContain("const blessed = require('blessed')");
      expect(mainFile?.content).toContain("const contrib = require('blessed-contrib')");
      expect(mainFile?.content).toContain("const si = require('systeminformation')");
    });

    it('should generate proper class definitions', () => {
      const design: DashboardDesign = {
        metadata: { name: 'Test', targetFramework: 'blessed' },
        settings: { dimensions: { width: 40, height: 20 }, gridSize: 4 },
        widgets: [
          {
            id: 'progress1',
            type: 'progress_bar',
            position: { x: 0, y: 0 },
            size: { width: 8, height: 4 },
            title: 'Progress',
            properties: { animated: true }
          }
        ],
        dataSources: []
      };

      const result = adapter.generate(design, { outputFormat: 'single' });
      const mainFile = result.files.find(f => f.filename === 'dashboard.js');
      
      expect(mainFile?.content).toContain('class Dashboard {');
      expect(mainFile?.content).toContain('class Progress1Widget {');
      expect(mainFile?.content).toContain('constructor(options = {}) {');
    });

    it('should generate proper event handling', () => {
      const design: DashboardDesign = {
        metadata: { name: 'Test', targetFramework: 'blessed' },
        settings: { dimensions: { width: 40, height: 20 }, gridSize: 4 },
        widgets: [
          {
            id: 'text1',
            type: 'text',
            position: { x: 0, y: 0 },
            size: { width: 8, height: 4 },
            title: 'Text',
            properties: {}
          }
        ],
        dataSources: []
      };

      const result = adapter.generate(design, { outputFormat: 'single' });
      const mainFile = result.files.find(f => f.filename === 'dashboard.js');
      
      expect(mainFile?.content).toContain('setupEventHandlers() {');
      expect(mainFile?.content).toContain("this.screen.key(['escape', 'q', 'C-c']");
      expect(mainFile?.content).toContain("this.screen.on('resize'");
    });

    it('should handle async operations correctly', () => {
      const design: DashboardDesign = {
        metadata: { name: 'Test', targetFramework: 'blessed' },
        settings: { dimensions: { width: 40, height: 20 }, gridSize: 4 },
        widgets: [],
        dataSources: [
          {
            id: 'api_source',
            name: 'API Data',
            config: { type: 'api', url: 'http://api.example.com/data', interval: 5000 }
          }
        ]
      };

      const result = adapter.generate(design, { outputFormat: 'single' });
      const mainFile = result.files.find(f => f.filename === 'dashboard.js');
      
      expect(mainFile?.content).toContain('async updateDataSource');
      expect(mainFile?.content).toContain('await this.dataUpdater');
    });
  });

  describe('widget positioning', () => {
    it('should generate correct percentage-based positioning', () => {
      const design: DashboardDesign = {
        metadata: { name: 'Test', targetFramework: 'blessed' },
        settings: { dimensions: { width: 40, height: 20 }, gridSize: 4 },
        widgets: [
          {
            id: 'widget1',
            type: 'text',
            position: { x: 8, y: 4 }, // 20% left, 20% top
            size: { width: 12, height: 6 }, // 30% width, 30% height
            title: 'Positioned Widget',
            properties: {}
          }
        ],
        dataSources: []
      };

      const result = adapter.generate(design, { outputFormat: 'single' });
      const mainFile = result.files.find(f => f.filename === 'dashboard.js');
      
      expect(mainFile?.content).toContain("left: '20.0%'");
      expect(mainFile?.content).toContain("top: '20.0%'");
      expect(mainFile?.content).toContain("width: '30.0%'");
      expect(mainFile?.content).toContain("height: '30.0%'");
    });
  });
});