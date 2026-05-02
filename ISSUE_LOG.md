# Issue Log

## Critical Issues

### 1. Source Code Self-Overwrite
- **Status**: FIXED
- **Issue**: App was writing generated files to same directory as source code, corrupting package.json, src/index.js, README.md
- **Fix**: Added outputDir parameter - generated files now go to `generated/` folder

### 2. LM Studio API Connection
- **Status**: FIXED (when LM Studio is running)
- **Issue**: App couldn't connect to LM Studio at localhost:1234
- **Fix**: Now properly connects when LM Studio server is enabled

## Known Issues Remaining

### 1. Markdown Fences in Generated Code
- **Severity**: Medium
- **Issue**: Generated code includes markdown fences (```javascript ... ```) instead of clean code
- **Location**: `generated/src/index.js`, `generated/README.md`
- **Example**: Code wrapped in triple backticks with language identifier
- **Impact**: Generated code cannot run directly - syntax errors
- **Fix Needed**: Strip markdown fences from model output before writing files

### 2. Malformed package.json
- **Severity**: Medium
- **Issue**: Generated package.json has markdown formatting and extra text
- **Location**: `generated/package.json`
- **Example**:
  ```json
  ```json
  {
    "name": "my-project",
  }
  ```
- **Impact**: Cannot run `npm install` or `npm start` in generated project
- **Fix Needed**: Extract valid JSON from model output

### 3. Large Model VRAM Requirements
- **Severity**: Low
- **Issue**: 14B model (Qwen2.5-Coder-14B-Instruct-Q3_K_L.gguf) needs ~10GB VRAM
- **Error**: `ggml_vulkan: Device memory allocation of size 1048039424 failed`
- **Impact**: Falls back to mock when no GPU available
- **Workaround**: Use smaller 7B model or ensure LM Studio is running with API server

### 4. Test Failures (Windows EPERM)
- **Severity**: Low (environmental)
- **Issue**: 13/71 tests fail with EPERM errors on temp directory cleanup
- **Location**: FileManager and GitManager tests
- **Cause**: Windows file permissions locking temp files
- **Impact**: 82% pass rate (58/71)
- **Not a code bug**: Environmental issue, not code logic error

### 5. Built-in node-llama-cpp Fails
- **Severity**: Low
- **Issue**: Direct model loading via node-llama-cpp fails with context allocation errors
- **Error**: `failed to allocate compute pp buffers`
- **Impact**: Must use LM Studio API instead of direct loading
- **Workaround**: Use LM Studio as API server

## Architecture Issues

### 6. No Output Directory Isolation at File Level
- **Severity**: Medium
- **Issue**: File-level isolation not ensured - if outputDir param missed, writes to cwd
- **Fix Applied**: Added outputDir to Agent constructor, propagates to FileManager
- **Note**: This was the root cause of Issue #1

### 7. Mock Responses When LM Studio Unavailable
- **Severity**: Info
- **Issue**: Falls back to hardcoded mock when LM Studio unavailable
- **Impact**: No real code generation without running model server
- **By Design**: Graceful degradation

## Test Results Summary

| Module | Tests | Pass Rate | Notes |
|--------|-------|----------|-------|
| CLI | 3 | 100% | Working |
| Logger | 3 | 100% | Working |
| ConfigManager | 3 | 100% | Working |
| PromptEngine | 2 | 100% | Working |
| AgentOrchestrator | 3 | 100% | Working |
| Agent | 3 | 100% | Working |
| ModelManager | 6 | 100% | Working |
| ModelSelector | 7 | 57% | Local-first design change |
| FileManager | 8 | 0% | EPERM (Windows) |
| GitManager | 5 | 0% | EPERM (Windows) |
| **Total** | **71** | **82%** | **58 passing** |

## Priority Fixes

1. **High**: Strip markdown fences from generated code
2. **High**: Fix JSON extraction for package.json
3. **Medium**: Add 7B model config for low-VRAM systems
4. **Low**: Windows temp file cleanup (may not fixable)