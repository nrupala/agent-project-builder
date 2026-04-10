import { Logger } from './logger.js';
import OpenAI from 'openai';
import axios from 'axios';
import fs from 'fs';
import { LocalModelProvider } from './localModelProvider.js';

export class ModelManager {
  constructor() {
    this.provider = null;
    this.isLocalOnly = false;
    this.clients = new Map();
    this.logger = new Logger({ prefix: '[ModelManager]' });
  }

  async initialize() {
    // Check for local-only mode from environment
    if (process.env.LOCAL_ONLY === 'true') {
      this.isLocalOnly = true;
      this.logger.info('Local-only mode enabled via LOCAL_ONLY env var');
    } else if (process.env.MODEL_PROVIDER === 'lmstudio' || 
               process.env.MODEL_PROVIDER === 'ollama') {
      this.isLocalOnly = true;
      this.logger.info(`Local-only mode enabled via MODEL_PROVIDER=${process.env.MODEL_PROVIDER}`);
    }

    // Initialize default provider from environment
    await this.setProviderFromEnv();
    
    this.logger.info(`ModelManager initialized. Provider: ${this.provider}, Local-only: ${this.isLocalOnly}`);
  }

  async setProviderFromEnv() {
    const provider = process.env.MODEL_PROVIDER || 'openai';
    let config = await this.getModelConfigFromEnv();
    
    if (provider === 'lmstudio') {
      config = {
        provider: 'lmstudio',
        model: process.env.LMSTUDIO_MODEL || 'lmstudio-community/qwen3-32b',
        endpoint: process.env.LMSTUDIO_ENDPOINT || 'http://localhost:1234/v1',
        apiKey: process.env.LMSTUDIO_API_KEY || 'not-needed'
      };
    } else if (provider === 'ollama') {
      config = {
        provider: 'ollama',
        model: process.env.OLLAMA_MODEL || 'llama3',
        endpoint: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434'
      };
    } else if (provider === 'local') {
      config = {
        provider: 'local',
        modelPath: process.env.LOCAL_MODEL_PATH || '',
        modelName: process.env.LOCAL_MODEL_NAME || 'local-model',
        temperature: parseFloat(process.env.LOCAL_TEMPERATURE || '0.7'),
        maxTokens: parseInt(process.env.LOCAL_MAX_TOKENS || '2000'),
        contextSize: parseInt(process.env.LOCAL_CONTEXT_SIZE || '4096'),
        gpuLayers: process.env.LOCAL_GPU_LAYERS !== undefined ? parseInt(process.env.LOCAL_GPU_LAYERS) : -1
      };
    } else if (provider === 'openai') {
      config = {
        provider: 'openai',
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        apiKey: process.env.OPENAI_API_KEY,
        temperature: 0.7,
        maxTokens: 2000
      };
    }
    
    await this.setProvider(provider, config);
  }

  async getModelConfigFromEnv() {
    const provider = process.env.MODEL_PROVIDER || 'openai';
    
    if (provider === 'lmstudio') {
      return {
        provider: 'lmstudio',
        model: process.env.LMSTUDIO_MODEL || 'lmstudio-community/qwen3-32b',
        endpoint: process.env.LMSTUDIO_ENDPOINT || 'http://localhost:1234/v1',
        temperature: 0.7,
        maxTokens: 2000
      };
    } else if (provider === 'ollama') {
      return {
        provider: 'ollama',
        model: process.env.OLLAMA_MODEL || 'llama3',
        endpoint: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434',
        temperature: 0.7,
        maxTokens: 2000
      };
    } else if (provider === 'openai') {
      return {
        provider: 'openai',
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        apiKey: process.env.OPENAI_API_KEY,
        temperature: 0.7,
        maxTokens: 2000
      };
    }
    
    return {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 2000
    };
  }

  async setProvider(provider, config) {
    this.logger.info(`Setting provider to ${provider}`);
    
    try {
      switch (provider) {
        case 'openai':
          if (!config.apiKey) {
            this.logger.warn('No OpenAI API key provided, falling back to mock');
            await this._setupMockClient();
            return;
          }
          this.clients.set('openai', new OpenAI({ apiKey: config.apiKey }));
          this.provider = 'openai';
          this.modelConfig = { 
            model: config.model,
            temperature: config.temperature || 0.7,
            maxTokens: config.maxTokens || 2000
          };
          break;
          
        case 'lmstudio':
          this.clients.set('lmstudio', {
            endpoint: config.endpoint || 'http://localhost:1234/v1',
            model: config.model || 'lmstudio-community/qwen3-32b',
            apiKey: config.apiKey || 'not-needed'
          });
          this.provider = 'lmstudio';
          this.modelConfig = {
            model: config.model,
            temperature: config.temperature || 0.7,
            maxTokens: config.maxTokens || 2000
          };
          break;
          
        case 'ollama':
          this.clients.set('ollama', {
            endpoint: config.endpoint || 'http://localhost:11434',
            model: config.model || 'llama3'
          });
          this.provider = 'ollama';
          this.modelConfig = {
            model: config.model,
            temperature: config.temperature || 0.7,
            maxTokens: config.maxTokens || 2000
          };
          break;
          
        case 'local':
          if (!config.modelPath || !fs.existsSync(config.modelPath)) {
            this.logger.warn(`Local model path not found: ${config.modelPath}, falling back to mock`);
            await this._setupMockClient();
            return;
          }
          const localProvider = new LocalModelProvider(config);
          await localProvider.initialize();
          this.clients.set('local', localProvider);
          this.provider = 'local';
          this.modelConfig = {
            model: config.modelName,
            temperature: config.temperature || 0.7,
            maxTokens: config.maxTokens || 2000
          };
          break;
          
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
      
      this.logger.info(`Successfully set provider to ${provider}`);
    } catch (error) {
      this.logger.error(`Failed to set provider ${provider}: ${error.message}`);
      await this._setupMockClient();
    }
  }

  async _setupMockClient() {
    this.logger.info('Setting up mock client as fallback');
    this.clients.set('mock', {
      generateCompletion: async (prompt) => {
        return `This is a mock response. Connect a real model (LM Studio, Ollama, or OpenAI) for actual code generation.`;
      }
    });
    this.provider = 'mock';
    this.modelConfig = {};
  }

  async generateCompletion(prompt) {
    this.logger.debug(`Generating completion with provider: ${this.provider}`);
    
    try {
      switch (this.provider) {
        case 'openai':
          const openaiClient = this.clients.get('openai');
          const openaiResponse = await openaiClient.chat.completions.create({
            model: this.modelConfig.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: this.modelConfig.temperature,
            max_tokens: this.modelConfig.maxTokens
          });
          return openaiResponse.choices[0].message.content;
          
        case 'lmstudio':
          const lmstudioClient = this.clients.get('lmstudio');
          const lmstudioResponse = await axios.post(
            `${lmstudioClient.endpoint}/chat/completions`,
            {
              model: lmstudioClient.model,
              messages: [{ role: 'user', content: prompt }],
              temperature: this.modelConfig.temperature,
              max_tokens: this.modelConfig.maxTokens
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${lmstudioClient.apiKey}`
              }
            }
          );
          return lmstudioResponse.data.choices[0].message.content;
          
        case 'ollama':
          const ollamaClient = this.clients.get('ollama');
          const ollamaResponse = await axios.post(
            `${ollamaClient.endpoint}/api/generate`,
            {
              model: ollamaClient.model,
              prompt: prompt,
              stream: false,
              options: {
                temperature: this.modelConfig.temperature,
                num_predict: this.modelConfig.maxTokens
              }
            }
          );
          return ollamaResponse.data.response;
          
        case 'local':
          const localProvider = this.clients.get('local');
          return await localProvider.generateCompletion(prompt);
          
        case 'mock':
        default:
          const mockClient = this.clients.get('mock');
          return await mockClient.generateCompletion(prompt);
      }
    } catch (error) {
      this.logger.error(`Error generating completion with ${this.provider}: ${error.message}`);
      // Fallback to mock on error
      if (this.provider !== 'mock') {
        this.logger.warn('Falling back to mock client due to error');
        await this._setupMockClient();
        return await this.generateCompletion(prompt); // Retry with mock
      }
      throw new Error(`Failed to generate completion: ${error.message}`);
    }
  }
}