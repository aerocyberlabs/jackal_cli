import React, { useState } from 'react';
import { useDesignerStore } from '../store/designer';
import type { DataSource } from '@cli-designer/core';

const DATA_SOURCE_TYPES = [
  { value: 'system_metric', label: 'System Metric' },
  { value: 'api', label: 'API Endpoint' },
  { value: 'file', label: 'File' },
  { value: 'command', label: 'Command' }
] as const;

const SYSTEM_METRICS = [
  { value: 'cpu_percent', label: 'CPU Usage %' },
  { value: 'memory_percent', label: 'Memory Usage %' },
  { value: 'memory_used', label: 'Memory Used (GB)' },
  { value: 'memory_total', label: 'Memory Total (GB)' },
  { value: 'disk_percent', label: 'Disk Usage %' },
  { value: 'disk_used', label: 'Disk Used (GB)' },
  { value: 'disk_total', label: 'Disk Total (GB)' },
  { value: 'network_in', label: 'Network In (MB)' },
  { value: 'network_out', label: 'Network Out (MB)' },
  { value: 'process_count', label: 'Process Count' },
  { value: 'load_average', label: 'Load Average' }
];

export const DataSourcePanel: React.FC = () => {
  const { dataSources, addDataSource, updateDataSource, removeDataSource } = useDesignerStore();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'system_metric' as const,
    config: {
      metric: 'cpu_percent',
      url: '',
      path: '',
      command: '',
      interval: 1000
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'system_metric',
      config: {
        metric: 'cpu_percent',
        url: '',
        path: '',
        command: '',
        interval: 1000
      }
    });
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingId(null);
    resetForm();
  };

  const handleEdit = (dataSource: DataSource) => {
    setEditingId(dataSource.id);
    setIsAddingNew(false);
    
    const config = dataSource.config;
    setFormData({
      name: dataSource.name || '',
      type: config.type as any,
      config: {
        metric: config.type === 'system_metric' ? config.metric : 'cpu_percent',
        url: config.type === 'api' ? config.url : '',
        path: config.type === 'file' ? config.path : '',
        command: config.type === 'command' ? config.command : '',
        interval: 'interval' in config ? config.interval : 1000
      }
    });
  };

  const handleSave = () => {
    const config: any = {
      type: formData.type,
      interval: formData.config.interval
    };

    // Add type-specific config
    switch (formData.type) {
      case 'system_metric':
        config.metric = formData.config.metric;
        break;
      case 'api':
        config.url = formData.config.url;
        break;
      case 'file':
        config.path = formData.config.path;
        break;
      case 'command':
        config.command = formData.config.command;
        break;
    }

    const dataSource: DataSource = {
      id: editingId || `ds_${Date.now()}`,
      name: formData.name,
      config
    };

    if (editingId) {
      updateDataSource(editingId, dataSource);
    } else {
      addDataSource(dataSource);
    }

    setIsAddingNew(false);
    setEditingId(null);
    resetForm();
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this data source?')) {
      removeDataSource(id);
    }
  };

  const renderConfigFields = () => {
    switch (formData.type) {
      case 'system_metric':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Metric
              </label>
              <select
                value={formData.config.metric}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  config: { ...prev.config, metric: e.target.value }
                }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SYSTEM_METRICS.map(metric => (
                  <option key={metric.value} value={metric.value}>
                    {metric.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Update Interval (ms)
              </label>
              <input
                type="number"
                value={formData.config.interval}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  config: { ...prev.config, interval: parseInt(e.target.value) || 1000 }
                }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="100"
                step="100"
              />
            </div>
          </div>
        );

      case 'api':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                API URL
              </label>
              <input
                type="url"
                value={formData.config.url}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  config: { ...prev.config, url: e.target.value }
                }))}
                placeholder="https://api.example.com/data"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Update Interval (ms)
              </label>
              <input
                type="number"
                value={formData.config.interval}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  config: { ...prev.config, interval: parseInt(e.target.value) || 5000 }
                }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1000"
                step="1000"
              />
            </div>
          </div>
        );

      case 'file':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              File Path
            </label>
            <input
              type="text"
              value={formData.config.path}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                config: { ...prev.config, path: e.target.value }
              }))}
              placeholder="/var/log/app.log"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );

      case 'command':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Command
              </label>
              <input
                type="text"
                value={formData.config.command}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  config: { ...prev.config, command: e.target.value }
                }))}
                placeholder="df -h"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Update Interval (ms)
              </label>
              <input
                type="number"
                value={formData.config.interval}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  config: { ...prev.config, interval: parseInt(e.target.value) || 5000 }
                }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1000"
                step="1000"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full bg-gray-800 border-l border-gray-700">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Data Sources</h3>
          <button
            onClick={handleAddNew}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Add New
          </button>
        </div>

        {/* Add/Edit Form */}
        {(isAddingNew || editingId) && (
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <h4 className="text-md font-medium text-white mb-3">
              {editingId ? 'Edit Data Source' : 'Add Data Source'}
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="CPU Usage"
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const newType = e.target.value as any;
                    setFormData(prev => ({
                      ...prev,
                      type: newType,
                      config: {
                        ...prev.config,
                        metric: newType === 'system_metric' ? 'cpu_percent' : prev.config.metric,
                        interval: newType === 'system_metric' ? 1000 : 
                                  newType === 'api' || newType === 'command' ? 5000 : 
                                  prev.config.interval
                      }
                    }));
                  }}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DATA_SOURCE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {renderConfigFields()}

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={!formData.name.trim()}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {editingId ? 'Update' : 'Add'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data Sources List */}
        <div className="space-y-2">
          {dataSources.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              No data sources configured
            </p>
          ) : (
            dataSources.map((dataSource) => (
              <div
                key={dataSource.id}
                className="bg-gray-700 rounded-lg p-3 border border-gray-600"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-white text-sm mb-1">
                      {dataSource.name}
                    </h4>
                    <p className="text-gray-400 text-xs mb-1">
                      Type: {DATA_SOURCE_TYPES.find(t => t.value === dataSource.config.type)?.label}
                    </p>
                    <div className="text-gray-400 text-xs">
                      {dataSource.config.type === 'system_metric' && (
                        <span>Metric: {SYSTEM_METRICS.find(m => m.value === dataSource.config.metric)?.label}</span>
                      )}
                      {dataSource.config.type === 'api' && (
                        <span>URL: {dataSource.config.url}</span>
                      )}
                      {dataSource.config.type === 'file' && (
                        <span>Path: {dataSource.config.path}</span>
                      )}
                      {dataSource.config.type === 'command' && (
                        <span>Command: {dataSource.config.command}</span>
                      )}
                    </div>
                    {dataSource.config.interval && (
                      <div className="text-gray-500 text-xs mt-1">
                        Interval: {dataSource.config.interval}ms
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <button
                      onClick={() => handleEdit(dataSource)}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(dataSource.id)}
                      className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};