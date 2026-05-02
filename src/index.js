import 'dotenv/config';
import { Logger } from './logger.js';
import { ModelManager } from './modelManager.js';
import { ConfigManager } from './configManager.js';
import { GitManager } from './gitManager.js';
import { FileManager } from './fileManager.js';
import { PromptEngine } from './promptEngine.js';
import { Agent } from './agent.js';
import { MultiAgentOrchestrator } from './multiAgentOrchestrator.js';
import { LlmEngine } from './llmEngine.js';
import { ModelSelector } from './modelSelector.js';
import { DirectoryManager } from './directoryManager.js';
import { BuiltInAgents, getAgentConfig } from './agentRegistry.js';

const logger = new Logger();
const directoryManager = new DirectoryManager();

async function main() {
  logger.info('Agent Project Builder starting...');
  logger.info('Workspace: ' + directoryManager.getWorkspace());
  logger.info('Output: ' + directoryManager.getOutputDir());
  logger.info('Temp: ' + directoryManager.getTempDir());
  logger.info('State: ' + directoryManager.getStateDir());

  const orchestrator = new MultiAgentOrchestrator();
  await orchestrator.initialize();

  const stats = orchestrator.getAgentStats();
  logger.info('Available agent types: ' + Object.keys(BuiltInAgents).join(', '));

  const modelManager = new ModelManager();
  await modelManager.initialize();
  const modelStats = modelManager.getStats();
  logger.info('Model provider: ' + modelStats.provider);
  logger.info('Client type: ' + modelStats.clientType);
  logger.info('Built-in engine: ' + (modelStats.builtInEngine ? modelStats.builtInEngine.backend : 'disabled'));

  const args = process.argv.slice(2);
  let agentType = 'build';
  let request = '';

  if (args[0] === '--agent' && args[1]) {
    agentType = args[1];
    request = args.slice(2).join(' ') || 'Create a simple hello world Express API';
  } else if (args[0] === '--multi') {
    await runMultiAgentDemo(orchestrator, args.slice(1).join(' '));
    return;
  } else if (args[0] === '--parallel') {
    await runParallelDemo(orchestrator, args.slice(1).join(' '));
    return;
  } else {
    request = args.join(' ') || 'Create a simple Node.js Express API with a health check endpoint';
  }

  logger.info('Using agent type: ' + agentType);
  logger.info('Processing request: ' + request);

  const result = await orchestrator.processRequest(request, {
    agentType: agentType,
    onProgress: (phase, message) => {
      logger.info('[' + phase + '] ' + message);
    },
    onFileGenerated: (path) => {
      logger.info('Generated: ' + path);
    }
  });

  logger.info('Build complete: ' + JSON.stringify(result, null, 2));
}

async function runMultiAgentDemo(orchestrator, baseRequest) {
  logger.info('Running multi-agent demonstration...');

  const plan = [
    { type: 'plan', request: `Analyze requirements and create a detailed plan for: ${baseRequest}`, options: { outputDir: `${directoryManager.getOutputDir()}/plan` } },
    { type: 'build', request: `Implement the solution based on the plan. Create working code.`, options: { outputDir: `${directoryManager.getOutputDir()}/build` } },
    { type: 'review', request: `Review the implementation and suggest improvements.`, options: { outputDir: `${directoryManager.getOutputDir()}/review` } }
  ];

  for (const step of plan) {
    logger.info(`Running ${step.type} agent...`);
    await orchestrator.runAgent(step.type, step.request, step.options);
  }

  logger.info('Multi-agent demo complete!');
}

async function runParallelDemo(orchestrator, request) {
  logger.info('Running parallel agent demonstration...');

  const agents = [
    { type: 'explore', request: 'Explore the codebase and find relevant files for: ' + request },
    { type: 'research', request: 'Research best practices and solutions for: ' + request },
    { type: 'docs', request: 'Create documentation draft for: ' + request }
  ];

  const results = await orchestrator.runParallelAgents(agents, {
    outputDir: directoryManager.getOutputDir()
  });

  logger.info('Parallel execution results:');
  results.forEach((r, i) => {
    logger.info(`Agent ${i+1} (${r.agentType}): ${r.status}`);
  });
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

export { Agent, MultiAgentOrchestrator, ModelManager, LlmEngine, ModelSelector, Logger, ConfigManager, GitManager, FileManager, PromptEngine, DirectoryManager, BuiltInAgents, getAgentConfig };