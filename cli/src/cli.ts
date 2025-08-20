#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { CodeGenerator, DashboardDesignSchema } from '@cli-designer/core';
import { TextualAdapter } from '@cli-designer/adapter-textual';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('Usage: cli-designer <design.json> [output-dir]');
  process.exit(1);
}

const designFile = args[0];
const outputDir = args[1] || './output';

try {
  // Read and parse design file
  const designJson = readFileSync(designFile, 'utf-8');
  const designData = JSON.parse(designJson);
  
  // Validate design
  const design = DashboardDesignSchema.parse(designData);
  
  // Initialize code generator
  const generator = new CodeGenerator();
  generator.registerAdapter('textual', new TextualAdapter());  
  // Generate code
  const result = generator.generate(design, {
    framework: design.metadata.framework || 'textual',
    includeComments: true,
    includeTypes: false,
    useMockData: true,
    standalone: true,
    outputFormat: 'single'
  });
  
  // Create output directory
  mkdirSync(outputDir, { recursive: true });
  
  // Write generated files
  for (const file of result.files) {
    const filePath = join(outputDir, file.filename);
    writeFileSync(filePath, file.content);
    console.log(`[OK] Generated: ${file.filename}`);
  }
  
  // Write instructions
  const instructionsPath = join(outputDir, 'README.md');
  writeFileSync(instructionsPath, result.instructions);
  
  console.log('\n[SUCCESS] Dashboard generated successfully!');
  console.log(`[OUTPUT] Output directory: ${outputDir}`);
  console.log('\n[INFO] Next steps:');
  console.log('1. cd ' + outputDir);
  console.log('2. pip install -r requirements.txt');
  console.log('3. python dashboard.py');

} catch (error) {
  console.error('[ERROR] Error:', error.message);
  process.exit(1);
}