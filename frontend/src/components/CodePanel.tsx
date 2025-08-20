import React, { useMemo, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { useDesignerStore } from '../store/designer';

export const CodePanel: React.FC = () => {
  const { widgets, dataSources, settings, metadata, exportDashboard } = useDesignerStore();
  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'go' | 'rust' | 'javascript'>('python');
  const [showOptions, setShowOptions] = useState(false);

  // Generate code based on current dashboard state
  const generatedCode = useMemo(() => {
    const dashboard = exportDashboard();
    
    // Basic Python/Textual code generation for now
    if (selectedLanguage === 'python') {
      return generatePythonCode(dashboard);
    }
    
    // Placeholder for other languages
    return `# ${selectedLanguage.toUpperCase()} code generation not implemented yet
# This will generate ${selectedLanguage} code for ${metadata.framework} framework
# Dashboard: ${metadata.name}
# Widgets: ${widgets.length}
# Framework: ${metadata.framework}

# Coming soon...`;
  }, [widgets, dataSources, settings, metadata, selectedLanguage, exportDashboard]);

  // Get language for Monaco editor
  const getMonacoLanguage = (lang: string) => {
    switch (lang) {
      case 'python': return 'python';
      case 'go': return 'go';
      case 'rust': return 'rust';
      case 'javascript': return 'javascript';
      default: return 'python';
    }
  };

  // Copy code to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Download code as file
  const handleDownload = () => {
    const extension = getFileExtension(selectedLanguage);
    const filename = `${metadata.name.replace(/\s+/g, '-').toLowerCase()}.${extension}`;
    
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-600">
        <div className="flex items-center space-x-3">
          <h3 className="text-sm font-semibold text-gray-200">Generated Code</h3>
          
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded flex items-center space-x-1"
            >
              <span>{selectedLanguage.toUpperCase()}</span>
              <span className="text-gray-400">▼</span>
            </button>
            
            {showOptions && (
              <div className="absolute top-full left-0 mt-1 bg-gray-700 border border-gray-600 rounded shadow-lg z-10">
                {['python', 'go', 'rust', 'javascript'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setSelectedLanguage(lang as any);
                      setShowOptions(false);
                    }}
                    className="block w-full px-3 py-1 text-xs text-left hover:bg-gray-600 text-gray-200"
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={handleCopy}
            className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
            title="Copy to clipboard"
          >
            Copy
          </button>
          <button
            onClick={handleDownload}
            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            title="Download file"
          >
            Download
          </button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 relative">
        {widgets.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-3">[CODE]</div>
              <div className="text-sm">Add widgets to generate code</div>
            </div>
          </div>
        ) : (
          <Editor
            height="100%"
            language={getMonacoLanguage(selectedLanguage)}
            value={generatedCode}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 12,
              lineNumbers: 'on',
              renderWhitespace: 'selection',
              automaticLayout: true,
              wordWrap: 'on',
            }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-600 bg-gray-750 text-xs text-gray-400">
        <div className="flex justify-between items-center">
          <span>Framework: {metadata.framework} • Language: {selectedLanguage}</span>
          <span>{generatedCode.split('\n').length} lines</span>
        </div>
      </div>
    </div>
  );
};

// Helper functions
function generatePythonCode(dashboard: any): string {
  const { metadata, widgets, dataSources } = dashboard;
  
  // Basic Python/Textual code generation
  const imports = [
    'from textual.app import App, ComposeResult',
    'from textual.containers import Container, Horizontal, Vertical', 
    'from textual.widgets import Header, Footer, Static',
    'import psutil',
    'import time'
  ];

  const widgetClasses = widgets.map((widget: any) => `
class ${widget.id}(Static):
    """${widget.type} widget - ${widget.title || 'Untitled'}"""
    
    def __init__(self):
        super().__init__()
        self.update("${widget.title || widget.type}")
    
    def on_mount(self) -> None:
        self.styles.width = ${widget.size.width}
        self.styles.height = ${widget.size.height}
        self.styles.border = ("solid", "white")
`).join('\n');

  const appClass = `
class DashboardApp(App):
    """${metadata.name || 'Dashboard Application'}"""
    
    CSS = """
    Container {
        background: $surface;
        padding: 1;
    }
    Static {
        margin: 1;
        padding: 1;
    }
    """
    
    def compose(self) -> ComposeResult:
        yield Header()
        with Container():${widgets.map((w: any) => `
            yield ${w.id}()`).join('')}
        yield Footer()
    
    def on_mount(self) -> None:
        self.title = "${metadata.name || 'Dashboard'}"
        ${dataSources.length > 0 ? 'self.set_interval(1.0, self.update_data)' : ''}
    
    ${dataSources.length > 0 ? `
    def update_data(self) -> None:
        """Update dashboard data"""
        # Data source updates would go here
        pass` : ''}
`;

  const main = `
if __name__ == "__main__":
    app = DashboardApp()
    app.run()
`;

  return [
    '#!/usr/bin/env python3',
    '"""',
    `${metadata.name || 'Dashboard'} - Generated by CLI Dashboard Designer`,
    `Created: ${new Date().toISOString()}`,
    `Widgets: ${widgets.length}`,
    `Framework: ${metadata.framework}`,
    '"""',
    '',
    imports.join('\n'),
    '',
    widgetClasses,
    '',
    appClass,
    '',
    main
  ].join('\n');
}

function getFileExtension(language: string): string {
  switch (language) {
    case 'python': return 'py';
    case 'go': return 'go';
    case 'rust': return 'rs';
    case 'javascript': return 'js';
    default: return 'txt';
  }
}