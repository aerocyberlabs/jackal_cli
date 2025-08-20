import { describe, it, expect } from 'vitest';
import { 
  PositionSchema, 
  SizeSchema
} from './schemas';
import { BaseWidgetSchema } from './widget-schemas';
import { DataSourceSchema, DashboardDesignSchema } from './dashboard-schema';

describe('PositionSchema', () => {
  it('should validate valid position', () => {
    const validPosition = { x: 0, y: 0 };
    const result = PositionSchema.safeParse(validPosition);
    expect(result.success).toBe(true);
  });

  it('should reject negative coordinates', () => {
    const invalidPosition = { x: -1, y: 0 };
    const result = PositionSchema.safeParse(invalidPosition);
    expect(result.success).toBe(false);
  });

  it('should reject non-integer coordinates', () => {
    const invalidPosition = { x: 1.5, y: 0 };
    const result = PositionSchema.safeParse(invalidPosition);
    expect(result.success).toBe(false);
  });
});

describe('SizeSchema', () => {
  it('should validate valid size', () => {
    const validSize = { width: 4, height: 2 };
    const result = SizeSchema.safeParse(validSize);
    expect(result.success).toBe(true);
  });

  it('should reject zero or negative dimensions', () => {
    const invalidSize1 = { width: 0, height: 2 };
    const invalidSize2 = { width: 4, height: -1 };
    
    expect(SizeSchema.safeParse(invalidSize1).success).toBe(false);
    expect(SizeSchema.safeParse(invalidSize2).success).toBe(false);
  });
});

describe('BaseWidgetSchema', () => {
  it('should validate valid widget', () => {
    const validWidget = {
      id: 'widget_1',
      type: 'text',
      position: { x: 0, y: 0 },
      size: { width: 4, height: 2 },
      title: 'Test Widget'
    };
    
    const result = BaseWidgetSchema.safeParse(validWidget);
    expect(result.success).toBe(true);
  });

  it('should validate widget with data source', () => {
    const widgetWithDataSource = {
      id: 'widget_1',
      type: 'metric_card',
      position: { x: 0, y: 0 },
      size: { width: 4, height: 2 },
      title: 'CPU Usage',
      dataSource: 'cpu_metric'
    };
    
    const result = BaseWidgetSchema.safeParse(widgetWithDataSource);
    expect(result.success).toBe(true);
  });

  it('should reject invalid widget type', () => {
    const invalidWidget = {
      id: 'widget_1',
      type: 'invalid_type',
      position: { x: 0, y: 0 },
      size: { width: 4, height: 2 },
      title: 'Test Widget'
    };
    
    const result = BaseWidgetSchema.safeParse(invalidWidget);
    expect(result.success).toBe(false);
  });
});

describe('DataSourceSchema', () => {
  it('should validate system metric data source', () => {
    const systemMetricSource = {
      id: 'cpu_metric',
      name: 'CPU Usage',
      config: {
        type: 'system_metric',
        metric: 'cpu_percent',
        interval: 1000
      }
    };
    
    const result = DataSourceSchema.safeParse(systemMetricSource);
    expect(result.success).toBe(true);
  });

  it('should validate API data source', () => {
    const apiSource = {
      id: 'weather_api',
      name: 'Weather Data',
      config: {
        type: 'api',
        url: 'https://api.weather.com/current',
        interval: 60000
      }
    };
    
    const result = DataSourceSchema.safeParse(apiSource);
    expect(result.success).toBe(true);
  });

  it('should validate file data source', () => {
    const fileSource = {
      id: 'log_file',
      name: 'Application Logs',
      config: {
        type: 'file',
        path: '/var/log/app.log'
      }
    };
    
    const result = DataSourceSchema.safeParse(fileSource);
    expect(result.success).toBe(true);
  });

  it('should validate command data source', () => {
    const commandSource = {
      id: 'disk_usage',
      name: 'Disk Usage',
      config: {
        type: 'command',
        command: 'df -h',
        interval: 30000
      }
    };
    
    const result = DataSourceSchema.safeParse(commandSource);
    expect(result.success).toBe(true);
  });
});

describe('DashboardDesignSchema', () => {
  it('should validate complete dashboard design', () => {
    const dashboard = {
      metadata: {
        name: 'Test Dashboard',
        targetFramework: 'textual'
      },
      settings: {
        dimensions: { width: 40, height: 20 },
        gridSize: 4,
        theme: 'dark',
        refreshRate: 1000
      },
      widgets: [
        {
          id: 'widget_1',
          type: 'text',
          position: { x: 0, y: 0 },
          size: { width: 8, height: 4 },
          title: 'Welcome'
        }
      ],
      dataSources: [
        {
          id: 'cpu_metric',
          name: 'CPU Usage',
          config: {
            type: 'system_metric',
            metric: 'cpu_percent',
            interval: 1000
          }
        }
      ]
    };
    
    const result = DashboardDesignSchema.safeParse(dashboard);
    expect(result.success).toBe(true);
  });

  it('should reject dashboard with invalid dimensions', () => {
    const invalidDashboard = {
      metadata: {
        name: 'Test Dashboard',
        targetFramework: 'textual'
      },
      settings: {
        dimensions: { width: 0, height: 20 },
        gridSize: 4
      },
      widgets: [],
      dataSources: []
    };
    
    const result = DashboardDesignSchema.safeParse(invalidDashboard);
    expect(result.success).toBe(false);
  });
});