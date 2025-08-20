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

export class BubbleTeaAdapter extends FrameworkAdapter {
  constructor() {
    super('bubbletea');
  }

  generate(design: DashboardDesign, options: CodeGenOptions): GeneratedCode {
    const files: GeneratedFile[] = [];

    if (options.outputFormat === 'single') {
      files.push(this.generateSingleFile(design, options));
    } else {
      files.push(...this.generateModularFiles(design, options));
    }

    files.push(this.generateGoMod());
    files.push(this.generateGoSum());

    return {
      framework: 'bubbletea',
      files,
      dependencies: {
        packages: this.getDependencies(),
        systemRequirements: ['Go 1.19+']
      },
      instructions: this.getInstructions()
    };
  }

  private generateSingleFile(design: DashboardDesign, options: CodeGenOptions): GeneratedFile {
    const imports = this.generateImports(design);
    const structs = this.generateStructs(design);
    const metricsCollector = SystemMetrics.generateMetricsCollector(design.dataSources);
    const dataUpdater = SystemMetrics.generateDataSourceUpdater(design.dataSources);
    const widgetComponents = design.widgets.map(w => this.generateWidgetComponent(w, options));
    const model = this.generateModel(design, options);
    const main = this.generateMain();

    const content = [
      imports,
      structs,
      metricsCollector,
      dataUpdater,
      ...widgetComponents,
      model,
      main
    ].filter(Boolean).join('\n\n');

    return {
      filename: 'main.go',
      content,
      language: 'go',
      executable: true
    };
  }

  private generateModularFiles(design: DashboardDesign, options: CodeGenOptions): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // Main application file
    files.push({
      filename: 'main.go',
      content: this.generateMain() + '\n\n' + this.generateModel(design, options),
      language: 'go',
      executable: true
    });

    // Widget components file
    const widgetImports = this.generateWidgetImports();
    const widgetComponents = design.widgets.map(w => this.generateWidgetComponent(w, options));
    
    files.push({
      filename: 'widgets.go',
      content: [widgetImports, ...widgetComponents].join('\n\n'),
      language: 'go'
    });

    // Data sources file if needed
    if (design.dataSources.length > 0) {
      files.push({
        filename: 'datasources.go',
        content: this.generateDataSources(design.dataSources),
        language: 'go'
      });
    }

    return files;
  }

  private generateImports(design: DashboardDesign): string {
    const imports = [
      'package main',
      '',
      'import (',
      '\t"context"',
      '\t"fmt"',
      '\t"log"',
      '\t"strings"',
      '\t"time"',
      '',
      '\t"github.com/charmbracelet/bubbles/progress"',
      '\t"github.com/charmbracelet/bubbles/table"',
      '\t"github.com/charmbracelet/bubbles/viewport"',
      '\t"github.com/charmbracelet/bubbletea"',
      '\t"github.com/charmbracelet/lipgloss"',
    ];

    // Add system monitoring imports if needed
    const hasSystemMetrics = design.dataSources.some(ds => ds.config.type === 'system_metric');
    if (hasSystemMetrics) {
      imports.push(
        '',
        '\t"github.com/shirou/gopsutil/v3/cpu"',
        '\t"github.com/shirou/gopsutil/v3/mem"',
        '\t"github.com/shirou/gopsutil/v3/disk"',
        '\t"github.com/shirou/gopsutil/v3/net"'
      );
    }

    // Add HTTP client imports for API sources
    const hasApiSources = design.dataSources.some(ds => ds.config.type === 'api');
    if (hasApiSources) {
      imports.push(
        '\t"encoding/json"',
        '\t"net/http"'
      );
    }

    imports.push(')\n');
    return imports.join('\n');
  }

  private generateStructs(design: DashboardDesign): string {
    return `
// Styles
var (
    baseStyle = lipgloss.NewStyle().
        BorderStyle(lipgloss.NormalBorder()).
        BorderForeground(lipgloss.Color("240"))
    
    titleStyle = lipgloss.NewStyle().
        Background(lipgloss.Color("62")).
        Foreground(lipgloss.Color("230")).
        Padding(0, 1)
    
    errorStyle = lipgloss.NewStyle().
        Foreground(lipgloss.Color("196"))
)

// Data types
type DataPoint struct {
    Value     float64   \`json:"value"\`
    Timestamp time.Time \`json:"timestamp"\`
}

type WidgetData map[string]interface{}
`;
  }

  private generateWidgetComponent(widget: Widget, options: CodeGenOptions): string {
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
func (m *Model) render${widget.id}() string {
    content := "${widget.title || widget.type}"
    
    style := baseStyle.
        Width(${widget.size.width * 2}).
        Height(${widget.size.height})
    
    return style.Render(content)
}
`;
  }

  private generateModel(design: DashboardDesign, options: CodeGenOptions): string {
    const hasDataSources = design.dataSources && design.dataSources.length > 0;
    
    const modelFields = [
      'width  int',
      'height int',
      'ready  bool'
    ];

    // Add widget-specific fields
    design.widgets.forEach(widget => {
      switch (widget.type) {
        case 'progress_bar':
          modelFields.push(`${widget.id}Progress float64`);
          break;
        case 'table':
          modelFields.push(`${widget.id}Table table.Model`);
          break;
        case 'log_viewer':
          modelFields.push(`${widget.id}Viewport viewport.Model`);
          modelFields.push(`${widget.id}Logs []string`);
          break;
      }
    });

    if (hasDataSources) {
      modelFields.push('dataCache map[string]WidgetData');
      modelFields.push('lastUpdate map[string]time.Time');
    }

    const initMethod = this.generateInitMethod(design);
    const updateMethod = this.generateUpdateMethod(design);
    const viewMethod = this.generateViewModel(design);

    return `
// Model represents the application state
type Model struct {
    ${modelFields.join('\n    ')}
}

${initMethod}

${updateMethod}

${viewMethod}
`;
  }

  private generateInitMethod(design: DashboardDesign): string {
    const hasDataSources = design.dataSources && design.dataSources.length > 0;
    
    let initBody = `
    m := &Model{
        width:  ${design.settings.dimensions.width * 2},
        height: ${design.settings.dimensions.height},
        ready:  false,`;

    if (hasDataSources) {
      initBody += `
        dataCache:  make(map[string]WidgetData),
        lastUpdate: make(map[string]time.Time),`;
    }

    // Initialize widget-specific fields
    design.widgets.forEach(widget => {
      switch (widget.type) {
        case 'table':
          initBody += `
        ${widget.id}Table: table.New(),`;
          break;
        case 'log_viewer':
          initBody += `
        ${widget.id}Viewport: viewport.New(${widget.size.width * 2}, ${widget.size.height - 2}),
        ${widget.id}Logs: make([]string, 0),`;
          break;
      }
    });

    initBody += `
    }`;

    // Initialize table widgets
    design.widgets.filter(w => w.type === 'table').forEach(widget => {
      initBody += `
    
    // Initialize ${widget.id} table
    columns := []table.Column{
        {Title: "ID", Width: 6},
        {Title: "Name", Width: 12},
        {Title: "Status", Width: 8},
        {Title: "Value", Width: 8},
    }
    m.${widget.id}Table.SetColumns(columns)
    m.${widget.id}Table = m.${widget.id}Table.WithStyles(table.DefaultStyles())`;
    });

    if (hasDataSources) {
      initBody += `
    
    // Start data collection
    go m.collectData(ctx)`;
    }

    return `
// NewModel creates a new model instance
func NewModel(ctx context.Context) *Model {${initBody}
    
    return m
}`;
  }

  private generateUpdateMethod(design: DashboardDesign): string {
    const hasDataSources = design.dataSources && design.dataSources.length > 0;

    let updateCases = '';
    
    if (hasDataSources) {
      updateCases += `
    case tea.WindowSizeMsg:
        m.width = msg.Width
        m.height = msg.Height
        m.ready = true
        return m, tea.Batch(
            tea.EnterAltScreen,
            m.updateDataSources(),
        )
    
    case tickMsg:
        return m, m.updateDataSources()`;
    } else {
      updateCases += `
    case tea.WindowSizeMsg:
        m.width = msg.Width
        m.height = msg.Height
        m.ready = true
        return m, tea.EnterAltScreen`;
    }

    updateCases += `
    
    case tea.KeyMsg:
        switch msg.String() {
        case "ctrl+c", "q":
            return m, tea.Quit
        }`;

    if (hasDataSources) {
      return `
// Update handles messages and updates the model
func (m *Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {${updateCases}
    }
    
    return m, nil
}

// tickMsg represents a tick for data updates
type tickMsg struct{}

// updateDataSources returns a command to update data sources
func (m *Model) updateDataSources() tea.Cmd {
    return tea.Tick(time.Second*${Math.floor((design.settings.refreshRate || 1000) / 1000)}, func(time.Time) tea.Msg {
        return tickMsg{}
    })
}`;
    }

    return `
// Update handles messages and updates the model
func (m *Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {${updateCases}
    }
    
    return m, nil
}`;
  }

  private generateViewModel(design: DashboardDesign): string {
    const widgetRenders = design.widgets.map(widget => 
      `        ${widget.id}Widget := m.render${widget.id}()`
    ).join('\n');

    // Create layout based on widget positions
    const layoutLogic = this.generateLayoutLogic(design.widgets);

    return `
// View renders the application
func (m *Model) View() string {
    if !m.ready {
        return "Initializing dashboard..."
    }

    // Render individual widgets
${widgetRenders}

    // Layout widgets
${layoutLogic}
    
    return dashboard
}`;
  }

  private generateLayoutLogic(widgets: Widget[]): string {
    // Simple grid-based layout for now
    // In a more sophisticated implementation, we'd use the actual positions
    
    let layout = '    var rows []string\n';
    
    // Group widgets by row (y position)
    const rowGroups: { [row: number]: Widget[] } = {};
    widgets.forEach(widget => {
      const row = Math.floor(widget.position.y / 4);
      if (!rowGroups[row]) {
        rowGroups[row] = [];
      }
      rowGroups[row].push(widget);
    });

    Object.keys(rowGroups).sort((a, b) => parseInt(a) - parseInt(b)).forEach(rowKey => {
      const row = parseInt(rowKey);
      const rowWidgets = rowGroups[row];
      
      layout += `\n    // Row ${row}\n`;
      const widgetNames = rowWidgets.map(w => `${w.id}Widget`).join(', ');
      layout += `    row${row} := lipgloss.JoinHorizontal(lipgloss.Top, ${widgetNames})\n`;
      layout += `    rows = append(rows, row${row})\n`;
    });

    layout += '\n    dashboard := lipgloss.JoinVertical(lipgloss.Left, rows...)\n';
    layout += '    return lipgloss.NewStyle().Margin(1).Render(dashboard)';

    return layout;
  }

  private generateMain(): string {
    return `
func main() {
    ctx := context.Background()
    model := NewModel(ctx)
    
    program := tea.NewProgram(model, tea.WithAltScreen())
    
    if err := program.Start(); err != nil {
        log.Fatalf("Error starting program: %v", err)
    }
}`;
  }

  private generateGoMod(): GeneratedFile {
    return {
      filename: 'go.mod',
      content: `module dashboard

go 1.19

require (
    github.com/charmbracelet/bubbletea v0.24.2
    github.com/charmbracelet/lipgloss v0.9.1
    github.com/charmbracelet/bubbles v0.16.1
    github.com/shirou/gopsutil/v3 v3.23.10
)`,
      language: 'go'
    };
  }

  private generateGoSum(): GeneratedFile {
    return {
      filename: 'go.sum',
      content: `// Generated automatically - run 'go mod tidy' to populate`,
      language: 'text'
    };
  }

  private generateWidgetImports(): string {
    return `package main

import (
    "github.com/charmbracelet/lipgloss"
)`;
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
        errors.push(`Widget type '${widget.type}' is not supported in Bubble Tea`);
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
      'github.com/charmbracelet/bubbletea@v0.24.2',
      'github.com/charmbracelet/lipgloss@v0.9.1',
      'github.com/charmbracelet/bubbles@v0.16.1',
      'github.com/shirou/gopsutil/v3@v3.23.10'
    ];
  }

  private getInstructions(): string {
    return `# Installation Instructions

1. Ensure Go 1.19+ is installed:
   go version

2. Initialize Go module (if not already done):
   go mod init dashboard

3. Install dependencies:
   go mod tidy

4. Run the dashboard:
   go run main.go

5. Controls:
   - 'q' or Ctrl+C: Quit the application

6. Customize the dashboard by editing the generated Go code.`;
  }
}

export { BubbleTeaAdapter };