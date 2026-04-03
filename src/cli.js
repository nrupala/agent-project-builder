import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

export class CLI {
  constructor() {
    this.logger = {
      info: (msg) => console.log('[CLI] ' + msg),
      error: (msg) => console.error('[CLI] ' + msg)
    };
  }

  parseArgs() {
    const args = process.argv.slice(2);
    const result = {
      request: null,
      options: {},
      help: false,
      version: false,
      interactive: false,
      server: false,
      port: null
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
        case '--server':
        case '-s':
          result.server = true;
          break;
        case '--port':
        case '-p':
          if (i + 1 < args.length) {
            result.port = parseInt(args[++i], 10);
          } else {
            this.logger.error('Missing value for --port option');
            process.exit(1);
          }
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
          if (!arg.startsWith('-')) {
            result.request = arg;
          } else {
            this.logger.warn('Unknown option: ' + arg);
          }
          break;
      }
    }

    return result;
  }

  showHelp() {
    console.log('');
    console.log('  OpenCode Agent Project Builder v1.0.0');
    console.log('');
    console.log('  Usage:');
    console.log('    node src/index.js [options] [request]');
    console.log('');
    console.log('  Modes:');
    console.log('    CLI Mode (default)    Build projects from command line');
    console.log('    Server Mode (--server) Start web GUI + API server');
    console.log('');
    console.log('  Options:');
    console.log('    -h, --help              Show help message');
    console.log('    -v, --version           Show version information');
    console.log('    -i, --interactive       Start interactive CLI mode');
    console.log('    -s, --server            Start web GUI server');
    console.log('    -p, --port <port>       Server port (default: 3000)');
    console.log('    -r, --request <req>     Specify project request');
    console.log('    -a, --agent-type <t>    Specify agent type');
    console.log('    -m, --model-provider <p> Specify model provider');
    console.log('    -l, --local-only        Use only local models');
    console.log('');
    console.log('  Examples:');
    console.log('    node src/index.js -s                          # Start web GUI');
    console.log('    node src/index.js -s -p 8080                  # Start GUI on port 8080');
    console.log('    node src/index.js "Create a REST API"         # CLI build');
    console.log('    node src/index.js -r "Build a React app" -l   # CLI with local models');
    console.log('    node src/index.js --interactive               # Interactive mode');
    console.log('');
  }

  showVersion() {
    try {
      const pkgPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      console.log('OpenCode Agent Project Builder v' + pkg.version);
    } catch (error) {
      console.log('OpenCode Agent Project Builder v1.0.0');
    }
  }
}
