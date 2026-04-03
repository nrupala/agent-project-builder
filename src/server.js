import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import archiver from 'archiver';
import { AgentOrchestrator } from './agentOrchestrator.js';
import { Logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const logger = new Logger({ prefix: '[Server]' });

class AgentServer {
  constructor(port) {
    this.port = port || 3000;
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    this.orchestrator = null;
    this.activeSessions = new Map();
  }

  async initialize() {
    this.orchestrator = new AgentOrchestrator();
    await this.orchestrator.initialize();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
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

    this.app.post('/api/build', async (req, res) => {
      const { request, agentType, modelProvider, options } = req.body;
      if (!request) {
        return res.status(400).json({ error: 'Request is required' });
      }
      try {
        const sessionId = Date.now().toString();
        this.activeSessions.set(sessionId, { status: 'running', files: [], logs: [] });
        res.json({ sessionId, status: 'started' });
        this.runBuild(sessionId, request, { agentType, modelProvider, ...options });
      } catch (error) {
        logger.error('Build failed: ' + error.message);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/session/:id', (req, res) => {
      const session = this.activeSessions.get(req.params.id);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.json(session);
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
    try {
      this.broadcast(sessionId, { phase: 'analysis', status: 'Analyzing request...' });
      session.logs.push({ phase: 'analysis', message: 'Analyzing request...' });

      const result = await this.orchestrator.processRequest(request, {
        ...options,
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
