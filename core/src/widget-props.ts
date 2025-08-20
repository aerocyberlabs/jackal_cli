import { z } from 'zod';

// Text widget
export const TextWidgetPropsSchema = z.object({
  content: z.string(),
  align: z.enum(['left', 'center', 'right']).default('left'),
  wrap: z.boolean().default(true)
});

// Line chart widget
export const LineChartPropsSchema = z.object({
  maxPoints: z.number().min(10).max(500).default(50),
  showLegend: z.boolean().default(true),
  showGrid: z.boolean().default(true),
  yMin: z.number().optional(),
  yMax: z.number().optional(),
  lineStyle: z.enum(['solid', 'dashed', 'dotted']).default('solid')
});

// Bar chart widget
export const BarChartPropsSchema = z.object({
  orientation: z.enum(['horizontal', 'vertical']).default('vertical'),
  showValues: z.boolean().default(true),
  maxBars: z.number().min(1).max(50).default(10),
  barWidth: z.number().min(1).max(10).default(3)
});