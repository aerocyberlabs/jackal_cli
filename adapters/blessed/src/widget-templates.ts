import { Widget } from '@cli-designer/core';

export class WidgetTemplates {
  static generateTextWidget(widget: Widget): string {
    const dataSourceId = widget.dataSource || '';
    const hasDataSource = dataSourceId !== '';
    
    return `
// ${widget.id} - Text widget
class ${widget.id.charAt(0).toUpperCase() + widget.id.slice(1)}Widget {
  constructor(options = {}) {
    this.options = { ...options };
    this.dataSourceId = '${dataSourceId}';
    
    this.element = blessed.box({
      ...defaultStyle,
      label: '${widget.title || 'Text'}',
      content: '${hasDataSource ? 'Loading...' : (widget.properties?.content || widget.title || 'Text Widget')}',
      left: '${(widget.position.x / 40 * 100).toFixed(1)}%',
      top: '${(widget.position.y / 20 * 100).toFixed(1)}%',
      width: '${(widget.size.width / 40 * 100).toFixed(1)}%',
      height: '${(widget.size.height / 20 * 100).toFixed(1)}%',
      tags: true,
      ...options
    });
  }

  update(data) {
    ${hasDataSource ? `
    if (data && typeof data === 'object') {
      const value = data.value !== undefined ? data.value : data;
      this.element.setContent(\`${widget.title || 'Data'}: \${value}\`);
    } else {
      this.element.setContent(\`${widget.title || 'Data'}: \${data || 'N/A'}\`);
    }` : `
    this.element.setContent(String(data || '${widget.properties?.content || widget.title || 'Text Widget'}'));`}
  }

  getElement() {
    return this.element;
  }
}`;
  }

  static generateLineChart(widget: Widget): string {
    return `
// ${widget.id} - Line chart widget
class ${widget.id.charAt(0).toUpperCase() + widget.id.slice(1)}Widget {
  constructor(options = {}) {
    this.options = { ...options };
    this.dataSourceId = '${widget.dataSource || ''}';
    this.data = [
      { title: 'Series 1', x: ['00:00', '00:05', '00:10', '00:15', '00:20', '00:25'], y: [23, 25, 24, 27, 30, 28] }
    ];
    
    this.element = contrib.line({
      ...defaultStyle,
      label: '${widget.title || 'Line Chart'}',
      left: '${(widget.position.x / 40 * 100).toFixed(1)}%',
      top: '${(widget.position.y / 20 * 100).toFixed(1)}%',
      width: '${(widget.size.width / 40 * 100).toFixed(1)}%',
      height: '${(widget.size.height / 20 * 100).toFixed(1)}%',
      showNthLabel: 2,
      abbreviate: true,
      legend: { width: 20 },
      xLabelPadding: 3,
      xPadding: 5,
      ...options
    });
    
    this.updateChart();
  }

  updateChart() {
    this.element.setData(this.data);
  }

  update(data) {
    if (Array.isArray(data)) {
      this.data[0].y = data.slice(-10); // Show last 10 points
    } else if (typeof data === 'number') {
      // Add new data point
      this.data[0].y.push(data);
      if (this.data[0].y.length > 10) {
        this.data[0].y.shift();
      }
    }
    this.updateChart();
  }

  getElement() {
    return this.element;
  }
}`;
  }

  static generateBarChart(widget: Widget): string {
    const orientation = widget.properties?.orientation || 'vertical';
    
    return `
// ${widget.id} - Bar chart widget
class ${widget.id.charAt(0).toUpperCase() + widget.id.slice(1)}Widget {
  constructor(options = {}) {
    this.options = { ...options };
    this.dataSourceId = '${widget.dataSource || ''}';
    this.data = {
      titles: ['A', 'B', 'C', 'D'],
      data: [25, 40, 15, 30]
    };
    
    this.element = contrib.${orientation === 'horizontal' ? 'horizontalBar' : 'bar'}({
      ...defaultStyle,
      label: '${widget.title || 'Bar Chart'}',
      left: '${(widget.position.x / 40 * 100).toFixed(1)}%',
      top: '${(widget.position.y / 20 * 100).toFixed(1)}%',
      width: '${(widget.size.width / 40 * 100).toFixed(1)}%',
      height: '${(widget.size.height / 20 * 100).toFixed(1)}%',
      barWidth: 4,
      barSpacing: 2,
      xOffset: 0,
      maxHeight: 50,
      ...options
    });
    
    this.updateChart();
  }

  updateChart() {
    this.element.setData(this.data);
  }

  update(data) {
    if (data && typeof data === 'object') {
      if (Array.isArray(data.values)) {
        this.data.data = data.values;
      }
      if (Array.isArray(data.labels)) {
        this.data.titles = data.labels;
      }
    } else if (Array.isArray(data)) {
      this.data.data = data;
    }
    this.updateChart();
  }

  getElement() {
    return this.element;
  }
}`;
  }

  static generateTable(widget: Widget): string {
    const showHeaders = widget.properties?.showHeaders !== false;
    
    return `
// ${widget.id} - Table widget
class ${widget.id.charAt(0).toUpperCase() + widget.id.slice(1)}Widget {
  constructor(options = {}) {
    this.options = { ...options };
    this.dataSourceId = '${widget.dataSource || ''}';
    
    const headers = ${showHeaders ? `['ID', 'Name', 'Status', 'Value']` : '[]'};
    const rows = [
      ['001', 'Item A', 'Active', '125'],
      ['002', 'Item B', 'Pending', '87'],
      ['003', 'Item C', 'Complete', '203'],
      ['004', 'Item D', 'Active', '156']
    ];
    
    this.element = contrib.table({
      ...defaultStyle,
      label: '${widget.title || 'Table'}',
      left: '${(widget.position.x / 40 * 100).toFixed(1)}%',
      top: '${(widget.position.y / 20 * 100).toFixed(1)}%',
      width: '${(widget.size.width / 40 * 100).toFixed(1)}%',
      height: '${(widget.size.height / 20 * 100).toFixed(1)}%',
      keys: true,
      fg: 'white',
      selectedFg: 'white',
      selectedBg: 'blue',
      interactive: false,
      columnSpacing: 1,
      columnWidth: [6, 12, 8, 8],
      ...options
    });
    
    this.data = { headers, data: rows };
    this.updateTable();
  }

  updateTable() {
    this.element.setData(this.data);
  }

  update(data) {
    if (Array.isArray(data)) {
      this.data.data = data.slice(0, ${widget.properties?.maxRows || 100});
      this.updateTable();
    }
  }

  getElement() {
    return this.element;
  }
}`;
  }

  static generateProgressBar(widget: Widget): string {
    const showPercentage = widget.properties?.showPercentage !== false;
    const animated = widget.properties?.animated === true;
    
    return `
// ${widget.id} - Progress bar widget
class ${widget.id.charAt(0).toUpperCase() + widget.id.slice(1)}Widget {
  constructor(options = {}) {
    this.options = { ...options };
    this.dataSourceId = '${widget.dataSource || ''}';
    this.progress = ${animated ? '0' : '45'};
    
    this.element = contrib.gauge({
      ...defaultStyle,
      label: '${widget.title || 'Progress'}',
      left: '${(widget.position.x / 40 * 100).toFixed(1)}%',
      top: '${(widget.position.y / 20 * 100).toFixed(1)}%',
      width: '${(widget.size.width / 40 * 100).toFixed(1)}%',
      height: '${(widget.size.height / 20 * 100).toFixed(1)}%',
      stroke: '${widget.properties?.color || 'green'}',
      fill: 'white',
      ${showPercentage ? 'showLabel: true,' : 'showLabel: false,'}
      ...options
    });
    
    ${animated ? `
    this.animation = setInterval(() => {
      this.progress = (this.progress + 2) % 100;
      this.updateProgress();
    }, 200);` : ''}
    
    this.updateProgress();
  }

  updateProgress() {
    this.element.setPercent(this.progress);
  }

  update(data) {
    if (typeof data === 'number') {
      this.progress = Math.max(0, Math.min(100, data));
      this.updateProgress();
    }
  }

  getElement() {
    return this.element;
  }
}`;
  }

  static generateSparkline(widget: Widget): string {
    const style = widget.properties?.style || 'line';
    
    return `
// ${widget.id} - Sparkline widget
class ${widget.id.charAt(0).toUpperCase() + widget.id.slice(1)}Widget {
  constructor(options = {}) {
    this.options = { ...options };
    this.dataSourceId = '${widget.dataSource || ''}';
    this.data = [23, 25, 24, 27, 30, 28, 26, 29, 31, 28, 25, 27];
    
    this.element = contrib.sparkline({
      ...defaultStyle,
      label: '${widget.title || 'Trend'}',
      left: '${(widget.position.x / 40 * 100).toFixed(1)}%',
      top: '${(widget.position.y / 20 * 100).toFixed(1)}%',
      width: '${(widget.size.width / 40 * 100).toFixed(1)}%',
      height: '${(widget.size.height / 20 * 100).toFixed(1)}%',
      tags: true,
      style: {
        fg: 'cyan',
        titleFg: 'white'
      },
      ...options
    });
    
    this.updateSparkline();
    
    // Simulate data updates
    setInterval(() => {
      this.simulateUpdate();
    }, 2000);
  }

  updateSparkline() {
    this.element.setData(this.data.slice(-20), \`\${this.data[this.data.length - 1]?.toFixed(1) || 'N/A'}\`);
    
    ${widget.properties?.showMinMax !== false ? `
    const min = Math.min(...this.data);
    const max = Math.max(...this.data);
    const current = this.data[this.data.length - 1];
    this.element.setLabel(\`${widget.title || 'Trend'} - Min: \${min.toFixed(1)} Max: \${max.toFixed(1)} Current: \${current?.toFixed(1) || 'N/A'}\`);` : ''}
  }

  simulateUpdate() {
    const lastValue = this.data[this.data.length - 1];
    const change = (Math.random() - 0.5) * 6; // -3 to +3
    const newValue = Math.max(0, lastValue + change);
    
    this.data.push(newValue);
    if (this.data.length > 50) {
      this.data.shift();
    }
    
    this.updateSparkline();
  }

  update(data) {
    if (Array.isArray(data)) {
      this.data = data.slice(-50);
      this.updateSparkline();
    } else if (typeof data === 'number') {
      this.data.push(data);
      if (this.data.length > 50) {
        this.data.shift();
      }
      this.updateSparkline();
    }
  }

  getElement() {
    return this.element;
  }
}`;
  }

  static generateGauge(widget: Widget): string {
    const minVal = widget.properties?.min || 0;
    const maxVal = widget.properties?.max || 100;
    const showValue = widget.properties?.showValue !== false;
    const units = widget.properties?.units || '%';
    
    return `
// ${widget.id} - Gauge widget
class ${widget.id.charAt(0).toUpperCase() + widget.id.slice(1)}Widget {
  constructor(options = {}) {
    this.options = { ...options };
    this.dataSourceId = '${widget.dataSource || ''}';
    this.value = 45;
    this.minVal = ${minVal};
    this.maxVal = ${maxVal};
    
    this.element = contrib.donut({
      ...defaultStyle,
      label: '${widget.title || 'Gauge'}',
      left: '${(widget.position.x / 40 * 100).toFixed(1)}%',
      top: '${(widget.position.y / 20 * 100).toFixed(1)}%',
      width: '${(widget.size.width / 40 * 100).toFixed(1)}%',
      height: '${(widget.size.height / 20 * 100).toFixed(1)}%',
      radius: 8,
      arcWidth: 3,
      yPadding: 2,
      data: [],
      ...options
    });
    
    this.updateGauge();
  }

  updateGauge() {
    // Normalize value to 0-100 range
    const normalized = Math.max(0, Math.min(100, 
      ((this.value - this.minVal) / (this.maxVal - this.minVal)) * 100
    ));
    
    const data = [
      { percent: normalized, label: ${showValue ? `\`\${this.value.toFixed(1)}${units}\`` : "'Value'"}, color: normalized > 75 ? 'red' : normalized > 50 ? 'yellow' : 'green' },
      { percent: 100 - normalized, label: 'Remaining', color: 'grey' }
    ];
    
    this.element.setData(data);
  }

  update(data) {
    if (typeof data === 'number') {
      this.value = data;
      this.updateGauge();
    }
  }

  getElement() {
    return this.element;
  }
}`;
  }

  static generateLogViewer(widget: Widget): string {
    const maxLines = widget.properties?.maxLines || 1000;
    const autoScroll = widget.properties?.autoScroll !== false;
    const showTimestamp = widget.properties?.showTimestamp !== false;
    
    return `
// ${widget.id} - Log viewer widget
class ${widget.id.charAt(0).toUpperCase() + widget.id.slice(1)}Widget {
  constructor(options = {}) {
    this.options = { ...options };
    this.dataSourceId = '${widget.dataSource || ''}';
    this.logs = [];
    this.maxLines = ${maxLines};
    
    this.element = blessed.log({
      ...defaultStyle,
      label: '${widget.title || 'Logs'}',
      left: '${(widget.position.x / 40 * 100).toFixed(1)}%',
      top: '${(widget.position.y / 20 * 100).toFixed(1)}%',
      width: '${(widget.size.width / 40 * 100).toFixed(1)}%',
      height: '${(widget.size.height / 20 * 100).toFixed(1)}%',
      tags: true,
      keys: true,
      vi: true,
      mouse: true,
      scrollback: this.maxLines,
      scrollOnInput: ${autoScroll ? 'true' : 'false'},
      ...options
    });
    
    // Generate initial log entries
    this.generateSampleLogs();
    
    // Add new log entries periodically
    this.logInterval = setInterval(() => {
      this.addLogEntry();
    }, 3000);
  }

  generateSampleLogs() {
    const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
    const messages = [
      'Application started successfully',
      'Database connection established',
      'Processing user request',
      'Cache updated',
      'Background job completed',
      'Configuration loaded'
    ];
    
    for (let i = 0; i < 10; i++) {
      const level = levels[Math.floor(Math.random() * levels.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];
      const timestamp = ${showTimestamp ? 'new Date().toLocaleTimeString()' : 'null'};
      
      this.addLog(level, message, timestamp);
    }
  }

  addLog(level, message, timestamp = null) {
    const ts = timestamp || ${showTimestamp ? 'new Date().toLocaleTimeString()' : 'null'};
    const logEntry = ${showTimestamp ? `ts ? \`[\${ts}] \${level}: \${message}\` : \`\${level}: \${message}\`` : `\`\${level}: \${message}\``};
    
    // Color code by log level
    let coloredEntry = logEntry;
    switch (level) {
      case 'ERROR':
        coloredEntry = \`{red-fg}\${logEntry}{/red-fg}\`;
        break;
      case 'WARN':
        coloredEntry = \`{yellow-fg}\${logEntry}{/yellow-fg}\`;
        break;
      case 'INFO':
        coloredEntry = \`{green-fg}\${logEntry}{/green-fg}\`;
        break;
      case 'DEBUG':
        coloredEntry = \`{grey-fg}\${logEntry}{/grey-fg}\`;
        break;
    }
    
    this.element.log(coloredEntry);
    this.logs.push(logEntry);
    
    // Keep only maxLines
    if (this.logs.length > this.maxLines) {
      this.logs = this.logs.slice(-this.maxLines);
    }
  }

  addLogEntry() {
    const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
    const messages = [
      'Request processed successfully',
      'Memory usage normal',
      'New user session created',
      'File uploaded',
      'Backup completed',
      'Network latency: 12ms'
    ];
    
    const level = levels[Math.floor(Math.random() * levels.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    this.addLog(level, message);
  }

  update(data) {
    if (typeof data === 'string') {
      this.addLog('INFO', data);
    } else if (Array.isArray(data)) {
      data.forEach(logLine => {
        if (typeof logLine === 'string') {
          this.addLog('INFO', logLine);
        }
      });
    }
  }

  getElement() {
    return this.element;
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
// ${widget.id} - Metric card widget
class ${widget.id.charAt(0).toUpperCase() + widget.id.slice(1)}Widget {
  constructor(options = {}) {
    this.options = { ...options };
    this.dataSourceId = '${dataSourceId}';
    this.value = ${hasDataSource ? '0' : '42.5'};
    this.previousValue = ${hasDataSource ? '0' : '38.2'};
    this.history = ${hasDataSource ? '[]' : '[30, 32, 35, 38, 40, 42, 39, 41, 43, 42.5]'};
    
    this.element = blessed.box({
      ...defaultStyle,
      label: '${widget.title || 'Metric'}',
      left: '${(widget.position.x / 40 * 100).toFixed(1)}%',
      top: '${(widget.position.y / 20 * 100).toFixed(1)}%',
      width: '${(widget.size.width / 40 * 100).toFixed(1)}%',
      height: '${(widget.size.height / 20 * 100).toFixed(1)}%',
      tags: true,
      content: '',
      ...options
    });
    
    this.updateMetric();
    
    ${!hasDataSource ? `
    // Simulate metric updates
    setInterval(() => {
      this.simulateUpdate();
    }, 3000);` : ''}
  }

  formatValue(value) {
    switch ('${format}') {
      case 'percentage':
        return \`\${value.toFixed(1)}%\`;
      case 'bytes':
        return this.formatBytes(value);
      default: // number
        if (value >= 1000000) {
          return \`\${(value / 1000000).toFixed(1)}M\`;
        } else if (value >= 1000) {
          return \`\${(value / 1000).toFixed(1)}K\`;
        } else {
          return value.toFixed(1);
        }
    }
  }

  formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return \`\${size.toFixed(1)} \${units[unitIndex]}\`;
  }

  updateMetric() {
    const formattedValue = this.formatValue(this.value);
    let content = \`${label}: \${formattedValue}\`;
    
    ${trend ? `
    // Add trend indicator
    if (this.value > this.previousValue) {
      const diff = this.formatValue(this.value - this.previousValue);
      content += \`\\n{green-fg}↗ +\${diff}{/green-fg}\`;
    } else if (this.value < this.previousValue) {
      const diff = this.formatValue(this.previousValue - this.value);
      content += \`\\n{red-fg}↘ -\${diff}{/red-fg}\`;
    } else {
      content += \`\\n{grey-fg}→ No change{/grey-fg}\`;
    }` : ''}
    
    ${sparkline ? `
    // Add mini sparkline
    if (this.history.length > 1) {
      const min = Math.min(...this.history);
      const max = Math.max(...this.history);
      
      if (max > min) {
        const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
        let sparklineStr = '';
        
        for (const val of this.history.slice(-10)) {
          const normalized = (val - min) / (max - min);
          const charIndex = Math.floor(normalized * (chars.length - 1));
          sparklineStr += chars[Math.min(charIndex, chars.length - 1)];
        }
        
        content += \`\\n\${sparklineStr}\`;
      }
    }` : ''}
    
    this.element.setContent(content);
  }

  simulateUpdate() {
    this.previousValue = this.value;
    // Simulate realistic variance
    const changePercent = (Math.random() - 0.5) * 0.4; // ±20% change
    this.value = Math.max(0, this.value * (1 + changePercent));
    
    // Update history
    this.history.push(this.value);
    if (this.history.length > 20) {
      this.history.shift();
    }
    
    this.updateMetric();
  }

  update(data) {
    ${hasDataSource ? `
    if (typeof data === 'number') {
      this.previousValue = this.value;
      this.value = data;
      
      // Update history
      this.history.push(this.value);
      if (this.history.length > 20) {
        this.history.shift();
      }
      
      this.updateMetric();
    }` : `
    // Handle external data updates
    if (typeof data === 'number') {
      this.previousValue = this.value;
      this.value = data;
      this.updateMetric();
    }`}
  }

  getElement() {
    return this.element;
  }
}`;
  }
}