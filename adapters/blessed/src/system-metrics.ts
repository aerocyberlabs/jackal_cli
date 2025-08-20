import { DataSource } from '@cli-designer/core';

export class SystemMetrics {
  static generateMetricsCollector(dataSources: DataSource[]): string {
    const systemMetrics = dataSources.filter(ds => ds.config.type === 'system_metric');
    
    if (systemMetrics.length === 0) {
      return '';
    }

    return `
const si = require('systeminformation');

// System metrics collector
class SystemMetricsCollector {
  constructor() {
    this.metricsCache = new Map();
    this.lastUpdate = new Map();
  }

  async getCPUPercent() {
    try {
      const cpu = await si.currentLoad();
      return cpu.currentload;
    } catch (error) {
      console.error('Error getting CPU percent:', error.message);
      return 0;
    }
  }

  async getMemoryInfo() {
    try {
      const memory = await si.mem();
      return {
        memory_percent: (memory.used / memory.total) * 100,
        memory_used: memory.used / (1024 * 1024 * 1024), // GB
        memory_total: memory.total / (1024 * 1024 * 1024) // GB
      };
    } catch (error) {
      console.error('Error getting memory info:', error.message);
      return { memory_percent: 0, memory_used: 0, memory_total: 0 };
    }
  }

  async getDiskInfo(path = '/') {
    try {
      const disks = await si.fsSize();
      const disk = disks.find(d => d.mount === path) || disks[0];
      
      if (!disk) {
        return { disk_percent: 0, disk_used: 0, disk_total: 0 };
      }
      
      const usedGB = disk.used / (1024 * 1024 * 1024);
      const totalGB = disk.size / (1024 * 1024 * 1024);
      const percent = totalGB > 0 ? (usedGB / totalGB) * 100 : 0;
      
      return {
        disk_percent: percent,
        disk_used: usedGB,
        disk_total: totalGB
      };
    } catch (error) {
      console.error('Error getting disk info:', error.message);
      return { disk_percent: 0, disk_used: 0, disk_total: 0 };
    }
  }

  async getNetworkInfo() {
    try {
      const networkStats = await si.networkStats();
      const stats = networkStats[0] || { rx_bytes: 0, tx_bytes: 0 };
      
      return {
        network_in: stats.rx_bytes / (1024 * 1024), // MB
        network_out: stats.tx_bytes / (1024 * 1024) // MB
      };
    } catch (error) {
      console.error('Error getting network info:', error.message);
      return { network_in: 0, network_out: 0 };
    }
  }

  async getProcessCount() {
    try {
      const processes = await si.processes();
      return processes.list.length;
    } catch (error) {
      console.error('Error getting process count:', error.message);
      return 0;
    }
  }

  async getLoadAverage() {
    try {
      const load = await si.currentLoad();
      return load.avgload || 0;
    } catch (error) {
      console.error('Error getting load average:', error.message);
      return 0;
    }
  }

  async getMetric(metricName) {
    const metricMap = {
      'cpu_percent': () => this.getCPUPercent(),
      'memory_percent': async () => {
        const memInfo = await this.getMemoryInfo();
        return memInfo.memory_percent;
      },
      'memory_used': async () => {
        const memInfo = await this.getMemoryInfo();
        return memInfo.memory_used;
      },
      'memory_total': async () => {
        const memInfo = await this.getMemoryInfo();
        return memInfo.memory_total;
      },
      'disk_percent': async () => {
        const diskInfo = await this.getDiskInfo();
        return diskInfo.disk_percent;
      },
      'disk_used': async () => {
        const diskInfo = await this.getDiskInfo();
        return diskInfo.disk_used;
      },
      'disk_total': async () => {
        const diskInfo = await this.getDiskInfo();
        return diskInfo.disk_total;
      },
      'network_in': async () => {
        const netInfo = await this.getNetworkInfo();
        return netInfo.network_in;
      },
      'network_out': async () => {
        const netInfo = await this.getNetworkInfo();
        return netInfo.network_out;
      },
      'process_count': () => this.getProcessCount(),
      'load_average': () => this.getLoadAverage()
    };

    if (metricMap[metricName]) {
      try {
        return await metricMap[metricName]();
      } catch (error) {
        console.error(\`Error collecting metric \${metricName}:\`, error.message);
        return 0;
      }
    } else {
      console.warn(\`Unknown metric: \${metricName}\`);
      return 0;
    }
  }

  async getAllMetrics() {
    const metrics = {};
    
    try {
      // CPU metrics
      metrics.cpu_percent = await this.getCPUPercent();
      
      // Memory metrics
      const memoryInfo = await this.getMemoryInfo();
      Object.assign(metrics, memoryInfo);
      
      // Disk metrics
      const diskInfo = await this.getDiskInfo();
      Object.assign(metrics, diskInfo);
      
      // Network metrics
      const networkInfo = await this.getNetworkInfo();
      Object.assign(metrics, networkInfo);
      
      // System metrics
      metrics.process_count = await this.getProcessCount();
      metrics.load_average = await this.getLoadAverage();
      
      // Add timestamp
      metrics.timestamp = new Date().toISOString();
      
      return metrics;
    } catch (error) {
      console.error('Error collecting all metrics:', error.message);
      return {};
    }
  }
}

// Global metrics collector instance
const metricsCollector = new SystemMetricsCollector();`;
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
// Data source updater
class DataUpdater {
  constructor() {
    this.dataCache = new Map();
    this.lastUpdate = new Map();
    this.watchers = new Map();
  }

  async updateSource(sourceId, type, config) {
    const currentTime = Date.now();
    const interval = config.interval || 1000;
    
    // Check if enough time has passed for this source
    const lastUpdate = this.lastUpdate.get(sourceId) || 0;
    if (currentTime - lastUpdate < interval && type !== 'file') {
      return this.dataCache.get(sourceId);
    }

    try {
      let data = null;

      switch (type) {
        case 'system_metric':
          data = await this.updateSystemMetric(sourceId, config.metric);
          break;
        case 'api':
          data = await this.updateAPISource(sourceId, config.url);
          break;
        case 'file':
          data = await this.updateFileSource(sourceId, config.path);
          break;
        case 'command':
          data = await this.updateCommandSource(sourceId, config.command);
          break;
        default:
          console.warn(\`Unknown data source type: \${type}\`);
          return null;
      }

      if (data !== null) {
        this.dataCache.set(sourceId, data);
        this.lastUpdate.set(sourceId, currentTime);
      }

      return data;
    } catch (error) {
      console.error(\`Error updating data source \${sourceId}:\`, error.message);
      return null;
    }
  }

  async updateSystemMetric(sourceId, metric) {
    try {
      const value = await metricsCollector.getMetric(metric);
      return {
        value: value,
        timestamp: Date.now(),
        metric: metric
      };
    } catch (error) {
      console.error(\`Error updating system metric \${sourceId}:\`, error.message);
      return null;
    }
  }

  async updateAPISource(sourceId, url) {
    try {
      const axios = require('axios');
      const response = await axios.get(url, { timeout: 10000 });
      
      return {
        data: response.data,
        timestamp: Date.now(),
        status_code: response.status
      };
    } catch (error) {
      console.error(\`Error updating API source \${sourceId}:\`, error.message);
      return {
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  async updateFileSource(sourceId, filePath) {
    try {
      const fs = require('fs');
      const stats = fs.statSync(filePath);
      const modTime = stats.mtime.getTime();
      
      // Check if file was modified since last read
      const lastModified = this.lastUpdate.get(\`\${sourceId}_modified\`) || 0;
      if (modTime <= lastModified) {
        return this.dataCache.get(sourceId);
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      this.lastUpdate.set(\`\${sourceId}_modified\`, modTime);
      
      return {
        content: content,
        timestamp: modTime,
        file_path: filePath
      };
    } catch (error) {
      console.error(\`Error updating file source \${sourceId}:\`, error.message);
      return {
        error: \`File not found: \${filePath}\`,
        timestamp: Date.now()
      };
    }
  }

  async updateCommandSource(sourceId, command) {
    return new Promise((resolve) => {
      const { exec } = require('child_process');
      
      exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
        const result = {
          output: stdout,
          error: stderr,
          return_code: error ? error.code || -1 : 0,
          timestamp: Date.now(),
          command: command
        };
        
        if (error) {
          console.error(\`Error executing command for \${sourceId}:\`, error.message);
        }
        
        resolve(result);
      });
    });
  }

  getData(sourceId) {
    return this.dataCache.get(sourceId);
  }

  clearCache() {
    this.dataCache.clear();
    this.lastUpdate.clear();
  }
}`;

    return updaterCode;
  }
}