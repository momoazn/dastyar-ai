#!/usr/bin/env bun

import fs from 'node:fs';
import path from 'node:path';
import { createSampleConfig, getConfig } from '../config';

const args = process.argv.slice(2);
const command = args[0];

const showHelp = () => {
  console.log(`
🔧 Dastyar AI Configuration Generator

Commands:
  generate [path]  - Generate a sample config file
  show            - Show current configuration
  validate        - Validate current configuration
  help            - Show this help

Examples:
  bun run src/scripts/config-generator.ts generate ./config.json
  bun run src/scripts/config-generator.ts show
  bun run src/scripts/config-generator.ts validate
`);
};

const generateConfig = (outputPath = './config.json') => {
  try {
    const fullPath = path.resolve(outputPath);

    if (fs.existsSync(fullPath)) {
      console.warn(`⚠️  Config file already exists at: ${fullPath}`);
      console.log('Use --force to overwrite or choose a different path.');
      return;
    }

    createSampleConfig(fullPath);
    console.log('✅ Sample configuration file created successfully!');
    console.log(`📝 Edit ${fullPath} to customize your settings.`);
  } catch (error) {
    console.error('❌ Failed to generate config file:', error);
    process.exit(1);
  }
};

const showCurrentConfig = () => {
  try {
    console.log('📋 Current Configuration:');
    console.log('========================');

    const config = getConfig();
    console.log(JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('❌ Failed to load configuration:', error);
    process.exit(1);
  }
};

const validateConfig = () => {
  try {
    console.log('🔍 Validating Configuration...');

    const config = getConfig();
    console.log('✅ Configuration is valid!');

    // Additional checks
    console.log('\n📊 Configuration Summary:');
    console.log(`Environment: ${config.environment}`);
    console.log(`Server: ${config.server.host}:${config.server.port}`);
    console.log(`Database: ${config.database.file}`);
    console.log(`Web Assets: ${config.web.distDir}`);
    console.log(`Whisper Models: ${config.whisper.modelsDir}`);
    console.log(
      `Remote Models: ${config.whisper.allowRemoteModels ? '✅ Enabled' : '❌ Disabled'}`
    );
    console.log(
      `Stable Diffusion: ${config.stableDiffusion.enabled ? '✅ Enabled' : '❌ Disabled'}`
    );

    // Check if directories exist
    console.log('\n📁 Directory Status:');
    console.log(
      `Web Assets: ${fs.existsSync(config.web.distDir) ? '✅ Exists' : '❌ Missing'}`
    );
    console.log(
      `Whisper Models: ${fs.existsSync(config.whisper.modelsDir) ? '✅ Exists' : '❌ Missing'}`
    );
    console.log(
      `Whisper Cache: ${fs.existsSync(config.whisper.cacheDir) ? '✅ Exists' : '❌ Missing'}`
    );
  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
    process.exit(1);
  }
};

// Main command dispatcher
switch (command) {
  case 'generate': {
    const outputPath = args[1] || './config.json';
    generateConfig(outputPath);
    break;
  }
  case 'show': {
    showCurrentConfig();
    break;
  }
  case 'validate': {
    validateConfig();
    break;
  }
  case 'help':
  case undefined: {
    showHelp();
    break;
  }
  default: {
    console.error(`❌ Unknown command: ${command}`);
    showHelp();
    process.exit(1);
  }
}
