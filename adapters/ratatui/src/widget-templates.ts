import { Widget } from '@cli-designer/core';

export class WidgetTemplates {
  static generateTextWidget(widget: Widget): string {
    const dataSourceId = widget.dataSource || '';
    const hasDataSource = dataSourceId !== '';
    
    return `
impl App {
    fn render_${widget.id}(&self, f: &mut Frame, area: Rect) {
        ${hasDataSource ? `
        let content = if let Some(data) = self.data_cache.get("${dataSourceId}") {
            format!("${widget.title || 'Data'}: {}", data)
        } else {
            "${widget.title || 'Text Widget'}: Loading...".to_string()
        };` : `
        let content = "${widget.properties?.content || widget.title || 'Text Widget'}";`}
        
        let block = Block::default()
            .title("${widget.title || 'Text'}")
            .borders(Borders::ALL)
            .style(Style::default().fg(Color::White));
            
        let paragraph = Paragraph::new(content)
            .block(block)
            .style(Style::default().fg(Color::White));
            
        f.render_widget(paragraph, area);
    }
}`;
  }

  static generateLineChart(widget: Widget): string {
    return `
impl App {
    fn render_${widget.id}(&self, f: &mut Frame, area: Rect) {
        let block = Block::default()
            .title("${widget.title || 'Line Chart'}")
            .borders(Borders::ALL)
            .style(Style::default().fg(Color::White));
        
        // Simple ASCII line chart representation
        let chart_data = vec![
            "   /\\\\    /\\\\",
            "  /  \\\\  /  \\\\",
            " /    \\\\/    \\\\",
            "/            \\\\",
        ];
        
        let chart_content = chart_data.join("\\n");
        let paragraph = Paragraph::new(chart_content)
            .block(block)
            .style(Style::default().fg(Color::Cyan));
            
        f.render_widget(paragraph, area);
    }
}`;
  }

  static generateBarChart(widget: Widget): string {
    const orientation = widget.properties?.orientation || 'vertical';
    
    return `
impl App {
    fn render_${widget.id}(&self, f: &mut Frame, area: Rect) {
        let block = Block::default()
            .title("${widget.title || 'Bar Chart'}")
            .borders(Borders::ALL)
            .style(Style::default().fg(Color::White));
        
        // Sample data for demonstration
        let data = vec![("A", 25), ("B", 40), ("C", 15), ("D", 30)];
        
        let chart_content = ${orientation === 'horizontal' ? `
        // Horizontal bars
        data.iter()
            .map(|(label, value)| {
                let bar = "█".repeat(value / 2);
                format!("{}: {} {}", label, bar, value)
            })
            .collect::<Vec<String>>()
            .join("\\n")` : `
        // Vertical bars (simplified)
        let mut lines = Vec::new();
        for i in (0..=40).step_by(5).rev() {
            let mut line = String::new();
            for (_, value) in &data {
                if *value >= i {
                    line.push_str("█ ");
                } else {
                    line.push_str("  ");
                }
            }
            lines.push(line);
        }
        lines.push("A B C D".to_string());
        lines.join("\\n")`};
        
        let paragraph = Paragraph::new(chart_content)
            .block(block)
            .style(Style::default().fg(Color::Green));
            
        f.render_widget(paragraph, area);
    }
}`;
  }

  static generateTable(widget: Widget): string {
    const showHeaders = widget.properties?.showHeaders !== false;
    const maxRows = widget.properties?.maxRows || 100;
    
    return `
impl App {
    fn render_${widget.id}(&self, f: &mut Frame, area: Rect) {
        let block = Block::default()
            .title("${widget.title || 'Table'}")
            .borders(Borders::ALL)
            .style(Style::default().fg(Color::White));
        
        ${showHeaders ? `
        let header_cells = ["ID", "Name", "Status", "Value"]
            .iter()
            .map(|h| Cell::from(*h).style(Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD)));
        let header = Row::new(header_cells).height(1);` : ''}
        
        let rows: Vec<Row> = self.${widget.id}_data
            .iter()
            .take(${maxRows})
            .map(|item| {
                let cells = item.iter().map(|c| Cell::from(c.as_str()));
                Row::new(cells).height(1)
            })
            .collect();
        
        let table = Table::new(rows)
            .block(block)
            ${showHeaders ? '.header(header)' : ''}
            .widths(&[
                Constraint::Length(6),
                Constraint::Length(12),
                Constraint::Length(8),
                Constraint::Length(8),
            ])
            .column_spacing(1)
            .style(Style::default().fg(Color::White))
            .highlight_style(Style::default().bg(Color::DarkGray));
            
        f.render_widget(table, area);
    }
}`;
  }

  static generateProgressBar(widget: Widget): string {
    const showPercentage = widget.properties?.showPercentage !== false;
    const animated = widget.properties?.animated === true;
    
    return `
impl App {
    fn render_${widget.id}(&self, f: &mut Frame, area: Rect) {
        let block = Block::default()
            .title("${widget.title || 'Progress'}")
            .borders(Borders::ALL)
            .style(Style::default().fg(Color::White));
        
        let progress = self.${widget.id}_progress / 100.0;
        
        ${showPercentage ? `
        let label = format!("{:.1}%", self.${widget.id}_progress);
        let gauge = Gauge::default()
            .block(block)
            .gauge_style(Style::default().fg(Color::Green))
            .percent((self.${widget.id}_progress as u16).min(100))
            .label(label);` : `
        let gauge = Gauge::default()
            .block(block)
            .gauge_style(Style::default().fg(Color::Green))
            .percent((self.${widget.id}_progress as u16).min(100));`}
            
        f.render_widget(gauge, area);
    }
}`;
  }

  static generateSparkline(widget: Widget): string {
    const style = widget.properties?.style || 'line';
    const showMinMax = widget.properties?.showMinMax !== false;
    
    return `
impl App {
    fn render_${widget.id}(&self, f: &mut Frame, area: Rect) {
        let block = Block::default()
            .title("${widget.title || 'Trend'}")
            .borders(Borders::ALL)
            .style(Style::default().fg(Color::White));
        
        let data = &self.${widget.id}_data;
        
        if data.is_empty() {
            let paragraph = Paragraph::new("No data")
                .block(block)
                .style(Style::default().fg(Color::Red));
            f.render_widget(paragraph, area);
            return;
        }
        
        let min_val = data.iter().fold(f64::INFINITY, |a, &b| a.min(b));
        let max_val = data.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
        let current_val = data.last().unwrap_or(&0.0);
        
        let sparkline = if max_val == min_val {
            ${style === 'bar' ? '"████████████".to_string()' : '"────────────".to_string()'}
        } else {
            data.iter().map(|&value| {
                let normalized = (value - min_val) / (max_val - min_val);
                ${style === 'bar' ? `
                let chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
                let char_index = (normalized * (chars.len() - 1) as f64) as usize;
                chars[char_index.min(chars.len() - 1)]` : `
                let chars = ['_', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
                let char_index = (normalized * (chars.len() - 1) as f64) as usize;
                chars[char_index.min(chars.len() - 1)]`}
            }).collect::<String>()
        };
        
        let content = ${showMinMax ? `
        format!("{}\\nMin: {:.0} Max: {:.0} Current: {:.0}", 
                sparkline, min_val, max_val, current_val)` : `
        format!("{}\\nCurrent: {:.0}", sparkline, current_val)`};
        
        let paragraph = Paragraph::new(content)
            .block(block)
            .style(Style::default().fg(Color::Cyan));
            
        f.render_widget(paragraph, area);
    }
}`;
  }

  static generateGauge(widget: Widget): string {
    const minVal = widget.properties?.min || 0;
    const maxVal = widget.properties?.max || 100;
    const showValue = widget.properties?.showValue !== false;
    const units = widget.properties?.units || '%';
    
    return `
impl App {
    fn render_${widget.id}(&self, f: &mut Frame, area: Rect) {
        let block = Block::default()
            .title("${widget.title || 'Gauge'}")
            .borders(Borders::ALL)
            .style(Style::default().fg(Color::White));
        
        // Sample value (would come from data source in real implementation)
        let value = 45.0;
        
        // Normalize value to 0-1 range
        let normalized = ((value - ${minVal} as f64) / (${maxVal} - ${minVal}) as f64)
            .max(0.0)
            .min(1.0);
        
        // Simple ASCII gauge representation
        let gauge_chars = ['○', '◔', '◑', '◕', '●'];
        let char_index = (normalized * (gauge_chars.len() - 1) as f64) as usize;
        let gauge_symbol = gauge_chars[char_index.min(gauge_chars.len() - 1)];
        
        // Create arc representation
        let arc_length = 20;
        let filled = (normalized * arc_length as f64) as usize;
        let arc = format!("{}{}",
            "█".repeat(filled),
            "░".repeat(arc_length - filled)
        );
        
        let content = ${showValue ? `
        format!("  {}\\n [{}]\\n {:.1}${units}", gauge_symbol, arc, value)` : `
        format!("  {}\\n [{}]", gauge_symbol, arc)`};
        
        let paragraph = Paragraph::new(content)
            .block(block)
            .style(Style::default().fg(Color::Yellow))
            .alignment(ratatui::layout::Alignment::Center);
            
        f.render_widget(paragraph, area);
    }
}`;
  }

  static generateLogViewer(widget: Widget): string {
    const maxLines = widget.properties?.maxLines || 1000;
    const autoScroll = widget.properties?.autoScroll !== false;
    const showTimestamp = widget.properties?.showTimestamp !== false;
    const filter = widget.properties?.filter || '';
    
    return `
impl App {
    fn render_${widget.id}(&self, f: &mut Frame, area: Rect) {
        let block = Block::default()
            .title("${widget.title || 'Logs'}")
            .borders(Borders::ALL)
            .style(Style::default().fg(Color::White));
        
        let mut display_logs = self.${widget.id}_logs.clone();
        
        // Apply filter if specified
        ${filter ? `
        display_logs.retain(|log| log.to_lowercase().contains("${filter.toLowerCase()}"));` : ''}
        
        // Limit to max lines and handle auto-scroll
        let visible_lines = area.height.saturating_sub(2) as usize; // Account for borders
        let logs_to_show = if display_logs.len() > visible_lines {
            ${autoScroll ? `
            &display_logs[display_logs.len().saturating_sub(visible_lines)..]` : `
            &display_logs[..visible_lines]`}
        } else {
            &display_logs
        };
        
        let items: Vec<ListItem> = logs_to_show
            .iter()
            .map(|log| {
                let style = if log.contains("ERROR") {
                    Style::default().fg(Color::Red)
                } else if log.contains("WARN") {
                    Style::default().fg(Color::Yellow)
                } else if log.contains("INFO") {
                    Style::default().fg(Color::Green)
                } else {
                    Style::default().fg(Color::White)
                };
                ListItem::new(log.as_str()).style(style)
            })
            .collect();
        
        let list = List::new(items)
            .block(block)
            .style(Style::default().fg(Color::White));
            
        f.render_widget(list, area);
    }
}`;
  }

  static generateMetricCard(widget: Widget): string {
    const label = widget.properties?.label || 'Metric';
    const format = widget.properties?.format || 'number';
    const trend = widget.properties?.trend === true;
    const sparkline = widget.properties?.sparkline === true;
    const dataSourceId = widget.dataSource || '';
    const hasDataSource = dataSourceId !== '';
    
    return `
impl App {
    fn render_${widget.id}(&self, f: &mut Frame, area: Rect) {
        let block = Block::default()
            .title("${widget.title || 'Metric'}")
            .borders(Borders::ALL)
            .style(Style::default().fg(Color::White));
        
        let value = ${hasDataSource ? `
        if let Some(data) = self.data_cache.get("${dataSourceId}") {
            data.as_f64().unwrap_or(self.${widget.id}_value)
        } else {
            self.${widget.id}_value
        }` : `self.${widget.id}_value`};
        
        let previous_value = self.${widget.id}_previous;
        
        // Format value based on format type
        let formatted_value = match "${format}" {
            "percentage" => format!("{:.1}%", value),
            "bytes" => format_bytes(value),
            _ => { // number
                if value >= 1_000_000.0 {
                    format!("{:.1}M", value / 1_000_000.0)
                } else if value >= 1_000.0 {
                    format!("{:.1}K", value / 1_000.0)
                } else {
                    format!("{:.1}", value)
                }
            }
        };
        
        let mut content_lines = vec![
            format!("${label}: {}", formatted_value)
        ];
        
        ${trend ? `
        // Add trend indicator
        let (trend_indicator, trend_style) = if value > previous_value {
            let diff = value - previous_value;
            let formatted_diff = match "${format}" {
                "percentage" => format!("{:.1}%", diff),
                "bytes" => format_bytes(diff),
                _ => format!("{:.1}", diff),
            };
            (format!("↗ +{}", formatted_diff), Style::default().fg(Color::Green))
        } else if value < previous_value {
            let diff = previous_value - value;
            let formatted_diff = match "${format}" {
                "percentage" => format!("{:.1}%", diff),
                "bytes" => format_bytes(diff),
                _ => format!("{:.1}", diff),
            };
            (format!("↘ -{}", formatted_diff), Style::default().fg(Color::Red))
        } else {
            ("→ No change".to_string(), Style::default().fg(Color::Gray))
        };
        
        content_lines.push(trend_indicator);` : ''}
        
        ${sparkline ? `
        // Add mini sparkline (simplified)
        let history = vec![30.0, 32.0, 35.0, 38.0, 40.0, 42.0, 39.0, 41.0, 43.0, value];
        let min_val = history.iter().fold(f64::INFINITY, |a, &b| a.min(b));
        let max_val = history.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
        
        let sparkline_str = if max_val > min_val {
            let chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
            history.iter()
                .take(10) // Last 10 values
                .map(|&val| {
                    let normalized = (val - min_val) / (max_val - min_val);
                    let char_index = (normalized * (chars.len() - 1) as f64) as usize;
                    chars[char_index.min(chars.len() - 1)]
                })
                .collect::<String>()
        } else {
            "████████████".to_string()
        };
        
        content_lines.push(sparkline_str);` : ''}
        
        let content = content_lines.join("\\n");
        let paragraph = Paragraph::new(content)
            .block(block)
            .style(Style::default().fg(Color::Cyan));
            
        f.render_widget(paragraph, area);
    }
}

// Helper function for formatting bytes
fn format_bytes(bytes: f64) -> String {
    let units = ["B", "KB", "MB", "GB", "TB"];
    let mut size = bytes;
    let mut unit_index = 0;
    
    while size >= 1024.0 && unit_index < units.len() - 1 {
        size /= 1024.0;
        unit_index += 1;
    }
    
    format!("{:.1} {}", size, units[unit_index])
}`;
  }
}