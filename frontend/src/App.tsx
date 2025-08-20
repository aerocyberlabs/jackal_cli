import React from 'react';
import { DesignCanvas } from './components/DesignCanvas';
import { WidgetLibrary } from './components/WidgetLibrary';
import { PropertiesPanel } from './components/PropertiesPanel';
import { DataSourcePanel } from './components/DataSourcePanel';
import { Toolbar } from './components/Toolbar';
import { PreviewPanel } from './components/PreviewPanel';
import { CodePanel } from './components/CodePanel';
import { useDesignerStore } from './store/designer';

function App() {
  const [rightPanelTab, setRightPanelTab] = React.useState<'properties' | 'dataSources'>('properties');

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      {/* Toolbar */}
      <Toolbar />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Widget Library */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <WidgetLibrary />
        </div>

        {/* Center - Design Canvas */}
        <div className="flex-1 bg-gray-850 relative">
          <DesignCanvas />
        </div>

        {/* Right Sidebar - Properties & Data Sources */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Tab Header */}
          <div className="flex border-b border-gray-700">
            <button
              className={`flex-1 px-4 py-3 text-sm font-medium border-r border-gray-700 ${
                rightPanelTab === 'properties'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-750'
              }`}
              onClick={() => setRightPanelTab('properties')}
            >
              Properties
            </button>
            <button
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                rightPanelTab === 'dataSources'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-750'
              }`}
              onClick={() => setRightPanelTab('dataSources')}
            >
              Data Sources
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {rightPanelTab === 'properties' && <PropertiesPanel />}
            {rightPanelTab === 'dataSources' && <DataSourcePanel />}
          </div>
        </div>
      </div>
      {/* Bottom Panel - Preview/Code */}
      <div className="h-80 bg-gray-800 border-t border-gray-700">
        <div className="flex h-full">
          <div className="flex-1 border-r border-gray-700">
            <PreviewPanel />
          </div>
          <div className="flex-1">
            <CodePanel />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;