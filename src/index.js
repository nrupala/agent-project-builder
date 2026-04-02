import { config } from 'dotenv';
import { AgentOrchestrator } from './agentOrchestrator.js';
import { CLI } from './cli.js';

// Load environment variables
config();

// Main entry point
async function main() {
  try {
    const cli = new CLI();
    const orchestrator = new AgentOrchestrator();
    
    // Parse command line arguments
    const args = cli.parseArgs();
    
    if (args.help) {
      cli.showHelp();
      return;
    }
    
    if (args.version) {
      cli.showVersion();
      return;
    }
    
    // Initialize the agent system
    await orchestrator.initialize();
    
    // Process the user request
    if (args.request) {
      await orchestrator.processRequest(args.request, args.options);
    } else if (args.interactive) {
      await orchestrator.startInteractiveMode();
    } else {
      cli.showHelp();
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
