import { z } from 'zod';

// Widget position and size schemas
export const PositionSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0)
});

export const SizeSchema = z.object({
  width: z.number().min(1),
  height: z.number().min(1)
});

// Widget style schemas
export const BorderStyleSchema = z.enum(['none', 'single', 'double', 'rounded', 'heavy', 'ascii']);
export const ColorSchema = z.enum(['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'default']);

export const WidgetStyleSchema = z.object({
  borderStyle: BorderStyleSchema.optional(),
  borderColor: ColorSchema.optional(),
  backgroundColor: ColorSchema.optional(),
  textColor: ColorSchema.optional(),
  padding: z.number().min(0).max(5).optional()
});

// Data source schemas
export const DataSourceTypeSchema = z.enum(['static', 'system_metric', 'api', 'file', 'command']);

export const SystemMetricSchema = z.enum([
  'cpu_percent',
  'memory_percent',
  'memory_used',
  'memory_total',
  'disk_percent',
  'disk_used',
  'disk_total',
  'network_in',
  'network_out',
  'process_count',
  'load_average'
]);

export const DataSourceConfigSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('static'),
    value: z.any()
  }),
  z.object({
    type: z.literal('system_metric'),
    metric: SystemMetricSchema,
    interval: z.number().min(100).default(1000)
  }),
  z.object({
    type: z.literal('api'),
    url: z.string().url(),
    method: z.enum(['GET', 'POST']).default('GET'),
    headers: z.record(z.string()).optional(),
    interval: z.number().min(1000).default(5000)
  }),
  z.object({
    type: z.literal('file'),
    path: z.string(),
    watch: z.boolean().default(false)
  }),
  z.object({
    type: z.literal('command'),
    command: z.string(),
    interval: z.number().min(1000).default(5000)
  })
]);