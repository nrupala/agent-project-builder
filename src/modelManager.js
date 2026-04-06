import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { LlmEngine } from './llmEngine.js';

export class ModelManager {
  constructor() {
    this.provider = null;
    this.modelConfig = null;
    this.clients = new Map();
    this.clientType = null;
    this.isLocalOnly = false;
    this.builtInEngine = new LlmEngine();
    this.useBuiltInEngine = true;
    this.maxConcurrentRequests = 20;
    this.activeRequests = 0;
    this.requestQueue = [];
    this.logger = {
      info: (msg) => console.log('[ModelManager] ' + msg),
      error: (msg) => console.error('[ModelManager] ' + msg),
      warn: (msg) => console.warn('[ModelManager] ' + msg)
    };
  }

  async initialize() {
    this.isLocalOnly = process.env.LOCAL_ONLY === 'true' ||
                       (process.env.MODEL_PROVIDER &&
                        ['lmstudio', 'ollama', 'opencode'].includes(process.env.MODEL_PROVIDER.toLowerCase()));

    if (this.isLocalOnly) {
      this.logger.info('Running in local-only mode - no external API calls will be made');
    }

    const useBuiltIn = process.env.USE_BUILTIN_ENGINE !== 'false';
    this.useBuiltInEngine = useBuiltIn;

    if (this.useBuiltInEngine) {
      try {
        const task = process.env.LLM_TASK || 'code-generation';
        const quality = process.env.LLM_QUALITY || 'auto';
        await this.builtInEngine.initialize({ task, quality });
        this.provider = 'builtin';
        this.clientType = 'llm-engine';
        this.logger.info('Built-in LLM engine initialized as primary provider');
        return;
      } catch (e) {
        this.logger.warn('Built-in engine failed to initialize: ' + e.message);
        this.logger.info('Falling back to external providers...');
      }
    }

    const providerName = process.env.MODEL_PROVIDER || 'lmstudio';
    const modelConfig = await this.getModelConfigFromEnv();

    await this.setProvider(providerName, modelConfig);
  }

  async getModelConfigFromEnv() {
    const provider = process.env.MODEL_PROVIDER || 'lmstudio';

    switch (provider.toLowerCase()) {
      case 'lmstudio':
        return {
          provider: 'lmstudio',
          model: process.env.LMSTUDIO_MODEL || 'qwen2.5-coder-14b-instruct',
          temperature: parseFloat(process.env.TEMPERATURE) || 0.7,
          maxTokens: parseInt(process.env.MAX_TOKENS) || 4096,
          basePath: process.env.LMSTUDIO_ENDPOINT || 'http://localhost:1234/v1'
        };
      case 'opencode':
        return {
          provider: 'opencode',
          model: process.env.OPENCODE_MODEL || 'qwen2.5-coder-14b-instruct',
          temperature: parseFloat(process.env.TEMPERATURE) || 0.7,
          maxTokens: parseInt(process.env.MAX_TOKENS) || 4096,
          basePath: process.env.OPENCODE_ENDPOINT || 'http://localhost:1234/v1'
        };
      case 'ollama':
        return {
          provider: 'ollama',
          model: process.env.OLLAMA_MODEL || 'codellama:7b-instruct',
          temperature: parseFloat(process.env.TEMPERATURE) || 0.7,
          maxTokens: parseInt(process.env.MAX_TOKENS) || 2000,
          basePath: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434/v1'
        };
      case 'openai':
      default:
        return {
          provider: 'openai',
          model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
          temperature: parseFloat(process.env.TEMPERATURE) || 0.7,
          maxTokens: parseInt(process.env.MAX_TOKENS) || 2000
        };
    }
  }

  async setProvider(providerName, modelConfig) {
    this.provider = providerName;
    this.modelConfig = modelConfig;

    if (this.isLocalOnly && !['lmstudio', 'ollama', 'opencode'].includes(providerName)) {
      this.logger.warn('Provider ' + providerName + ' is not local-only. Switching to lmstudio.');
      this.provider = 'lmstudio';
      try {
        const lmstudioConfig = await this.getModelConfigFromEnv();
        this.modelConfig = lmstudioConfig;
      } catch (e) {
        this.modelConfig = {
          provider: 'lmstudio',
          model: 'qwen2.5-coder-14b-instruct',
          temperature: 0.7,
          maxTokens: 4096,
          basePath: 'http://localhost:1234/v1'
        };
      }
    }

    try {
      switch (this.provider) {
        case 'openai':
          if (!this.isLocalOnly) {
            await this.initializeClient('openai', process.env.OPENAI_API_KEY, null);
          } else {
            this.logger.warn('OpenAI requested but local-only mode. Trying local providers...');
            await this.tryLocalProviders();
          }
          break;
        case 'lmstudio':
          await this.tryLocalProviders();
          break;
        case 'opencode':
          await this.tryLocalProviders();
          break;
        case 'ollama':
          await this.tryLocalProviders();
          break;
        case 'vscode':
          await this.tryLocalProviders();
          break;
        default:
          await this.tryLocalProviders();
      }

      this.logger.info('Model provider set to ' + this.provider + ' (client type: ' + this.clientType + ')' + (this.isLocalOnly ? ' (local-only)' : ''));
    } catch (error) {
      this.logger.error('Failed to initialize client: ' + error.message);
      this.initializeMockClient();
    }
  }

  async tryLocalProviders() {
    try {
      const lmstudioBase = this.modelConfig.basePath || 'http://localhost:1234/v1';
      await this.initializeClient('lmstudio', 'not-needed', lmstudioBase);
      this.logger.info('Connected to LM Studio at ' + lmstudioBase);
      this.provider = 'lmstudio';
      return;
    } catch (e) {
      this.logger.info('LM Studio not available: ' + e.message);
    }

    try {
      const opencodeBase = process.env.OPENCODE_ENDPOINT || 'http://localhost:1234/v1';
      await this.initializeClient('opencode', 'not-needed', opencodeBase);
      this.logger.info('Connected to OpenCode at ' + opencodeBase);
      this.provider = 'opencode';
      return;
    } catch (e) {
      this.logger.info('OpenCode not available: ' + e.message);
    }

    try {
      const ollamaBase = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434/v1';
      await this.initializeClient('ollama', 'not-needed', ollamaBase);
      this.logger.info('Connected to Ollama at ' + ollamaBase);
      this.provider = 'ollama';
      return;
    } catch (e) {
      this.logger.info('Ollama not available: ' + e.message);
    }

    this.logger.warn('All local providers failed. Using mock client.');
    this.initializeMockClient();
  }

  async initializeClient(providerName, apiKey, baseURL) {
    try {
      const { OpenAI } = await import('openai');
      const client = new OpenAI({
        apiKey: apiKey,
        baseURL: baseURL || undefined,
        dangerouslyAllowBrowser: true
      });
      if (client.chat && client.chat.completions && typeof client.chat.completions.create === 'function') {
        this.clients.set(providerName, client);
        this.clientType = 'sdk-v4';
        this.logger.info(providerName + ' client initialized (SDK v4: chat.completions.create)');
        return;
      }
    } catch (e) {
      this.logger.info('SDK v4 not available for ' + providerName + ': ' + e.message);
    }

    try {
      const openaiModule = await import('openai');
      const OpenAI = openaiModule.OpenAIApi || openaiModule.default || openaiModule;

      if (OpenAI && OpenAI.Configuration) {
        const { Configuration, OpenAIApi } = OpenAI;
        const config = new Configuration({
          apiKey: apiKey,
          basePath: baseURL
        });
        const client = new OpenAIApi(config);
        if (typeof client.createChatCompletion === 'function') {
          this.clients.set(providerName, client);
          this.clientType = 'sdk-v3';
          this.logger.info(providerName + ' client initialized (SDK v3: createChatCompletion)');
          return;
        }
      } else if (OpenAI && typeof OpenAI.createChatCompletion === 'function') {
        OpenAI.apiKey = apiKey;
        if (baseURL) OpenAI.basePath = baseURL;
        this.clients.set(providerName, OpenAI);
        this.clientType = 'sdk-v3-static';
        this.logger.info(providerName + ' client initialized (SDK v3 static)');
        return;
      }
    } catch (e) {
      this.logger.info('SDK v3 not available for ' + providerName + ': ' + e.message);
    }

    this.clients.set(providerName, {
      _httpBase: baseURL || 'https://api.openai.com/v1',
      _apiKey: apiKey,
      _provider: providerName
    });
    this.clientType = 'raw-http';
    this.logger.info(providerName + ' client initialized (raw HTTP fallback to ' + baseURL + ')');
  }

  initializeMockClient() {
    this.clients.set('mock', { _mock: true });
    this.clientType = 'mock';
    this.logger.info('Using mock model client');
  }

  async _executeWithConcurrencyControl(fn) {
    if (this.activeRequests >= this.maxConcurrentRequests) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push({ fn, resolve, reject });
      });
    }

    this.activeRequests++;
    try {
      return await fn();
    } finally {
      this.activeRequests--;
      if (this.requestQueue.length > 0) {
        const next = this.requestQueue.shift();
        this._executeWithConcurrencyControl(next.fn).then(next.resolve).catch(next.reject);
      }
    }
  }

  async generateCompletion(prompt, options = {}) {
    return this._executeWithConcurrencyControl(async () => {
      if (this.useBuiltInEngine && this.builtInEngine.initialized) {
        try {
          const result = await this.builtInEngine.generate(prompt, {
            temperature: options.temperature ?? this.modelConfig?.temperature ?? 0.7,
            maxTokens: options.maxTokens ?? this.modelConfig?.maxTokens ?? 4096,
            systemPrompt: options.systemPrompt
          });
          this.logger.info('Generated completion using built-in LLM engine (' + this.builtInEngine.primaryBackend + ')');
          return result;
        } catch (e) {
          this.logger.warn('Built-in engine generation failed: ' + e.message + '. Falling back...');
        }
      }

      return this._generateWithExternalProvider(prompt, options);
    });
  }

  async _generateWithExternalProvider(prompt, options) {
    let client;
    let providerUsed = this.provider;

    if (this.provider === 'openai') {
      client = this.clients.get('openai');
    } else if (this.provider === 'lmstudio') {
      client = this.clients.get('lmstudio');
    } else if (this.provider === 'opencode') {
      client = this.clients.get('opencode') || this.clients.get('lmstudio');
      providerUsed = this.clients.has('opencode') ? 'opencode' : 'lmstudio';
    } else if (this.provider === 'ollama') {
      client = this.clients.get('ollama');
    } else if (this.provider === 'vscode') {
      client = this.clients.get('lmstudio') || this.clients.get('opencode') || this.clients.get('ollama');
      if (this.clients.has('lmstudio')) providerUsed = 'lmstudio';
      else if (this.clients.has('opencode')) providerUsed = 'opencode';
      else providerUsed = 'ollama';
    } else {
      client = this.clients.get('mock');
      providerUsed = 'mock';
    }

    if (!client) {
      this.logger.warn('No client found for ' + this.provider + ', using mock');
      client = this.clients.get('mock');
      providerUsed = 'mock';
      this.clientType = 'mock';
    }

    const requestParams = {
      model: this.modelConfig.model || 'mock-model',
      messages: [{ role: 'user', content: prompt }],
      temperature: this.modelConfig.temperature || 0.7,
      max_tokens: this.modelConfig.maxTokens || 4096
    };

    try {
      let content;

      if (this.clientType === 'sdk-v4') {
        const response = await client.chat.completions.create(requestParams);
        content = response.choices[0].message.content;

      } else if (this.clientType === 'sdk-v3') {
        const response = await client.createChatCompletion(requestParams);
        content = response.data.choices[0].message.content;

      } else if (this.clientType === 'sdk-v3-static') {
        const response = await client.createChatCompletion(requestParams);
        content = response.data.choices[0].message.content;

      } else if (this.clientType === 'raw-http') {
        const response = await axios.post(
          client._httpBase + '/chat/completions',
          requestParams,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + client._apiKey
            }
          }
        );
        content = response.data.choices[0].message.content;

      } else {
        content = 'This is a mock response. Connect a real model (LM Studio, OpenCode, Ollama, or OpenAI) for actual code generation.';
      }

      this.logger.info('Generated completion using ' + providerUsed + ' (' + this.clientType + ')');
      return content;

    } catch (error) {
      this.logger.error('Error with ' + this.clientType + ' on ' + providerUsed + ': ' + error.message);

      if (this.clientType !== 'raw-http' && this.clientType !== 'mock') {
        this.logger.info('Falling back to raw HTTP...');
        const fallbackClient = {
          _httpBase: this.modelConfig.basePath || 'https://api.openai.com/v1',
          _apiKey: this.provider === 'openai' ? process.env.OPENAI_API_KEY : 'not-needed'
        };
        const prevType = this.clientType;
        this.clientType = 'raw-http';
        try {
          const response = await axios.post(
            fallbackClient._httpBase + '/chat/completions',
            requestParams,
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + fallbackClient._apiKey
              }
            }
          );
          this.logger.info('Raw HTTP fallback succeeded');
          return response.data.choices[0].message.content;
        } catch (httpError) {
          this.logger.error('Raw HTTP fallback also failed: ' + httpError.message);
          this.clientType = prevType;
        }
      }

      if (this.clientType !== 'mock') {
        this.logger.info('Falling back to mock client');
        this.clientType = 'mock';
        return 'Mock response: Could not reach AI model. Ensure LM Studio, OpenCode, or Ollama is running.';
      }

      throw error;
    }
  }

  async generateCode(prompt, options = {}) {
    if (this.useBuiltInEngine && this.builtInEngine.initialized) {
      return this.builtInEngine.generateCode(prompt, options);
    }
    return this.generateCompletion(prompt, options);
  }

  async generateAnalysis(prompt, options = {}) {
    if (this.useBuiltInEngine && this.builtInEngine.initialized) {
      return this.builtInEngine.generateAnalysis(prompt, options);
    }
    return this.generateCompletion(prompt, options);
  }

  async generateMultiple(prompts, options = {}) {
    if (this.useBuiltInEngine && this.builtInEngine.initialized) {
      return this.builtInEngine.generateMultiple(prompts, options);
    }

    const concurrency = Math.min(options.concurrency || 3, this.maxConcurrentRequests);
    const results = [];

    for (let i = 0; i < prompts.length; i += concurrency) {
      const batch = prompts.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(p => this.generateCompletion(p, options))
      );
      results.push(...batchResults);
    }

    return results;
  }

  async getEmbedding(text) {
    if (this.useBuiltInEngine && this.builtInEngine.initialized) {
      return this.builtInEngine.getEmbedding(text);
    }
    return new Array(384).fill(0);
  }

  getStats() {
    return {
      provider: this.provider,
      clientType: this.clientType,
      isLocalOnly: this.isLocalOnly,
      useBuiltInEngine: this.useBuiltInEngine,
      builtInEngine: this.builtInEngine.initialized ? this.builtInEngine.getStats() : null,
      activeRequests: this.activeRequests,
      queuedRequests: this.requestQueue.length,
      maxConcurrentRequests: this.maxConcurrentRequests
    };
  }

  async dispose() {
    await this.builtInEngine.dispose();
    this.clients.clear();
    this.requestQueue = [];
    this.activeRequests = 0;
    this.logger.info('ModelManager disposed');
  }
}
