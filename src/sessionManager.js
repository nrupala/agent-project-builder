import { Logger } from './logger.js';
import { ModelManager } from './modelManager.js';
import { ConfigManager } from './configManager.js';
import * as os from 'os';

export class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.logger = new Logger({ prefix: '[SessionManager]' });
  }

  /**
   * Generate a unique session ID based on computer info and timestamp
   * @returns {string} Unique session ID
   */
  generateSessionId() {
    // Create a session ID based on hostname + timestamp for uniqueness
    const hostname = os.hostname() || 'unknown';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${hostname}-${timestamp}-${random}`;
  }

  /**
   * Create a new session with default or specified configuration
   * @param {Object} config - Initial session configuration
   * @returns {string} Session ID
   */
  createSession(config = {}) {
    const sessionId = this.generateSessionId();
    
    // Set up session with default values
    const session = {
      id: sessionId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      modelProvider: config.modelProvider || 'lmstudio',
      agentType: config.agentType || 'default',
      // Store model-specific configuration
      modelConfig: {
        lmstudio: {
          endpoint: config.lmstudioEndpoint || process.env.LMSTUDIO_ENDPOINT || 'http://localhost:1234/v1',
          model: config.lmstudioModel || process.env.LMSTUDIO_MODEL || 'lmstudio-community/qwen3-32b',
          apiKey: config.lmstudioApiKey || process.env.LMSTUDIO_API_KEY || 'not-needed'
        },
        ollama: {
          endpoint: config.ollamaEndpoint || process.env.OLLAMA_ENDPOINT || 'http://localhost:11434',
          model: config.ollamaModel || process.env.OLLAMA_MODEL || 'llama3'
        },
        openai: {
          model: config.openaiModel || process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
          apiKey: config.openaiApiKey || process.env.OPENAI_API_KEY || null
        }
      },
      // Resource allocation
      resources: {
        maxTokens: parseInt(config.maxTokens || process.env.MAX_TOKENS || '2000'),
        temperature: parseFloat(config.temperature || process.env.TEMPERATURE || '0.7'),
        contextSize: parseInt(config.contextSize || process.env.CONTEXT_SIZE || '4096')
      },
      // System info
       systemInfo: {
         hostname: os.hostname(),
         platform: process.platform,
          totalMemory: Math.floor(os.totalmem() / (1024 * 1024)), // MB
          freeMemory: Math.floor(os.freemem() / (1024 * 1024)) // MB
       },
      status: 'initialized',
      agents: new Map() // Store agent instances for this session
    };

    this.sessions.set(sessionId, session);
    this.logger.info(`Created session: ${sessionId}`);
    
    return sessionId;
  }

  /**
   * Get session by ID
   * @param {string} sessionId - Session identifier
   * @returns {Object|null} Session object or null if not found
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Update session configuration
   * @param {string} sessionId - Session identifier
   * @param {Object} updates - Configuration updates
   * @returns {boolean} Success status
   */
  updateSession(sessionId, updates) {
    const session = this.getSession(sessionId);
    if (!session) {
      this.logger.warn(`Session not found: ${sessionId}`);
      return false;
    }

    // Update allowed fields
    if (updates.modelProvider !== undefined) {
      session.modelProvider = updates.modelProvider;
    }
    if (updates.agentType !== undefined) {
      session.agentType = updates.agentType;
    }
    if (updates.modelConfig !== undefined) {
      session.modelConfig = { ...session.modelConfig, ...updates.modelConfig };
    }
    if (updates.resources !== undefined) {
      session.resources = { ...session.resources, ...updates.resources };
    }

    session.updatedAt = Date.now();
    this.logger.info(`Updated session: ${sessionId}`);
    return true;
  }

  /**
   * Store an agent instance for a session
   * @param {string} sessionId - Session identifier
   * @param {string} agentId - Agent identifier
   * @param {Object} agentInstance - Agent instance
   */
  storeAgent(sessionId, agentId, agentInstance) {
    const session = this.getSession(sessionId);
    if (!session) {
      this.logger.warn(`Cannot store agent - session not found: ${sessionId}`);
      return false;
    }
    
    session.agents.set(agentId, agentInstance);
    this.logger.info(`Stored agent ${agentId} for session ${sessionId}`);
    return true;
  }

  /**
   * Retrieve an agent instance for a session
   * @param {string} sessionId - Session identifier
   * @param {string} agentId - Agent identifier
   * @returns {Object|null} Agent instance or null if not found
   */
  getAgent(sessionId, agentId) {
    const session = this.getSession(sessionId);
    if (!session) {
      return null;
    }
    
    return session.agents.get(agentId) || null;
  }

  /**
   * Remove a session
   * @param {string} sessionId - Session identifier
   * @returns {boolean} Success status
   */
  removeSession(sessionId) {
    const result = this.sessions.delete(sessionId);
    if (result) {
      this.logger.info(`Removed session: ${sessionId}`);
    } else {
      this.logger.warn(`Attempted to remove non-existent session: ${sessionId}`);
    }
    return result;
  }

  /**
   * Get all active sessions (for admin/monitoring)
   * @returns {Array} Array of session objects
   */
  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * Get session count
   * @returns {number} Number of active sessions
   */
  getSessionCount() {
    return this.sessions.size;
  }
}