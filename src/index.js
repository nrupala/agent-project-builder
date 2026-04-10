#!/usr/bin/env node
import 'dotenv/config';
import { CLI } from './cli.js';
import { AgentServer } from './server.js';
import { AgentOrchestrator } from './agentOrchestrator.js';
import { Logger } from './logger.js';

const logger = new Logger({ prefix: '[Main]' });

async function main() {
  const cli = new CLI();
  const args = cli.parseArgs();

  if (args.help) {
    cli.showHelp();
    return;
  }

  if (args.version) {
    cli.showVersion();
    return;
  }

  if (args.server) {
    await startServer(args);
    return;
  }

  if (args.interactive || (!args.request && process.stdin.isTTY)) {
    await startInteractive(cli);
    return;
  }

  if (args.request) {
    await runCLIBuild(args);
    return;
  }

  cli.showHelp();
}

async function startServer(args) {
  const port = args.port || process.env.PORT || 3000;
  logger.info('Starting Agent Project Builder server on port ' + port);

  const server = new AgentServer(port);
  await server.initialize();
  server.start();
}

async function startInteractive(cli) {
  logger.info('Starting interactive mode');
  console.log('');
  console.log('  Agent Project Builder - Interactive Mode');
  console.log('  Type your project description and press Enter.');
  console.log('  Type "quit" or "exit" to leave.');
  console.log('');

  const readline = await import('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const orchestrator = new AgentOrchestrator();
  await orchestrator.initialize();

  const ask = () => {
    rl.question('> ', async (answer) => {
      const trimmed = answer.trim().toLowerCase();
      if (trimmed === 'quit' || trimmed === 'exit') {
        rl.close();
        return;
      }
      if (!answer.trim()) {
        ask();
        return;
      }

      try {
        console.log('');
        console.log('  Building project...');
        console.log('');
        const result = await orchestrator.processRequest(answer.trim(), {
          onProgress: (phase, msg) => console.log('  [' + phase + '] ' + msg),
          onFileGenerated: (path, content) => console.log('  [file] ' + path)
        });
        console.log('');
        console.log('  Done. Generated project in ' + result.outputDir);
        console.log('');
      } catch (error) {
        console.error('');
        console.error('  Error: ' + error.message);
        console.error('');
      }
      ask();
    });
  };

  ask();
}

async function runCLIBuild(args) {
  logger.info('Building: ' + args.request);

  const orchestrator = new AgentOrchestrator();
  await orchestrator.initialize();

  try {
    const result = await orchestrator.processRequest(args.request, {
      agentType: args.options.agentType,
      modelProvider: args.options.modelProvider,
      onProgress: (phase, msg) => console.log('  [' + phase + '] ' + msg),
      onFileGenerated: (path, content) => console.log('  [file] ' + path)
    });
    logger.info('Build complete. Output in: ' + result.outputDir);
  } catch (error) {
    logger.error('Build failed: ' + error.message);
    process.exit(1);
  }
}

main().catch((err) => {
  logger.error('Fatal: ' + err.message);
  process.exit(1);
});