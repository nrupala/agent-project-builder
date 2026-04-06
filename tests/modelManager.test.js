import { ModelManager } from '../src/modelManager.js';

describe('ModelManager', () => {
  let manager;

  beforeEach(() => {
    process.env.USE_BUILTIN_ENGINE = 'false';
    manager = new ModelManager();
  });

  afterEach(() => {
    delete process.env.USE_BUILTIN_ENGINE;
    delete process.env.MODEL_PROVIDER;
    delete process.env.LOCAL_ONLY;
  });

  test('should create instance with defaults', () => {
    expect(manager.provider).toBeNull();
    expect(manager.isLocalOnly).toBe(false);
    expect(manager.clients).toBeInstanceOf(Map);
    expect(manager.builtInEngine).toBeDefined();
    expect(manager.maxConcurrentRequests).toBe(20);
  });

  test('should detect local-only mode from env', async () => {
    process.env.LOCAL_ONLY = 'true';
    await manager.initialize();
    expect(manager.isLocalOnly).toBe(true);
  });

  test('should detect local-only mode from lmstudio provider', async () => {
    process.env.MODEL_PROVIDER = 'lmstudio';
    await manager.initialize();
    expect(manager.isLocalOnly).toBe(true);
  });

  test('should get model config from env for lmstudio', async () => {
    process.env.MODEL_PROVIDER = 'lmstudio';
    process.env.LMSTUDIO_MODEL = 'test-model';
    process.env.LMSTUDIO_ENDPOINT = 'http://localhost:1234/v1';
    const config = await manager.getModelConfigFromEnv();
    expect(config.provider).toBe('lmstudio');
    expect(config.model).toBe('test-model');
  });

  test('should get model config from env for ollama', async () => {
    process.env.MODEL_PROVIDER = 'ollama';
    process.env.OLLAMA_MODEL = 'llama3';
    const config = await manager.getModelConfigFromEnv();
    expect(config.provider).toBe('ollama');
    expect(config.model).toBe('llama3');
  });

  test('should get model config from env for openai', async () => {
    process.env.MODEL_PROVIDER = 'openai';
    process.env.OPENAI_MODEL = 'gpt-4';
    const config = await manager.getModelConfigFromEnv();
    expect(config.provider).toBe('openai');
    expect(config.model).toBe('gpt-4');
  });

  test('should use defaults when no env vars set', async () => {
    const config = await manager.getModelConfigFromEnv();
    expect(config.provider).toBe('lmstudio');
    expect(config.temperature).toBe(0.7);
    expect(config.maxTokens).toBe(4096);
  });

  test('should fallback to raw-http when openai key is missing', async () => {
    process.env.MODEL_PROVIDER = 'openai';
    delete process.env.OPENAI_API_KEY;
    await manager.setProvider('openai', { provider: 'openai', model: 'gpt-3.5-turbo' });
    expect(manager.clientType).toBe('raw-http');
  });

  test('should have concurrency control', async () => {
    expect(manager.maxConcurrentRequests).toBe(20);
    expect(manager.activeRequests).toBe(0);
    expect(manager.requestQueue).toEqual([]);
  });

  test('should return stats', async () => {
    const stats = manager.getStats();
    expect(stats).toHaveProperty('provider');
    expect(stats).toHaveProperty('clientType');
    expect(stats).toHaveProperty('maxConcurrentRequests');
    expect(stats.maxConcurrentRequests).toBe(20);
  });
});
