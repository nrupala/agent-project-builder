import path from 'path';
import { Agent } from './agent.js';
import { ModelManager } from './modelManager.js';
import { ConfigManager } from './configManager.js';
import { Logger } from './logger.js';
import { GitManager } from './gitManager.js';

export class AgentOrchestrator {
  constructor(config = {}) {
    this.configManager = new ConfigManager();
    // Allow passing pre-configured model manager for session-specific settings
    this.modelManager = config.modelManager || new ModelManager();
    this.logger = new Logger();
    this.gitManager = new GitManager();
    this.agent = null;
    this.sessionConfig = config.sessionConfig || {};
  }

  async initialize() {
    await this.configManager.loadConfigs();
    
    // If we have session-specific model configuration, apply it
    if (this.sessionConfig.modelProvider) {
      await this._applySessionModelConfig();
    } else {
      await this.modelManager.initialize();
    }
    
    this.logger.info('Agent orchestrator initialized');
    await this.gitManager.initRepoIfNeeded();
  }

  /**
   * Apply session-specific model configuration
   * @private
   */
  async _applySessionModelConfig() {
    const { modelProvider, modelConfig } = this.sessionConfig;
    
    if (!modelProvider) {
      await this.modelManager.initialize();
      return;
    }

    // Prepare configuration based on provider
    let providerConfig = {};
    switch (modelProvider) {
      case 'lmstudio':
        providerConfig = {
          provider: 'lmstudio',
          model: modelConfig?.lmstudio?.model || process.env.LMSTUDIO_MODEL || 'lmstudio-community/qwen3-32b',
          endpoint: modelConfig?.lmstudio?.endpoint || process.env.LMSTUDIO_ENDPOINT || 'http://localhost:1234/v1',
          apiKey: modelConfig?.lmstudio?.apiKey || process.env.LMSTUDIO_API_KEY || 'not-needed'
        };
        break;
        
      case 'ollama':
        providerConfig = {
          provider: 'ollama',
          model: modelConfig?.ollama?.model || process.env.OLLAMA_MODEL || 'llama3',
          endpoint: modelConfig?.ollama?.endpoint || process.env.OLLAMA_ENDPOINT || 'http://localhost:11434'
        };
        break;
        
      case 'openai':
        providerConfig = {
          provider: 'openai',
          model: modelConfig?.openai?.model || process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
          apiKey: modelConfig?.openai?.apiKey || process.env.OPENAI_API_KEY
        };
        break;
        
      default:
        await this.modelManager.initialize();
        return;
    }

    // Apply the session-specific configuration
    await this.modelManager.setProvider(modelProvider, providerConfig);
    
    // Apply resource settings if provided
    if (modelConfig?.resources) {
      const { maxTokens, temperature } = modelConfig.resources;
      // These would be used in the model config during generation
      // For now, we'll store them to be used later
      this.sessionConfig._customModelParams = {
        maxTokens: maxTokens || 2000,
        temperature: temperature || 0.7
      };
    }
  }

  _generateOutputDir(request) {
    const sanitizedName = request.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 40);
    const timestamp = Date.now();
    return path.join('output', `${sanitizedName}-${timestamp}`);
  }

  async processRequest(request, options = {}) {
    this.logger.info(`Processing request: ${request}`);

    // Use session-specific settings if available, otherwise fall back to options or defaults
    const sessionConfig = options.sessionConfig || {};
    const agentType = options.agentType || sessionConfig.agentType || 'default';
    const modelProvider = options.modelProvider || sessionConfig.modelProvider || 'lmstudio';
    const outputDir = options.outputDir || this._generateOutputDir(request);

    // Create orchestrator with session-specific config if we don't already have one initialized
    let orchestratorToUse = this;
    if (Object.keys(sessionConfig).length > 0) {
      // Create a new orchestrator with session-specific configuration
      orchestratorToUse = new AgentOrchestrator({ sessionConfig });
      await orchestratorToUse.initialize();
    }

    orchestratorToUse.agent = new Agent({
      type: agentType,
      modelProvider,
      configManager: orchestratorToUse.configManager,
      modelManager: orchestratorToUse.modelManager,
      logger: orchestratorToUse.logger,
      gitManager: orchestratorToUse.gitManager,
      outputDir
    });

    orchestratorToUse.agent.setCallbacks({
      onProgress: options.onProgress,
      onFileGenerated: options.onFileGenerated
    });

    await orchestratorToUse.agent.initialize();

    const result = await orchestratorToUse.agent.buildProject(request, options);
    result.outputDir = outputDir;

    this.logger.info('Request processed successfully');
    return result;
  }

  async startInteractiveMode() {
    this.logger.info('Starting interactive mode');
    console.log('Interactive mode not yet implemented');
  }
}
