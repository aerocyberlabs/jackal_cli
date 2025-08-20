import { DashboardDesign } from '../dashboard-schema';
import { Framework, CodeGenOptions, GeneratedCode } from './types';

// Abstract base class for framework adapters
export abstract class FrameworkAdapter {
  constructor(protected framework: Framework) {}

  abstract generate(design: DashboardDesign, options: CodeGenOptions): GeneratedCode;
  abstract validateDesign(design: DashboardDesign): string[];
  abstract getDependencies(): string[];
}

// Main code generator
export class CodeGenerator {
  private adapters: Map<Framework, FrameworkAdapter> = new Map();

  registerAdapter(framework: Framework, adapter: FrameworkAdapter): void {
    this.adapters.set(framework, adapter);
  }

  generate(design: DashboardDesign, options: CodeGenOptions): GeneratedCode {
    const adapter = this.adapters.get(options.framework);
    if (!adapter) {
      throw new Error(`No adapter registered for framework: ${options.framework}`);
    }

    const errors = adapter.validateDesign(design);
    if (errors.length > 0) {
      throw new Error(`Design validation failed: ${errors.join(', ')}`);
    }

    return adapter.generate(design, options);
  }
}