# Jackal CLI - TUI Dashboard Designer

```
     ╔══════════════════════════════════════════════════════════════╗
     ║  ╦╔═╗╔═╗╦╔═╔═╗╦    ┌─┐┬  ┬                                ║
     ║  ║╠═╣║  ╠╩╗╠═╣║    │  │  │                                ║
     ║ ╚╝╩ ╩╚═╝╩ ╩╩ ╩╩═╝  └─┘┴─┘┴                                ║
     ║                                                            ║
     ║  Terminal User Interface Dashboard Designer & Code Gen     ║
     ╚══════════════════════════════════════════════════════════════╝
     
     ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
     │   Web Designer  │─▶│  JSON Config    │─▶│  Generated Code │
     └─────────────────┘  └─────────────────┘  └─────────────────┘
     
     Supports: Python/Textual │ Go/Bubble Tea │ Rust/Ratatui │ Node.js/Blessed
```

A professional visual designer and code generator for creating terminal-based dashboards across multiple TUI frameworks. Design once, deploy everywhere.

## Support Development

[![GitHub Sponsors](https://img.shields.io/github/sponsors/aerocyberlabs?style=social)](https://github.com/sponsors/aerocyberlabs)

Help fund continued development and new framework integrations.

## Overview

Jackal CLI bridges the gap between visual design and terminal application development. Using an intuitive web-based interface, developers can design sophisticated dashboards with real-time data sources and export production-ready code for their preferred TUI framework.

### Key Features

- **Visual Drag & Drop Designer**: Browser-based interface with grid-based layout system
- **Multi-Framework Code Generation**: Single design exports to 4 different TUI frameworks
- **Real-time Data Integration**: Built-in support for system metrics, APIs, files, and commands  
- **Live Preview**: Terminal-accurate preview with ASCII rendering
- **Comprehensive Widget Library**: 9 widget types covering most dashboard use cases
- **Smart Layout Engine**: Collision detection, grid snapping, and automatic positioning
- **Type-safe Schemas**: Full TypeScript support with Zod validation
- **Modular Architecture**: Clean separation between design, generation, and framework adapters

### Supported Frameworks

| Framework | Language | Status | Features |
|-----------|----------|--------|----------|
| **Textual** | Python | Complete | Async widgets, rich rendering, mouse support |
| **Bubble Tea** | Go | Complete | Concurrent updates, tea.Model pattern, channels |
| **Ratatui** | Rust | Complete | Zero-cost abstractions, memory safety, tokio async |
| **Blessed** | Node.js | Complete | Event-driven architecture, blessed-contrib widgets |

### Widget Types

- **Text Display**: Static content, dynamic data binding, formatting options
- **Line Charts**: Time-series data, multiple series, customizable styling  
- **Bar Charts**: Horizontal/vertical orientation, categorical data visualization
- **Tables**: Sortable columns, pagination, data formatting
- **Progress Bars**: Percentage displays, animated progress, custom colors
- **Sparklines**: Compact trend visualization, historical data
- **Gauges**: Circular progress indicators, threshold colors, value displays
- **Log Viewers**: Real-time log streaming, syntax highlighting, filtering
- **Metric Cards**: KPI displays, trend indicators, formatted values

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Python 3.8+ (for Textual generated code)
- Go 1.19+ (for Bubble Tea generated code)
- Rust 1.70+ (for Ratatui generated code)

### Installation

```bash
git clone https://github.com/aerocyberlabs/jackal_cli.git
cd jackal_cli
pnpm install
```

### Development Mode

```bash
# Start the web designer
pnpm dev

# Open browser to http://localhost:3000
# Design your dashboard using the visual interface
```

### Building and Code Generation

```bash
# Build all modules
pnpm build

# Generate code from a design file
node cli/dist/cli.js examples/system-monitor.json output/ --framework textual

# Run generated dashboard
cd output/
pip install -r requirements.txt
python dashboard.py
```

## Project Structure

```
jackal_cli/
├── core/                  # Shared TypeScript library
│   ├── src/
│   │   ├── dashboard-schema.ts    # Zod schemas for validation
│   │   ├── widget-registry.ts     # Widget definitions and properties
│   │   └── utils/                 # Layout and validation utilities
├── frontend/              # React-based visual designer
│   ├── src/
│   │   ├── components/            # UI components
│   │   ├── store/                 # Zustand state management
│   │   └── App.tsx               # Main application
├── adapters/              # Framework-specific code generators
│   ├── textual/          # Python/Textual adapter
│   ├── bubbletea/        # Go/Bubble Tea adapter  
│   ├── ratatui/          # Rust/Ratatui adapter
│   └── blessed/          # Node.js/Blessed adapter
├── cli/                   # Command-line interface
└── examples/              # Sample dashboard designs
```

## Usage Guide

### Design Process

1. **Create Layout**: Drag widgets from the library to the canvas
2. **Configure Properties**: Use the properties panel to customize widget behavior  
3. **Add Data Sources**: Configure system metrics, APIs, files, or commands in the data sources tab
4. **Connect Data**: Bind widgets to data sources for dynamic content
5. **Preview**: Use the live preview to verify layout and styling
6. **Export**: Generate code for your target framework

### Data Source Types

**System Metrics**
- CPU usage percentage
- Memory usage and availability  
- Disk space and I/O statistics
- Network throughput
- Process counts and load averages

**API Endpoints**
- HTTP GET/POST requests
- Custom headers and authentication
- Configurable refresh intervals
- JSON response handling

**File Monitoring**
- Real-time file watching
- Log file tailing
- Change detection
- Custom parsing

**Command Execution**
- Shell command output
- Scheduled execution
- Error handling
- Output formatting

### Code Generation Options

```bash
# Single file output (for simple deployments)
node cli/dist/cli.js design.json output/ --format single

# Modular output (for larger projects)  
node cli/dist/cli.js design.json output/ --format modular

# Framework-specific generation
node cli/dist/cli.js design.json output/ --framework textual
node cli/dist/cli.js design.json output/ --framework bubbletea
node cli/dist/cli.js design.json output/ --framework ratatui
node cli/dist/cli.js design.json output/ --framework blessed
```

## API Reference

### Core Types

```typescript
interface DashboardDesign {
  metadata: {
    name: string;
    targetFramework: Framework;
    version?: string;
  };
  settings: {
    dimensions: { width: number; height: number };
    gridSize: number;
    theme: string;
    refreshRate: number;
  };
  widgets: Widget[];
  dataSources: DataSource[];
}

interface Widget {
  id: string;
  type: WidgetType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  title?: string;
  dataSource?: string;
}

interface DataSource {
  id: string;
  name: string;
  config: {
    type: 'system_metric' | 'api' | 'file' | 'command';
    // Type-specific configuration options
  };
}
```

### Framework Adapter Interface

```typescript
abstract class FrameworkAdapter {
  abstract generate(design: DashboardDesign, options: CodeGenOptions): GeneratedCode;
  abstract validateDesign(design: DashboardDesign): string[];
  abstract getDependencies(): string[];
}
```

## Examples

### System Monitoring Dashboard

```bash
# Generate a complete system monitoring dashboard
node cli/dist/cli.js examples/system-monitor.json output/
```

Features CPU, memory, disk usage widgets with real-time system metrics.

### API Dashboard

```bash
# Generate a dashboard for API monitoring
node cli/dist/cli.js examples/api-monitor.json output/
```

Displays API response times, status codes, and error rates.

### Log Analysis Dashboard

```bash
# Generate a log analysis dashboard
node cli/dist/cli.js examples/log-analysis.json output/
```

Real-time log streaming with filtering and search capabilities.

## Testing

```bash
# Run all tests
pnpm test

# Test specific module
pnpm test --filter core
pnpm test --filter frontend

# Test framework adapters
pnpm test --filter @cli-designer/adapter-textual
pnpm test --filter @cli-designer/adapter-bubbletea
```

## Feedback and Discussion

We welcome feedback, bug reports, and feature suggestions! While this project is actively developed by AeroCyberLabs, community input is valuable.

### How to Provide Feedback

- **Bug Reports**: Open an issue with detailed reproduction steps
- **Feature Requests**: Create an issue describing your use case and proposed solution
- **Questions**: Use GitHub Discussions for general questions about usage
- **Feedback**: Share your experience and suggestions in issues or discussions

### Development Status

This project is actively maintained by AeroCyberLabs. We appreciate community feedback and will consider high-value contributions on a case-by-case basis.

### Development Setup (For Testing/Feedback)

```bash
# Clone and install dependencies
git clone https://github.com/aerocyberlabs/jackal_cli.git
cd jackal_cli
pnpm install

# Start development environment
pnpm dev

# Run tests
pnpm test
```

## Architecture

### Design Philosophy

Jackal CLI follows a plugin-based architecture where each TUI framework is implemented as an independent adapter. This allows for:

- **Framework Independence**: Each adapter can be developed and tested separately
- **Consistent API**: All adapters implement the same interface for predictable behavior
- **Extensibility**: New frameworks can be added without modifying existing code
- **Type Safety**: Full TypeScript support ensures compile-time correctness

### Code Generation Pipeline

1. **Schema Validation**: Input designs are validated against Zod schemas
2. **Layout Processing**: Widget positions and sizes are optimized for the target framework  
3. **Data Source Analysis**: Dependencies and initialization code are determined
4. **Template Rendering**: Framework-specific code is generated using template engines
5. **Output Assembly**: Multiple files are combined with proper imports and dependencies

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Textual](https://github.com/Textualize/textual) - Rich framework for building TUIs in Python
- [Bubble Tea](https://github.com/charmbracelet/bubbletea) - Powerful TUI framework for Go
- [Ratatui](https://github.com/ratatui-org/ratatui) - Rust library for building rich terminal UIs
- [Blessed](https://github.com/chjj/blessed) - Curses-like library for Node.js

---

**Jackal CLI** - Bridging visual design and terminal development
