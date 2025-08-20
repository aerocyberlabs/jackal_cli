import { z } from 'zod';

// Progress bar widget
export const ProgressBarPropsSchema = z.object({
  min: z.number().default(0),
  max: z.number().default(100),
  showPercentage: z.boolean().default(true),
  showValue: z.boolean().default(false),
  barCharacter: z.string().max(1).default('█'),
  emptyCharacter: z.string().max(1).default('░')
});

// Table widget
export const TablePropsSchema = z.object({
  showHeaders: z.boolean().default(true),
  maxRows: z.number().min(1).max(1000).default(100),
  columnWidths: z.array(z.number()).optional(),
  sortable: z.boolean().default(false),
  filterable: z.boolean().default(false)
});

// Sparkline widget
export const SparklinePropsSchema = z.object({
  maxPoints: z.number().min(10).max(200).default(50),
  showMinMax: z.boolean().default(false),
  showCurrent: z.boolean().default(true)
});