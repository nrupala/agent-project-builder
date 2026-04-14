import 'dotenv/config';
import { Logger } from './logger.js';
import { ModelManager } from './modelManager.js';
import { ConfigManager } from './configManager.js';
import { GitManager } from './gitManager.js';
import { FileManager } from './fileManager.js';
import { PromptEngine } from './promptEngine.js';
import { Agent } from './agent.js';
import { AgentOrchestrator } from './agentOrchestrator.js';
import { LlmEngine } from './llmEngine.js';
import { ModelSelector } from './modelSelector.js';

async function main() {
  const logger = new Logger();
  const modelManager = new ModelManager();
  const configManager = new ConfigManager();
  const gitManager = new GitManager();
  const promptEngine = new PromptEngine();

  logger.info('Agent Project Builder starting...');

  await modelManager.initialize();

  const stats = modelManager.getStats();
  logger.info('Model provider: ' + stats.provider);
  logger.info('Client type: ' + stats.clientType);
  logger.info('Built-in engine: ' + (stats.builtInEngine ? stats.builtInEngine.backend : 'disabled'));

  const request = process.argv[2] || 'Create a simple Node.js Express API with a health check endpoint';
  logger.info('Processing request: ' + request);

  const orchestrator = new AgentOrchestrator();

  const result = await orchestrator.processRequest(request, {
    onProgress: (phase, message) => {
      logger.info('[' + phase + '] ' + message);
    },
    onFileGenerated: (path) => {
      logger.info('Generated: ' + path);
    }
  });
  logger.info('Build complete: ' + JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

export { Agent, AgentOrchestrator, ModelManager, LlmEngine, ModelSelector, Logger, ConfigManager, GitManager, FileManager, PromptEngine };
