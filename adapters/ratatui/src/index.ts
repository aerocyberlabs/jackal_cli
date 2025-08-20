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

export class RatatuiAdapter extends FrameworkAdapter {
  constructor() {
    super('ratatui');
  }

  generate(design: DashboardDesign, options: CodeGenOptions): GeneratedCode {
    const files: GeneratedFile[] = [];

    if (options.outputFormat === 'single') {
      files.push(this.generateSingleFile(design, options));
    } else {
      files.push(...this.generateModularFiles(design, options));
    }

    files.push(this.generateCargoToml());
    files.push(this.generateCargoLock());

    return {
      framework: 'ratatui',
      files,
      dependencies: {
        packages: this.getDependencies(),
        systemRequirements: ['Rust 1.70+', 'Cargo']
      },
      instructions: this.getInstructions()
    };
  }

  private generateSingleFile(design: DashboardDesign, options: CodeGenOptions): GeneratedFile {
    const uses = this.generateUses(design);
    const structs = this.generateStructs(design);
    const metricsCollector = SystemMetrics.generateMetricsCollector(design.dataSources);
    const dataUpdater = SystemMetrics.generateDataSourceUpdater(design.dataSources);
    const widgetComponents = design.widgets.map(w => this.generateWidgetComponent(w, options));
    const appImpl = this.generateAppImplementation(design, options);
    const main = this.generateMain();

    const content = [
      uses,
      structs,
      metricsCollector,
      dataUpdater,
      ...widgetComponents,
      appImpl,
      main
    ].filter(Boolean).join('\n\n');

    return {
      filename: 'src/main.rs',
      content,
      language: 'rust',
      executable: true
    };
  }

  private generateModularFiles(design: DashboardDesign, options: CodeGenOptions): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // Main application file
    files.push({
      filename: 'src/main.rs',
      content: this.generateMain() + '\n\n' + this.generateAppImplementation(design, options),
      language: 'rust',
      executable: true
    });

    // Widget components file
    const widgetUses = this.generateWidgetUses();
    const widgetComponents = design.widgets.map(w => this.generateWidgetComponent(w, options));
    
    files.push({
      filename: 'src/widgets.rs',
      content: [widgetUses, ...widgetComponents].join('\n\n'),
      language: 'rust'
    });

    // Data sources file if needed
    if (design.dataSources.length > 0) {
      files.push({
        filename: 'src/data_sources.rs',
        content: this.generateDataSources(design.dataSources),
        language: 'rust'
      });
    }

    // Lib file for modules
    files.push({
      filename: 'src/lib.rs',
      content: this.generateLibRs(design),
      language: 'rust'
    });

    return files;
  }

  private generateUses(design: DashboardDesign): string {
    const uses = [
      'use crossterm::{',
      '    event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode, KeyEventKind},',
      '    execute,',
      '    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},',
      '};',
      'use ratatui::{',
      '    backend::{Backend, CrosstermBackend},',
      '    layout::{Constraint, Direction, Layout, Rect},',
      '    style::{Color, Modifier, Style},',
      '    text::{Line, Span},',
      '    widgets::{Block, Borders, Clear, Gauge, List, ListItem, Paragraph, Table, Row, Cell},',
      '    Frame, Terminal,',
      '};',
      'use std::{',
      '    collections::HashMap,',
      '    error::Error,',
      '    io,',
      '    time::{Duration, Instant},',
      '};'
    ];

    // Add system monitoring imports if needed
    const hasSystemMetrics = design.dataSources.some(ds => ds.config.type === 'system_metric');
    if (hasSystemMetrics) {
      uses.push(
        '',
        'use sysinfo::{CpuExt, System, SystemExt, DiskExt, NetworkExt};'
      );
    }

    // Add HTTP client imports for API sources
    const hasApiSources = design.dataSources.some(ds => ds.config.type === 'api');
    if (hasApiSources) {
      uses.push(
        'use reqwest;',
        'use serde_json;',
        'use tokio;'
      );
    }

    return uses.join('\n');
  }

  private generateStructs(design: DashboardDesign): string {
    const hasDataSources = design.dataSources && design.dataSources.length > 0;

    let appFields = [
      'running: bool',
      'last_tick: Instant'
    ];

    // Add widget-specific fields
    design.widgets.forEach(widget => {
      switch (widget.type) {
        case 'progress_bar':
          appFields.push(`${widget.id}_progress: f64`);
          break;
        case 'table':
          appFields.push(`${widget.id}_data: Vec<Vec<String>>`);
          break;
        case 'log_viewer':
          appFields.push(`${widget.id}_logs: Vec<String>`);
          break;
        case 'sparkline':
          appFields.push(`${widget.id}_data: Vec<f64>`);
          break;
        case 'metric_card':
          appFields.push(`${widget.id}_value: f64`);
          appFields.push(`${widget.id}_previous: f64`);
          break;
      }
    });

    if (hasDataSources) {
      appFields.push('data_cache: HashMap<String, serde_json::Value>');
      appFields.push('last_update: HashMap<String, Instant>');
      appFields.push('system: System');
    }

    return `
#[derive(Debug, Clone)]
pub struct DataPoint {
    pub value: f64,
    pub timestamp: Instant,
}

pub struct App {
    ${appFields.join(',\n    ')},
}

impl Default for App {
    fn default() -> App {
        App {
            running: true,
            last_tick: Instant::now(),${design.widgets.map(widget => {
              switch (widget.type) {
                case 'progress_bar':
                  return `\n            ${widget.id}_progress: ${widget.properties?.animated ? '0.0' : '45.0'},`;
                case 'table':
                  return `\n            ${widget.id}_data: vec![
                vec!["001".to_string(), "Item A".to_string(), "Active".to_string(), "125".to_string()],
                vec!["002".to_string(), "Item B".to_string(), "Pending".to_string(), "87".to_string()],
                vec!["003".to_string(), "Item C".to_string(), "Complete".to_string(), "203".to_string()],
            ],`;
                case 'log_viewer':
                  return `\n            ${widget.id}_logs: vec![
                "INFO: Application started successfully".to_string(),
                "INFO: Database connection established".to_string(),
                "WARN: High memory usage detected".to_string(),
            ],`;
                case 'sparkline':
                  return `\n            ${widget.id}_data: vec![23.0, 25.0, 24.0, 27.0, 30.0, 28.0, 26.0, 29.0, 31.0, 28.0, 25.0, 27.0],`;
                case 'metric_card':
                  return `\n            ${widget.id}_value: 42.5,\n            ${widget.id}_previous: 38.2,`;
                default:
                  return '';
              }
            }).join('')}${hasDataSources ? `
            data_cache: HashMap::new(),
            last_update: HashMap::new(),
            system: System::new_all(),` : ''}
        }
    }
}`;
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
impl App {
    fn render_${widget.id}(&self, f: &mut Frame, area: Rect) {
        let block = Block::default()
            .title("${widget.title || widget.type}")
            .borders(Borders::ALL);
        
        let paragraph = Paragraph::new("${widget.title || widget.type}")
            .block(block);
            
        f.render_widget(paragraph, area);
    }
}`;
  }

  private generateAppImplementation(design: DashboardDesign, options: CodeGenOptions): string {
    const hasDataSources = design.dataSources && design.dataSources.length > 0;
    const updateMethod = this.generateUpdateMethod(design);
    const renderMethod = this.generateRenderMethod(design);
    const layoutMethod = this.generateLayoutMethod(design);

    let dataSourceMethods = '';
    if (hasDataSources) {
      dataSourceMethods = this.generateDataSourceMethods(design);
    }

    return `
impl App {
    pub fn new() -> App {
        App::default()
    }

    pub fn run(&mut self) {
        self.running = true;
    }

    pub fn quit(&mut self) {
        self.running = false;
    }

${updateMethod}

${renderMethod}

${layoutMethod}

${dataSourceMethods}
}`;
  }

  private generateUpdateMethod(design: DashboardDesign): string {
    const hasDataSources = design.dataSources && design.dataSources.length > 0;
    
    let updateBody = '';
    
    // Update animated widgets
    const animatedWidgets = design.widgets.filter(w => w.properties?.animated === true);
    if (animatedWidgets.length > 0) {
      updateBody += `
        // Update animations
        let now = Instant::now();
        if now.duration_since(self.last_tick).as_millis() > 100 {
            ${animatedWidgets.map(widget => {
              if (widget.type === 'progress_bar') {
                return `self.${widget.id}_progress += 2.0;
            if self.${widget.id}_progress > 100.0 {
                self.${widget.id}_progress = 0.0;
            }`;
              }
              return '';
            }).filter(Boolean).join('\n            ')}
            self.last_tick = now;
        }`;
    }

    if (hasDataSources) {
      updateBody += `
        
        // Update data sources
        self.update_data_sources();`;
    }

    return `
    pub fn update(&mut self) {${updateBody}
    }`;
  }

  private generateRenderMethod(design: DashboardDesign): string {
    const widgetRenders = design.widgets.map((widget, index) => 
      `        self.render_${widget.id}(f, chunks[${index}]);`
    ).join('\n');

    return `
    pub fn render<B: Backend>(&mut self, f: &mut Frame<B>) {
        let chunks = self.create_layout(f.size());
        
        ${widgetRenders}
    }`;
  }

  private generateLayoutMethod(design: DashboardDesign): string {
    // Simple layout for now - could be enhanced with actual positioning
    const constraints = design.widgets.map(widget => {
      const percentage = Math.floor((widget.size.height / design.settings.dimensions.height) * 100);
      return `Constraint::Percentage(${Math.max(percentage, 10)})`;
    }).join(', ');

    return `
    fn create_layout(&self, area: Rect) -> Vec<Rect> {
        Layout::default()
            .direction(Direction::Vertical)
            .constraints([${constraints}])
            .split(area)
            .to_vec()
    }`;
  }

  private generateDataSourceMethods(design: DashboardDesign): string {
    return `
    fn update_data_sources(&mut self) {
        // Refresh system information
        self.system.refresh_all();
        
        // Update metrics from data sources
        ${design.dataSources.filter(ds => ds.config.type === 'system_metric').map(ds => `
        // ${ds.id}: ${ds.config.metric}
        let ${ds.id}_value = self.get_system_metric("${ds.config.metric}");
        self.data_cache.insert("${ds.id}".to_string(), serde_json::json!(${ds.id}_value));`).join('')}
    }
    
    fn get_system_metric(&self, metric: &str) -> f64 {
        match metric {
            "cpu_percent" => {
                self.system.global_cpu_info().cpu_usage() as f64
            },
            "memory_percent" => {
                let used = self.system.used_memory() as f64;
                let total = self.system.total_memory() as f64;
                if total > 0.0 { (used / total) * 100.0 } else { 0.0 }
            },
            "memory_used" => {
                (self.system.used_memory() as f64) / (1024.0 * 1024.0 * 1024.0) // GB
            },
            "memory_total" => {
                (self.system.total_memory() as f64) / (1024.0 * 1024.0 * 1024.0) // GB
            },
            "disk_percent" => {
                let disks = self.system.disks();
                if let Some(disk) = disks.first() {
                    let used = disk.total_space() - disk.available_space();
                    ((used as f64) / (disk.total_space() as f64)) * 100.0
                } else {
                    0.0
                }
            },
            _ => 0.0,
        }
    }`;
  }

  private generateMain(): string {
    return `
fn main() -> Result<(), Box<dyn Error>> {
    // Setup terminal
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    // Create app and run it
    let tick_rate = Duration::from_millis(250);
    let app = App::new();
    let res = run_app(&mut terminal, app, tick_rate);

    // Restore terminal
    disable_raw_mode()?;
    execute!(
        terminal.backend_mut(),
        LeaveAlternateScreen,
        DisableMouseCapture
    )?;
    terminal.show_cursor()?;

    if let Err(err) = res {
        println!("{:?}", err);
    }

    Ok(())
}

fn run_app<B: Backend>(
    terminal: &mut Terminal<B>,
    mut app: App,
    tick_rate: Duration,
) -> io::Result<()> {
    let mut last_tick = Instant::now();
    
    loop {
        terminal.draw(|f| app.render(f))?;

        let timeout = tick_rate
            .checked_sub(last_tick.elapsed())
            .unwrap_or_else(|| Duration::from_secs(0));
            
        if crossterm::event::poll(timeout)? {
            if let Event::Key(key) = event::read()? {
                if key.kind == KeyEventKind::Press {
                    match key.code {
                        KeyCode::Char('q') | KeyCode::Esc => {
                            return Ok(());
                        }
                        KeyCode::Char('c') if key.modifiers.contains(crossterm::event::KeyModifiers::CONTROL) => {
                            return Ok(());
                        }
                        _ => {}
                    }
                }
            }
        }

        if last_tick.elapsed() >= tick_rate {
            app.update();
            last_tick = Instant::now();
        }
        
        if !app.running {
            return Ok(());
        }
    }
}`;
  }

  private generateCargoToml(): GeneratedFile {
    return {
      filename: 'Cargo.toml',
      content: `[package]
name = "dashboard"
version = "0.1.0"
edition = "2021"

[dependencies]
ratatui = "0.24"
crossterm = "0.27"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.0", features = ["full"] }
reqwest = { version = "0.11", features = ["json"] }
sysinfo = "0.29"`,
      language: 'toml'
    };
  }

  private generateCargoLock(): GeneratedFile {
    return {
      filename: 'Cargo.lock',
      content: `# This file is automatically generated by Cargo.
# It is not intended for manual editing.
# Run 'cargo build' to populate this file`,
      language: 'toml'
    };
  }

  private generateWidgetUses(): string {
    return `use ratatui::{
    backend::Backend,
    layout::Rect,
    widgets::{Block, Borders, Paragraph},
    Frame,
};
use crate::App;`;
  }

  private generateLibRs(design: DashboardDesign): string {
    const modules = ['widgets'];
    if (design.dataSources.length > 0) {
      modules.push('data_sources');
    }

    return modules.map(module => `pub mod ${module};`).join('\n');
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
        errors.push(`Widget type '${widget.type}' is not supported in Ratatui`);
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
      'ratatui = "0.24"',
      'crossterm = "0.27"',
      'serde = { version = "1.0", features = ["derive"] }',
      'serde_json = "1.0"',
      'tokio = { version = "1.0", features = ["full"] }',
      'reqwest = { version = "0.11", features = ["json"] }',
      'sysinfo = "0.29"'
    ];
  }

  private getInstructions(): string {
    return `# Installation Instructions

1. Ensure Rust 1.70+ and Cargo are installed:
   rustc --version
   cargo --version

2. Build the dashboard:
   cargo build --release

3. Run the dashboard:
   cargo run --release

4. Controls:
   - 'q' or Esc: Quit the application
   - Ctrl+C: Force quit

5. For development:
   cargo run

6. Customize the dashboard by editing the generated Rust code.`;
  }
}

export { RatatuiAdapter };