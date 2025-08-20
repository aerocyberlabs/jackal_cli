import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import type { DashboardDesign } from '@cli-designer/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('CLI Integration Tests', () => {
  let tempDir: string;
  let testDesign: DashboardDesign;

  beforeEach(async () => {
    // Create temporary directory for test outputs
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'cli-test-'));
    
    // Create a test design
    testDesign = {
      metadata: {
        name: 'Test Dashboard',
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
          id: 'cpu_card',
          type: 'metric_card',
          position: { x: 8, y: 0 },
          size: { width: 8, height: 4 },
          title: 'CPU Usage',
          dataSource: 'cpu_metric',
          properties: {
            label: 'CPU',
            format: 'percentage',
            trend: true
          }
        },
        {
          id: 'memory_gauge',
          type: 'gauge',
          position: { x: 16, y: 0 },
          size: { width: 8, height: 8 },
          title: 'Memory Usage',
          dataSource: 'memory_metric',
          properties: {
            min: 0,
            max: 100,
            units: '%'
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
        },
        {
          id: 'memory_metric',
          name: 'Memory Usage',
          config: {
            type: 'system_metric',
            metric: 'memory_percent',
            interval: 2000
          }
        }
      ]
    };
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Code Generation', () => {
    it('should generate single file dashboard', async () => {
      // Import the main CLI module
      const { CodeGenerator } = await import('./index.js');
      const { TextualAdapter } = await import('@cli-designer/adapter-textual');
      
      const generator = new CodeGenerator();
      generator.registerAdapter(new TextualAdapter());
      
      const result = await generator.generate(testDesign, {
        outputFormat: 'single',
        includeComments: true
      });
      
      expect(result.framework).toBe('textual');
      expect(result.files).toHaveLength(2); // dashboard.py + requirements.txt
      
      const mainFile = result.files.find(f => f.filename === 'dashboard.py');
      expect(mainFile).toBeDefined();
      expect(mainFile?.content).toContain('class DashboardApp(App)');
      expect(mainFile?.content).toContain('class text_widget(Static)');
      expect(mainFile?.content).toContain('class cpu_card(Static)');
      expect(mainFile?.content).toContain('class memory_gauge(Static)');
      expect(mainFile?.content).toContain('SystemMetricsCollector');
    });

    it('should generate modular dashboard files', async () => {
      const { CodeGenerator } = await import('./index.js');
      const { TextualAdapter } = await import('@cli-designer/adapter-textual');
      
      const generator = new CodeGenerator();
      generator.registerAdapter(new TextualAdapter());
      
      const result = await generator.generate(testDesign, {
        outputFormat: 'modular',
        includeComments: true
      });
      
      expect(result.framework).toBe('textual');
      expect(result.files.length).toBeGreaterThanOrEqual(4); // app.py, widgets.py, data_sources.py, requirements.txt
      
      const fileNames = result.files.map(f => f.filename);
      expect(fileNames).toContain('app.py');
      expect(fileNames).toContain('widgets.py');
      expect(fileNames).toContain('data_sources.py');
      expect(fileNames).toContain('requirements.txt');
    });

    it('should write files to output directory', async () => {
      const { writeGeneratedFiles } = await import('./index.js');
      const { CodeGenerator } = await import('./index.js');
      const { TextualAdapter } = await import('@cli-designer/adapter-textual');
      
      const generator = new CodeGenerator();
      generator.registerAdapter(new TextualAdapter());
      
      const result = await generator.generate(testDesign, {
        outputFormat: 'single',
        includeComments: true
      });
      
      await writeGeneratedFiles(result, tempDir);
      
      // Check that files were created
      const dashboardFile = path.join(tempDir, 'dashboard.py');
      const reqFile = path.join(tempDir, 'requirements.txt');
      
      expect(await fs.access(dashboardFile).then(() => true).catch(() => false)).toBe(true);
      expect(await fs.access(reqFile).then(() => true).catch(() => false)).toBe(true);
      
      // Check file contents
      const dashboardContent = await fs.readFile(dashboardFile, 'utf-8');
      const reqContent = await fs.readFile(reqFile, 'utf-8');
      
      expect(dashboardContent).toContain('class DashboardApp(App)');
      expect(reqContent).toContain('textual>=');
    });
  });

  describe('Design Validation', () => {
    it('should validate correct design', async () => {
      const { validateDesign } = await import('./index.js');
      const { TextualAdapter } = await import('@cli-designer/adapter-textual');
      
      const adapter = new TextualAdapter();
      const errors = validateDesign(testDesign, adapter);
      
      expect(errors).toEqual([]);
    });

    it('should detect invalid widget types', async () => {
      const { validateDesign } = await import('./index.js');
      const { TextualAdapter } = await import('@cli-designer/adapter-textual');
      
      const invalidDesign = {
        ...testDesign,
        widgets: [
          {
            id: 'invalid_widget',
            type: 'nonexistent_type' as any,
            position: { x: 0, y: 0 },
            size: { width: 4, height: 4 },
            title: 'Invalid',
            properties: {}
          }
        ]
      };
      
      const adapter = new TextualAdapter();
      const errors = validateDesign(invalidDesign, adapter);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('nonexistent_type');
    });

    it('should validate data source configurations', async () => {
      const { DashboardDesignSchema } = await import('@cli-designer/core');
      
      const result = DashboardDesignSchema.safeParse(testDesign);
      expect(result.success).toBe(true);
      
      // Test invalid data source
      const invalidDataSourceDesign = {
        ...testDesign,
        dataSources: [
          {
            id: 'invalid_source',
            name: 'Invalid Source',
            config: {
              type: 'invalid_type' as any
            }
          }
        ]
      };
      
      const invalidResult = DashboardDesignSchema.safeParse(invalidDataSourceDesign);
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('File Operations', () => {
    it('should read design from JSON file', async () => {
      // Write test design to file
      const designFile = path.join(tempDir, 'test-design.json');
      await fs.writeFile(designFile, JSON.stringify(testDesign, null, 2));
      
      // Read it back
      const { readDesignFile } = await import('./index.js');
      const readDesign = await readDesignFile(designFile);
      
      expect(readDesign).toEqual(testDesign);
    });

    it('should handle malformed JSON files', async () => {
      const invalidFile = path.join(tempDir, 'invalid.json');
      await fs.writeFile(invalidFile, '{ invalid json }');
      
      const { readDesignFile } = await import('./index.js');
      
      await expect(readDesignFile(invalidFile)).rejects.toThrow();
    });

    it('should handle non-existent files', async () => {
      const nonExistentFile = path.join(tempDir, 'does-not-exist.json');
      
      const { readDesignFile } = await import('./index.js');
      
      await expect(readDesignFile(nonExistentFile)).rejects.toThrow();
    });

    it('should create output directory if it does not exist', async () => {
      const nestedOutputDir = path.join(tempDir, 'nested', 'output', 'directory');
      
      const { writeGeneratedFiles } = await import('./index.js');
      const { CodeGenerator } = await import('./index.js');
      const { TextualAdapter } = await import('@cli-designer/adapter-textual');
      
      const generator = new CodeGenerator();
      generator.registerAdapter(new TextualAdapter());
      
      const result = await generator.generate(testDesign, {
        outputFormat: 'single',
        includeComments: true
      });
      
      await writeGeneratedFiles(result, nestedOutputDir);
      
      // Check that directory was created and files exist
      const dashboardFile = path.join(nestedOutputDir, 'dashboard.py');
      expect(await fs.access(dashboardFile).then(() => true).catch(() => false)).toBe(true);
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full generation workflow', async () => {
      // 1. Write design file
      const designFile = path.join(tempDir, 'dashboard.json');
      await fs.writeFile(designFile, JSON.stringify(testDesign, null, 2));
      
      // 2. Read and validate design
      const { readDesignFile, validateDesign } = await import('./index.js');
      const { TextualAdapter } = await import('@cli-designer/adapter-textual');
      
      const design = await readDesignFile(designFile);
      const adapter = new TextualAdapter();
      const errors = validateDesign(design, adapter);
      expect(errors).toEqual([]);
      
      // 3. Generate code
      const { CodeGenerator } = await import('./index.js');
      const generator = new CodeGenerator();
      generator.registerAdapter(adapter);
      
      const result = await generator.generate(design, {
        outputFormat: 'single',
        includeComments: true
      });
      
      // 4. Write output files
      const outputDir = path.join(tempDir, 'output');
      const { writeGeneratedFiles } = await import('./index.js');
      await writeGeneratedFiles(result, outputDir);
      
      // 5. Verify all files exist and contain expected content
      const dashboardFile = path.join(outputDir, 'dashboard.py');
      const reqFile = path.join(outputDir, 'requirements.txt');
      
      const dashboardContent = await fs.readFile(dashboardFile, 'utf-8');
      const reqContent = await fs.readFile(reqFile, 'utf-8');
      
      // Check main application structure
      expect(dashboardContent).toContain('class DashboardApp(App)');
      expect(dashboardContent).toContain('def compose(self)');
      expect(dashboardContent).toContain('if __name__ == "__main__"');
      
      // Check widgets are included
      expect(dashboardContent).toContain('class text_widget(Static)');
      expect(dashboardContent).toContain('class cpu_card(Static)');
      expect(dashboardContent).toContain('class memory_gauge(Static)');
      
      // Check data sources are integrated
      expect(dashboardContent).toContain('SystemMetricsCollector');
      expect(dashboardContent).toContain('cpu_percent');
      expect(dashboardContent).toContain('memory_percent');
      
      // Check requirements
      expect(reqContent).toContain('textual>=');
      expect(reqContent).toContain('psutil>=');
      expect(reqContent).toContain('rich>=');
      
      // 6. Verify Python syntax (basic check)
      expect(dashboardContent).not.toContain('undefined');
      expect(dashboardContent).not.toContain('null');
      expect(dashboardContent).not.toContain('[object Object]');
    });

    it('should handle large dashboard designs', async () => {
      // Create a design with many widgets and data sources
      const largeDesign: DashboardDesign = {
        metadata: {
          name: 'Large Dashboard',
          targetFramework: 'textual'
        },
        settings: {
          dimensions: { width: 80, height: 40 },
          gridSize: 4
        },
        widgets: [],
        dataSources: []
      };
      
      // Add 20 widgets of different types
      const widgetTypes = ['text', 'metric_card', 'gauge', 'progress_bar', 'sparkline'];
      for (let i = 0; i < 20; i++) {
        const widgetType = widgetTypes[i % widgetTypes.length];
        largeDesign.widgets.push({
          id: `widget_${i}`,
          type: widgetType as any,
          position: { x: (i % 10) * 8, y: Math.floor(i / 10) * 8 },
          size: { width: 8, height: 6 },
          title: `Widget ${i}`,
          dataSource: `source_${i}`,
          properties: {}
        });
        
        largeDesign.dataSources.push({
          id: `source_${i}`,
          name: `Data Source ${i}`,
          config: {
            type: 'system_metric',
            metric: 'cpu_percent',
            interval: 1000 + (i * 100)
          }
        });
      }
      
      const { CodeGenerator } = await import('./index.js');
      const { TextualAdapter } = await import('@cli-designer/adapter-textual');
      
      const generator = new CodeGenerator();
      generator.registerAdapter(new TextualAdapter());
      
      const result = await generator.generate(largeDesign, {
        outputFormat: 'modular',
        includeComments: true
      });
      
      expect(result.files.length).toBeGreaterThan(3);
      
      const appFile = result.files.find(f => f.filename === 'app.py');
      const widgetsFile = result.files.find(f => f.filename === 'widgets.py');
      
      expect(appFile?.content).toContain('class DashboardApp(App)');
      expect(widgetsFile?.content).toContain('class widget_0(Static)');
      expect(widgetsFile?.content).toContain('class widget_19(Static)');
    });
  });
});