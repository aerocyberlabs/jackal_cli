import { Widget } from '@cli-designer/core';

export class WidgetTemplates {
  static generateTextWidget(widget: Widget): string {
    const dataSourceId = widget.dataSource || '';
    const hasDataSource = dataSourceId !== '';
    
    return `
class ${widget.id}(Static):
    """Text display widget"""
    
    def __init__(self):
        super().__init__()
        self.data_source_id = "${dataSourceId}"
        ${hasDataSource ? 'self.update_content()' : `self.update("${widget.title || 'Text Widget'}")`}
    
    def on_mount(self) -> None:
        self.styles.width = ${widget.size.width}
        self.styles.height = ${widget.size.height}
        ${hasDataSource ? 'self.set_interval(2.0, self.update_content)' : ''}
    
    ${hasDataSource ? `
    def update_content(self) -> None:
        """Update text from data source"""
        try:
            data = get_widget_data(self.data_source_id, "${widget.title || 'No Data'}")
            if isinstance(data, (int, float)):
                formatted_data = format_metric_value(data, 'number')
                self.update(f"${widget.title || 'Value'}: {formatted_data}")
            else:
                self.update(f"${widget.title || 'Data'}: {str(data)[:100]}")
        except Exception as e:
            self.update(f"${widget.title || 'Error'}: {str(e)}")` : ''}
`;
  }

  static generateLineChart(widget: Widget): string {
    return `
class ${widget.id}(Static):
    """Line chart widget"""
    
    def __init__(self):
        super().__init__()
        self.data = []
        
    def on_mount(self) -> None:
        self.styles.width = ${widget.size.width}
        self.styles.height = ${widget.size.height}
        self.set_interval(1.0, self.update_chart)
    
    def update_chart(self) -> None:
        # Update chart data here
        pass
`;
  }

  static generateBarChart(widget: Widget): string {
    const orientation = widget.properties?.orientation || 'vertical';
    const showValues = widget.properties?.showValues !== false;
    const showLegend = widget.properties?.showLegend !== false;
    
    return `
class ${widget.id}(Static):
    """Bar chart widget"""
    
    def __init__(self):
        super().__init__()
        self.data = [
            ("Category A", 25),
            ("Category B", 40),
            ("Category C", 15),
            ("Category D", 30)
        ]
        self.orientation = "${orientation}"
        self.show_values = ${showValues ? 'True' : 'False'}
        self.show_legend = ${showLegend ? 'True' : 'False'}
        
    def on_mount(self) -> None:
        self.styles.width = ${widget.size.width}
        self.styles.height = ${widget.size.height}
        self.render_chart()
        self.set_interval(2.0, self.update_chart)
    
    def render_chart(self) -> None:
        try:
            import plotext as plt
            plt.clear_data()
            plt.clear_figure()
            
            categories, values = zip(*self.data)
            
            if self.orientation == "horizontal":
                plt.bar(categories, values, orientation="horizontal")
            else:
                plt.bar(categories, values)
                
            plt.title("${widget.title || 'Bar Chart'}")
            
            if self.show_legend:
                plt.show_legend()
                
            plt.canvas_color('none')
            plt.axes_color('white')
            plt.ticks_color('white')
            
            chart_str = plt.build()
            self.update(chart_str)
            
        except ImportError:
            self.update("Bar Chart\\n[plotext not available]\\nInstall: pip install plotext")
        except Exception as e:
            self.update(f"Bar Chart\\n[Error: {str(e)}]")
    
    def update_chart(self) -> None:
        # Simulate data updates
        import random
        self.data = [(cat, random.randint(10, 50)) for cat, _ in self.data]
        self.render_chart()
`;
  }

  static generateTable(widget: Widget): string {
    const showHeaders = widget.properties?.showHeaders !== false;
    const sortable = widget.properties?.sortable !== false;
    const maxRows = widget.properties?.maxRows || 100;
    
    return `
class ${widget.id}(Static):
    """Data table widget"""
    
    def __init__(self):
        super().__init__()
        self.headers = ["ID", "Name", "Status", "Value"]
        self.data = [
            ["001", "Item A", "Active", "125"],
            ["002", "Item B", "Pending", "87"],
            ["003", "Item C", "Complete", "203"],
            ["004", "Item D", "Active", "156"]
        ]
        self.show_headers = ${showHeaders ? 'True' : 'False'}
        self.sortable = ${sortable ? 'True' : 'False'}
        self.max_rows = ${maxRows}
        
    def on_mount(self) -> None:
        self.styles.width = ${widget.size.width}
        self.styles.height = ${widget.size.height}
        self.render_table()
        self.set_interval(3.0, self.update_data)
    
    def render_table(self) -> None:
        try:
            from rich.console import Console
            from rich.table import Table
            from rich.text import Text
            
            table = Table(show_header=self.show_headers)
            
            # Add columns
            for header in self.headers:
                table.add_column(header, style="cyan")
            
            # Add rows (limited by max_rows)
            for row in self.data[:self.max_rows]:
                table.add_row(*row)
            
            # Render to string
            console = Console(width=${widget.size.width}, height=${widget.size.height})
            with console.capture() as capture:
                console.print(table)
            
            self.update(capture.get())
            
        except ImportError:
            # Fallback to simple ASCII table
            table_str = "${widget.title || 'Table'}\\n"
            table_str += "-" * ${widget.size.width} + "\\n"
            
            if self.show_headers:
                header_row = " | ".join(h[:10] for h in self.headers)
                table_str += header_row + "\\n"
                table_str += "-" * len(header_row) + "\\n"
            
            for row in self.data[:self.max_rows]:
                row_str = " | ".join(str(cell)[:10] for cell in row)
                table_str += row_str + "\\n"
            
            self.update(table_str)
        except Exception as e:
            self.update(f"Table\\n[Error: {str(e)}]")
    
    def update_data(self) -> None:
        # Simulate data updates
        import random
        statuses = ["Active", "Pending", "Complete", "Error"]
        for i, row in enumerate(self.data):
            row[2] = random.choice(statuses)
            row[3] = str(random.randint(50, 300))
        self.render_table()
`;
  }

  static generateProgressBar(widget: Widget): string {
    const showPercentage = widget.properties?.showPercentage !== false;
    const color = widget.properties?.color || 'blue';
    const animated = widget.properties?.animated === true;
    
    return `
class ${widget.id}(Static):
    """Progress bar widget"""
    
    def __init__(self):
        super().__init__()
        self.progress = 0
        self.show_percentage = ${showPercentage ? 'True' : 'False'}
        self.color = "${color}"
        self.animated = ${animated ? 'True' : 'False'}
        
    def on_mount(self) -> None:
        self.styles.width = ${widget.size.width}
        self.styles.height = ${widget.size.height}
        self.update_progress()
        if self.animated:
            self.set_interval(0.5, self.animate_progress)
        else:
            self.set_interval(2.0, self.update_progress)
    
    def render_progress(self) -> None:
        width = ${widget.size.width - 2}
        filled = int((self.progress / 100) * width)
        empty = width - filled
        
        # Color mapping for different themes
        colors = {
            'blue': '█',
            'green': '█', 
            'yellow': '█',
            'red': '█'
        }
        
        fill_char = colors.get(self.color, '█')
        empty_char = '░'
        
        bar = fill_char * filled + empty_char * empty
        
        if self.show_percentage:
            progress_text = f"${widget.title || 'Progress'}: [{bar}] {self.progress:.1f}%"
        else:
            progress_text = f"${widget.title || 'Progress'}: [{bar}]"
            
        self.update(progress_text)
    
    def update_progress(self) -> None:
        # Simulate progress updates
        import random
        self.progress = random.uniform(0, 100)
        self.render_progress()
    
    def animate_progress(self) -> None:
        # Smooth animation
        self.progress = (self.progress + 2) % 100
        self.render_progress()
`;
  }

  static generateSparkline(widget: Widget): string {
    const style = widget.properties?.style || 'line';
    const showMinMax = widget.properties?.showMinMax !== false;
    
    return `
class ${widget.id}(Static):
    """Sparkline widget for compact trends"""
    
    def __init__(self):
        super().__init__()
        self.data = [23, 25, 24, 27, 30, 28, 26, 29, 31, 28, 25, 27]
        self.style = "${style}"
        self.show_min_max = ${showMinMax ? 'True' : 'False'}
        
    def on_mount(self) -> None:
        self.styles.width = ${widget.size.width}
        self.styles.height = ${widget.size.height}
        self.render_sparkline()
        self.set_interval(2.0, self.update_data)
    
    def render_sparkline(self) -> None:
        if not self.data:
            self.update("No data")
            return
            
        min_val = min(self.data)
        max_val = max(self.data)
        current_val = self.data[-1]
        
        if self.style == "bar":
            # Bar style sparkline
            chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
            if max_val == min_val:
                sparkline = chars[4] * len(self.data)
            else:
                sparkline = ""
                for val in self.data:
                    normalized = (val - min_val) / (max_val - min_val)
                    char_index = int(normalized * (len(chars) - 1))
                    sparkline += chars[char_index]
        else:
            # Line style sparkline
            chars = ['_', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
            if max_val == min_val:
                sparkline = "─" * len(self.data)
            else:
                sparkline = ""
                for i, val in enumerate(self.data):
                    normalized = (val - min_val) / (max_val - min_val)
                    char_index = int(normalized * (len(chars) - 1))
                    sparkline += chars[char_index]
        
        # Build display text
        title = "${widget.title || 'Trend'}"
        if self.show_min_max:
            display = f"{title}\\n{sparkline}\\nMin: {min_val} Max: {max_val} Current: {current_val}"
        else:
            display = f"{title}\\n{sparkline}\\nCurrent: {current_val}"
            
        self.update(display)
    
    def update_data(self) -> None:
        import random
        # Simulate trending data
        last_val = self.data[-1]
        change = random.uniform(-3, 3)
        new_val = max(0, last_val + change)
        self.data = self.data[1:] + [new_val]
        self.render_sparkline()
`;
  }

  static generateGauge(widget: Widget): string {
    const minVal = widget.properties?.min || 0;
    const maxVal = widget.properties?.max || 100;
    const showValue = widget.properties?.showValue !== false;
    const units = widget.properties?.units || '%';
    
    return `
class ${widget.id}(Static):
    """Circular gauge widget"""
    
    def __init__(self):
        super().__init__()
        self.value = 45
        self.min_val = ${minVal}
        self.max_val = ${maxVal}
        self.show_value = ${showValue ? 'True' : 'False'}
        self.units = "${units}"
        
    def on_mount(self) -> None:
        self.styles.width = ${widget.size.width}
        self.styles.height = ${widget.size.height}
        self.render_gauge()
        self.set_interval(2.0, self.update_value)
    
    def render_gauge(self) -> None:
        # Normalize value to 0-1 range
        normalized = (self.value - self.min_val) / (self.max_val - self.min_val)
        normalized = max(0, min(1, normalized))
        
        # Simple ASCII gauge representation
        gauge_chars = ['○', '◔', '◑', '◕', '●']
        char_index = int(normalized * (len(gauge_chars) - 1))
        gauge_symbol = gauge_chars[char_index]
        
        # Create gauge display
        title = "${widget.title || 'Gauge'}"
        
        # Simple arc representation
        arc_length = 20
        filled = int(normalized * arc_length)
        arc = '█' * filled + '░' * (arc_length - filled)
        
        if self.show_value:
            display = f"{title}\\n  {gauge_symbol}\\n [{arc}]\\n {self.value:.1f}{self.units}"
        else:
            display = f"{title}\\n  {gauge_symbol}\\n [{arc}]"
            
        self.update(display)
    
    def update_value(self) -> None:
        import random
        # Simulate gauge value changes
        self.value = random.uniform(self.min_val, self.max_val)
        self.render_gauge()
`;
  }

  static generateLogViewer(widget: Widget): string {
    const maxLines = widget.properties?.maxLines || 1000;
    const autoScroll = widget.properties?.autoScroll !== false;
    const showTimestamp = widget.properties?.showTimestamp !== false;
    const filter = widget.properties?.filter || '';
    
    return `
class ${widget.id}(Static):
    """Log viewer widget"""
    
    def __init__(self):
        super().__init__()
        self.logs = []
        self.max_lines = ${maxLines}
        self.auto_scroll = ${autoScroll ? 'True' : 'False'}
        self.show_timestamp = ${showTimestamp ? 'True' : 'False'}
        self.filter = "${filter}"
        self.log_levels = ["INFO", "WARN", "ERROR", "DEBUG"]
        
    def on_mount(self) -> None:
        self.styles.width = ${widget.size.width}
        self.styles.height = ${widget.size.height}
        self.generate_sample_logs()
        self.render_logs()
        self.set_interval(1.0, self.add_log_entry)
    
    def generate_sample_logs(self) -> None:
        import random
        from datetime import datetime, timedelta
        
        messages = [
            "Application started successfully",
            "Database connection established", 
            "Processing user request",
            "Cache updated",
            "Background job completed",
            "Configuration loaded",
            "API endpoint called",
            "Data validation passed"
        ]
        
        # Generate initial log entries
        base_time = datetime.now() - timedelta(minutes=30)
        for i in range(20):
            timestamp = base_time + timedelta(seconds=i * 5)
            level = random.choice(self.log_levels)
            message = random.choice(messages)
            
            if self.show_timestamp:
                log_entry = f"[{timestamp.strftime('%H:%M:%S')}] {level}: {message}"
            else:
                log_entry = f"{level}: {message}"
                
            self.logs.append(log_entry)
    
    def add_log_entry(self) -> None:
        import random
        from datetime import datetime
        
        messages = [
            "Request processed in 245ms",
            "Memory usage: 67%", 
            "New user session created",
            "File uploaded successfully",
            "Backup completed",
            "Cache miss for key: user_data",
            "Network latency: 12ms"
        ]
        
        level = random.choice(self.log_levels)
        message = random.choice(messages)
        
        if self.show_timestamp:
            log_entry = f"[{datetime.now().strftime('%H:%M:%S')}] {level}: {message}"
        else:
            log_entry = f"{level}: {message}"
        
        self.logs.append(log_entry)
        
        # Keep only max_lines
        if len(self.logs) > self.max_lines:
            self.logs = self.logs[-self.max_lines:]
            
        self.render_logs()
    
    def render_logs(self) -> None:
        display_logs = self.logs
        
        # Apply filter if specified
        if self.filter:
            display_logs = [log for log in self.logs if self.filter.lower() in log.lower()]
        
        # Get visible lines based on widget height
        visible_lines = ${widget.size.height - 2}  # Leave space for title and border
        
        if self.auto_scroll:
            # Show most recent logs
            visible_logs = display_logs[-visible_lines:]
        else:
            # Show from beginning
            visible_logs = display_logs[:visible_lines]
        
        title = "${widget.title || 'Logs'}"
        log_text = title + "\\n" + "\\n".join(visible_logs)
        
        self.update(log_text)
`;
  }

  static generateMetricCard(widget: Widget): string {
    const label = widget.properties?.label || 'Metric';
    const format = widget.properties?.format || 'number';
    const trend = widget.properties?.trend === true;
    const sparkline = widget.properties?.sparkline === true;
    const dataSourceId = widget.dataSource || '';
    const hasDataSource = dataSourceId !== '';
    
    return `
class ${widget.id}(Static):
    """Single metric display card"""
    
    def __init__(self):
        super().__init__()
        self.data_source_id = "${dataSourceId}"
        ${hasDataSource ? 'self.value = 0.0' : 'self.value = 42.5'}
        self.previous_value = ${hasDataSource ? '0.0' : '38.2'}
        self.label = "${label}"
        self.format = "${format}"
        self.show_trend = ${trend ? 'True' : 'False'}
        self.show_sparkline = ${sparkline ? 'True' : 'False'}
        self.history = ${hasDataSource ? '[]' : '[30, 32, 35, 38, 40, 42, 39, 41, 43, 42.5]'}
        
    def on_mount(self) -> None:
        self.styles.width = ${widget.size.width}
        self.styles.height = ${widget.size.height}
        self.render_metric()
        self.set_interval(3.0, self.update_metric)
    
    def format_value(self, value: float) -> str:
        if self.format == "percentage":
            return f"{value:.1f}%"
        elif self.format == "bytes":
            units = ["B", "KB", "MB", "GB", "TB"]
            size = value
            unit_index = 0
            while size >= 1024 and unit_index < len(units) - 1:
                size /= 1024
                unit_index += 1
            return f"{size:.1f} {units[unit_index]}"
        else:  # number
            if value >= 1000000:
                return f"{value/1000000:.1f}M"
            elif value >= 1000:
                return f"{value/1000:.1f}K"
            else:
                return f"{value:.1f}"
    
    def render_metric(self) -> None:
        title = "${widget.title || 'Metric'}"
        formatted_value = self.format_value(self.value)
        
        # Build display components
        components = [title, f"{self.label}: {formatted_value}"]
        
        if self.show_trend:
            if self.value > self.previous_value:
                trend_indicator = "↗ +" + self.format_value(self.value - self.previous_value)
                trend_color = "green"
            elif self.value < self.previous_value:
                trend_indicator = "↘ -" + self.format_value(self.previous_value - self.value) 
                trend_color = "red"
            else:
                trend_indicator = "→ No change"
                trend_color = "gray"
            
            components.append(trend_indicator)
        
        if self.show_sparkline and len(self.history) > 1:
            # Mini sparkline
            min_val = min(self.history)
            max_val = max(self.history)
            
            if max_val > min_val:
                sparkline_chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
                sparkline = ""
                for val in self.history[-10:]:  # Last 10 values
                    normalized = (val - min_val) / (max_val - min_val)
                    char_index = int(normalized * (len(sparkline_chars) - 1))
                    sparkline += sparkline_chars[char_index]
                components.append(sparkline)
        
        display = "\\n".join(components)
        self.update(display)
    
    def update_metric(self) -> None:
        ${hasDataSource ? `
        # Get data from data source
        try:
            new_value = get_widget_data(self.data_source_id, self.value)
            if isinstance(new_value, (int, float)):
                self.previous_value = self.value
                self.value = float(new_value)
                
                # Update history for sparkline
                self.history.append(self.value)
                if len(self.history) > 20:
                    self.history = self.history[-20:]
            elif len(self.history) == 0:
                # Initialize with some default values if no history
                self.history = [self.value] * 10
        except Exception as e:
            pass  # Keep previous value on error` : `
        import random
        
        # Store previous value for trend calculation
        self.previous_value = self.value
        
        # Simulate metric updates with some realistic variance
        change_percent = random.uniform(-0.2, 0.2)  # ±20% change
        self.value = max(0, self.value * (1 + change_percent))
        
        # Update history for sparkline
        self.history.append(self.value)
        if len(self.history) > 20:
            self.history = self.history[-20:]`}
        
        self.render_metric()
`;
  }
}