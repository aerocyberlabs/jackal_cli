import React, { useCallback } from 'react';
import { useDesignerStore } from '../store/designer';

export const Toolbar: React.FC = () => {
  const { 
    clearDashboard, 
    exportDashboard, 
    loadDashboard,
    metadata,
    updateMetadata
  } = useDesignerStore();

  const handleExport = useCallback(() => {
    const dashboard = exportDashboard();
    const blob = new Blob([JSON.stringify(dashboard, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportDashboard, metadata.name]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        const dashboard = JSON.parse(text);
        loadDashboard(dashboard);
      }
    };
    input.click();
  }, [loadDashboard]);

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-white">TUI Dashboard Designer</h1>
        
        <input
          type="text"
          placeholder="Dashboard Name"
          value={metadata.name}
          onChange={(e) => updateMetadata({ name: e.target.value })}
          className="bg-gray-700 text-white px-3 py-1 rounded-md border border-gray-600 focus:outline-none focus:border-blue-500"
        />
        
        <select
          value={metadata.targetFramework}
          onChange={(e) => updateMetadata({ targetFramework: e.target.value as any })}
          className="bg-gray-700 text-white px-3 py-1 rounded-md border border-gray-600 focus:outline-none focus:border-blue-500"
        >
          <option value="textual">Textual (Python)</option>
          <option value="bubble_tea">Bubble Tea (Go)</option>
          <option value="ratatui">Ratatui (Rust)</option>
          <option value="blessed">Blessed (Node.js)</option>
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={handleImport}
          className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm"
        >
          Import
        </button>
        
        <button
          onClick={handleExport}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 text-sm"
        >
          Export
        </button>
        
        <button
          onClick={clearDashboard}
          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-500 text-sm"
        >
          Clear
        </button>
      </div>
    </div>
  );
};