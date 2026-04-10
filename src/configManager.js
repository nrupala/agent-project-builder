import { Logger } from './logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export class ConfigManager {
  constructor() {
    this.configs = {};
    this.logger = new Logger({ prefix: '[ConfigManager]' });
  }

  async loadConfigs() {
    const agentsDir = path.join(rootDir, 'config', 'agents');
    
    this.configs = {
      default: this.createDefaultConfig('default'),
      web: this.createDefaultConfig('web'),
      api: this.createDefaultConfig('api')
    };
    
    if (fs.existsSync(agentsDir)) {
      const files = fs.readdirSync(agentsDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const config = JSON.parse(fs.readFileSync(path.join(agentsDir, file), 'utf8'));
          this.configs[file.replace('.json', '')] = config;
        } catch (e) {
          this.logger.warn(`Failed to load config file: ${file}`);
        }
      }
    }
    
    this.logger.info('Configuration loaded');
  }

  createDefaultConfig(name) {
    return {
      name: name,
      description: `${name} agent configuration`,
      model: {
        provider: process.env.MODEL_PROVIDER || 'openai',
        temperature: 0.7,
        maxTokens: 2000
      },
      capabilities: ['code_generation', 'file_creation', 'project_planning'],
      tools: ['fileManager', 'gitManager', 'modelManager'],
      behavior: {
        autoCommit: false,
        runTests: true,
        maxIterations: 10
      }
    };
  }

  getAgentConfig(type) {
    if (this.configs[type]) {
      return this.configs[type];
    }
    return this.createDefaultConfig(type);
  }

  getModelConfig(name) {
    return null;
  }

  getAllConfigs() {
    return this.configs;
  }
}