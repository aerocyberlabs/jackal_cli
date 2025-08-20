import { z } from 'zod';

// Framework enum
export const FrameworkSchema = z.enum(['textual', 'bubble_tea', 'ratatui', 'blessed']);

// Theme enum
export const ThemeSchema = z.enum(['dark', 'light', 'monokai', 'dracula', 'nord', 'custom']);

// Dashboard settings
export const DashboardSettingsSchema = z.object({
  dimensions: z.object({
    width: z.number().min(40).max(300).default(120),
    height: z.number().min(20).max(100).default(40)
  }),
  gridSize: z.number().min(1).max(20).default(4),
  theme: ThemeSchema.default('dark'),
  refreshRate: z.number().min(100).max(60000).default(1000),
  autoResize: z.boolean().default(true)
});

// Dashboard metadata
export const DashboardMetadataSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  version: z.string().default('1.0.0'),
  created: z.string().datetime().optional(),
  modified: z.string().datetime().optional(),
  targetFramework: FrameworkSchema.default('textual'),
  tags: z.array(z.string()).optional()
});