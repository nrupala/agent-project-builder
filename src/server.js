import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import archiver from 'archiver';
import { AgentOrchestrator } from './agentOrchestrator.js';
import { Logger } from './logger.js';
import { SessionManager } from './sessionManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const logger = new Logger({ prefix: '[Server]' });
const sessionManager = new SessionManager();

class AgentServer {
  constructor(port) {
    this.port = port || 3000;
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    this.orchestrators = new Map(); // Store orchestrator instances per session
    this.activeSessions = new Map();
  }

  async initialize() {
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  /**
   * Get or create orchestrator for a session
   * @param {string} sessionId - Session identifier
   * @returns {AgentOrchestrator} Orchestrator instance
   */
  getOrCreateOrchestrator(sessionId) {
    if (!this.orchestrators.has(sessionId)) {
      const orchestrator = new AgentOrchestrator();
      this.orchestrators.set(sessionId, orchestrator);
      // Initialize the orchestrator (this loads configs, initializes model manager, etc.)
      orchestrator.initialize().catch(err => {
        logger.error(`Failed to initialize orchestrator for session ${sessionId}: ${err.message}`);
      });
    }
    return this.orchestrators.get(sessionId);
  }

  setupMiddleware() {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.static(path.join(rootDir, 'public')));
  }

    setupRoutes() {
        this.app.get('/api/health', (req, res) => {
            res.json({ status: 'ok', uptime: process.uptime() });
        });

        this.app.get('/api/providers', (req, res) => {
            res.json([
                { id: 'lmstudio', name: 'LM Studio', type: 'local', default: true },
                { id: 'ollama', name: 'Ollama', type: 'local', default: false },
                { id: 'openai', name: 'OpenAI', type: 'cloud', default: false }
            ]);
        });

        this.app.get('/api/agents', (req, res) => {
            const agentsDir = path.join(rootDir, 'config', 'agents');
            const agents = [];
            if (fs.existsSync(agentsDir)) {
                const files = fs.readdirSync(agentsDir).filter(f => f.endsWith('.json'));
                for (const file of files) {
                    try {
                        const config = JSON.parse(fs.readFileSync(path.join(agentsDir, file), 'utf8'));
                        agents.push({ id: file.replace('.json', ''), ...config });
                    } catch (e) {
                        // skip invalid
                    }
                }
            }
            res.json(agents);
        });

        // Session management endpoints
        this.app.post('/api/session/create', (req, res) => {
            try {
                const config = req.body || {};
                const sessionId = sessionManager.createSession(config);
                res.json({ sessionId, status: 'created' });
            } catch (error) {
                logger.error('Failed to create session: ' + error.message);
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/session/:id', (req, res) => {
            try {
                const session = sessionManager.getSession(req.params.id);
                if (!session) {
                    return res.status(404).json({ error: 'Session not found' });
                }
                res.json(session);
            } catch (error) {
                logger.error('Failed to get session: ' + error.message);
                res.status(500).json({ error: error.message });
            }
        });

        this.app.put('/api/session/:id', (req, res) => {
            try {
                const updates = req.body || {};
                const success = sessionManager.updateSession(req.params.id, updates);
                if (!success) {
                    return res.status(404).json({ error: 'Session not found' });
                }
                res.json({ status: 'updated' });
            } catch (error) {
                logger.error('Failed to update session: ' + error.message);
                res.status(500).json({ error: error.message });
            }
        });

        this.app.delete('/api/session/:id', (req, res) => {
            try {
                const success = sessionManager.removeSession(req.params.id);
                if (!success) {
                    return res.status(404).json({ error: 'Session not found' });
                }
                res.json({ status: 'removed' });
            } catch (error) {
                logger.error('Failed to remove session: ' + error.message);
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/sessions', (req, res) => {
            try {
                const sessions = sessionManager.getAllSessions();
                res.json({ sessions, count: sessions.length });
            } catch (error) {
                logger.error('Failed to get sessions: ' + error.message);
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/build', async (req, res) => {
            const { request, agentType, modelProvider, sessionId, options } = req.body;
            if (!request) {
                return res.status(400).json({ error: 'Request is required' });
            }
            if (!sessionId) {
                return res.status(400).json({ error: 'Session ID is required' });
            }
            
            // Validate session exists
            const session = sessionManager.getSession(sessionId);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }
            
            try {
                // Use session-specific settings if not overridden in request
                const effectiveAgentType = agentType || session.agentType;
                const effectiveModelProvider = modelProvider || session.modelProvider;
                
                // Update session activity timestamp
                sessionManager.updateSession(sessionId, { updatedAt: Date.now() });
                
                // Initialize build tracking
                this.activeSessions.set(sessionId, { status: 'running', files: [], logs: [] });
                res.json({ sessionId, status: 'started' });
                
                // Run the build with session-specific configuration
                this.runBuild(sessionId, request, { 
                    agentType: effectiveAgentType, 
                    modelProvider: effectiveModelProvider, 
                    ...options 
                });
            } catch (error) {
                logger.error('Build failed: ' + error.message);
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/download/:id', (req, res) => {
            const session = this.activeSessions.get(req.params.id);
            if (!session || session.status !== 'complete') {
                return res.status(404).json({ error: 'Session not found or not complete' });
            }
            const archive = archiver('zip', { zlib: { level: 9 } });
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', 'attachment; filename=project-' + req.params.id + '.zip');
            archive.pipe(res);
            for (const file of session.files) {
                archive.append(file.content, { name: file.path });
            }
            archive.finalize();
        });
    }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      logger.info('Client connected');
      ws.on('close', () => logger.info('Client disconnected'));
    });
  }

  broadcast(sessionId, message) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ sessionId, ...message }));
      }
    });
  }

    async runBuild(sessionId, request, options) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        
        try {
            this.broadcast(sessionId, { phase: 'analysis', status: 'Analyzing request...' });
            session.logs.push({ phase: 'analysis', message: 'Analyzing request...' });

            // Get or create orchestrator for this session
            const orchestrator = this.getOrCreateOrchestrator(sessionId);
            
            // Apply session-specific configuration to the orchestrator if needed
            const sessionConfig = {
                modelProvider: session.modelProvider,
                agentType: session.agentType,
                modelConfig: session.modelConfig
            };

            const result = await orchestrator.processRequest(request, {
                ...options,
                sessionConfig,
                onProgress: (phase, message) => {
                    this.broadcast(sessionId, { phase, status: message });
                    session.logs.push({ phase, message });
                },
                onFileGenerated: (filePath, content) => {
                    session.files.push({ path: filePath, content });
                    this.broadcast(sessionId, {
                        phase: 'file',
                        status: 'Generated: ' + filePath,
                        file: { path: filePath, content }
                    });
                }
            });

            session.status = 'complete';
            session.result = result;
            this.broadcast(sessionId, { phase: 'complete', status: 'Project generation complete!', fileCount: session.files.length });
        } catch (error) {
            session.status = 'error';
            session.error = error.message;
            this.broadcast(sessionId, { phase: 'error', status: 'Error: ' + error.message });
        }
    }

  start() {
    this.server.listen(this.port, '0.0.0.0', () => {
      logger.info('Agent Project Builder running on http://localhost:' + this.port);
      console.log('');
      console.log('  Open http://localhost:' + this.port + ' in your browser');
      console.log('');
    });
  }
}

export { AgentServer };
