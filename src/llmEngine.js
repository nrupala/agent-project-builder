import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { ModelSelector } from './modelSelector.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class LlmEngine {
  constructor() {
    this.initialized = false;
    this.primaryBackend = null;
    this.fallbackBackend = null;
    this.llamaInstance = null;
    this.model = null;
    this.context = null;
    this.session = null;
    this.transformerPipeline = null;
    this.modelSelector = new ModelSelector();
    this.modelsDir = path.join(__dirname, '..', 'models');
    this.logger = {
      info: (msg) => console.log('[LlmEngine] ' + msg),
      error: (msg) => console.error('[LlmEngine] ' + msg),
      warn: (msg) => console.warn('[LlmEngine] ' + msg)
    };
    this.activeSessions = new Map();
    this.stats = { totalRequests: 0, cacheHits: 0, avgResponseTime: 0 };
    this.responseCache = new Map();
    this.maxCacheSize = 100;
  }

  async initialize(options = {}) {
    if (this.initialized) return true;

    const task = options.task || 'code-generation';
    const quality = options.quality || process.env.LLM_QUALITY || 'auto';
    const forceBackend = options.forceBackend || process.env.LLM_BACKEND || 'auto';

    if (!fs.existsSync(this.modelsDir)) {
      fs.mkdirSync(this.modelsDir, { recursive: true });
    }

    const selectedModel = await this.modelSelector.selectModel(task, quality);
    this.logger.info(`Selected model: ${selectedModel.name} (${selectedModel.params}, ${selectedModel.quantization})`);
    this.logger.info(`GPU: ${selectedModel.willUseGPU ? 'Yes (' + selectedModel.hardwareProfile.gpu.type + ')' : 'No'} | RAM: ${selectedModel.hardwareProfile.availableRamGB}GB available`);

    if (selectedModel.warning) {
      this.logger.warn(selectedModel.warning);
    }

    this.currentModel = selectedModel;

    if (forceBackend === 'auto') {
      try {
        await this._initializeNodeLlamaCpp(selectedModel);
        this.primaryBackend = 'node-llama-cpp';
        this.logger.info('Primary backend: node-llama-cpp (GGUF)');
      } catch (e) {
        this.logger.warn(`node-llama-cpp failed: ${e.message}`);
        try {
          await this._initializeTransformers(selectedModel);
          this.primaryBackend = 'transformers';
          this.fallbackBackend = 'mock';
          this.logger.info('Primary backend: @huggingface/transformers');
        } catch (e2) {
          this.logger.warn(`transformers failed: ${e2.message}`);
          this.primaryBackend = 'mock';
          this.logger.info('Using mock backend (all inference failed)');
        }
      }
    } else if (forceBackend === 'llama-cpp') {
      try {
        await this._initializeNodeLlamaCpp(selectedModel);
        this.primaryBackend = 'node-llama-cpp';
      } catch (e) {
        this.logger.error(`llama-cpp initialization failed: ${e.message}`);
        this.primaryBackend = 'mock';
      }
    } else if (forceBackend === 'transformers') {
      try {
        await this._initializeTransformers(selectedModel);
        this.primaryBackend = 'transformers';
      } catch (e) {
        this.logger.error(`transformers initialization failed: ${e.message}`);
        this.primaryBackend = 'mock';
      }
    } else {
      this.primaryBackend = 'mock';
    }

    this.initialized = true;
    this.logger.info(`LlmEngine initialized with backend: ${this.primaryBackend}`);
    return true;
  }

  async _downloadModel(modelInfo) {
    const modelPath = path.join(this.modelsDir, modelInfo.filename);

    if (fs.existsSync(modelPath)) {
      const stats = fs.statSync(modelPath);
      if (stats.size > 1000000) {
        this.logger.info(`Model already exists: ${modelInfo.filename} (${(stats.size / (1024 * 1024)).toFixed(1)}MB)`);
        return modelPath;
      }
    }

    this.logger.info(`Downloading model: ${modelInfo.name}...`);

    const urls = [modelInfo.url];
    if (modelInfo.fallback) urls.push(modelInfo.fallback);

    for (const url of urls) {
      try {
        const response = await axios({
          url,
          method: 'GET',
          responseType: 'stream',
          timeout: 300000,
          headers: { 'User-Agent': 'agent-project-builder/1.0' }
        });

        const writer = fs.createWriteStream(modelPath);
        let downloaded = 0;
        const total = parseInt(response.headers['content-length'], 10);

        response.data.on('data', (chunk) => {
          downloaded += chunk.length;
          if (total) {
            const pct = ((downloaded / total) * 100).toFixed(0);
            if (downloaded % (10 * 1024 * 1024) < chunk.length) {
              process.stdout.write(`\r  Downloading: ${pct}% (${(downloaded / (1024 * 1024)).toFixed(0)}MB)`);
            }
          }
        });

        await new Promise((resolve, reject) => {
          response.data.pipe(writer);
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        process.stdout.write('\n');
        this.logger.info(`Model downloaded: ${modelInfo.filename} (${(fs.statSync(modelPath).size / (1024 * 1024)).toFixed(1)}MB)`);
        return modelPath;
      } catch (e) {
        this.logger.warn(`Download failed from ${url}: ${e.message}`);
      }
    }

    throw new Error(`Failed to download model from all sources`);
  }

  async _initializeNodeLlamaCpp(modelInfo) {
    const { getLlama, LlamaChatSession } = await import('node-llama-cpp');

    const llama = await getLlama({
      gpu: 'auto'
    });

    this.llamaInstance = llama;

    const gpuInfo = llama.getGpuDeviceInfos ? llama.getGpuDeviceInfos() : [];
    if (gpuInfo.length > 0) {
      this.logger.info(`GPU detected: ${gpuInfo.map(g => g.name || g.type).join(', ')}`);
    }

    const modelPath = await this._downloadModel(modelInfo);

    this.model = await llama.loadModel({
      modelPath,
      gpuLayers: modelInfo.willUseGPU ? -1 : 0
    });

    this.context = await this.model.createContext({
      sequences: 1,
      contextSize: Math.min(8192, this.model.contextSize)
    });

    this.session = new LlamaChatSession({
      contextSequence: this.context.getSequence(),
      autoDisposeSequence: false
    });

    this.logger.info(`node-llama-cpp initialized: ${modelInfo.name} (GPU layers: ${modelInfo.willUseGPU ? 'all' : 'none'})`);
  }

  async _initializeTransformers(modelInfo) {
    const { pipeline } = await import('@huggingface/transformers');

    const modelName = modelInfo.id.replace('-instruct', '').replace('-Q4_K_M', '').replace('-q4_k_m', '');

    this.transformerPipeline = await pipeline(
      'text-generation',
      `Xenova/${modelName}`,
      {
        device: -1,
        dtype: 'q4'
      }
    );

    this.logger.info(`@huggingface/transformers initialized: ${modelName}`);
  }

  async generate(prompt, options = {}) {
    this.stats.totalRequests++;

    const cacheKey = this._getCacheKey(prompt, options);
    if (this.responseCache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.responseCache.get(cacheKey);
    }

    const startTime = Date.now();
    let result;

    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 4096;
    const systemPrompt = options.systemPrompt;

    try {
      switch (this.primaryBackend) {
        case 'node-llama-cpp':
          result = await this._generateWithLlamaCpp(prompt, { temperature, maxTokens, systemPrompt });
          break;
        case 'transformers':
          result = await this._generateWithTransformers(prompt, { temperature, maxTokens, systemPrompt });
          break;
        case 'mock':
        default:
          result = await this._generateMock(prompt, { temperature, maxTokens, systemPrompt });
          break;
      }
    } catch (error) {
      this.logger.error(`Generation error (${this.primaryBackend}): ${error.message}`);

      if (this.primaryBackend !== 'mock') {
        this.logger.info('Falling back to mock...');
        result = await this._generateMock(prompt, { temperature, maxTokens, systemPrompt });
      } else {
        throw error;
      }
    }

    const responseTime = Date.now() - startTime;
    this._updateAvgResponseTime(responseTime);
    this._cacheResult(cacheKey, result);

    return result;
  }

  async _generateWithLlamaCpp(prompt, options) {
    const fullPrompt = options.systemPrompt
      ? `<|system|>\n${options.systemPrompt}<|end|>\n<|user|>\n${prompt}<|end|>\n<|assistant|>`
      : prompt;

    const response = await this.session.prompt(fullPrompt, {
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      stopOnAbortSignal: true
    });

    return response.trim();
  }

  async _generateWithTransformers(prompt, options) {
    const fullPrompt = options.systemPrompt
      ? `System: ${options.systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`
      : prompt;

    const output = await this.transformerPipeline(fullPrompt, {
      max_new_tokens: options.maxTokens,
      temperature: options.temperature,
      do_sample: true,
      top_p: 0.95,
      repetition_penalty: 1.1
    });

    const generatedText = output[0].generated_text;
    const assistantPrefix = 'Assistant:';
    const idx = generatedText.lastIndexOf(assistantPrefix);

    return idx !== -1
      ? generatedText.slice(idx + assistantPrefix.length).trim()
      : generatedText.replace(fullPrompt, '').trim();
  }

  async _generateMock(prompt, options) {
    const responses = [
      `I understand you want me to help with: "${prompt.substring(0, 80)}...". Connect a real model for actual responses.`,
      `Mock response to your prompt. The LLM engine is initializing - please wait for model download to complete.`,
      `This is a placeholder response. Once the GGUF model is downloaded and loaded, you'll get real AI-generated content.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  async generateWithSystemPrompt(userPrompt, systemPrompt, options = {}) {
    return this.generate(userPrompt, { ...options, systemPrompt });
  }

  async generateCode(prompt, options = {}) {
    const systemPrompt = options.systemPrompt ||
      'You are an expert software engineer. Write clean, efficient, well-documented code. Follow best practices and include only the code needed without unnecessary explanations.';
    return this.generate(prompt, { ...options, systemPrompt });
  }

  async generateAnalysis(prompt, options = {}) {
    const systemPrompt = options.systemPrompt ||
      'You are an expert code analyst. Analyze the provided code or architecture and give detailed, actionable insights.';
    return this.generate(prompt, { ...options, systemPrompt });
  }

  async generateMultiple(prompts, options = {}) {
    const concurrency = options.concurrency || 3;
    const results = [];

    for (let i = 0; i < prompts.length; i += concurrency) {
      const batch = prompts.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(p => this.generate(p, options))
      );
      results.push(...batchResults);
    }

    return results;
  }

  async getEmbedding(text) {
    if (this.primaryBackend === 'node-llama-cpp' && this.llamaInstance) {
      const { LlamaEmbeddingContext } = await import('node-llama-cpp');
      const embeddingModel = await this.modelSelector.selectModel('embedding');
      const embeddingPath = await this._downloadModel(embeddingModel);
      const embeddingModelInstance = await this.llamaInstance.loadModel({ modelPath: embeddingPath });
      const embeddingContext = new LlamaEmbeddingContext({ model: embeddingModelInstance });
      const embedding = await embeddingContext.getEmbeddingForText(text);
      return embedding;
    }

    if (this.primaryBackend === 'transformers') {
      const { pipeline } = await import('@huggingface/transformers');
      const embedder = await pipeline('feature-extraction', 'Xenova/nomic-embed-text-v1.5');
      const output = await embedder(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    }

    return new Array(384).fill(0);
  }

  _getCacheKey(prompt, options) {
    const hash = `${prompt.substring(0, 200)}|t${options.temperature ?? 0.7}|m${options.maxTokens ?? 4096}`;
    return Buffer.from(hash).toString('base64').substring(0, 64);
  }

  _cacheResult(key, value) {
    if (this.responseCache.size >= this.maxCacheSize) {
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }
    this.responseCache.set(key, value);
  }

  _updateAvgResponseTime(newTime) {
    const n = this.stats.totalRequests;
    this.stats.avgResponseTime = ((this.stats.avgResponseTime * (n - 1)) + newTime) / n;
  }

  getStats() {
    return {
      ...this.stats,
      backend: this.primaryBackend,
      model: this.currentModel?.name || 'none',
      cacheSize: this.responseCache.size,
      activeSessions: this.activeSessions.size
    };
  }

  async dispose() {
    if (this.session) {
      this.session.dispose?.();
      this.session = null;
    }
    if (this.context) {
      this.context.dispose?.();
      this.context = null;
    }
    if (this.model) {
      this.model.dispose?.();
      this.model = null;
    }
    if (this.llamaInstance) {
      this.llamaInstance.dispose?.();
      this.llamaInstance = null;
    }
    this.transformerPipeline = null;
    this.initialized = false;
    this.logger.info('LlmEngine disposed');
  }
}
