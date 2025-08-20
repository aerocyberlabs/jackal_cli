import { describe, it, expect, beforeEach } from 'vitest';
import { BubbleTeaAdapter } from './index';
import type { DashboardDesign, CodeGenOptions } from '@cli-designer/core';

describe('BubbleTeaAdapter', () => {
  let adapter: BubbleTeaAdapter;

  beforeEach(() => {
    adapter = new BubbleTeaAdapter();
  });

  describe('constructor', () => {
    it('should initialize with correct framework name', () => {
      expect(adapter['frameworkName']).toBe('bubbletea');
    });
  });

  describe('getDependencies', () => {
    it('should return required Go packages', () => {
      const deps = adapter.getDependencies();
      
      expect(deps).toContain('github.com/charmbracelet/bubbletea@v0.24.2');
      expect(deps).toContain('github.com/charmbracelet/lipgloss@v0.9.1');
      expect(deps).toContain('github.com/charmbracelet/bubbles@v0.16.1');
      expect(deps).toContain('github.com/shirou/gopsutil/v3@v3.23.10');
    });
  });

  describe('validateDesign', () => {
    it('should return no errors for valid design', () => {
      const validDesign: DashboardDesign = {
        metadata: {
          name: 'Test Dashboard',
          targetFramework: 'bubbletea'
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
          targetFramework: 'bubbletea'
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
            targetFramework: 'bubbletea'
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
        targetFramework: 'bubbletea'
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
      it('should generate single Go file with all components', () => {
        const options: CodeGenOptions = {
          outputFormat: 'single',
          includeComments: true
        };

        const result = adapter.generate(sampleDesign, options);

        expect(result.framework).toBe('bubbletea');
        expect(result.files).toHaveLength(3); // main.go + go.mod + go.sum
        
        const mainFile = result.files.find(f => f.filename === 'main.go');
        expect(mainFile).toBeDefined();
        expect(mainFile?.executable).toBe(true);
        expect(mainFile?.language).toBe('go');
        expect(mainFile?.content).toContain('package main');
        expect(mainFile?.content).toContain('type Model struct');
        expect(mainFile?.content).toContain('func (m *Model) rendertext_widget()');
        expect(mainFile?.content).toContain('func (m *Model) renderchart_widget()');
        expect(mainFile?.content).toContain('SystemMetricsCollector');

        const goModFile = result.files.find(f => f.filename === 'go.mod');
        expect(goModFile).toBeDefined();
        expect(goModFile?.content).toContain('module dashboard');
        expect(goModFile?.content).toContain('github.com/charmbracelet/bubbletea');
      });
    });

    describe('modular output', () => {
      it('should generate multiple Go files', () => {
        const options: CodeGenOptions = {
          outputFormat: 'modular',
          includeComments: true
        };

        const result = adapter.generate(sampleDesign, options);

        expect(result.framework).toBe('bubbletea');
        expect(result.files.length).toBeGreaterThan(3);
        
        const mainFile = result.files.find(f => f.filename === 'main.go');
        const widgetsFile = result.files.find(f => f.filename === 'widgets.go');
        const dataSourcesFile = result.files.find(f => f.filename === 'datasources.go');
        const goModFile = result.files.find(f => f.filename === 'go.mod');

        expect(mainFile).toBeDefined();
        expect(widgetsFile).toBeDefined();
        expect(dataSourcesFile).toBeDefined();
        expect(goModFile).toBeDefined();

        expect(mainFile?.content).toContain('type Model struct');
        expect(widgetsFile?.content).toContain('func (m *Model) rendertext_widget()');
        expect(dataSourcesFile?.content).toContain('SystemMetricsCollector');
      });
    });

    it('should include system requirements and instructions', () => {
      const options: CodeGenOptions = {
        outputFormat: 'single',
        includeComments: true
      };

      const result = adapter.generate(sampleDesign, options);

      expect(result.dependencies.systemRequirements).toContain('Go 1.19+');
      expect(result.dependencies.packages).toEqual(adapter.getDependencies());
      expect(result.instructions).toContain('go mod init');
      expect(result.instructions).toContain('go mod tidy');
      expect(result.instructions).toContain('go run main.go');
    });

    it('should handle empty design', () => {
      const emptyDesign: DashboardDesign = {
        metadata: {
          name: 'Empty Dashboard',
          targetFramework: 'bubbletea'
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
      
      expect(result.files).toHaveLength(3); // main.go + go.mod + go.sum
      const mainFile = result.files.find(f => f.filename === 'main.go');
      expect(mainFile?.content).toContain('type Model struct');
      expect(mainFile?.content).not.toContain('collectData');
    });

    it('should generate Go code with proper syntax', () => {
      const options: CodeGenOptions = {
        outputFormat: 'single',
        includeComments: true
      };

      const result = adapter.generate(sampleDesign, options);
      const mainFile = result.files.find(f => f.filename === 'main.go');
      
      expect(mainFile?.content).toContain('package main');
      expect(mainFile?.content).toContain('import (');
      expect(mainFile?.content).toContain('func main() {');
      expect(mainFile?.content).toContain('tea.NewProgram');
      expect(mainFile?.content).not.toContain('undefined');
      expect(mainFile?.content).not.toContain('null');
    });
  });

  describe('Go-specific features', () => {
    it('should generate proper Go imports', () => {
      const design: DashboardDesign = {
        metadata: { name: 'Test', targetFramework: 'bubbletea' },
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
      const mainFile = result.files.find(f => f.filename === 'main.go');
      
      expect(mainFile?.content).toContain('github.com/charmbracelet/bubbletea');
      expect(mainFile?.content).toContain('github.com/charmbracelet/lipgloss');
      expect(mainFile?.content).toContain('github.com/shirou/gopsutil/v3/cpu');
    });

    it('should generate proper struct definitions', () => {
      const design: DashboardDesign = {
        metadata: { name: 'Test', targetFramework: 'bubbletea' },
        settings: { dimensions: { width: 40, height: 20 }, gridSize: 4 },
        widgets: [
          {
            id: 'progress1',
            type: 'progress_bar',
            position: { x: 0, y: 0 },
            size: { width: 8, height: 4 },
            title: 'Progress',
            properties: {}
          }
        ],
        dataSources: []
      };

      const result = adapter.generate(design, { outputFormat: 'single' });
      const mainFile = result.files.find(f => f.filename === 'main.go');
      
      expect(mainFile?.content).toContain('type Model struct');
      expect(mainFile?.content).toContain('progress1Progress float64');
    });

    it('should generate proper method receivers', () => {
      const design: DashboardDesign = {
        metadata: { name: 'Test', targetFramework: 'bubbletea' },
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
      const mainFile = result.files.find(f => f.filename === 'main.go');
      
      expect(mainFile?.content).toContain('func (m *Model) Update(msg tea.Msg)');
      expect(mainFile?.content).toContain('func (m *Model) View()');
      expect(mainFile?.content).toContain('func (m *Model) rendertext1()');
    });
  });
});