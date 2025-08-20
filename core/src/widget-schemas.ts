import { z } from 'zod';
import { PositionSchema, SizeSchema, WidgetStyleSchema } from './schemas';

// Widget types enum
export const WidgetTypeSchema = z.enum([
  'text',
  'line_chart',
  'bar_chart',
  'sparkline',
  'table',
  'progress_bar',
  'gauge',
  'log_viewer',
  'metric_card',
  'heatmap'
]);

// Base widget properties
export const BaseWidgetSchema = z.object({
  id: z.string(),
  type: WidgetTypeSchema,
  position: PositionSchema,
  size: SizeSchema,
  title: z.string().optional(),
  style: WidgetStyleSchema.optional(),
  dataSource: z.string().optional()
});