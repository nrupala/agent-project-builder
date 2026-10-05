# Agent Project Builder

An AI-powered project builder: describe the software you want in plain
language and a multi-agent pipeline plans it, writes the files, installs
dependencies, runs tests and the linter, and commits the result to git.

## How it works

A natural-language request flows through the pipeline:

```
CLI / Web GUI → MultiAgentOrchestrator → Agent(s) → LLM backend(s)
  → FileManager (writes files to `generated/`, installs deps, runs tests + lint)
  → GitManager (commits the result)
```

- **CLI** (`node src/index.js "<request>"`, `--interactive`, `--server`): entry point.
- **MultiAgentOrchestrator / AgentOrchestrator**: plans and coordinates agents;
  built-in agents are registered in `src/agentRegistry.js`.
- **LLM backends** (selectable): OpenAI API, LM Studio (local), Ollama
  (local), or direct local GGUF loading via `node-llama-cpp`
  (`src/llmEngine.js`, `src/modelManager.js`, `src/modelSelector.js`).
- **PromptEngine**: prompt templates for analysis, planning, and file
  generation; agent configs in `config/agents/`, model configs in
  `config/models/`.
- **FileManager / DirectoryManager**: generated projects are written to the
  `generated/` output directory (never into the source tree), with workspace,
  temp, and state dirs isolated.
- **Web GUI** (`npm run server`): chat interface on `http://localhost:3000`.

See `docs/ARCHITECTURE.md` for the full component/data-flow diagrams and
`docs/USAGE.md` for the usage guide.

## Quickstart

```bash
git clone https://github.com/nrupala/agent-project-builder.git
cd agent-project-builder
npm install
```

Pick a provider (LM Studio local, Ollama local, or OpenAI cloud) and create
a `.env` — see `docs/USAGE.md` for the exact variables, e.g.:

```env
MODEL_PROVIDER=lmstudio
LMSTUDIO_ENDPOINT=http://localhost:1234/v1
LMSTUDIO_MODEL=qwen2.5-coder-14b-instruct
```

Generate a project:

```bash
# Web GUI (recommended)
npm run server        # → http://localhost:3000

# CLI
node src/index.js "Create a Node.js REST API for a task management system"

# Interactive mode
node src/index.js --interactive
```

## Build and test

```bash
npm ci                # install dependencies
npm test              # jest suite
node src/index.js --help   # CLI smoke check
```

CI runs on Ubuntu, Windows, and macOS (Node 18/20): `npm ci` → `npm test` →
CLI help check → server-start smoke test.

## Known issues

See `ISSUE_LOG.md` for the current issue list (fixed and remaining), including
generated-code cleanup items and platform notes.
