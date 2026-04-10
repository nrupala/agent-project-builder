import { getLlama, LlamaChatSession } from 'node-llama-cpp';
import { Logger } from './logger.js';
import fs from 'fs';
import path from 'path';

export class LocalModelProvider {
  constructor(config) {
    this.logger = new Logger({ prefix: '[LocalProvider]' });
    this.modelPath = config.modelPath;
    this.modelName = config.modelName || path.basename(config.modelPath);
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 2000;
    this.contextSize = config.contextSize || 4096;
    this.gpuLayers = config.gpuLayers ?? -1;
    
    this.llama = null;
    this.model = null;
    this.context = null;
    this.session = null;
  }

  async initialize() {
    if (!fs.existsSync(this.modelPath)) {
      throw new Error(`Model file not found: ${this.modelPath}`);
    }

    this.logger.info(`Loading local model: ${this.modelName}`);
    this.logger.info(`Model path: ${this.modelPath}`);
    
    this.llama = await getLlama({
      gpuLayers: this.gpuLayers
    });
    
    this.model = await this.llama.loadModel({
      modelPath: this.modelPath,
      contextSize: this.contextSize
    });
    
    this.context = await this.model.createContext();
    this.session = new LlamaChatSession({
      contextSequence: this.context.getSequence()
    });
    
    this.logger.info(`Local model loaded successfully: ${this.modelName}`);
  }

  async generateCompletion(prompt) {
    if (!this.session) {
      throw new Error('Local model not initialized. Call initialize() first.');
    }

    this.logger.debug(`Generating completion with local model: ${this.modelName}`);
    
    const response = await this.session.prompt(prompt, {
      temperature: this.temperature,
      maxTokens: this.maxTokens
    });
    
    return response;
  }

  async resetSession() {
    if (this.context) {
      this.context = await this.model.createContext();
      this.session = new LlamaChatSession({
        contextSequence: this.context.getSequence()
      });
    }
  }

  async dispose() {
    if (this.session) {
      this.session.dispose?.();
    }
    if (this.context) {
      this.context.dispose?.();
    }
    if (this.model) {
      this.model.dispose?.();
    }
    if (this.llama) {
      this.llama.dispose?.();
    }
  }
}
