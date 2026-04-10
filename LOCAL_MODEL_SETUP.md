# Local Model Setup for Agent Project Builder

## Overview

This guide explains how to configure the Agent Project Builder to run entirely locally using GGUF models, eliminating the need for external API connections.

## System Capabilities

The Agent Project Builder includes built-in support for local GGUF model inference through the `node-llama-cpp` library. This enables:

- Fully private, offline operation
- No API keys or external service dependencies
- Reduced latency after initial model load
- Complete control over model selection and hardware utilization

## Quick Start

### 1. Download a Model

Run the included model downloader script:
```bash
npm run download-model
```

This downloads a small test model (`tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf`) suitable for initial testing.

For better code generation, you can modify the script to download larger models like:
- Qwen2.5 Coder 7B: Good balance of quality and speed
- CodeLlama variants: Specifically trained for code
- StarCoder: Another strong coding model

### 2. Configure Environment

Update your `.env` file with local model settings:
```env
MODEL_PROVIDER=local
LOCAL_MODEL_PATH=/path/to/your/model.gguf
LOCAL_MODEL_NAME=Your Model Name
LOCAL_TEMPERATURE=0.7
LOCAL_MAX_TOKENS=2000
LOCAL_CONTEXT_SIZE=4096
LOCAL_GPU_LAYERS=-1  # Set to number of layers to offload to GPU, -1 for all
```

### 3. Run the Agent

```bash
# CLI Mode
node src/index.js "Create a simple web calculator" --local-only

# Interactive Mode  
node src/index.js --interactive

# Server Mode
node src/index.js --server
```

## Model Recommendations

### For Testing:
- **TinyLlama 1.1B**: Very fast, good for testing (~600MB Q4)

### For Code Generation:
- **Qwen2.5 Coder 7B**: Excellent coding performance (~4.5GB Q4)
- **CodeLlama 7B**: Specifically trained for code (~4.5GB Q4)  
- **StarCoder 3B**: Good balance (~2GB Q4)

### For Maximum Quality:
- **Qwen2.5 Coder 14B**: Highest quality (~9GB Q4)
- **CodeLlama 13B**: Strong alternative (~7GB Q4)

## Performance Tips

1. **GPU Acceleration**: If you have a compatible GPU, set `LOCAL_GPU_LAYERS` to the number of layers to offload (e.g., 20 for RTX 3060 12GB)
2. **Model Quantization**: Q4_K_M offers good quality/speed ratio; use Q5_K_M for better quality or Q3_K_L for faster speed
3. **Context Size**: Increase `LOCAL_CONTEXT_SIZE` for larger projects (requires more RAM)
4. **First Load**: Initial model loading takes time; subsequent requests are much faster

## Troubleshooting

### "Model file not found"
- Verify `LOCAL_MODEL_PATH` points to an existing .gguf file
- Use absolute paths to avoid confusion

### Slow Performance
- Check if model is properly loaded into GPU (if configured)
- Consider using a smaller quantized version
- Close other memory-intensive applications

### Out of Memory Errors
- Reduce `LOCAL_CONTEXT_SIZE`
- Use a smaller model or more aggressive quantization
- Increase virtual memory/page file size

## Architecture Notes

The local model implementation uses:
- `node-llama-cpp` for efficient GGUF inference
- LlamaChatSession for maintaining conversation state
- Async/await pattern for non-blocking operations
- Proper resource cleanup to prevent memory leaks

## Security Benefits

- All processing happens locally on your machine
- No code or prompts leave your environment
- Zero risk of data exposure to external services
- Compatible with air-gapped or highly restricted networks

## Custom Model Sources

Reputable sources for GGUF models:
- Hugging Face (look for GGUF variants)
- TheBloke's collections (high-quality quantizations)
- Official model repositories when they provide GGUF files

Always verify model authenticity and licensing before use.