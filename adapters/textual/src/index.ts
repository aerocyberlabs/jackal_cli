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

export class TextualAdapter extends FrameworkAdapter {
  constructor() {
    super('textual');
  }

  generate(design: DashboardDesign, options: CodeGenOptions): GeneratedCode {
    const files: GeneratedFile[] = [];

    if (options.outputFormat === 'single') {
      files.push(this.generateSingleFile(design, options));
    } else {
      files.push(...this.generateModularFiles(design, options));
    }

    files.push(this.generateRequirementsFile());

    return {
      framework: 'textual',
      files,
      dependencies: {
        packages: this.getDependencies(),
        systemRequirements: ['Python 3.8+']
      },
      instructions: this.getInstructions()
    };
  }
  private generateSingleFile(design: DashboardDesign, options: CodeGenOptions): GeneratedFile {
    const imports = this.generateImports(design);
    const metricsCollector = SystemMetrics.generateMetricsCollector(design.dataSources);
    const dataUpdater = SystemMetrics.generateDataSourceUpdater(design.dataSources);
    const metricsIntegration = SystemMetrics.generateMetricsIntegration(design.dataSources);
    const widgetClasses = design.widgets.map(w => this.generateWidgetClass(w, options));
    const appClass = this.generateAppClass(design, options);
    const main = this.generateMain();

    const content = [
      imports,
      metricsCollector,
      dataUpdater,
      metricsIntegration,
      ...widgetClasses,
      appClass,
      main
    ].filter(Boolean).join('\n\n');

    return {
      filename: 'dashboard.py',
      content,
      language: 'python',
      executable: true
    };
  }

  private generateModularFiles(design: DashboardDesign, options: CodeGenOptions): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // Main app file
    files.push({
      filename: 'app.py',
      content: this.generateAppClass(design, options) + '\n\n' + this.generateMain(),
      language: 'python',
      executable: true
    });
    // Widgets file
    const widgetImports = this.generateWidgetImports();
    const widgetClasses = design.widgets.map(w => this.generateWidgetClass(w, options));
    
    files.push({
      filename: 'widgets.py',
      content: [widgetImports, ...widgetClasses].join('\n\n'),
      language: 'python'
    });

    // Data sources file if needed
    if (design.dataSources.length > 0) {
      files.push({
        filename: 'data_sources.py',
        content: this.generateDataSources(design.dataSources),
        language: 'python'
      });
    }

    return files;
  }

  private generateImports(design: DashboardDesign): string {
    const imports = [
      'from textual.app import App, ComposeResult',
      'from textual.containers import Container, Horizontal, Vertical',
      'from textual.widgets import Header, Footer, Static'
    ];

    // Add widget-specific imports
    const widgetTypes = new Set(design.widgets.map(w => w.type));
    
    return imports.join('\n');
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
class ${widget.id}(Static):
    """${widget.type} widget"""
    
    def __init__(self):
        super().__init__()
        self.update("${widget.title || widget.type}")
    
    def on_mount(self) -> None:
        self.styles.width = ${widget.size.width}
        self.styles.height = ${widget.size.height}
`;
  }

  private generateAppClass(design: DashboardDesign, options: CodeGenOptions): string {
    const widgetYields = design.widgets
      .map(w => `        yield ${w.id}()`)
      .join('\n');

    const hasDataSources = design.dataSources && design.dataSources.length > 0;

    return `
class DashboardApp(App):
    """${design.metadata.name || 'Dashboard Application'}"""
    
    CSS = """
    Container {
        background: $surface;
        padding: 1;
    }
    Static {
        margin: 1;
        padding: 1;
        border: solid $accent;
    }
    """
    
    def compose(self) -> ComposeResult:
        yield Header()
        with Container():${widgetYields}
        yield Footer()
    
    def on_mount(self) -> None:
        self.title = "${design.metadata.name || 'Dashboard'}"
        ${hasDataSources ? `
        # Start data source updates
        self.set_interval(1.0, self.update_data_sources)` : ''}
    
    ${hasDataSources ? `
    def update_data_sources(self) -> None:
        """Update all data sources"""
        try:
            # Run async data updates in a sync context
            import asyncio
            asyncio.create_task(data_updater.update_all_sources())
        except Exception as e:
            self.log.error(f"Error updating data sources: {e}")` : ''}
`;
  }
  private generateMain(): string {
    return `
if __name__ == "__main__":
    app = DashboardApp()
    app.run()
`;
  }

  private generateRequirementsFile(): GeneratedFile {
    return {
      filename: 'requirements.txt',
      content: this.getDependencies().join('\n'),
      language: 'text'
    };
  }

  private generateWidgetImports(): string {
    return `from textual.widgets import Static
from textual.containers import Container`;
  }

  private generateDataSources(dataSources: any[]): string {
    if (dataSources.length === 0) {
      return '';
    }

    const metricsCollector = SystemMetrics.generateMetricsCollector(dataSources);
    const dataUpdater = SystemMetrics.generateDataSourceUpdater(dataSources);
    const metricsIntegration = SystemMetrics.generateMetricsIntegration(dataSources);

    return [metricsCollector, dataUpdater, metricsIntegration].filter(Boolean).join('\n\n');
  }

  validateDesign(design: DashboardDesign): string[] {
    const errors: string[] = [];
    
    // Check if all widgets are supported
    for (const widget of design.widgets) {
      if (!this.isWidgetSupported(widget.type)) {
        errors.push(`Widget type '${widget.type}' is not supported in Textual`);
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
      'textual>=0.40.0',
      'plotext>=5.2.8',
      'psutil>=5.9.0',
      'rich>=13.0.0',
      'aiohttp>=3.8.0',
      'aiofiles>=22.0.0'
    ];
  }

  private getInstructions(): string {
    return `# Installation Instructions

1. Create a virtual environment:
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate

2. Install dependencies:
   pip install -r requirements.txt

3. Run the dashboard:
   python dashboard.py

4. Customize the dashboard by editing the generated code.`;
  }
}