import fs from 'fs';
import path from 'path';

export class ModelManager {
  constructor() {
    this.provider = null;
    this.modelConfig = null;
    this.clients = new Map();
    this.isLocalOnly = false;
    this.logger = {
      info: (msg) => console.log(`[ModelManager] ${msg}`),
      error: (msg) => console.error(`[ModelManager] ${msg}`),
      warn: (msg) => console.warn(`[ModelManager] ${msg}`)
    };
  }

  async initialize() {
    // Check if we should operate in local-only mode
    this.isLocalOnly = process.env.LOCAL_ONLY === 'true' || 
                       (process.env.MODEL_PROVIDER && 
                        ['lmstudio', 'ollama'].includes(process.env.MODEL_PROVIDER.toLowerCase()));
    
    if (this.isLocalOnly) {
      this.logger.info('Running in local-only mode - no external API calls will be made');
    }
    
    // Initialize with default provider from env or config
    const providerName = process.env.MODEL_PROVIDER || 'openai';
    const modelConfig = await this.getModelConfigFromEnv();
    
    await this.setProvider(providerName, modelConfig);
  }

  async getModelConfigFromEnv() {
    // Try to get model config from environment or use defaults
    const provider = process.env.MODEL_PROVIDER || 'openai';
    
    switch (provider.toLowerCase()) {
      case 'lmstudio':
        return {
          provider: 'lmstudio',
          model: process.env.LMSTUDIO_MODEL || 'lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF',
          temperature: parseFloat(process.env.TEMPERATURE) || 0.7,
          maxTokens: parseInt(process.env.MAX_TOKENS) || 2000,
          basePath: process.env.LMSTUDIO_ENDPOINT || 'http://localhost:1234/v1'
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
    
    // Check if we're forcing local-only mode
    if (this.isLocalOnly && !['lmstudio', 'ollama'].includes(providerName)) {
      this.logger.warn(`Provider ${providerName} is not local-only. Switching to lmstudio.`);
      this.provider = 'lmstudio';
      // Try to load LM Studio config
      try {
        const lmstudioConfig = await this.getModelConfigFromEnv();
        this.modelConfig = lmstudioConfig;
      } catch (e) {
        // Use defaults
        this.modelConfig = {
          provider: 'lmstudio',
          model: 'lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF',
          temperature: 0.7,
          maxTokens: 2000,
          basePath: 'http://localhost:1234/v1'
        };
      }
    }
    
    // Initialize appropriate client based on provider
    try {
      switch (this.provider) {
        case 'openai':
          if (!this.isLocalOnly) {
            await this.initializeOpenAIClient();
          } else {
            this.logger.warn('OpenAI requested but local-only mode is enabled. Using mock client.');
            this.initializeMockClient();
          }
          break;
        case 'lmstudio':
          await this.initializeLMStudioClient();
          break;
        case 'ollama':
          await this.initializeOllamaClient();
          break;
        case 'vscode':
          // VS Code agent uses local models via LM Studio or Ollama backend
          await this.initializeVSCodeClient();
          break;
        default:
          throw new Error(`Unsupported model provider: ${this.provider}`);
      }
      
      this.logger.info(`Model provider set to ${this.provider}${this.isLocalOnly ? ' (local-only)' : ''}`);
    } catch (error) {
      this.logger.error(`Failed to initialize ${this.provider} client: ${error.message}`);
      // Fallback to mock client for development
      this.initializeMockClient();
    }
  }

  async initializeOpenAIClient() {
    try {
      // Check if we can import openai
      let OpenAI;
      try {
        const openaiModule = await import('openai');
        OpenAI = openaiModule.OpenAIApi || openaiModule.default || openaiModule;
      } catch (e) {
        this.logger.warn('Could not import openai package, using mock client');
        this.initializeMockClient();
        return;
      }
      
      // Check if it's the new or old API
      if (OpenAI && OpenAI.Configuration) {
        // Newer version
        const { Configuration, OpenAIApi } = OpenAI;
        const configuration = new Configuration({
          apiKey: process.env.OPENAI_API_KEY,
        });
        this.clients.set('openai', new OpenAIApi(configuration));
      } else if (OpenAI && OpenAI.apiKey) {
        // Older version
        OpenAI.apiKey = process.env.OPENAI_API_KEY;
        this.clients.set('openai', OpenAI);
      } else {
        // Assume it's the client directly
        this.clients.set('openai', new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));
      }
      
      this.logger.info('OpenAI client initialized');
    } catch (error) {
      this.logger.error(`Failed to initialize OpenAI client: ${error.message}`);
      this.initializeMockClient();
    }
  }

  async initializeLMStudioClient() {
    try {
      // Check if we can import openai
      let OpenAI;
      try {
        const openaiModule = await import('openai');
        OpenAI = openaiModule.OpenAIApi || openaiModule.default || openaiModule;
      } catch (e) {
        this.logger.warn('Could not import openai package, using mock client');
        this.initializeMockClient();
        return;
      }
      
      // Check if it's the new or old API
      if (OpenAI && OpenAI.Configuration) {
        // Newer version
        const { Configuration, OpenAIApi } = OpenAI;
        const configuration = new Configuration({
          basePath: this.modelConfig.basePath || 'http://localhost:1234/v1',
          apiKey: 'not-needed', // LM Studio doesn't require an API key
        });
        this.clients.set('lmstudio', new OpenAIApi(configuration));
      } else if (OpenAI && OpenAI.apiKey) {
        // Older version
        OpenAI.apiKey = 'not-needed';
        OpenAI.basePath = this.modelConfig.basePath || 'http://localhost:1234/v1';
        this.clients.set('lmstudio', OpenAI);
      } else {
        // Assume it's the client directly
        this.clients.set('lmstudio', new OpenAI({
          basePath: this.modelConfig.basePath || 'http://localhost:1234/v1',
          apiKey: 'not-needed'
        }));
      }
      
      this.logger.info('LM Studio client initialized');
    } catch (error) {
      this.logger.error(`Failed to initialize LM Studio client: ${error.message}`);
      this.initializeMockClient();
    }
  }

  async initializeOllamaClient() {
    try {
      // Check if we can import openai
      let OpenAI;
      try {
        const openaiModule = await import('openai');
        OpenAI = openaiModule.OpenAIApi || openaiModule.default || openaiModule;
      } catch (e) {
        this.logger.warn('Could not import openai package, using mock client');
        this.initializeMockClient();
        return;
      }
      
      // Check if it's the new or old API
      if (OpenAI && OpenAI.Configuration) {
        // Newer version
        const { Configuration, OpenAIApi } = OpenAI;
        const configuration = new Configuration({
          basePath: this.modelConfig.basePath || 'http://localhost:11434/v1',
          apiKey: 'not-needed', // Ollama doesn't require an API key
        });
        this.clients.set('ollama', new OpenAIApi(configuration));
      } else if (OpenAI && OpenAI.apiKey) {
        // Older version
        OpenAI.apiKey = 'not-needed';
        OpenAI.basePath = this.modelConfig.basePath || 'http://localhost:11434/v1';
        this.clients.set('ollama', OpenAI);
      } else {
        // Assume it's the client directly
        this.clients.set('ollama', new OpenAI({
          basePath: this.modelConfig.basePath || 'http://localhost:11434/v1',
          apiKey: 'not-needed'
        }));
      }
      
      this.logger.info('Ollama client initialized');
    } catch (error) {
      this.logger.error(`Failed to initialize Ollama client: ${error.message}`);
      this.initializeMockClient();
    }
  }

  async initializeVSCodeClient() {
    // VS Code agent will use either LM Studio or Ollama backend depending on availability
    // For now, we'll try LM Studio first, then Ollama
    try {
      await this.initializeLMStudioClient();
      this.logger.info('VS Code agent configured to use LM Studio backend');
    } catch (lmStudioError) {
      try {
        await this.initializeOllamaClient();
        this.logger.info('VS Code agent configured to use Ollama backend');
      } catch (ollamaError) {
        this.logger.error(`Failed to initialize VS Code agent backends: LM Studio: ${lmStudioError.message}, Ollama: ${ollamaError.message}`);
        this.initializeMockClient();
      }
    }
  }

  initializeMockClient() {
    // Mock client for development/testing when no real API is available
    this.clients.set('mock', {
      createChatCompletion: async () => ({
        data: {
          choices: [{
            message: {
              content: "// Mock AI response\nconsole.log('This is a mock response from the AI agent');\n// In a real implementation, this would be generated by a local LLM\n"
            }
          }]
        }
      })
    });
    this.logger.info('Using mock model client');
  }

  async generateCompletion(prompt) {
    let client;
    let providerUsed = this.provider;
    
    // Determine which client to use
    if (this.provider === 'openai') {
      client = this.clients.get('openai');
    } else if (this.provider === 'lmstudio') {
      client = this.clients.get('lmstudio');
    } else if (this.provider === 'ollama') {
      client = this.clients.get('ollama');
    } else if (this.provider === 'vscode') {
      // VS Code agent uses whatever backend was initialized (LM Studio or Ollama)
      client = this.clients.get('lmstudio') || this.clients.get('ollama');
      providerUsed = client ? (this.clients.get('lmstudio') ? 'lmstudio' : 'ollama') : 'mock';
    } else {
      client = this.clients.get('mock');
      providerUsed = 'mock';
    }
    
    if (!client) {
      this.logger.warn(`No client found for ${this.provider}, using mock client`);
      client = this.clients.get('mock');
      providerUsed = 'mock';
    }
    
    try {
      const response = await client.createChatCompletion({
        model: this.modelConfig.model || 
               (this.provider === 'openai' ? 'gpt-3.5-turbo' :
                this.provider === 'lmstudio' ? this.modelConfig.model || 'lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF' :
                this.provider === 'ollama' ? this.modelConfig.model || 'codellama:7b-instruct' :
                'mock-model'),
        messages: [{ role: 'user', content: prompt }],
        temperature: this.modelConfig.temperature || 0.7,
        max_tokens: this.modelConfig.maxTokens || 2000
      });
      
      this.logger.info(`Generated completion using ${providerUsed} provider`);
      return response.data.choices[0].message.content;
    } catch (error) {
      this.logger.error(`Error generating completion with ${this.provider}: ${error.message}`);
      
      // Fallback to mock client if real client fails
      if (providerUsed !== 'mock') {
        this.logger.info('Falling back to mock client');
        const mockClient = this.clients.get('mock');
        if (mockClient) {
          try {
            const response = await mockClient.createChatCompletion({
              model: 'mock-model',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.7,
              max_tokens: 2000
            });
            return response.data.choices[0].message.content;
          } catch (mockError) {
            this.logger.error(`Mock client also failed: ${mockError.message}`);
          }
        }
      }
      
      throw error;
    }
  }
}
