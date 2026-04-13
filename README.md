# Agent Project Builder

An automated agent system for building projects based on user requests using AI models.

## Overview

Agent Project Builder is an intelligent agent system that can understand natural language project descriptions and automatically generate complete project structures with code, configuration files, and documentation. It uses local or remote AI models to analyze requests, plan implementations, and generate production-ready code.

## Features

- **Natural Language Processing**: Convert project descriptions into structured plans
- **Multi-model Support**: Works with local GGUF models (via llama.cpp), LM Studio, Ollama, and OpenAI APIs
- **Autonomous Project Generation**: Creates complete project structures with appropriate file organization
- **Multiple Agent Types**: Specialized agents for different project types (web apps, APIs, CLIs, etc.)
- **Built-in Dev Tools**: Includes testing, linting, and git integration
- **Extensible Architecture**: Easy to add new agent types and capabilities
- **Interactive and CLI Modes**: Use via command line or interactive prompt

## Project Structure

```
agent-project-builder/
├── src/                    # Source code
│   ├── agent.js            # Base agent class
│   ├── agentOrchestrator.js # Orchestrates agent workflows
│   ├── cli.js              # Command-line interface
│   ├── configManager.js    # Configuration management
│   ├── fileManager.js      # File system operations
│   ├── gitManager.js       # Git integration
│   ├── index.js            # Application entry point
│   ├── localModelProvider.js # Local GGUF model interface
│   ├── logger.js           # Logging utility
│   ├── modelManager.js     # AI model provider abstraction
│   ├── promptEngine.js     # Prompt engineering and templating
│   ├── server.js           # HTTP server interface
│   └── sessionManager.js   # Session management
├── config/                 # Configuration files
│   └── agents/             # Agent-specific configurations
├── docs/                   # Documentation
├── models/                 # Local AI models (GGUF format)
├── output/                 # Generated projects
├── scripts/                # Utility scripts
├── tests/                  # Test suites
├── public/                 # Static assets
├── .github/                # GitHub workflows
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/nrupala/agent-project-builder.git
   cd agent-project-builder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Download a local GGUF model for offline use:
   ```bash
   npm run download-model
   ```
   Or manually place `.gguf` files in the `models/` directory.

## Usage

### Command Line Interface

Generate a project from a natural language description:
```bash
npm start -- "Create a REST API for a todo application with user authentication"
```

Start the HTTP server:
```bash
npm run server
```

### Interactive Mode

Start an interactive session:
```bash
npm start -- --interactive
# or
npm start -i
```

Then enter your project descriptions at the prompt.

### Available Options

- `--request <description>`: Project description to build
- `--server`: Start HTTP server mode
- `--interactive` or `-i`: Start interactive mode
- `--help`: Show help information
- `--version`: Show version information
- `--port <number>`: Specify server port (default: 3000)
- `--agent-type <type>`: Specify agent type (web, api, cli, etc.)
- `--model-provider <provider>`: Specify AI model provider (local, lmstudio, ollama, openai)

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Model Provider Settings
LOCAL_ONLY=true
MODEL_PROVIDER=local
LMSTUDIO_BASE_URL=http://localhost:1234
OLLAMA_BASE_URL=http://localhost:11434
OPENAI_API_KEY=your_openai_key_here

# Server Settings
PORT=3000

# Logging
LOG_LEVEL=info
```

### Model Providers

The system supports multiple AI model providers:

1. **Local GGUF Models**: Uses `node-llama-cpp` to run models locally
   - Set `MODEL_PROVIDER=local`
   - Place `.gguf` files in the `models/` directory

2. **LM Studio**: Connect to LM Studio local server
   - Set `MODEL_PROVIDER=lmstudio`
   - Ensure LM Studio is running with a model loaded

3. **Ollama**: Connect to Ollama service
   - Set `MODEL_PROVIDER=ollama`
   - Ensure Ollama is running: `ollama serve`

4. **OpenAI**: Use OpenAI's API
   - Set `MODEL_PROVIDER=openai`
   - Provide `OPENAI_API_KEY` in `.env`

## Examples

### Web Application
```bash
npm start -- "Create a React todo app with local storage"
```

### REST API
```bash
npm start -- "Build a Node.js Express API for managing blog posts with MongoDB"
```

### Command Line Tool
```bash
npm start -- "Create a CLI tool that converts markdown to HTML"
```

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Starting Development Server
```bash
npm run dev:server
```

## Generated Project Structure

When the agent builds a project, it creates a complete structure including:

- Source code files organized by concern
- Configuration files (package.json, .env.example, etc.)
- Documentation (README.md)
- Test scaffolding
- Git initialization
- Build and start scripts

## How It Works

1. **Request Analysis**: The system parses your natural language description
2. **Planning**: Creates a technical implementation plan
3. **Execution**: Generates files according to the plan
4. **Finalization**: Runs tests, linters, and initializes git repository
5. **Output**: Places the generated project in the `output/` directory

## Extending the System

To add new agent types:
1. Create a new agent class extending `Agent` in `src/`
2. Add configuration in `config/agents/`
3. Register the agent type in `agentOrchestrator.js`
4. Implement the specific generation logic

## Troubleshooting

### Common Issues

**Model Loading Failures**:
- Ensure sufficient RAM/VRAM for local models
- Check that `.gguf` files are valid and not corrupted
- Verify `node-llama-cpp` is properly installed

**Connection Errors**:
- Ensure LM Studio/Ollama servers are running
- Check firewall settings for localhost connections
- Verify API keys for remote services

**Permission Errors**:
- Run terminal/command prompt as administrator if encountering EPERM errors
- Ensure you have write permissions to the output directory

## License

MIT License - see the LICENSE file for details.

## Acknowledgements

- Built with Node.js and modern JavaScript
- Uses llama.cpp via node-llama-cpp for local model inference
- Inspired by autonomous agent systems and code generation tools