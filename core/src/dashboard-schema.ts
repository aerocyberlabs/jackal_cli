import { z } from 'zod';
import { DashboardMetadataSchema, DashboardSettingsSchema } from './design-schema';
import { BaseWidgetSchema } from './widget-schemas';
import { DataSourceConfigSchema } from './schemas';

// Data source with ID
export const DataSourceSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  config: DataSourceConfigSchema
});

// Complete dashboard design schema
export const DashboardDesignSchema = z.object({
  version: z.string().default('1.0.0'),
  metadata: DashboardMetadataSchema,
  settings: DashboardSettingsSchema,
  widgets: z.array(BaseWidgetSchema),
  dataSources: z.array(DataSourceSchema).default([]),
  layout: z.object({
    type: z.enum(['grid', 'flex', 'absolute']).default('grid'),
    gridSize: z.number().min(1).max(20).default(4)
  }).optional()
});

// Export types
export type DashboardDesign = z.infer<typeof DashboardDesignSchema>;
export type Widget = z.infer<typeof BaseWidgetSchema>;
export type DataSource = z.infer<typeof DataSourceSchema>;