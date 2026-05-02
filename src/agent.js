import path from 'path';
import { Logger } from './logger.js';
import { ModelManager } from './modelManager.js';
import { ConfigManager } from './configManager.js';
import { GitManager } from './gitManager.js';
import { FileManager } from './fileManager.js';
import { PromptEngine } from './promptEngine.js';

export class Agent {
  constructor({ type, modelProvider, configManager, modelManager, logger, gitManager, outputDir, agentId, parentId, role, permissions, sessionId }) {
    this.type = type;
    this.agentId = agentId || null;
    this.parentId = parentId || null;
    this.role = role || 'executor';
    this.permissions = permissions || {};
    this.sessionId = sessionId || null;
    
    this.modelProvider = modelProvider;
    this.configManager = configManager;
    this.modelManager = modelManager;
    this.logger = logger;
    this.gitManager = gitManager;
    this.outputDir = outputDir || 'generated';
    this.fileManager = new FileManager({ outputDir: this.outputDir });
    this.promptEngine = new PromptEngine();
    this.config = null;
    this.onProgress = null;
    this.onFileGenerated = null;
    this.context = [];
    this.history = [];
  }

  canPerform(permission) {
    return this.permissions[permission] === 'allow';
  }

  addToContext(message) {
    this.context.push({ timestamp: Date.now(), ...message });
    if (this.context.length > 100) {
      this.context = this.context.slice(-50);
    }
  }

  addToHistory(action, result) {
    this.history.push({ timestamp: Date.now(), action, result });
  }

  getContext() {
    return this.context;
  }

  getHistory() {
    return this.history;
  }

  getState() {
    return {
      agentId: this.agentId,
      type: this.type,
      role: this.role,
      parentId: this.parentId,
      sessionId: this.sessionId,
      contextLength: this.context.length,
      historyLength: this.history.length,
      outputDir: this.outputDir
    };
  }

  checkPermission(permission) {
    if (!this.permissions) {
      this.logger.warn('No permissions configured for agent');
      return true;
    }
    
    const allowed = this.permissions[permission];
    if (allowed === 'deny') {
      this.logger.error(`Permission denied: ${permission} for agent type ${this.type}`);
      return false;
    }
    if (allowed === 'allow') {
      return true;
    }
    if (allowed === 'read') {
      return permission.includes('read');
    }
    this.logger.warn(`Unknown permission action: ${allowed} for ${permission}`);
    return false;
  }

  requirePermission(permission) {
    if (!this.checkPermission(permission)) {
      throw new Error(`Permission denied: ${permission} not allowed for ${this.type} agent`);
    }
  }

  async initialize() {
    this.logger.info('Initializing ' + this.type + ' agent with ' + this.modelProvider + ' provider');
    this.config = await this.configManager.getAgentConfig(this.type);
    await this.modelManager.setProvider(this.modelProvider, this.config.model);
    this.logger.info('Agent initialized successfully');
  }

  setCallbacks({ onProgress, onFileGenerated } = {}) {
    this.onProgress = onProgress || null;
    this.onFileGenerated = onFileGenerated || null;
  }

  emitProgress(phase, message) {
    if (this.onProgress) this.onProgress(phase, message);
  }

  emitFileGenerated(path, content) {
    if (this.onFileGenerated) this.onFileGenerated(path, content);
  }

  async buildProject(request, options = {}) {
    this.logger.info('Building project for request: ' + request);

    const analysis = await this.analyzeRequest(request, options);
    const plan = await this.planProject(analysis, options);
    const result = await this.executePlan(plan, options);
    await this.finalizeProject(result, options);

    return result;
  }

  async analyzeRequest(request, options) {
    this.logger.info('Analyzing user request');
    this.emitProgress('analysis', 'Analyzing request...');

    const prompt = this.promptEngine.createAnalysisPrompt(request, options);
    const response = await this.modelManager.generateCompletion(prompt);
    return this.parseAnalysis(response);
  }

  async planProject(analysis, options) {
    this.logger.info('Planning project structure');
    this.emitProgress('planning', 'Planning project structure...');

    const prompt = this.promptEngine.createPlanningPrompt(analysis, options);
    const response = await this.modelManager.generateCompletion(prompt);
    return this.parsePlan(response);
  }

  async executePlan(plan, options) {
    this.logger.info('Executing project plan');
    this.emitProgress('execution', 'Generating files...');

    this.requirePermission('file:read');
    await this.fileManager.createProjectStructure(plan.structure);

    for (const fileSpec of plan.files) {
      await this.generateFile(fileSpec, options);
    }

    if (plan.dependencies && plan.dependencies.length > 0) {
      this.requirePermission('npm:install');
      this.emitProgress('dependencies', 'Installing dependencies...');
      await this.fileManager.installDependencies(plan.dependencies);
    }

    await this.fileManager.setupConfigFiles(plan.configs);

    return { plan, status: 'executed' };
  }

  async generateFile(fileSpec, options) {
    this.requirePermission('file:write');
    
    this.logger.info('Generating file: ' + fileSpec.path);
    this.emitProgress('file', 'Generating ' + fileSpec.path + '...');

    const prompt = this.promptEngine.createFileGenerationPrompt(fileSpec, options);
    const content = await this.modelManager.generateCompletion(prompt);

    await this.fileManager.writeFile(fileSpec.path, content);
    this.emitFileGenerated(fileSpec.path, content);
  }

  async finalizeProject(result, options) {
    this.logger.info('Finalizing project');
    this.emitProgress('finalizing', 'Running tests and linting...');

    const targetDir = path.resolve(process.cwd(), this.outputDir);

    if (this.config.behavior.runTests) {
      this.requirePermission('bash:execute');
      await this.fileManager.runTests(targetDir);
    }

    if (this.config.behavior.lintBeforeCommit) {
      this.requirePermission('bash:execute');
      await this.fileManager.runLinter(targetDir);
    }

    if (this.config.behavior.autoCommit) {
      await this.gitManager.commitChanges('feat: ' + result.plan.name + ' project generated by agent');
    }

    this.emitProgress('complete', 'Project generation complete!');
    this.logger.info('Project finalized');
  }

  parseAnalysis(response) {
    return {
      type: 'project',
      description: response.substring(0, 100),
      requirements: response.split('\n').filter(line => line.trim().startsWith('-')),
      technology: this.detectTechnology(response)
    };
  }

  detectTechnology(response) {
    const techMap = {
      'javascript': ['node', 'js', 'javascript', 'es6'],
      'typescript': ['typescript', 'ts', 'tsx'],
      'python': ['python', 'py', 'django', 'flask'],
      'java': ['java', 'spring', 'maven'],
      'html': ['html', 'web', 'frontend'],
      'css': ['css', 'scss', 'sass', 'styling']
    };

    const lowerResponse = response.toLowerCase();
    for (const [tech, keywords] of Object.entries(techMap)) {
      if (keywords.some(keyword => lowerResponse.includes(keyword))) {
        return tech;
      }
    }
    return 'javascript';
  }

  parsePlan(response) {
    return {
      name: 'generated-project',
      description: 'Project generated by AI agent',
      structure: { src: {}, tests: {}, docs: {} },
      files: [
        { path: 'src/index.js', type: 'source', description: 'Main entry point' },
        { path: 'README.md', type: 'documentation', description: 'Project documentation' },
        { path: 'package.json', type: 'configuration', description: 'Project dependencies and scripts' }
      ],
      dependencies: [],
      configs: {}
    };
  }
}
