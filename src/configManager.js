import fs from 'fs';
import path from 'path';

export class ConfigManager {
  constructor() {
    this.configs = {};
    this.configDir = path.resolve(process.cwd(), 'config');
    this.logger = {
      info: (msg) => console.log(`[ConfigManager] ${msg}`),
      error: (msg) => console.error(`[ConfigManager] ${msg}`)
    };
  }

  async loadConfigs() {
    try {
      // Load agent configurations
      const agentsDir = path.join(this.configDir, 'agents');
      if (fs.existsSync(agentsDir)) {
        const agentFiles = fs.readdirSync(agentsDir).filter(file => file.endsWith('.json'));
        for (const file of agentFiles) {
          const agentName = path.basename(file, '.json');
          const agentConfig = JSON.parse(fs.readFileSync(path.join(agentsDir, file), 'utf8'));
          this.configs[`agent:${agentName}`] = agentConfig;
        }
      }
      
      // Load model configurations
      const modelsDir = path.join(this.configDir, 'models');
      if (fs.existsSync(modelsDir)) {
        const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.json'));
        for (const file of modelFiles) {
          const modelName = path.basename(file, '.json');
          const modelConfig = JSON.parse(fs.readFileSync(path.join(modelsDir, file), 'utf8'));
          this.configs[`model:${modelName}`] = modelConfig;
        }
      }
      
      this.logger.info('Configuration files loaded');
    } catch (error) {
      this.logger.error(`Error loading configurations: ${error.message}`);
      // Continue with empty configs - will use defaults
    }
  }

  async getAgentConfig(agentType) {
    const configKey = `agent:${agentType}`;
    if (this.configs[configKey]) {
      return this.configs[configKey];
    }
    
    // Return default config if specific one not found
    const defaultKey = 'agent:default';
    if (this.configs[defaultKey]) {
      return this.configs[defaultKey];
    }
    
    // Return minimal default config
    return {
      name: agentType,
      description: `Default ${agentType} agent`,
      model: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 2000
      },
      capabilities: ["code-generation"],
      tools: ["read", "write", "edit"],
      behavior: {
        autoCommit: false,
        runTests: false,
        lintBeforeCommit: false,
        maxIterations: 5
      }
    };
  }

  getModelConfig(modelName) {
    const configKey = `model:${modelName}`;
    return this.configs[configKey] || null;
  }
}
