// Supported frameworks
export type Framework = 'textual' | 'bubble_tea' | 'ratatui' | 'blessed';

// Code generation options
export interface CodeGenOptions {
  framework: Framework;
  includeComments: boolean;
  includeTypes: boolean;
  useMockData: boolean;
  standalone: boolean;
  outputFormat: 'single' | 'modular';
}

// Generated code result
export interface GeneratedCode {
  framework: Framework;
  files: GeneratedFile[];
  dependencies: Dependencies;
  instructions: string;
}

// Generated file
export interface GeneratedFile {
  filename: string;
  content: string;
  language: string;
  executable?: boolean;
}

// Dependencies for each framework
export interface Dependencies {
  packages: string[];
  devPackages?: string[];
  systemRequirements?: string[];
}