import {
  FrameworkAdapter,
  DashboardDesign,
  CodeGenOptions,
  GeneratedCode,
  GeneratedFile,
  Widget
} from '@cli-designer/core';
import { WidgetTemplates } from './widget-templates';
import { SystemMetrics } from './system-metrics';

export class BlessedAdapter extends FrameworkAdapter {
  constructor() {
    super('blessed');
  }

  generate(design: DashboardDesign, options: CodeGenOptions): GeneratedCode {
    const files: GeneratedFile[] = [];

    if (options.outputFormat === 'single') {
      files.push(this.generateSingleFile(design, options));
    } else {
      files.push(...this.generateModularFiles(design, options));
    }

    files.push(this.generatePackageJson());

    return {
      framework: 'blessed',
      files,
      dependencies: {
        packages: this.getDependencies(),
        systemRequirements: ['Node.js 18+', 'npm']
      },
      instructions: this.getInstructions()
    };
  }

  private generateSingleFile(design: DashboardDesign, options: CodeGenOptions): GeneratedFile {
    const imports = this.generateImports(design);
    const constants = this.generateConstants();
    const metricsCollector = SystemMetrics.generateMetricsCollector(design.dataSources);
    const dataUpdater = SystemMetrics.generateDataSourceUpdater(design.dataSources);
    const widgetClasses = design.widgets.map(w => this.generateWidgetClass(w, options));
    const app = this.generateApp(design, options);
    const main = this.generateMain();

    const content = [
      imports,
      constants,
      metricsCollector,
      dataUpdater,
      ...widgetClasses,
      app,
      main
    ].filter(Boolean).join('\n\n');

    return {
      filename: 'dashboard.js',
      content,
      language: 'javascript',
      executable: true
    };
  }

  private generateModularFiles(design: DashboardDesign, options: CodeGenOptions): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // Main application file
    files.push({
      filename: 'app.js',
      content: this.generateApp(design, options) + '\n\n' + this.generateMain(),
      language: 'javascript',
      executable: true
    });

    // Widget classes file
    const widgetImports = this.generateWidgetImports();
    const widgetClasses = design.widgets.map(w => this.generateWidgetClass(w, options));
    
    files.push({
      filename: 'widgets.js',
      content: [widgetImports, ...widgetClasses].join('\n\n'),
      language: 'javascript'
    });

    // Data sources file if needed
    if (design.dataSources.length > 0) {
      files.push({
        filename: 'datasources.js',
        content: this.generateDataSources(design.dataSources),
        language: 'javascript'
      });
    }

    return files;
  }

  private generateImports(design: DashboardDesign): string {
    const imports = [
      "const blessed = require('blessed');",
      "const contrib = require('blessed-contrib');",
      "const fs = require('fs');",
      "const path = require('path');"
    ];

    // Add system monitoring imports if needed
    const hasSystemMetrics = design.dataSources.some(ds => ds.config.type === 'system_metric');
    if (hasSystemMetrics) {
      imports.push(
        "const si = require('systeminformation');"
      );
    }

    // Add HTTP client imports for API sources
    const hasApiSources = design.dataSources.some(ds => ds.config.type === 'api');
    if (hasApiSources) {
      imports.push(
        "const axios = require('axios');"
      );
    }

    // Add child process for command sources
    const hasCommandSources = design.dataSources.some(ds => ds.config.type === 'command');
    if (hasCommandSources) {
      imports.push(
        "const { exec } = require('child_process');"
      );
    }

    return imports.join('\n');
  }

  private generateConstants(): string {
    return `
// Color scheme
const colors = {
  primary: 'blue',
  secondary: 'green', 
  accent: 'yellow',
  danger: 'red',
  text: 'white',
  border: 'grey'
};

// Default styles
const defaultStyle = {
  border: {
    type: 'line'
  },
  style: {
    border: {
      fg: colors.border
    },
    focus: {
      border: {
        fg: colors.primary
      }
    }
  }
};`;
  }

  private generateWidgetClass(widget: Widget, options: CodeGenOptions): string {
    // Map widget type to template
    switch (widget.type) {
      case 'text':
        return WidgetTemplates.generateTextWidget(widget);
      case 'line_chart':
        return WidgetTemplates.generateLineChart(widget);
      case 'bar_chart':
        return WidgetTemplates.generateBarChart(widget);
      case 'table':
        return WidgetTemplates.generateTable(widget);
      case 'progress_bar':
        return WidgetTemplates.generateProgressBar(widget);
      case 'sparkline':
        return WidgetTemplates.generateSparkline(widget);
      case 'gauge':
        return WidgetTemplates.generateGauge(widget);
      case 'log_viewer':
        return WidgetTemplates.generateLogViewer(widget);
      case 'metric_card':
        return WidgetTemplates.generateMetricCard(widget);
      default:
        return this.generateGenericWidget(widget);
    }
  }

  private generateGenericWidget(widget: Widget): string {
    return `
// ${widget.id} - ${widget.type} widget
class ${widget.id.charAt(0).toUpperCase() + widget.id.slice(1)}Widget {
  constructor(options = {}) {
    this.options = { ...options };
    this.dataSourceId = '${widget.dataSource || ''}';
    
    this.element = blessed.box({
      ...defaultStyle,
      label: '${widget.title || widget.type}',
      content: '${widget.title || widget.type}',
      left: '${(widget.position.x / 40 * 100).toFixed(1)}%',
      top: '${(widget.position.y / 20 * 100).toFixed(1)}%',
      width: '${(widget.size.width / 40 * 100).toFixed(1)}%',
      height: '${(widget.size.height / 20 * 100).toFixed(1)}%',
      ...options
    });
  }

  update(data) {
    if (data && typeof data === 'object') {
      this.element.setContent(JSON.stringify(data, null, 2));
    } else {
      this.element.setContent(String(data || '${widget.title || widget.type}'));
    }
  }

  getElement() {
    return this.element;
  }
}`;
  }

  private generateApp(design: DashboardDesign, options: CodeGenOptions): string {
    const hasDataSources = design.dataSources && design.dataSources.length > 0;
    
    const widgetInstantiations = design.widgets.map(widget => {
      const className = widget.id.charAt(0).toUpperCase() + widget.id.slice(1) + 'Widget';
      return `    this.${widget.id} = new ${className}();`;
    }).join('\n');

    const widgetAppends = design.widgets.map(widget => 
      `    this.screen.append(this.${widget.id}.getElement());`
    ).join('\n');

    const dataSourceUpdates = hasDataSources ? design.dataSources.map(ds => 
      `      this.updateDataSource('${ds.id}', '${ds.config.type}', ${JSON.stringify(ds.config)});`
    ).join('\n') : '';

    return `
// Dashboard Application
class Dashboard {
  constructor() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: '${design.metadata.name || 'Dashboard'}'
    });

    this.dataCache = new Map();
    this.lastUpdate = new Map();
    ${hasDataSources ? 'this.dataUpdater = new DataUpdater();' : ''}

    this.initializeWidgets();
    this.setupEventHandlers();
    ${hasDataSources ? 'this.startDataCollection();' : ''}
  }

  initializeWidgets() {
${widgetInstantiations}

${widgetAppends}
  }

  setupEventHandlers() {
    // Quit on Escape, q, or Control-C
    this.screen.key(['escape', 'q', 'C-c'], () => {
      process.exit(0);
    });

    // Handle resize
    this.screen.on('resize', () => {
      this.render();
    });
  }

  ${hasDataSources ? `
  startDataCollection() {
    // Update data sources every ${Math.floor((design.settings.refreshRate || 1000) / 1000)} seconds
    setInterval(() => {
${dataSourceUpdates}
    }, ${design.settings.refreshRate || 1000});

    // Initial update
${dataSourceUpdates}
  }

  async updateDataSource(id, type, config) {
    try {
      const data = await this.dataUpdater.updateSource(id, type, config);
      if (data !== null) {
        this.dataCache.set(id, data);
        this.updateWidgetData(id, data);
      }
    } catch (error) {
      console.error(\`Error updating data source \${id}:\`, error.message);
    }
  }

  updateWidgetData(sourceId, data) {
    // Update widgets that use this data source
    ${design.widgets.filter(w => w.dataSource).map(widget => `
    if ('${widget.dataSource}' === sourceId && this.${widget.id}) {
      this.${widget.id}.update(data);
    }`).join('')}
  }` : ''}

  render() {
    this.screen.render();
  }

  run() {
    this.render();
  }
}`;
  }

  private generateMain(): string {
    return `
// Main entry point
if (require.main === module) {
  const dashboard = new Dashboard();
  dashboard.run();
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}`;
  }

  private generatePackageJson(): GeneratedFile {
    return {
      filename: 'package.json',
      content: `{
  "name": "dashboard",
  "version": "1.0.0",
  "description": "Terminal dashboard application",
  "main": "dashboard.js",
  "type": "commonjs",
  "scripts": {
    "start": "node dashboard.js",
    "dev": "node dashboard.js"
  },
  "dependencies": {
    "blessed": "^0.1.81",
    "blessed-contrib": "^4.11.0",
    "systeminformation": "^5.21.15",
    "axios": "^1.6.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "keywords": [
    "terminal",
    "dashboard",
    "tui",
    "blessed"
  ]
}`,
      language: 'json'
    };
  }

  private generateWidgetImports(): string {
    return `const blessed = require('blessed');
const contrib = require('blessed-contrib');`;
  }

  private generateDataSources(dataSources: any[]): string {
    if (dataSources.length === 0) {
      return '';
    }

    const metricsCollector = SystemMetrics.generateMetricsCollector(dataSources);
    const dataUpdater = SystemMetrics.generateDataSourceUpdater(dataSources);

    return [metricsCollector, dataUpdater].filter(Boolean).join('\n\n');
  }

  validateDesign(design: DashboardDesign): string[] {
    const errors: string[] = [];
    
    // Check if all widgets are supported
    for (const widget of design.widgets) {
      if (!this.isWidgetSupported(widget.type)) {
        errors.push(`Widget type '${widget.type}' is not supported in Blessed`);
      }
    }
    
    return errors;
  }

  private isWidgetSupported(type: string): boolean {
    const supportedTypes = [
      'text', 
      'line_chart', 
      'bar_chart', 
      'table', 
      'progress_bar',
      'sparkline',
      'gauge', 
      'log_viewer', 
      'metric_card'
    ];
    return supportedTypes.includes(type);
  }

  getDependencies(): string[] {
    return [
      'blessed@^0.1.81',
      'blessed-contrib@^4.11.0',
      'systeminformation@^5.21.15',
      'axios@^1.6.0'
    ];
  }

  private getInstructions(): string {
    return `# Installation Instructions

1. Ensure Node.js 18+ is installed:
   node --version
   npm --version

2. Install dependencies:
   npm install

3. Run the dashboard:
   npm start

4. For development:
   npm run dev

5. Controls:
   - 'q', Escape, or Ctrl+C: Quit the application

6. Customize the dashboard by editing the generated JavaScript code.`;
  }
}

export { BlessedAdapter };