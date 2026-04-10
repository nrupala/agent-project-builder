# Usage Guide

## Getting Started

### 1. Installation

```bash
git clone https://github.com/nrupala/agent-project-builder.git
cd agent-project-builder
npm install
```

### 2. Choose Your AI Provider

#### Option A: LM Studio (Recommended - Local)

1. Download and install [LM Studio](https://lmstudio.ai/)
2. Download a coding model (e.g., `qwen2.5-coder-14b-instruct`)
3. Start the local server (default: `http://localhost:1234/v1`)
4. Create `.env`:
   ```env
   LOCAL_ONLY=true
   MODEL_PROVIDER=lmstudio
   LMSTUDIO_ENDPOINT=http://localhost:1234/v1
   LMSTUDIO_MODEL=qwen2.5-coder-14b-instruct
   ```

#### Option B: Ollama (Local)

1. Install [Ollama](https://ollama.ai/)
2. Pull a model: `ollama pull codellama:7b-instruct`
3. Create `.env`:
   ```env
   LOCAL_ONLY=true
   MODEL_PROVIDER=ollama
   OLLAMA_MODEL=codellama:7b-instruct
   ```

#### Option C: OpenAI (Cloud)

1. Get an API key from [OpenAI](https://platform.openai.com/)
2. Create `.env`:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   MODEL_PROVIDER=openai
   OPENAI_MODEL=gpt-3.5-turbo
   ```

### 3. Start Using

#### Web GUI (Recommended)

```bash
npm run server
```

Open http://localhost:3000 and describe your project in the chat interface.

#### CLI

```bash
node src/index.js "Create a Node.js REST API for a task management system"
```

#### Interactive

```bash
node src/index.js --interactive
```

## Example Requests

### Web Application
```
Build a React dashboard with charts for monitoring server metrics, using Tailwind CSS for styling
```

### REST API
```
Create a REST API for an e-commerce store with products, orders, and users. Use Express.js with MongoDB
```

### CLI Tool
```
Build a CLI tool that converts Markdown files to HTML with syntax highlighting
```

### Python Project
```
Create a Python data analysis script that reads CSV files and generates summary statistics with matplotlib charts
```

### Full Stack
```
Build a full-stack chat application with Node.js backend, Socket.IO for real-time messaging, and a React frontend
```

## Advanced Configuration

### Custom Agents

Create a new agent config in `config/agents/my-agent.json`:

```json
{
  "name": "my-agent",
  "description": "Specialized agent for Python projects",
  "model": {
    "provider": "lmstudio",
    "model": "qwen2.5-coder-14b-instruct",
    "temperature": 0.3,
    "maxTokens": 4000
  },
  "capabilities": ["code-generation", "project-structure"],
  "tools": ["read", "write", "edit"],
  "behavior": {
    "autoCommit": true,
    "runTests": true,
    "lintBeforeCommit": true,
    "maxIterations": 10
  }
}
```

Use it:
```bash
node src/index.js -r "Build a Python Flask API" -a my-agent -m lmstudio -l
```

### Custom Prompts

Edit `config/prompts/project-builder.txt` to customize the system prompt.

### Server Configuration

```bash
# Custom port
node src/index.js --server --port 8080

# Or via environment
PORT=8080 node src/index.js --server
```

## Troubleshooting

### "Cannot connect to model"

- Verify your model server is running (LM Studio on port 1234, Ollama on port 11434)
- Check the endpoint URL in your `.env` file
- For WSL users, use your Windows host IP (not localhost)

### "No files generated"

- The mock client is used when no real model is available
- Connect a real model provider for actual code generation
- Check logs for model connection errors

### Server won't start

- Check if port 3000 is already in use
- Try a different port: `node src/index.js --server --port 8080`
- Verify all dependencies are installed: `npm install`
