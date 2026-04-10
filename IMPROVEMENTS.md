# Improvements Backlog

## Post-Release Improvements

### Model Provider Integration
- [ ] Research models.dev for free/reasoning models that work without paid API keys
- [ ] Evaluate open-weight models suitable for code generation (DeepSeek, Qwen, Llama variants)
- [ ] Add support for additional free providers (Groq, Together AI, HuggingFace Inference API)
- [ ] Implement model fallback chain: try multiple providers automatically
- [ ] Add model capability detection (reasoning, coding, context window size)

### Agent Capabilities
- [ ] Add multi-agent orchestration (planner + coder + reviewer agents)
- [ ] Implement iterative refinement loop with self-correction
- [ ] Add test-driven generation (generate tests first, then code)
- [ ] Support incremental updates to existing projects

### Performance & Efficiency
- [ ] Implement response caching for repeated prompts
- [ ] Add streaming support for real-time output
- [ ] Optimize prompt templates to reduce token usage
- [ ] Add parallel file generation for independent files

### Security & Safety
- [ ] Add sandboxed execution for generated code
- [ ] Implement content filtering for generated code
- [ ] Add dependency vulnerability scanning
- [ ] Implement rate limiting for model API calls

### Developer Experience
- [ ] Add project templates (React, Express, FastAPI, etc.)
- [ ] Implement interactive refinement chat
- [ ] Add visual project structure preview
- [ ] Support import/export of project configurations

### Testing & Quality
- [ ] Add integration tests with real model providers
- [ ] Implement CI/CD pipeline for the agent itself
- [ ] Add benchmarking suite for code quality metrics
- [ ] Implement automated regression testing

### Infrastructure
- [ ] Add Docker support for easy deployment
- [ ] Implement WebSocket-based real-time progress updates
- [ ] Add project archiving and versioning
- [ ] Support cloud storage for generated projects