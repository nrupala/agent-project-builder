# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Portfolio certification rollout: real README (the old one was a stub left by
  the self-overwrite bug, see ISSUE_LOG.md), CONTRIBUTING.md with PR-flow
  discipline, this CHANGELOG, NOTICE attribution. Signed-deploy survey: no
  deploy target. License verified: MIT, Copyright 2026 Nrupal Akolkar.

## [1.0.0] - 2026-10-05

### Added

- Multi-agent project generation: CLI (`node src/index.js "<request>"`),
  interactive mode, and web GUI (`npm run server`) on `http://localhost:3000`.
- LLM backends: OpenAI API, LM Studio (local), Ollama (local), direct local
  GGUF via `node-llama-cpp` (`LlmEngine`, `ModelManager`, `ModelSelector`).
- `FileManager`/`DirectoryManager`: generated projects written to `generated/`
  (output-dir isolation), dependency install, test run, linter.
- `GitManager`: commits generated projects. Agent registry, prompt engine,
  config manager, structured logger.
- Architecture and usage docs (`docs/ARCHITECTURE.md`, `docs/USAGE.md`),
  issue log (`ISSUE_LOG.md`), security policy (`SECURITY.md`).
- CI: Ubuntu/Windows/macOS × Node 18/20 (`npm ci` → `npm test` → CLI help →
  server smoke test).
