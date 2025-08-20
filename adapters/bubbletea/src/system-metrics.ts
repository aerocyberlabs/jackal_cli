import { DataSource } from '@cli-designer/core';

export class SystemMetrics {
  static generateMetricsCollector(dataSources: DataSource[]): string {
    const systemMetrics = dataSources.filter(ds => ds.config.type === 'system_metric');
    
    if (systemMetrics.length === 0) {
      return '';
    }

    return `
// SystemMetricsCollector handles system metric collection
type SystemMetricsCollector struct {
    metricsCache map[string]WidgetData
    lastUpdate   map[string]time.Time
}

// NewSystemMetricsCollector creates a new metrics collector
func NewSystemMetricsCollector() *SystemMetricsCollector {
    return &SystemMetricsCollector{
        metricsCache: make(map[string]WidgetData),
        lastUpdate:   make(map[string]time.Time),
    }
}

// GetCPUPercent returns CPU usage percentage
func (c *SystemMetricsCollector) GetCPUPercent(ctx context.Context) (float64, error) {
    percentages, err := cpu.PercentWithContext(ctx, time.Second, false)
    if err != nil {
        return 0, fmt.Errorf("failed to get CPU percent: %w", err)
    }
    
    if len(percentages) == 0 {
        return 0, fmt.Errorf("no CPU percentage data available")
    }
    
    return percentages[0], nil
}

// GetMemoryInfo returns memory usage information
func (c *SystemMetricsCollector) GetMemoryInfo(ctx context.Context) (map[string]float64, error) {
    memory, err := mem.VirtualMemoryWithContext(ctx)
    if err != nil {
        return nil, fmt.Errorf("failed to get memory info: %w", err)
    }
    
    return map[string]float64{
        "memory_percent": memory.UsedPercent,
        "memory_used":    float64(memory.Used) / (1024 * 1024 * 1024), // GB
        "memory_total":   float64(memory.Total) / (1024 * 1024 * 1024), // GB
    }, nil
}

// GetDiskInfo returns disk usage information
func (c *SystemMetricsCollector) GetDiskInfo(ctx context.Context, path string) (map[string]float64, error) {
    if path == "" {
        path = "/"
    }
    
    usage, err := disk.UsageWithContext(ctx, path)
    if err != nil {
        return nil, fmt.Errorf("failed to get disk info: %w", err)
    }
    
    return map[string]float64{
        "disk_percent": (float64(usage.Used) / float64(usage.Total)) * 100,
        "disk_used":    float64(usage.Used) / (1024 * 1024 * 1024),  // GB
        "disk_total":   float64(usage.Total) / (1024 * 1024 * 1024), // GB
    }, nil
}

// GetNetworkInfo returns network I/O information
func (c *SystemMetricsCollector) GetNetworkInfo(ctx context.Context) (map[string]float64, error) {
    counters, err := net.IOCountersWithContext(ctx, false)
    if err != nil {
        return nil, fmt.Errorf("failed to get network info: %w", err)
    }
    
    if len(counters) == 0 {
        return nil, fmt.Errorf("no network interface data available")
    }
    
    // Sum all interfaces
    var totalBytesRecv, totalBytesSent uint64
    for _, counter := range counters {
        totalBytesRecv += counter.BytesRecv
        totalBytesSent += counter.BytesSent
    }
    
    return map[string]float64{
        "network_in":  float64(totalBytesRecv) / (1024 * 1024),  // MB
        "network_out": float64(totalBytesSent) / (1024 * 1024),  // MB
    }, nil
}

// GetMetric retrieves a specific metric by name
func (c *SystemMetricsCollector) GetMetric(ctx context.Context, metricName string) (interface{}, error) {
    switch metricName {
    case "cpu_percent":
        return c.GetCPUPercent(ctx)
        
    case "memory_percent":
        memInfo, err := c.GetMemoryInfo(ctx)
        if err != nil {
            return 0.0, err
        }
        return memInfo["memory_percent"], nil
        
    case "memory_used":
        memInfo, err := c.GetMemoryInfo(ctx)
        if err != nil {
            return 0.0, err
        }
        return memInfo["memory_used"], nil
        
    case "memory_total":
        memInfo, err := c.GetMemoryInfo(ctx)
        if err != nil {
            return 0.0, err
        }
        return memInfo["memory_total"], nil
        
    case "disk_percent":
        diskInfo, err := c.GetDiskInfo(ctx, "/")
        if err != nil {
            return 0.0, err
        }
        return diskInfo["disk_percent"], nil
        
    case "disk_used":
        diskInfo, err := c.GetDiskInfo(ctx, "/")
        if err != nil {
            return 0.0, err
        }
        return diskInfo["disk_used"], nil
        
    case "disk_total":
        diskInfo, err := c.GetDiskInfo(ctx, "/")
        if err != nil {
            return 0.0, err
        }
        return diskInfo["disk_total"], nil
        
    case "network_in":
        netInfo, err := c.GetNetworkInfo(ctx)
        if err != nil {
            return 0.0, err
        }
        return netInfo["network_in"], nil
        
    case "network_out":
        netInfo, err := c.GetNetworkInfo(ctx)
        if err != nil {
            return 0.0, err
        }
        return netInfo["network_out"], nil
        
    default:
        return nil, fmt.Errorf("unknown metric: %s", metricName)
    }
}

// Global metrics collector instance
var metricsCollector = NewSystemMetricsCollector()
`;
  }

  static generateDataSourceUpdater(dataSources: DataSource[]): string {
    const systemMetrics = dataSources.filter(ds => ds.config.type === 'system_metric');
    const apiSources = dataSources.filter(ds => ds.config.type === 'api');
    const fileSources = dataSources.filter(ds => ds.config.type === 'file');
    const commandSources = dataSources.filter(ds => ds.config.type === 'command');

    if (dataSources.length === 0) {
      return '';
    }

    let updaterCode = `
// DataSourceUpdater manages data source updates
type DataSourceUpdater struct {
    dataCache   map[string]WidgetData
    lastUpdate  map[string]time.Time
    httpClient  *http.Client
}

// NewDataSourceUpdater creates a new data source updater
func NewDataSourceUpdater() *DataSourceUpdater {
    return &DataSourceUpdater{
        dataCache:  make(map[string]WidgetData),
        lastUpdate: make(map[string]time.Time),
        httpClient: &http.Client{Timeout: 10 * time.Second},
    }
}

// collectData starts the data collection goroutine
func (m *Model) collectData(ctx context.Context) {
    updater := NewDataSourceUpdater()
    ticker := time.NewTicker(time.Second)
    defer ticker.Stop()
    
    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            m.updateAllSources(ctx, updater)
        }
    }
}

// updateAllSources updates data from all configured sources
func (m *Model) updateAllSources(ctx context.Context, updater *DataSourceUpdater) {
    ${systemMetrics.map(ds => `
    // System metric: ${ds.id}
    go m.updateSystemMetric(ctx, updater, "${ds.id}", "${ds.config.metric}", ${ds.config.interval || 1000})`).join('\n    ')}
    
    ${apiSources.map(ds => `
    // API source: ${ds.id}
    go m.updateAPISource(ctx, updater, "${ds.id}", "${ds.config.url}", ${ds.config.interval || 5000})`).join('\n    ')}
    
    ${fileSources.map(ds => `
    // File source: ${ds.id}
    go m.updateFileSource(ctx, updater, "${ds.id}", "${ds.config.path}")`).join('\n    ')}
    
    ${commandSources.map(ds => `
    // Command source: ${ds.id}
    go m.updateCommandSource(ctx, updater, "${ds.id}", "${ds.config.command}", ${ds.config.interval || 5000})`).join('\n    ')}
}

// updateSystemMetric updates a system metric data source
func (m *Model) updateSystemMetric(ctx context.Context, updater *DataSourceUpdater, sourceID, metric string, intervalMs int) {
    currentTime := time.Now()
    intervalDuration := time.Duration(intervalMs) * time.Millisecond
    
    if lastUpdate, exists := updater.lastUpdate[sourceID]; exists {
        if currentTime.Sub(lastUpdate) < intervalDuration {
            return
        }
    }
    
    value, err := metricsCollector.GetMetric(ctx, metric)
    if err != nil {
        log.Printf("Error updating system metric %s: %v", sourceID, err)
        return
    }
    
    updater.dataCache[sourceID] = WidgetData{
        "value":     value,
        "timestamp": currentTime,
        "metric":    metric,
    }
    updater.lastUpdate[sourceID] = currentTime
    
    // Update model's data cache
    m.dataCache[sourceID] = updater.dataCache[sourceID]
}

// updateAPISource updates an API data source
func (m *Model) updateAPISource(ctx context.Context, updater *DataSourceUpdater, sourceID, url string, intervalMs int) {
    currentTime := time.Now()
    intervalDuration := time.Duration(intervalMs) * time.Millisecond
    
    if lastUpdate, exists := updater.lastUpdate[sourceID]; exists {
        if currentTime.Sub(lastUpdate) < intervalDuration {
            return
        }
    }
    
    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        log.Printf("Error creating request for API source %s: %v", sourceID, err)
        return
    }
    
    resp, err := updater.httpClient.Do(req)
    if err != nil {
        log.Printf("Error fetching API source %s: %v", sourceID, err)
        updater.dataCache[sourceID] = WidgetData{
            "error":     err.Error(),
            "timestamp": currentTime,
        }
        m.dataCache[sourceID] = updater.dataCache[sourceID]
        return
    }
    defer resp.Body.Close()
    
    var data interface{}
    if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
        log.Printf("Error decoding API response for %s: %v", sourceID, err)
        return
    }
    
    updater.dataCache[sourceID] = WidgetData{
        "data":        data,
        "timestamp":   currentTime,
        "status_code": resp.StatusCode,
    }
    updater.lastUpdate[sourceID] = currentTime
    
    // Update model's data cache
    m.dataCache[sourceID] = updater.dataCache[sourceID]
}

// updateFileSource updates a file data source
func (m *Model) updateFileSource(ctx context.Context, updater *DataSourceUpdater, sourceID, filePath string) {
    // Check if file was modified
    fileInfo, err := os.Stat(filePath)
    if err != nil {
        log.Printf("Error accessing file %s for source %s: %v", filePath, sourceID, err)
        updater.dataCache[sourceID] = WidgetData{
            "error":     fmt.Sprintf("File not found: %s", filePath),
            "timestamp": time.Now(),
        }
        m.dataCache[sourceID] = updater.dataCache[sourceID]
        return
    }
    
    modTime := fileInfo.ModTime()
    if lastUpdate, exists := updater.lastUpdate[sourceID]; exists {
        if modTime.Before(lastUpdate) || modTime.Equal(lastUpdate) {
            return
        }
    }
    
    content, err := os.ReadFile(filePath)
    if err != nil {
        log.Printf("Error reading file %s for source %s: %v", filePath, sourceID, err)
        return
    }
    
    updater.dataCache[sourceID] = WidgetData{
        "content":   string(content),
        "timestamp": modTime,
        "file_path": filePath,
    }
    updater.lastUpdate[sourceID] = modTime
    
    // Update model's data cache
    m.dataCache[sourceID] = updater.dataCache[sourceID]
}

// updateCommandSource updates a command data source
func (m *Model) updateCommandSource(ctx context.Context, updater *DataSourceUpdater, sourceID, command string, intervalMs int) {
    currentTime := time.Now()
    intervalDuration := time.Duration(intervalMs) * time.Millisecond
    
    if lastUpdate, exists := updater.lastUpdate[sourceID]; exists {
        if currentTime.Sub(lastUpdate) < intervalDuration {
            return
        }
    }
    
    // Create context with timeout for command execution
    cmdCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
    defer cancel()
    
    var cmd *exec.Cmd
    if strings.Contains(command, " ") {
        parts := strings.Fields(command)
        cmd = exec.CommandContext(cmdCtx, parts[0], parts[1:]...)
    } else {
        cmd = exec.CommandContext(cmdCtx, command)
    }
    
    output, err := cmd.CombinedOutput()
    
    updater.dataCache[sourceID] = WidgetData{
        "output":      string(output),
        "error":       nil,
        "return_code": 0,
        "timestamp":   currentTime,
        "command":     command,
    }
    
    if err != nil {
        if exitError, ok := err.(*exec.ExitError); ok {
            updater.dataCache[sourceID]["return_code"] = exitError.ExitCode()
        }
        updater.dataCache[sourceID]["error"] = err.Error()
    }
    
    updater.lastUpdate[sourceID] = currentTime
    
    // Update model's data cache
    m.dataCache[sourceID] = updater.dataCache[sourceID]
}`;

    // Add required imports
    if (fileSources.length > 0 || commandSources.length > 0) {
      updaterCode = `import (
    "os"
    "os/exec"
)\n` + updaterCode;
    }

    return updaterCode;
  }
}