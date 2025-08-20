import { DataSource } from '@cli-designer/core';

export class SystemMetrics {
  static generateMetricsCollector(dataSources: DataSource[]): string {
    const systemMetrics = dataSources.filter(ds => ds.config.type === 'system_metric');
    
    if (systemMetrics.length === 0) {
      return '';
    }

    return `
use std::collections::HashMap;
use std::time::{Duration, Instant};
use sysinfo::{CpuExt, System, SystemExt, DiskExt, NetworkExt};

#[derive(Debug, Clone)]
pub struct MetricsCollector {
    system: System,
    cache: HashMap<String, f64>,
    last_update: HashMap<String, Instant>,
}

impl MetricsCollector {
    pub fn new() -> Self {
        Self {
            system: System::new_all(),
            cache: HashMap::new(),
            last_update: HashMap::new(),
        }
    }
    
    pub fn refresh(&mut self) {
        self.system.refresh_all();
    }
    
    pub fn get_cpu_percent(&mut self) -> f64 {
        self.system.refresh_cpu();
        self.system.global_cpu_info().cpu_usage() as f64
    }
    
    pub fn get_memory_info(&mut self) -> HashMap<String, f64> {
        self.system.refresh_memory();
        
        let used = self.system.used_memory() as f64;
        let total = self.system.total_memory() as f64;
        let percent = if total > 0.0 { (used / total) * 100.0 } else { 0.0 };
        
        let mut info = HashMap::new();
        info.insert("memory_percent".to_string(), percent);
        info.insert("memory_used".to_string(), used / (1024.0 * 1024.0 * 1024.0)); // GB
        info.insert("memory_total".to_string(), total / (1024.0 * 1024.0 * 1024.0)); // GB
        info
    }
    
    pub fn get_disk_info(&mut self, path: Option<&str>) -> HashMap<String, f64> {
        self.system.refresh_disks();
        
        let disks = self.system.disks();
        let disk = if let Some(path) = path {
            disks.iter().find(|d| d.mount_point().to_str() == Some(path))
        } else {
            disks.first()
        };
        
        if let Some(disk) = disk {
            let used = disk.total_space() - disk.available_space();
            let total = disk.total_space();
            let percent = if total > 0 { (used as f64 / total as f64) * 100.0 } else { 0.0 };
            
            let mut info = HashMap::new();
            info.insert("disk_percent".to_string(), percent);
            info.insert("disk_used".to_string(), used as f64 / (1024.0 * 1024.0 * 1024.0)); // GB
            info.insert("disk_total".to_string(), total as f64 / (1024.0 * 1024.0 * 1024.0)); // GB
            info
        } else {
            HashMap::new()
        }
    }
    
    pub fn get_network_info(&mut self) -> HashMap<String, f64> {
        self.system.refresh_networks();
        
        let networks = self.system.networks();
        let (mut total_received, mut total_transmitted) = (0u64, 0u64);
        
        for (_, network) in networks {
            total_received += network.received();
            total_transmitted += network.transmitted();
        }
        
        let mut info = HashMap::new();
        info.insert("network_in".to_string(), total_received as f64 / (1024.0 * 1024.0)); // MB
        info.insert("network_out".to_string(), total_transmitted as f64 / (1024.0 * 1024.0)); // MB
        info
    }
    
    pub fn get_metric(&mut self, metric_name: &str) -> Option<f64> {
        match metric_name {
            "cpu_percent" => Some(self.get_cpu_percent()),
            
            "memory_percent" => {
                let mem_info = self.get_memory_info();
                mem_info.get("memory_percent").copied()
            },
            
            "memory_used" => {
                let mem_info = self.get_memory_info();
                mem_info.get("memory_used").copied()
            },
            
            "memory_total" => {
                let mem_info = self.get_memory_info();
                mem_info.get("memory_total").copied()
            },
            
            "disk_percent" => {
                let disk_info = self.get_disk_info(None);
                disk_info.get("disk_percent").copied()
            },
            
            "disk_used" => {
                let disk_info = self.get_disk_info(None);
                disk_info.get("disk_used").copied()
            },
            
            "disk_total" => {
                let disk_info = self.get_disk_info(None);
                disk_info.get("disk_total").copied()
            },
            
            "network_in" => {
                let net_info = self.get_network_info();
                net_info.get("network_in").copied()
            },
            
            "network_out" => {
                let net_info = self.get_network_info();
                net_info.get("network_out").copied()
            },
            
            _ => None,
        }
    }
    
    pub fn get_all_metrics(&mut self) -> HashMap<String, f64> {
        let mut metrics = HashMap::new();
        
        // CPU metrics
        metrics.insert("cpu_percent".to_string(), self.get_cpu_percent());
        
        // Memory metrics
        let memory_info = self.get_memory_info();
        metrics.extend(memory_info);
        
        // Disk metrics
        let disk_info = self.get_disk_info(None);
        metrics.extend(disk_info);
        
        // Network metrics
        let network_info = self.get_network_info();
        metrics.extend(network_info);
        
        metrics
    }
}`;
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
use std::collections::HashMap;
use std::time::{Duration, Instant};
use std::fs;
use std::process::Command;
use tokio::time::sleep;
use reqwest;
use serde_json::Value;

#[derive(Debug, Clone)]
pub struct DataSourceUpdater {
    data_cache: HashMap<String, Value>,
    last_update: HashMap<String, Instant>,
    http_client: reqwest::Client,
    metrics_collector: MetricsCollector,
}

impl DataSourceUpdater {
    pub fn new() -> Self {
        Self {
            data_cache: HashMap::new(),
            last_update: HashMap::new(),
            http_client: reqwest::Client::new(),
            metrics_collector: MetricsCollector::new(),
        }
    }
    
    pub async fn update_all_sources(&mut self) {
        ${systemMetrics.map(ds => `
        // System metric: ${ds.id}
        self.update_system_metric("${ds.id}", "${ds.config.metric}", Duration::from_millis(${ds.config.interval || 1000})).await;`).join('')}
        
        ${apiSources.map(ds => `
        // API source: ${ds.id}
        self.update_api_source("${ds.id}", "${ds.config.url}", Duration::from_millis(${ds.config.interval || 5000})).await;`).join('')}
        
        ${fileSources.map(ds => `
        // File source: ${ds.id}
        self.update_file_source("${ds.id}", "${ds.config.path}").await;`).join('')}
        
        ${commandSources.map(ds => `
        // Command source: ${ds.id}
        self.update_command_source("${ds.id}", "${ds.config.command}", Duration::from_millis(${ds.config.interval || 5000})).await;`).join('')}
    }
    
    async fn update_system_metric(&mut self, source_id: &str, metric: &str, interval: Duration) {
        let current_time = Instant::now();
        
        if let Some(last_update) = self.last_update.get(source_id) {
            if current_time.duration_since(*last_update) < interval {
                return;
            }
        }
        
        if let Some(value) = self.metrics_collector.get_metric(metric) {
            self.data_cache.insert(
                source_id.to_string(),
                serde_json::json!({
                    "value": value,
                    "timestamp": current_time.elapsed().as_millis(),
                    "metric": metric
                })
            );
            self.last_update.insert(source_id.to_string(), current_time);
        }
    }
    
    async fn update_api_source(&mut self, source_id: &str, url: &str, interval: Duration) {
        let current_time = Instant::now();
        
        if let Some(last_update) = self.last_update.get(source_id) {
            if current_time.duration_since(*last_update) < interval {
                return;
            }
        }
        
        match self.http_client.get(url).send().await {
            Ok(response) => {
                let status = response.status().as_u16();
                match response.json::<Value>().await {
                    Ok(data) => {
                        self.data_cache.insert(
                            source_id.to_string(),
                            serde_json::json!({
                                "data": data,
                                "timestamp": current_time.elapsed().as_millis(),
                                "status_code": status
                            })
                        );
                        self.last_update.insert(source_id.to_string(), current_time);
                    },
                    Err(e) => {
                        eprintln!("Error parsing API response for {}: {}", source_id, e);
                    }
                }
            },
            Err(e) => {
                eprintln!("Error fetching API source {}: {}", source_id, e);
                self.data_cache.insert(
                    source_id.to_string(),
                    serde_json::json!({
                        "error": e.to_string(),
                        "timestamp": current_time.elapsed().as_millis()
                    })
                );
            }
        }
    }
    
    async fn update_file_source(&mut self, source_id: &str, file_path: &str) {
        match fs::metadata(file_path) {
            Ok(metadata) => {
                let mod_time = metadata.modified().unwrap_or(std::time::SystemTime::UNIX_EPOCH);
                let mod_instant = Instant::now() - mod_time.elapsed().unwrap_or(Duration::ZERO);
                
                if let Some(last_update) = self.last_update.get(source_id) {
                    if mod_instant <= *last_update {
                        return;
                    }
                }
                
                match fs::read_to_string(file_path) {
                    Ok(content) => {
                        self.data_cache.insert(
                            source_id.to_string(),
                            serde_json::json!({
                                "content": content,
                                "timestamp": mod_instant.elapsed().as_millis(),
                                "file_path": file_path
                            })
                        );
                        self.last_update.insert(source_id.to_string(), mod_instant);
                    },
                    Err(e) => {
                        eprintln!("Error reading file {} for source {}: {}", file_path, source_id, e);
                    }
                }
            },
            Err(e) => {
                eprintln!("Error accessing file {} for source {}: {}", file_path, source_id, e);
                self.data_cache.insert(
                    source_id.to_string(),
                    serde_json::json!({
                        "error": format!("File not found: {}", file_path),
                        "timestamp": Instant::now().elapsed().as_millis()
                    })
                );
            }
        }
    }
    
    async fn update_command_source(&mut self, source_id: &str, command: &str, interval: Duration) {
        let current_time = Instant::now();
        
        if let Some(last_update) = self.last_update.get(source_id) {
            if current_time.duration_since(*last_update) < interval {
                return;
            }
        }
        
        let parts: Vec<&str> = command.split_whitespace().collect();
        if parts.is_empty() {
            return;
        }
        
        let mut cmd = Command::new(parts[0]);
        if parts.len() > 1 {
            cmd.args(&parts[1..]);
        }
        
        match cmd.output() {
            Ok(output) => {
                self.data_cache.insert(
                    source_id.to_string(),
                    serde_json::json!({
                        "output": String::from_utf8_lossy(&output.stdout),
                        "error": String::from_utf8_lossy(&output.stderr),
                        "return_code": output.status.code().unwrap_or(-1),
                        "timestamp": current_time.elapsed().as_millis(),
                        "command": command
                    })
                );
                self.last_update.insert(source_id.to_string(), current_time);
            },
            Err(e) => {
                eprintln!("Error executing command {} for source {}: {}", command, source_id, e);
            }
        }
    }
    
    pub fn get_data(&self, source_id: &str) -> Option<&Value> {
        self.data_cache.get(source_id)
    }
}`;

    return updaterCode;
  }
}