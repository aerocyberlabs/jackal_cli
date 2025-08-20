import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type WidgetType = 
  | 'text' 
  | 'line_chart' 
  | 'bar_chart' 
  | 'table' 
  | 'progress_bar' 
  | 'sparkline' 
  | 'gauge' 
  | 'log_viewer' 
  | 'metric_card';

export type Framework = 'textual' | 'bubble_tea' | 'ratatui' | 'blessed';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Widget {
  id: string;
  type: WidgetType;
  position: Position;
  size: Size;
  title?: string;
  dataSource?: string;
  properties?: Record<string, any>;
}

export interface DataSource {
  id: string;
  name: string;
  config: {
    type: 'system_metric' | 'api' | 'file' | 'command';
    metric?: string;
    interval?: number;
    command?: string;
    url?: string;
    path?: string;
  };
}

export interface DashboardSettings {
  dimensions: Size;
  theme: 'dark' | 'light';
  refreshRate: number;
  autoResize?: boolean;
  gridSize?: number;
}

export interface DesignerState {
  // Dashboard data
  widgets: Widget[];
  dataSources: DataSource[];
  settings: DashboardSettings;
  metadata: {
    name: string;
    description?: string;
    framework: Framework;
  };
  
  // UI state
  selectedWidgetId: string | null;
  activeView: 'design' | 'preview' | 'code';
  isDragging: boolean;
  hoveredCellPosition: Position | null;
  
  // Actions
  addWidget: (widget: Widget) => void;  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<Widget>) => void;
  selectWidget: (id: string | null) => void;
  moveWidget: (id: string, position: Position) => void;
  resizeWidget: (id: string, size: Size) => void;
  
  addDataSource: (dataSource: DataSource) => void;
  removeDataSource: (id: string) => void;
  updateDataSource: (id: string, updates: Partial<DataSource>) => void;
  
  updateSettings: (settings: Partial<DashboardSettings>) => void;
  updateMetadata: (metadata: Partial<DesignerState['metadata']>) => void;
  
  setActiveView: (view: 'design' | 'preview' | 'code') => void;
  setDragging: (isDragging: boolean) => void;
  setHoveredCell: (position: Position | null) => void;
  
  clearDashboard: () => void;
  loadDashboard: (dashboard: any) => void;
  exportDashboard: () => any;
}

export const useDesignerStore = create<DesignerState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      widgets: [],
      dataSources: [],
      settings: {
        dimensions: { width: 120, height: 40 },
        theme: 'dark',
        refreshRate: 1000,
        autoResize: true,
        gridSize: 4
      },      metadata: {
        name: 'Untitled Dashboard',
        framework: 'textual'
      },
      selectedWidgetId: null,
      activeView: 'design',
      isDragging: false,
      hoveredCellPosition: null,

      // Actions
      addWidget: (widget) =>
        set((state) => {
          state.widgets.push(widget);
        }),

      removeWidget: (id) =>
        set((state) => {
          state.widgets = state.widgets.filter((w) => w.id !== id);
          if (state.selectedWidgetId === id) {
            state.selectedWidgetId = null;
          }
        }),

      updateWidget: (id, updates) =>
        set((state) => {
          const widget = state.widgets.find((w) => w.id === id);
          if (widget) {
            Object.assign(widget, updates);
          }
        }),

      selectWidget: (id) =>
        set((state) => {
          state.selectedWidgetId = id;
        }),
      moveWidget: (id, position) =>
        set((state) => {
          const widget = state.widgets.find((w) => w.id === id);
          if (widget) {
            widget.position = position;
          }
        }),

      resizeWidget: (id, size) =>
        set((state) => {
          const widget = state.widgets.find((w) => w.id === id);
          if (widget) {
            widget.size = size;
          }
        }),

      addDataSource: (dataSource) =>
        set((state) => {
          state.dataSources.push(dataSource);
        }),

      removeDataSource: (id) =>
        set((state) => {
          state.dataSources = state.dataSources.filter((ds) => ds.id !== id);
        }),

      updateDataSource: (id, updates) =>
        set((state) => {
          const dataSource = state.dataSources.find((ds) => ds.id === id);
          if (dataSource) {
            Object.assign(dataSource, updates);
          }
        }),
      updateSettings: (settings) =>
        set((state) => {
          Object.assign(state.settings, settings);
        }),

      updateMetadata: (metadata) =>
        set((state) => {
          Object.assign(state.metadata, metadata);
        }),

      setActiveView: (view) =>
        set((state) => {
          state.activeView = view;
        }),

      setDragging: (isDragging) =>
        set((state) => {
          state.isDragging = isDragging;
        }),

      setHoveredCell: (position) =>
        set((state) => {
          state.hoveredCellPosition = position;
        }),

      clearDashboard: () =>
        set((state) => {
          state.widgets = [];
          state.dataSources = [];
          state.selectedWidgetId = null;
        }),

      loadDashboard: (dashboard) =>
        set((state) => {
          state.widgets = dashboard.widgets || [];
          state.dataSources = dashboard.dataSources || [];
          state.settings = dashboard.settings || state.settings;
          state.metadata = dashboard.metadata || state.metadata;
        }),

      exportDashboard: () => {
        const state = get();
        return {
          version: '1.0.0',
          metadata: state.metadata,
          settings: state.settings,
          widgets: state.widgets,
          dataSources: state.dataSources
        };
      }
    }))
  )
);