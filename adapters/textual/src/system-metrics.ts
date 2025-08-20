import { DataSource } from '@cli-designer/core';

export class SystemMetrics {
  static generateMetricsCollector(dataSources: DataSource[]): string {
    const systemMetrics = dataSources.filter(ds => ds.config.type === 'system_metric');
    
    if (systemMetrics.length === 0) {
      return '';
    }

    const imports = [
      'import psutil',
      'import time',
      'import asyncio',
      'from datetime import datetime',
      'from typing import Dict, Any, Optional'
    ].join('\n');

    const metricsClass = `
class SystemMetricsCollector:
    """Collects system metrics using psutil"""
    
    def __init__(self):
        self.metrics_cache = {}
        self.last_update = {}
        
    def get_cpu_percent(self, interval: float = 0.1) -> float:
        """Get CPU usage percentage"""
        try:
            return psutil.cpu_percent(interval=interval)
        except Exception as e:
            print(f"Error getting CPU percent: {e}")
            return 0.0
            
    def get_memory_info(self) -> Dict[str, float]:
        """Get memory usage information"""
        try:
            memory = psutil.virtual_memory()
            return {
                'memory_percent': memory.percent,
                'memory_used': memory.used / (1024**3),  # GB
                'memory_total': memory.total / (1024**3)  # GB
            }
        except Exception as e:
            print(f"Error getting memory info: {e}")
            return {'memory_percent': 0.0, 'memory_used': 0.0, 'memory_total': 0.0}
            
    def get_disk_info(self, path: str = '/') -> Dict[str, float]:
        """Get disk usage information"""
        try:
            disk = psutil.disk_usage(path)
            return {
                'disk_percent': (disk.used / disk.total) * 100,
                'disk_used': disk.used / (1024**3),  # GB
                'disk_total': disk.total / (1024**3)  # GB
            }
        except Exception as e:
            print(f"Error getting disk info: {e}")
            return {'disk_percent': 0.0, 'disk_used': 0.0, 'disk_total': 0.0}
            
    def get_network_info(self) -> Dict[str, float]:
        """Get network I/O information"""
        try:
            net_io = psutil.net_io_counters()
            return {
                'network_in': net_io.bytes_recv / (1024**2),  # MB
                'network_out': net_io.bytes_sent / (1024**2)  # MB
            }
        except Exception as e:
            print(f"Error getting network info: {e}")
            return {'network_in': 0.0, 'network_out': 0.0}
            
    def get_process_count(self) -> int:
        """Get number of running processes"""
        try:
            return len(psutil.pids())
        except Exception as e:
            print(f"Error getting process count: {e}")
            return 0
            
    def get_load_average(self) -> float:
        """Get system load average (1 minute)"""
        try:
            if hasattr(psutil, 'getloadavg'):
                return psutil.getloadavg()[0]
            else:
                # Fallback for Windows
                return psutil.cpu_percent(interval=0.1) / 100.0
        except Exception as e:
            print(f"Error getting load average: {e}")
            return 0.0
    
    def get_metric(self, metric_name: str, **kwargs) -> Any:
        """Get a specific metric by name"""
        metric_map = {
            'cpu_percent': lambda: self.get_cpu_percent(),
            'memory_percent': lambda: self.get_memory_info()['memory_percent'],
            'memory_used': lambda: self.get_memory_info()['memory_used'],
            'memory_total': lambda: self.get_memory_info()['memory_total'],
            'disk_percent': lambda: self.get_disk_info()['disk_percent'],
            'disk_used': lambda: self.get_disk_info()['disk_used'],
            'disk_total': lambda: self.get_disk_info()['disk_total'],
            'network_in': lambda: self.get_network_info()['network_in'],
            'network_out': lambda: self.get_network_info()['network_out'],
            'process_count': lambda: self.get_process_count(),
            'load_average': lambda: self.get_load_average()
        }
        
        if metric_name in metric_map:
            try:
                return metric_map[metric_name]()
            except Exception as e:
                print(f"Error collecting metric {metric_name}: {e}")
                return 0.0
        else:
            print(f"Unknown metric: {metric_name}")
            return 0.0
    
    def get_all_metrics(self) -> Dict[str, Any]:
        """Get all available system metrics"""
        metrics = {}
        
        # CPU metrics
        metrics['cpu_percent'] = self.get_cpu_percent()
        
        # Memory metrics
        memory_info = self.get_memory_info()
        metrics.update(memory_info)
        
        # Disk metrics
        disk_info = self.get_disk_info()
        metrics.update(disk_info)
        
        # Network metrics
        network_info = self.get_network_info()
        metrics.update(network_info)
        
        # System metrics
        metrics['process_count'] = self.get_process_count()
        metrics['load_average'] = self.get_load_average()
        
        # Add timestamp
        metrics['timestamp'] = datetime.now().isoformat()
        
        return metrics

# Global metrics collector instance
metrics_collector = SystemMetricsCollector()
`;

    return imports + '\n' + metricsClass;
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
class DataSourceUpdater:
    """Handles updating data from various sources"""
    
    def __init__(self):
        self.data_cache = {}
        self.last_update = {}
        
    async def update_all_sources(self):
        """Update data from all configured sources"""
        tasks = []
        
        ${systemMetrics.map(ds => `
        # System metric: ${ds.id}
        tasks.append(self.update_system_metric("${ds.id}", "${ds.config.metric}", ${ds.config.interval || 1000}))`).join('')}
        
        ${apiSources.map(ds => `
        # API source: ${ds.id}
        tasks.append(self.update_api_source("${ds.id}", "${ds.config.url}", ${ds.config.interval || 5000}))`).join('')}
        
        ${fileSources.map(ds => `
        # File source: ${ds.id}
        tasks.append(self.update_file_source("${ds.id}", "${ds.config.path}"))`).join('')}
        
        ${commandSources.map(ds => `
        # Command source: ${ds.id}
        tasks.append(self.update_command_source("${ds.id}", "${ds.config.command}", ${ds.config.interval || 5000}))`).join('')}
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def update_system_metric(self, source_id: str, metric: str, interval_ms: int):
        """Update system metric data"""
        try:
            current_time = time.time()
            interval_seconds = interval_ms / 1000.0
            
            # Check if enough time has passed
            if (source_id in self.last_update and 
                current_time - self.last_update[source_id] < interval_seconds):
                return
            
            value = metrics_collector.get_metric(metric)
            self.data_cache[source_id] = {
                'value': value,
                'timestamp': current_time,
                'metric': metric
            }
            self.last_update[source_id] = current_time
            
        except Exception as e:
            print(f"Error updating system metric {source_id}: {e}")
    
    async def update_api_source(self, source_id: str, url: str, interval_ms: int):
        """Update API data source"""
        try:
            import aiohttp
            current_time = time.time()
            interval_seconds = interval_ms / 1000.0
            
            # Check if enough time has passed
            if (source_id in self.last_update and 
                current_time - self.last_update[source_id] < interval_seconds):
                return
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=10) as response:
                    data = await response.json()
                    self.data_cache[source_id] = {
                        'data': data,
                        'timestamp': current_time,
                        'status_code': response.status
                    }
                    self.last_update[source_id] = current_time
                    
        except Exception as e:
            print(f"Error updating API source {source_id}: {e}")
            # Store error in cache
            self.data_cache[source_id] = {
                'error': str(e),
                'timestamp': time.time()
            }
    
    async def update_file_source(self, source_id: str, file_path: str):
        """Update file data source"""
        try:
            import aiofiles
            import os
            
            # Check if file was modified
            if os.path.exists(file_path):
                mod_time = os.path.getmtime(file_path)
                
                if (source_id in self.last_update and 
                    mod_time <= self.last_update[source_id]):
                    return
                
                async with aiofiles.open(file_path, 'r') as f:
                    content = await f.read()
                    self.data_cache[source_id] = {
                        'content': content,
                        'timestamp': mod_time,
                        'file_path': file_path
                    }
                    self.last_update[source_id] = mod_time
            else:
                self.data_cache[source_id] = {
                    'error': f"File not found: {file_path}",
                    'timestamp': time.time()
                }
                
        except Exception as e:
            print(f"Error updating file source {source_id}: {e}")
    
    async def update_command_source(self, source_id: str, command: str, interval_ms: int):
        """Update command data source"""
        try:
            import subprocess
            current_time = time.time()
            interval_seconds = interval_ms / 1000.0
            
            # Check if enough time has passed
            if (source_id in self.last_update and 
                current_time - self.last_update[source_id] < interval_seconds):
                return
            
            result = subprocess.run(
                command, 
                shell=True, 
                capture_output=True, 
                text=True, 
                timeout=30
            )
            
            self.data_cache[source_id] = {
                'output': result.stdout,
                'error': result.stderr,
                'return_code': result.returncode,
                'timestamp': current_time,
                'command': command
            }
            self.last_update[source_id] = current_time
            
        except Exception as e:
            print(f"Error updating command source {source_id}: {e}")
    
    def get_data(self, source_id: str) -> Optional[Dict[str, Any]]:
        """Get cached data for a specific source"""
        return self.data_cache.get(source_id)

# Global data source updater instance
data_updater = DataSourceUpdater()
`;

    return updaterCode;
  }

  static generateMetricsIntegration(dataSources: DataSource[]): string {
    if (dataSources.length === 0) {
      return '';
    }

    return `
# Data source integration helpers
def get_widget_data(source_id: str, default_value=None):
    """Get data for a widget from its data source"""
    if not source_id:
        return default_value
        
    data = data_updater.get_data(source_id)
    if not data:
        return default_value
        
    # Handle different data types
    if 'value' in data:  # System metrics
        return data['value']
    elif 'data' in data:  # API data
        return data['data']
    elif 'content' in data:  # File data
        return data['content']
    elif 'output' in data:  # Command output
        return data['output']
    
    return default_value

def format_metric_value(value, format_type='number'):
    """Format metric values for display"""
    if value is None:
        return "N/A"
        
    try:
        if format_type == 'percentage':
            return f"{float(value):.1f}%"
        elif format_type == 'bytes':
            bytes_val = float(value)
            units = ['B', 'KB', 'MB', 'GB', 'TB']
            unit_index = 0
            while bytes_val >= 1024 and unit_index < len(units) - 1:
                bytes_val /= 1024
                unit_index += 1
            return f"{bytes_val:.1f} {units[unit_index]}"
        elif format_type == 'number':
            num_val = float(value)
            if num_val >= 1000000:
                return f"{num_val/1000000:.1f}M"
            elif num_val >= 1000:
                return f"{num_val/1000:.1f}K"
            else:
                return f"{num_val:.1f}"
        else:
            return str(value)
    except (ValueError, TypeError):
        return str(value)
`;
  }
}