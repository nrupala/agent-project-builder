# OpenCode Agent Project Builder - Usage Guide

## Overview

The OpenCode Agent Project Builder is an autonomous AI agent system that generates complete software projects from natural language descriptions. It can operate in various modes including cloud-based (OpenAI) and 100% local (LM Studio, Ollama) deployments.

## Table of Contents

1. [Installation](#installation)
2. [Quick Start Examples](#quick-start-examples)
3. [Command Line Interface](#command-line-interface)
4. [Configuration Options](#configuration-options)
5. [Supported AI Providers](#supported-ai-providers)
6. [Project Examples](#project-examples)
7. [Advanced Usage](#advanced-usage)
8. [Troubleshooting](#troubleshooting)

## Installation

### Prerequisites

- Node.js (v14 or higher)
- Git
- One of the following AI backends:
  - OpenAI API access (for cloud models)
  - [LM Studio](https://lmstudio.ai/) running locally (for local Llama/Mistral models)
  - [Ollama](https://ollama.ai/) running locally (for local Llama/Mistral/Codellama models)
  - VS Code with GitHub Copilot or similar AI assistant

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/agent-project-builder.git
   cd agent-project-builder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your environment by creating a `.env` file:
   ```bash
   # For OpenAI
   OPENAI_API_KEY=your_openai_api_key_here
   
   # For LM Studio (default: http://localhost:1234/v1)
   # LMSTUDIO_ENDPOINT=http://localhost:1234/v1
   # LMSTUDIO_MODEL=lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF
   
   # For Ollama (default: http://localhost:11434/v1)
   # OLLAMA_ENDPOINT=http://localhost:11434/v1
   # OLLAMA_MODEL=codellama:7b-instruct
   
   # To force local-only mode (no external API calls)
   # LOCAL_ONLY=true
   # MODEL_PROVIDER=lmstudio  # or ollama
   ```

## Quick Start Examples

### Basic Usage

Create a project from a natural language description:
```bash
node src/index.js -r "Create a REST API for a blog with Node.js and Express"
```

### Specifying Agent and Provider

Use specific agents and model providers:
```bash
node src/index.js -r "Build a React todo app" -a vscode-agent -m lmstudio -l
```

### Interactive Mode

Start an interactive session:
```bash
node src/index.js --interactive
```

### Version and Help

Check version or see help:
```bash
node src/index.js --version
node src/index.js --help
```

## Command Line Interface

### Usage

```
node src/index.js [options] [request]
```

### Options

| Option | Description |
|--------|-------------|
| `-h, --help` | Show help message |
| `-v, --version` | Show version information |
| `-i, --interactive` | Start interactive mode |
| `-r, --request <req>` | Specify project request directly |
| `-a, --agent-type <t>` | Specify agent type (default, vscode-agent) |
| `-m, --model-provider <p>` | Specify model provider (openai, lmstudio, ollama) |
| `-l, --local-only` | Use only local models (no external API calls) |

### Examples

```bash
# Create a web scraper with Python
node src/index.js -r "Create a web scraper that extracts product prices from e-commerce sites"

# Build a mobile app with React Native (local only)
node src/index.js -r "Create a fitness tracking app with workout logging" -a vscode-agent -m ollama -l

# Generate a REST API with specific agent
node src/index.js -r "API for managing a library catalog with books and authors" -a default-agent -m openai

# Interactive mode for complex projects
node src/index.js --interactive
```

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | API key for OpenAI | (required for openai provider) |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-3.5-turbo` |
| `LMSTUDIO_ENDPOINT` | LM Studio server endpoint | `http://localhost:1234/v1` |
| `LMSTUDIO_MODEL` | LM Studio model to use | `lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF` |
| `OLLAMA_ENDPOINT` | Ollama server endpoint | `http://localhost:11434/v1` |
| `OLLAMA_MODEL` | Ollama model to use | `codellama:7b-instruct` |
| `MODEL_PROVIDER` | Default model provider | `openai` |
| `LOCAL_ONLY` | Force local-only mode | `false` |
| `TEMPERATURE` | AI temperature (0.0-2.0) | `0.7` |
| `MAX_TOKENS` | Maximum tokens in response | `2000` |

### Agent Configuration

Agent configurations are stored in `config/agents/` as JSON files:

#### default-agent.json
```json
{
  "name": "default-agent",
  "description": "Default agent for automatic project building",
  "model": {
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "temperature": 0.7,
    "maxTokens": 2000
  },
  "capabilities": [
    "code-generation",
    "project-structure",
    "file-modification",
    "dependency-resolution"
  ],
  "tools": ["read", "write", "edit", "bash", "glob", "grep"],
  "behavior": {
    "autoCommit": true,
    "runTests": true,
    "lintBeforeCommit": true,
    "maxIterations": 10
  }
}
```

#### vscode-agent.json
```json
{
  "name": "vscode-agent",
  "description": "VS Code integrated agent for project building - 100% local with locally stored model",
  "model": {
    "provider": "lmstudio",
    "model": "lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF",
    "temperature": 0.7,
    "maxTokens": 2000
  },
  "capabilities": [
    "code-generation",
    "file-creation",
    "terminal-integration",
    "debugging-assistance",
    "local-processing"
  ],
  "tools": ["read", "write", "edit", "bash", "glob", "grep"],
  "behavior": {
    "autoCommit": true,
    "runTests": true,
    "lintBeforeCommit": true,
    "maxIterations": 10,
    "vscodeIntegration": true,
    "localOnly": true
  },
  "notes": "This agent runs entirely locally using models stored in LM Studio or Ollama. No external API calls are made."
}
```

## Supported AI Providers

### 1. OpenAI (Cloud)
- Requires API key
- Supports GPT-3.5-turbo, GPT-4, etc.
- Fastest response times
- Requires internet connection

### 2. LM Studio (Local)
- Runs Llama/Mistral models locally
- No API key needed
- Private and secure
- Requires LM Studio application running
- Good performance with adequate hardware

### 3. Ollama (Local)
- Runs Llama/Mistral/Codellama models locally
- No API key needed
- Private and secure
- Requires Ollama service running
- Excellent for code-specific models

### 4. VS Code Agent
- Uses either LM Studio or Ollama backend
- Integrated with VS Code workflow
- 100% local operation
- Specialized for development tasks

## Project Examples

### Web Applications
- "Create a React e-commerce site with product catalog, shopping cart, and user authentication"
- "Build a Vue.js dashboard for displaying real-time stock market data with charts"
- "Create a simple HTML/CSS/JavaScript personal portfolio site with contact form"

### APIs and Backends
- "Create a REST API for a blog using Node.js, Express, and MongoDB"
- "Build a GraphQL server for a task management system with user authentication"
- "Create a Python Flask API for a weather service that integrates with OpenWeatherMap"

### Mobile Applications
- "Create a React Native fitness tracker app with exercise logging and progress charts"
- "Build an Ionic app for restaurant menu browsing with online ordering"

### Command Line Tools
- "Create a CLI tool for converting markdown files to PDF with custom styling"
- "Build a file organizer that sorts files into folders based on file type and date"

### Libraries and Packages
- "Create a JavaScript library for form validation with support for async validation rules"
- "Build a Python package for interacting with a specific REST API with retry logic"

### Data Processing
- "Create a Python script for cleaning and analyzing CSV data with visualization"
- "Build a Node.js service for processing JSON logs and generating summary reports"

### Games
- "Create a simple 2D game using HTML5 Canvas and JavaScript"
- "Build a text-based adventure game with Python"

### DevOps and Infrastructure
- "Create a Docker Compose setup for a microservices architecture with nginx reverse proxy"
- "Build a set of GitHub Actions workflows for CI/CD of a Node.js application"

## Advanced Usage

### Customizing Project Generation

You can customize how projects are generated by modifying:

1. **Prompts**: Edit files in `config/prompts/` to change how the AI analyzes requests and generates code
2. **Agent Behavior**: Modify the behavior settings in agent configuration files
3. **Templates**: Add custom template files for specific project types

### Extending the System

To add new capabilities:

1. **New Model Providers**: Extend `src/modelManager.js` with new provider initialization
2. **New Agent Types**: Create new agent configuration files and extend the agent logic
3. **New Tools**: Add new tool implementations and register them in agent configurations
4. **New Output Formats**: Modify `src/fileManager.js` to support additional file types

### Programmatic Usage

You can also use the agent programmatically:

```javascript
import { AgentOrchestrator } from './src/agentOrchestrator.js';

async function buildProject() {
  const orchestrator = new AgentOrchestrator();
  await orchestrator.initialize();
  
  const result = await orchestrator.processRequest(
    "Create a REST API for a todo app with Node.js and Express",
    {
      agentType: 'default-agent',
      modelProvider: 'openai'
    }
  );
  
  return result;
}
```

## Troubleshooting

### Common Issues

#### "Cannot find module 'openai'"
- Solution: Run `npm install` to install dependencies
- Ensure you're in the project directory when running commands

#### "Failed to initialize LM Studio client"
- Solution: Make sure LM Studio is running and accessible at the configured endpoint
- Check that the model is loaded in LM Studio
- Verify network access to localhost:1234

#### "Failed to initialize Ollama client"
- Solution: Make sure Ollama service is running (`ollama serve`)
- Check that the specified model is available (`ollama list`)
- Verify the endpoint is correct (default: http://localhost:11434/v1)

#### Authentication errors with OpenAI
- Solution: Verify your OPENAI_API_KEY is correct in the .env file
- Check that you have sufficient quota and access
- Ensure the key doesn't have extra whitespace

#### "Command failed: git"
- Solution: Make sure git is installed and in your PATH
- Ensure you have write permissions to the directory
- Check that you're not trying to initialize git in a restricted location

### Getting Help

If you encounter issues:

1. Check the console output for specific error messages
2. Ensure all prerequisites are installed correctly
3. Verify your configuration in the .env file
4. Look at the logs in the console for detailed information
5. Search existing issues or create a new one on GitHub

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to:
- Report bugs
- Suggest features
- Submit pull requests
- Follow coding standards

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you find this project helpful, please consider:
- Giving it a ⭐️ on GitHub
- Sharing it with others who might benefit
- Contributing back to the project
- Following us for updates

---

*Built with ❤️ using OpenCode workflow*
