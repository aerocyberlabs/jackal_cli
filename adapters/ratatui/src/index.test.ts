import { describe, it, expect, beforeEach } from 'vitest';
import { RatatuiAdapter } from './index';
import type { DashboardDesign, CodeGenOptions } from '@cli-designer/core';

describe('RatatuiAdapter', () => {
  let adapter: RatatuiAdapter;

  beforeEach(() => {
    adapter = new RatatuiAdapter();
  });

  describe('constructor', () => {
    it('should initialize with correct framework name', () => {
      expect(adapter['frameworkName']).toBe('ratatui');
    });
  });

  describe('getDependencies', () => {
    it('should return required Rust crates', () => {
      const deps = adapter.getDependencies();
      
      expect(deps).toContain('ratatui = "0.24"');
      expect(deps).toContain('crossterm = "0.27"');
      expect(deps).toContain('sysinfo = "0.29"');
      expect(deps).toContain('serde = { version = "1.0", features = ["derive"] }');
      expect(deps).toContain('serde_json = "1.0"');
    });
  });

  describe('validateDesign', () => {
    it('should return no errors for valid design', () => {
      const validDesign: DashboardDesign = {
        metadata: {
          name: 'Test Dashboard',
          targetFramework: 'ratatui'
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
          targetFramework: 'ratatui'
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
            targetFramework: 'ratatui'
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
        targetFramework: 'ratatui'
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
      it('should generate single Rust file with all components', () => {
        const options: CodeGenOptions = {
          outputFormat: 'single',
          includeComments: true
        };

        const result = adapter.generate(sampleDesign, options);

        expect(result.framework).toBe('ratatui');
        expect(result.files).toHaveLength(3); // main.rs + Cargo.toml + Cargo.lock
        
        const mainFile = result.files.find(f => f.filename === 'src/main.rs');
        expect(mainFile).toBeDefined();
        expect(mainFile?.executable).toBe(true);
        expect(mainFile?.language).toBe('rust');
        expect(mainFile?.content).toContain('use ratatui::');
        expect(mainFile?.content).toContain('pub struct App');
        expect(mainFile?.content).toContain('fn render_text_widget(');
        expect(mainFile?.content).toContain('fn render_chart_widget(');
        expect(mainFile?.content).toContain('MetricsCollector');

        const cargoFile = result.files.find(f => f.filename === 'Cargo.toml');
        expect(cargoFile).toBeDefined();
        expect(cargoFile?.content).toContain('[package]');
        expect(cargoFile?.content).toContain('ratatui = "0.24"');
      });
    });

    describe('modular output', () => {
      it('should generate multiple Rust files', () => {
        const options: CodeGenOptions = {
          outputFormat: 'modular',
          includeComments: true
        };

        const result = adapter.generate(sampleDesign, options);

        expect(result.framework).toBe('ratatui');
        expect(result.files.length).toBeGreaterThan(3);
        
        const mainFile = result.files.find(f => f.filename === 'src/main.rs');
        const widgetsFile = result.files.find(f => f.filename === 'src/widgets.rs');
        const dataSourcesFile = result.files.find(f => f.filename === 'src/data_sources.rs');
        const libFile = result.files.find(f => f.filename === 'src/lib.rs');
        const cargoFile = result.files.find(f => f.filename === 'Cargo.toml');

        expect(mainFile).toBeDefined();
        expect(widgetsFile).toBeDefined();
        expect(dataSourcesFile).toBeDefined();
        expect(libFile).toBeDefined();
        expect(cargoFile).toBeDefined();

        expect(mainFile?.content).toContain('pub struct App');
        expect(widgetsFile?.content).toContain('fn render_text_widget(');
        expect(dataSourcesFile?.content).toContain('MetricsCollector');
        expect(libFile?.content).toContain('pub mod widgets;');
      });
    });

    it('should include system requirements and instructions', () => {
      const options: CodeGenOptions = {
        outputFormat: 'single',
        includeComments: true
      };

      const result = adapter.generate(sampleDesign, options);

      expect(result.dependencies.systemRequirements).toContain('Rust 1.70+');
      expect(result.dependencies.systemRequirements).toContain('Cargo');
      expect(result.dependencies.packages).toEqual(adapter.getDependencies());
      expect(result.instructions).toContain('cargo build');
      expect(result.instructions).toContain('cargo run');
    });

    it('should handle empty design', () => {
      const emptyDesign: DashboardDesign = {
        metadata: {
          name: 'Empty Dashboard',
          targetFramework: 'ratatui'
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
      
      expect(result.files).toHaveLength(3); // main.rs + Cargo.toml + Cargo.lock
      const mainFile = result.files.find(f => f.filename === 'src/main.rs');
      expect(mainFile?.content).toContain('pub struct App');
      expect(mainFile?.content).not.toContain('update_data_sources');
    });

    it('should generate Rust code with proper syntax', () => {
      const options: CodeGenOptions = {
        outputFormat: 'single',
        includeComments: true
      };

      const result = adapter.generate(sampleDesign, options);
      const mainFile = result.files.find(f => f.filename === 'src/main.rs');
      
      expect(mainFile?.content).toContain('use ratatui::');
      expect(mainFile?.content).toContain('fn main() -> Result<(), Box<dyn Error>>');
      expect(mainFile?.content).toContain('impl App {');
      expect(mainFile?.content).toContain('Terminal::new');
      expect(mainFile?.content).not.toContain('undefined');
      expect(mainFile?.content).not.toContain('null');
    });
  });

  describe('Rust-specific features', () => {
    it('should generate proper Rust imports', () => {
      const design: DashboardDesign = {
        metadata: { name: 'Test', targetFramework: 'ratatui' },
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
      const mainFile = result.files.find(f => f.filename === 'src/main.rs');
      
      expect(mainFile?.content).toContain('use ratatui::{');
      expect(mainFile?.content).toContain('use crossterm::{');
      expect(mainFile?.content).toContain('use sysinfo::{');
    });

    it('should generate proper struct definitions', () => {
      const design: DashboardDesign = {
        metadata: { name: 'Test', targetFramework: 'ratatui' },
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
      const mainFile = result.files.find(f => f.filename === 'src/main.rs');
      
      expect(mainFile?.content).toContain('pub struct App {');
      expect(mainFile?.content).toContain('progress1_progress: f64');
      expect(mainFile?.content).toContain('impl Default for App');
    });

    it('should generate proper method implementations', () => {
      const design: DashboardDesign = {
        metadata: { name: 'Test', targetFramework: 'ratatui' },
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
      const mainFile = result.files.find(f => f.filename === 'src/main.rs');
      
      expect(mainFile?.content).toContain('impl App {');
      expect(mainFile?.content).toContain('pub fn update(&mut self)');
      expect(mainFile?.content).toContain('pub fn render<B: Backend>');
      expect(mainFile?.content).toContain('fn render_text1(&self, f: &mut Frame, area: Rect)');
    });

    it('should handle lifetimes and borrowing correctly', () => {
      const design: DashboardDesign = {
        metadata: { name: 'Test', targetFramework: 'ratatui' },
        settings: { dimensions: { width: 40, height: 20 }, gridSize: 4 },
        widgets: [
          {
            id: 'table1',
            type: 'table',
            position: { x: 0, y: 0 },
            size: { width: 12, height: 8 },
            title: 'Table',
            properties: {}
          }
        ],
        dataSources: []
      };

      const result = adapter.generate(design, { outputFormat: 'single' });
      const mainFile = result.files.find(f => f.filename === 'src/main.rs');
      
      expect(mainFile?.content).toContain('&mut self');
      expect(mainFile?.content).toContain('&self');
      expect(mainFile?.content).toContain('f: &mut Frame');
    });
  });
});