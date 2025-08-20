import { Widget } from '@cli-designer/core';

export class WidgetTemplates {
  static generateTextWidget(widget: Widget): string {
    const dataSourceId = widget.dataSource || '';
    const hasDataSource = dataSourceId !== '';
    
    return `
// ${widget.id} - Text widget
func (m *Model) render${widget.id}() string {
    var content string
    ${hasDataSource ? `
    if data, exists := m.dataCache["${dataSourceId}"]; exists {
        if value, ok := data["value"]; ok {
            content = fmt.Sprintf("${widget.title || 'Data'}: %v", value)
        } else {
            content = fmt.Sprintf("${widget.title || 'Data'}: %v", data)
        }
    } else {
        content = "${widget.title || 'Text Widget'}: Loading..."
    }` : `
    content = "${widget.properties?.content || widget.title || 'Text Widget'}"`}
    
    style := baseStyle.
        Width(${widget.size.width * 2}).
        Height(${widget.size.height}).
        Align(lipgloss.Left)
    
    return style.Render(content)
}`;
  }

  static generateLineChart(widget: Widget): string {
    return `
// ${widget.id} - Line chart widget
func (m *Model) render${widget.id}() string {
    title := titleStyle.Render("${widget.title || 'Line Chart'}")
    
    // Simple ASCII line chart representation
    chart := strings.Join([]string{
        "   /\\    /\\",
        "  /  \\  /  \\",
        " /    \\/    \\",
        "/            \\",
    }, "\\n")
    
    style := baseStyle.
        Width(${widget.size.width * 2}).
        Height(${widget.size.height})
    
    content := lipgloss.JoinVertical(lipgloss.Left, title, chart)
    return style.Render(content)
}`;
  }

  static generateBarChart(widget: Widget): string {
    const orientation = widget.properties?.orientation || 'vertical';
    
    return `
// ${widget.id} - Bar chart widget
func (m *Model) render${widget.id}() string {
    title := titleStyle.Render("${widget.title || 'Bar Chart'}")
    
    // Sample data for demonstration
    data := []struct{
        Label string
        Value int
    }{
        {"A", 25}, {"B", 40}, {"C", 15}, {"D", 30},
    }
    
    var chart string
    ${orientation === 'horizontal' ? `
    // Horizontal bars
    for _, item := range data {
        bar := strings.Repeat("█", item.Value/2)
        chart += fmt.Sprintf("%s: %s %d\\n", item.Label, bar, item.Value)
    }` : `
    // Vertical bars (simplified)
    maxVal := 40
    for i := maxVal; i > 0; i -= 5 {
        line := ""
        for _, item := range data {
            if item.Value >= i {
                line += "█ "
            } else {
                line += "  "
            }
        }
        chart += line + "\\n"
    }
    chart += "A B C D\\n"`}
    
    style := baseStyle.
        Width(${widget.size.width * 2}).
        Height(${widget.size.height})
    
    content := lipgloss.JoinVertical(lipgloss.Left, title, chart)
    return style.Render(content)
}`;
  }

  static generateTable(widget: Widget): string {
    const showHeaders = widget.properties?.showHeaders !== false;
    const maxRows = widget.properties?.maxRows || 100;
    
    return `
// ${widget.id} - Table widget
func (m *Model) render${widget.id}() string {
    title := titleStyle.Render("${widget.title || 'Table'}")
    
    // Update table data
    rows := []table.Row{
        {"001", "Item A", "Active", "125"},
        {"002", "Item B", "Pending", "87"},
        {"003", "Item C", "Complete", "203"},
        {"004", "Item D", "Active", "156"},
    }
    
    m.${widget.id}Table.SetRows(rows[:${maxRows}])
    m.${widget.id}Table.SetWidth(${widget.size.width * 2})
    m.${widget.id}Table.SetHeight(${widget.size.height - 2})
    
    ${showHeaders ? `
    tableView := m.${widget.id}Table.View()` : `
    // Hide headers by customizing the view
    tableView := m.${widget.id}Table.View()
    lines := strings.Split(tableView, "\\n")
    if len(lines) > 2 {
        tableView = strings.Join(lines[2:], "\\n")
    }`}
    
    style := baseStyle.
        Width(${widget.size.width * 2}).
        Height(${widget.size.height})
    
    content := lipgloss.JoinVertical(lipgloss.Left, title, tableView)
    return style.Render(content)
}`;
  }

  static generateProgressBar(widget: Widget): string {
    const showPercentage = widget.properties?.showPercentage !== false;
    const animated = widget.properties?.animated === true;
    
    return `
// ${widget.id} - Progress bar widget
func (m *Model) render${widget.id}() string {
    title := titleStyle.Render("${widget.title || 'Progress'}")
    
    ${animated ? `
    // Animate progress
    m.${widget.id}Progress += 2.0
    if m.${widget.id}Progress > 100 {
        m.${widget.id}Progress = 0
    }` : `
    // Static or data-driven progress
    if m.${widget.id}Progress == 0 {
        m.${widget.id}Progress = 45.0 // Default value
    }`}
    
    progressBar := progress.New(progress.WithDefaultGradient())
    progressBar.Width = ${widget.size.width * 2 - 4}
    
    progressView := progressBar.ViewAs(m.${widget.id}Progress / 100.0)
    
    ${showPercentage ? `
    percentageText := fmt.Sprintf("%.1f%%", m.${widget.id}Progress)
    progressWithText := lipgloss.JoinVertical(lipgloss.Left, progressView, percentageText)` : `
    progressWithText := progressView`}
    
    style := baseStyle.
        Width(${widget.size.width * 2}).
        Height(${widget.size.height})
    
    content := lipgloss.JoinVertical(lipgloss.Left, title, progressWithText)
    return style.Render(content)
}`;
  }

  static generateSparkline(widget: Widget): string {
    const style = widget.properties?.style || 'line';
    const showMinMax = widget.properties?.showMinMax !== false;
    
    return `
// ${widget.id} - Sparkline widget
func (m *Model) render${widget.id}() string {
    title := titleStyle.Render("${widget.title || 'Trend'}")
    
    // Sample data
    data := []float64{23, 25, 24, 27, 30, 28, 26, 29, 31, 28, 25, 27}
    
    var sparkline string
    ${style === 'bar' ? `
    // Bar style sparkline
    chars := []rune{'▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'}
    min, max := data[0], data[0]
    for _, v := range data {
        if v < min { min = v }
        if v > max { max = v }
    }
    
    for _, value := range data {
        if max == min {
            sparkline += string(chars[4])
        } else {
            normalized := (value - min) / (max - min)
            charIndex := int(normalized * float64(len(chars)-1))
            if charIndex >= len(chars) { charIndex = len(chars) - 1 }
            sparkline += string(chars[charIndex])
        }
    }` : `
    // Line style sparkline
    chars := []rune{'_', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'}
    min, max := data[0], data[0]
    for _, v := range data {
        if v < min { min = v }
        if v > max { max = v }
    }
    
    for _, value := range data {
        if max == min {
            sparkline += "─"
        } else {
            normalized := (value - min) / (max - min)
            charIndex := int(normalized * float64(len(chars)-1))
            if charIndex >= len(chars) { charIndex = len(chars) - 1 }
            sparkline += string(chars[charIndex])
        }
    }`}
    
    ${showMinMax ? `
    current := data[len(data)-1]
    info := fmt.Sprintf("Min: %.0f Max: %.0f Current: %.0f", min, max, current)
    display := lipgloss.JoinVertical(lipgloss.Left, sparkline, info)` : `
    current := data[len(data)-1]
    info := fmt.Sprintf("Current: %.0f", current)
    display := lipgloss.JoinVertical(lipgloss.Left, sparkline, info)`}
    
    style := baseStyle.
        Width(${widget.size.width * 2}).
        Height(${widget.size.height})
    
    content := lipgloss.JoinVertical(lipgloss.Left, title, display)
    return style.Render(content)
}`;
  }

  static generateGauge(widget: Widget): string {
    const minVal = widget.properties?.min || 0;
    const maxVal = widget.properties?.max || 100;
    const showValue = widget.properties?.showValue !== false;
    const units = widget.properties?.units || '%';
    
    return `
// ${widget.id} - Gauge widget
func (m *Model) render${widget.id}() string {
    title := titleStyle.Render("${widget.title || 'Gauge'}")
    
    // Sample value (would come from data source in real implementation)
    value := 45.0
    
    // Normalize value to 0-1 range
    normalized := (value - ${minVal}) / (${maxVal} - ${minVal})
    if normalized < 0 { normalized = 0 }
    if normalized > 1 { normalized = 1 }
    
    // Simple ASCII gauge representation
    gaugeChars := []rune{'○', '◔', '◑', '◕', '●'}
    charIndex := int(normalized * float64(len(gaugeChars)-1))
    if charIndex >= len(gaugeChars) { charIndex = len(gaugeChars) - 1 }
    gaugeSymbol := string(gaugeChars[charIndex])
    
    // Create arc representation
    arcLength := 20
    filled := int(normalized * float64(arcLength))
    arc := strings.Repeat("█", filled) + strings.Repeat("░", arcLength-filled)
    
    var display string
    gauge := fmt.Sprintf("  %s\\n [%s]", gaugeSymbol, arc)
    
    ${showValue ? `
    valueText := fmt.Sprintf(" %.1f${units}", value)
    display = lipgloss.JoinVertical(lipgloss.Center, gauge, valueText)` : `
    display = gauge`}
    
    style := baseStyle.
        Width(${widget.size.width * 2}).
        Height(${widget.size.height}).
        Align(lipgloss.Center)
    
    content := lipgloss.JoinVertical(lipgloss.Center, title, display)
    return style.Render(content)
}`;
  }

  static generateLogViewer(widget: Widget): string {
    const maxLines = widget.properties?.maxLines || 1000;
    const autoScroll = widget.properties?.autoScroll !== false;
    const showTimestamp = widget.properties?.showTimestamp !== false;
    const filter = widget.properties?.filter || '';
    
    return `
// ${widget.id} - Log viewer widget
func (m *Model) render${widget.id}() string {
    title := titleStyle.Render("${widget.title || 'Logs'}")
    
    // Sample log entries (would be populated from real log source)
    if len(m.${widget.id}Logs) == 0 {
        m.${widget.id}Logs = []string{
            ${showTimestamp ? `
            "[" + time.Now().Add(-time.Minute*5).Format("15:04:05") + "] INFO: Application started successfully",
            "[" + time.Now().Add(-time.Minute*4).Format("15:04:05") + "] INFO: Database connection established",
            "[" + time.Now().Add(-time.Minute*3).Format("15:04:05") + "] WARN: High memory usage detected",
            "[" + time.Now().Add(-time.Minute*2).Format("15:04:05") + "] INFO: Processing user request",
            "[" + time.Now().Add(-time.Minute).Format("15:04:05") + "] INFO: Request completed successfully",` : `
            "INFO: Application started successfully",
            "INFO: Database connection established", 
            "WARN: High memory usage detected",
            "INFO: Processing user request",
            "INFO: Request completed successfully",`}
        }
    }
    
    // Add new log entry periodically
    if len(m.${widget.id}Logs) < ${maxLines} && time.Now().Unix()%5 == 0 {
        ${showTimestamp ? `
        newLog := "[" + time.Now().Format("15:04:05") + "] INFO: New log entry"` : `
        newLog := "INFO: New log entry"`}
        m.${widget.id}Logs = append(m.${widget.id}Logs, newLog)
        
        // Keep only maxLines
        if len(m.${widget.id}Logs) > ${maxLines} {
            m.${widget.id}Logs = m.${widget.id}Logs[len(m.${widget.id}Logs)-${maxLines}:]
        }
    }
    
    // Apply filter if specified
    displayLogs := m.${widget.id}Logs
    ${filter ? `
    filteredLogs := make([]string, 0)
    for _, log := range m.${widget.id}Logs {
        if strings.Contains(strings.ToLower(log), strings.ToLower("${filter}")) {
            filteredLogs = append(filteredLogs, log)
        }
    }
    displayLogs = filteredLogs` : ''}
    
    // Set viewport content
    content := strings.Join(displayLogs, "\\n")
    m.${widget.id}Viewport.SetContent(content)
    m.${widget.id}Viewport.Width = ${widget.size.width * 2 - 2}
    m.${widget.id}Viewport.Height = ${widget.size.height - 2}
    
    ${autoScroll ? `
    // Auto-scroll to bottom
    m.${widget.id}Viewport.GotoBottom()` : ''}
    
    style := baseStyle.
        Width(${widget.size.width * 2}).
        Height(${widget.size.height})
    
    viewportView := m.${widget.id}Viewport.View()
    content := lipgloss.JoinVertical(lipgloss.Left, title, viewportView)
    return style.Render(content)
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
// ${widget.id} - Metric card widget
func (m *Model) render${widget.id}() string {
    title := titleStyle.Render("${widget.title || 'Metric'}")
    
    // Get metric value
    var value float64 = ${hasDataSource ? '0' : '42.5'}
    var previousValue float64 = ${hasDataSource ? '0' : '38.2'}
    
    ${hasDataSource ? `
    if data, exists := m.dataCache["${dataSourceId}"]; exists {
        if v, ok := data["value"].(float64); ok {
            value = v
        }
        if prev, ok := data["previous"].(float64); ok {
            previousValue = prev
        }
    }` : `
    // Simulate some variation
    variation := float64(time.Now().Unix()%10) - 5
    value = 42.5 + variation
    previousValue = 38.2`}
    
    // Format value based on format type
    var formattedValue string
    switch "${format}" {
    case "percentage":
        formattedValue = fmt.Sprintf("%.1f%%", value)
    case "bytes":
        formattedValue = formatBytes(value)
    default: // number
        if value >= 1000000 {
            formattedValue = fmt.Sprintf("%.1fM", value/1000000)
        } else if value >= 1000 {
            formattedValue = fmt.Sprintf("%.1fK", value/1000)
        } else {
            formattedValue = fmt.Sprintf("%.1f", value)
        }
    }
    
    metricText := fmt.Sprintf("${label}: %s", formattedValue)
    components := []string{metricText}
    
    ${trend ? `
    // Add trend indicator
    var trendIndicator string
    var trendColor lipgloss.Color
    if value > previousValue {
        diff := value - previousValue
        var formattedDiff string
        switch "${format}" {
        case "percentage":
            formattedDiff = fmt.Sprintf("%.1f%%", diff)
        case "bytes":
            formattedDiff = formatBytes(diff)
        default:
            formattedDiff = fmt.Sprintf("%.1f", diff)
        }
        trendIndicator = fmt.Sprintf("↗ +%s", formattedDiff)
        trendColor = lipgloss.Color("10") // Green
    } else if value < previousValue {
        diff := previousValue - value
        var formattedDiff string
        switch "${format}" {
        case "percentage":
            formattedDiff = fmt.Sprintf("%.1f%%", diff)
        case "bytes":
            formattedDiff = formatBytes(diff)
        default:
            formattedDiff = fmt.Sprintf("%.1f", diff)
        }
        trendIndicator = fmt.Sprintf("↘ -%s", formattedDiff)
        trendColor = lipgloss.Color("9") // Red
    } else {
        trendIndicator = "→ No change"
        trendColor = lipgloss.Color("8") // Gray
    }
    
    trendStyle := lipgloss.NewStyle().Foreground(trendColor)
    components = append(components, trendStyle.Render(trendIndicator))` : ''}
    
    ${sparkline ? `
    // Add mini sparkline (simplified)
    history := []float64{30, 32, 35, 38, 40, 42, 39, 41, 43, value}
    min, max := history[0], history[0]
    for _, v := range history {
        if v < min { min = v }
        if v > max { max = v }
    }
    
    var sparklineStr string
    chars := []rune{'▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'}
    for _, val := range history[len(history)-10:] { // Last 10 values
        if max > min {
            normalized := (val - min) / (max - min)
            charIndex := int(normalized * float64(len(chars)-1))
            if charIndex >= len(chars) { charIndex = len(chars) - 1 }
            sparklineStr += string(chars[charIndex])
        } else {
            sparklineStr += string(chars[4])
        }
    }
    components = append(components, sparklineStr)` : ''}
    
    display := strings.Join(components, "\\n")
    
    style := baseStyle.
        Width(${widget.size.width * 2}).
        Height(${widget.size.height}).
        Align(lipgloss.Left)
    
    content := lipgloss.JoinVertical(lipgloss.Left, title, display)
    return style.Render(content)
}

// Helper function for formatting bytes
func formatBytes(bytes float64) string {
    units := []string{"B", "KB", "MB", "GB", "TB"}
    size := bytes
    unitIndex := 0
    
    for size >= 1024 && unitIndex < len(units)-1 {
        size /= 1024
        unitIndex++
    }
    
    return fmt.Sprintf("%.1f %s", size, units[unitIndex])
}`;
  }
}