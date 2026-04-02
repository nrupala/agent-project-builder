import { Agent } from './agent.js';
import { ModelManager } from './modelManager.js';
import { ConfigManager } from './configManager.js';
import { Logger } from './logger.js';
import { GitManager } from './gitManager.js';

export class AgentOrchestrator {
  constructor() {
    this.configManager = new ConfigManager();
    this.modelManager = new ModelManager();
    this.logger = new Logger();
    this.gitManager = new GitManager();
    this.agent = null;
  }

  async initialize() {
    await this.configManager.loadConfigs();
    await this.modelManager.initialize();
    this.logger.info('Agent orchestrator initialized');
    
    // Initialize git repo if not exists
    await this.gitManager.initRepoIfNeeded();
  }

  async processRequest(request, options = {}) {
    this.logger.info(`Processing request: ${request}`);
    
    // Create or get agent based on options
    const agentType = options.agentType || 'default';
    const modelProvider = options.modelProvider || 'openai';
    
    this.agent = new Agent({
      type: agentType,
      modelProvider,
      configManager: this.configManager,
      modelManager: this.modelManager,
      logger: this.logger,
      gitManager: this.gitManager
    });
    
    await this.agent.initialize();
    
    // Process the request
    const result = await this.agent.buildProject(request, options);
    
    this.logger.info('Request processed successfully');
    return result;
  }

  async startInteractiveMode() {
    this.logger.info('Starting interactive mode');
    // Interactive mode implementation would go here
    console.log('Interactive mode not yet implemented');
  }
}
