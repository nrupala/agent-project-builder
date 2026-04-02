import { AgentOrchestrator } from './agentOrchestrator.js';

export class CLI {
  constructor() {
    this.logger = {
      info: (msg) => console.log(`[CLI] ${msg}`),
      error: (msg) => console.error(`[CLI] ${msg}`)
    };
  }

  parseArgs() {
    const args = process.argv.slice(2);
    const result = {
      request: null,
      options: {},
      help: false,
      version: false,
      interactive: false
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case '--help':
        case '-h':
          result.help = true;
          break;
        case '--version':
        case '-v':
          result.version = true;
          break;
        case '--interactive':
        case '-i':
          result.interactive = true;
          break;
        case '--request':
        case '-r':
          if (i + 1 < args.length) {
            result.request = args[++i];
          } else {
            this.logger.error('Missing value for --request option');
            process.exit(1);
          }
          break;
        case '--agent-type':
        case '-a':
          if (i + 1 < args.length) {
            result.options.agentType = args[++i];
          } else {
            this.logger.error('Missing value for --agent-type option');
            process.exit(1);
          }
          break;
        case '--model-provider':
        case '-m':
          if (i + 1 < args.length) {
            result.options.modelProvider = args[++i];
          } else {
            this.logger.error('Missing value for --model-provider option');
            process.exit(1);
          }
          break;
        case '--local-only':
        case '-l':
          result.options.localOnly = true;
          break;
        default:
          // If it doesn't start with '-', treat it as the request
          if (!arg.startsWith('-')) {
            result.request = arg;
          } else {
            this.logger.warn(`Unknown option: ${arg}`);
          }
          break;
      }
    }

    return result;
  }

  showHelp() {
    console.log(`
  OpenCode Agent Project Builder

  Usage:
    node src/index.js [options] [request]

  Options:
    -h, --help           Show help message
    -v, --version        Show version information
    -i, --interactive    Start interactive mode
    -r, --request <req>  Specify project request directly
    -a, --agent-type <t> Specify agent type (default, vscode-agent, etc.)
    -m, --model-provider <p> Specify model provider (openai, lmstudio, ollama)
    -l, --local-only     Use only local models (no external API calls)

  Examples:
    node src/index.js "Create a REST API for a blog with Node.js and Express"
    node src/index.js -r "Build a React todo app" -a vscode-agent -m lmstudio -l
    node src/index.js --interactive
  `);
  }

  showVersion() {
    const packageJsonPath = './package.json';
    try {
      const packageJson = require(packageJsonPath);
      console.log(`OpenCode Agent Project Builder v${packageJson.version}`);
    } catch (error) {
      console.log('OpenCode Agent Project Builder v1.0.0');
    }
  }
}
