import { Agent } from './agent.js';
import { ModelManager } from './modelManager.js';
import { ConfigManager } from './configManager.js';
import { Logger } from './logger.js';
import { GitManager } from './gitManager.js';
import { DirectoryManager } from './directoryManager.js';
import { BuiltInAgents, getAgentConfig, canDelegateTask } from './agentRegistry.js';

function generateId() {
  return 'agent-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
}

export class MultiAgentOrchestrator {
  constructor() {
    this.configManager = new ConfigManager();
    this.modelManager = new ModelManager();
    this.logger = new Logger();
    this.gitManager = new GitManager();
    this.directoryManager = new DirectoryManager();
    
    this.agents = new Map();
    this.activeAgents = new Map();
    this.sessions = new Map();
    this.taskQueue = [];
    this.delegationBudgets = new Map();
    
    this.maxDepth = 5;
  }

  async initialize() {
    await this.configManager.loadConfigs();
    await this.modelManager.initialize();
    await this.directoryManager.ensureDirectories();
    this.logger.info('Multi-agent orchestrator initialized');
    await this.gitManager.initRepoIfNeeded();
  }

  createAgent(agentType, options = {}) {
    const config = getAgentConfig(agentType);
    const agentId = options.id || generateId();
    
    const agent = new Agent({
      type: agentType,
      modelProvider: options.modelProvider || 'lmstudio',
      configManager: this.configManager,
      modelManager: this.modelManager,
      logger: this.logger,
      gitManager: this.gitManager,
      outputDir: options.outputDir || this.directoryManager.getOutputDir(),
      agentId: agentId,
      parentId: options.parentId || null,
      role: config.role,
      permissions: config.permissions
    });

    this.agents.set(agentId, { agent, config, status: 'idle' });
    return { agentId, agent };
  }

  getAgent(agentId) {
    return this.agents.get(agentId);
  }

  async runAgent(agentType, request, options = {}) {
    const { agentId, agent } = this.createAgent(agentType, {
      parentId: options.parentId,
      outputDir: options.outputDir
    });

    this.activeAgents.set(agentId, {
      startTime: Date.now(),
      status: 'running',
      request: request
    });

    agent.setCallbacks({
      onProgress: options.onProgress || ((phase, msg) => this.logger.info(`[${agentType}] ${phase}: ${msg}`)),
      onFileGenerated: options.onFileGenerated || ((path) => this.logger.info(`[${agentType}] Generated: ${path}`))
    });

    try {
      await agent.initialize();
      const result = await agent.buildProject(request, options);
      
      this.activeAgents.set(agentId, { ...this.activeAgents.get(agentId), status: 'completed', result });
      return { agentId, result, status: 'success' };
    } catch (error) {
      this.activeAgents.set(agentId, { ...this.activeAgents.get(agentId), status: 'failed', error: error.message });
      return { agentId, error: error.message, status: 'failed' };
    }
  }

  async delegateTask(fromAgentId, toAgentType, task, options = {}) {
    const fromAgent = this.agents.get(fromAgentId);
    if (!fromAgent) {
      throw new Error(`Agent ${fromAgentId} not found`);
    }

    if (!canDelegateTask(fromAgent.config.type)) {
      throw new Error(`Agent ${fromAgent.config.type} cannot delegate tasks`);
    }

    const budgetKey = `${fromAgentId}-${toAgentType}`;
    const currentUsage = this.delegationBudgets.get(budgetKey) || 0;
    
    if (currentUsage >= fromAgent.config.taskBudget) {
      throw new Error(`Task budget exhausted for ${fromAgent.config.type} -> ${toAgentType}`);
    }

    const depth = this.calculateDepth(options.parentId);
    if (depth >= this.maxDepth) {
      throw new Error(`Maximum delegation depth (${this.maxDepth}) reached`);
    }

    this.delegationBudgets.set(budgetKey, currentUsage + 1);

    const result = await this.runAgent(toAgentType, task, {
      parentId: fromAgentId,
      ...options
    });

    return result;
  }

  calculateDepth(agentId) {
    let depth = 0;
    let currentId = agentId;
    
    while (currentId) {
      const agent = this.agents.get(currentId);
      if (agent && agent.options?.parentId) {
        depth++;
        currentId = agent.options.parentId;
      } else {
        break;
      }
    }
    
    return depth;
  }

  async runParallelAgents(agentConfigs, options = {}) {
    const promises = agentConfigs.map(config => 
      this.runAgent(config.type, config.request, {
        ...options,
        outputDir: `${this.directoryManager.getOutputDir()}/${config.type}-${Date.now()}`
      })
    );

    const results = await Promise.allSettled(promises);
    return results.map((r, i) => ({
      agentType: agentConfigs[i].type,
      ...(r.status === 'fulfilled' ? r.value : { error: r.reason, status: 'failed' })
    }));
  }

  async runSequential(agentConfigs, options = {}) {
    const results = [];
    
    for (const config of agentConfigs) {
      const result = await this.runAgent(config.type, config.request, options);
      results.push({ agentType: config.type, ...result });
      
      if (result.status === 'failed' && options.stopOnError) {
        break;
      }
    }
    
    return results;
  }

  async runOrchestrated(orchestrationPlan) {
    const results = [];
    
    for (const step of orchestrationPlan) {
      this.logger.info(`Orchestration step: ${step.type} -> ${step.agentType}`);
      
      switch (step.mode) {
        case 'parallel':
          const parallelResults = await this.runParallelAgents(step.agents, step.options);
          results.push({ step: step.name, mode: 'parallel', results: parallelResults });
          break;
          
        case 'sequential':
          const seqResults = await this.runSequential(step.agents, step.options);
          results.push({ step: step.name, mode: 'sequential', results: seqResults });
          break;
          
        case 'delegation':
          const delResult = await this.delegateTask(step.from, step.to, step.task, step.options);
          results.push({ step: step.name, mode: 'delegation', result: delResult });
          break;
          
        case 'single':
        default:
          const singleResult = await this.runAgent(step.agentType, step.request, step.options);
          results.push({ step: step.name, mode: 'single', result: singleResult });
          break;
      }
    }
    
    return results;
  }

  saveSession(sessionId, sessionData) {
    this.sessions.set(sessionId, {
      ...sessionData,
      savedAt: Date.now()
    });
    this.directoryManager.saveState(`session-${sessionId}`, sessionData);
  }

  loadSession(sessionId) {
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId);
    }
    return this.directoryManager.loadState(`session-${sessionId}`);
  }

  getActiveAgents() {
    return Array.from(this.activeAgents.entries()).map(([id, data]) => ({
      agentId: id,
      ...data
    }));
  }

  getAgentStats() {
    const stats = {
      total: this.agents.size,
      running: 0,
      completed: 0,
      failed: 0,
      idle: 0
    };

    for (const [id, agent] of this.agents) {
      const activeData = this.activeAgents.get(id);
      if (!activeData) {
        stats.idle++;
      } else if (activeData.status === 'running') {
        stats.running++;
      } else if (activeData.status === 'completed') {
        stats.completed++;
      } else if (activeData.status === 'failed') {
        stats.failed++;
      }
    }

    return stats;
  }

  async processRequest(request, options = {}) {
    const agentType = options.agentType || 'build';
    return await this.runAgent(agentType, request, options);
  }
}

export const multiAgentOrchestrator = new MultiAgentOrchestrator();