import { ModelManager } from '../src/modelManager.js';

describe('ModelManager', () => {
  let manager;

  beforeEach(() => {
    manager = new ModelManager();
  });

  test('should create instance with defaults', () => {
    expect(manager.provider).toBeNull();
    expect(manager.isLocalOnly).toBe(false);
    expect(manager.clients).toBeInstanceOf(Map);
  });

  test('should detect local-only mode from env', async () => {
    process.env.LOCAL_ONLY = 'true';
    await manager.initialize();
    expect(manager.isLocalOnly).toBe(true);
    delete process.env.LOCAL_ONLY;
  });

  test('should detect local-only mode from lmstudio provider', async () => {
    process.env.MODEL_PROVIDER = 'lmstudio';
    await manager.initialize();
    expect(manager.isLocalOnly).toBe(true);
    delete process.env.MODEL_PROVIDER;
  });

  test('should get model config from env for lmstudio', async () => {
    process.env.MODEL_PROVIDER = 'lmstudio';
    process.env.LMSTUDIO_MODEL = 'test-model';
    process.env.LMSTUDIO_ENDPOINT = 'http://localhost:1234/v1';
    const config = await manager.getModelConfigFromEnv();
    expect(config.provider).toBe('lmstudio');
    expect(config.model).toBe('test-model');
    delete process.env.MODEL_PROVIDER;
    delete process.env.LMSTUDIO_MODEL;
    delete process.env.LMSTUDIO_ENDPOINT;
  });

  test('should get model config from env for ollama', async () => {
    process.env.MODEL_PROVIDER = 'ollama';
    process.env.OLLAMA_MODEL = 'llama3';
    const config = await manager.getModelConfigFromEnv();
    expect(config.provider).toBe('ollama');
    expect(config.model).toBe('llama3');
    delete process.env.MODEL_PROVIDER;
    delete process.env.OLLAMA_MODEL;
  });

  test('should get model config from env for openai', async () => {
    process.env.MODEL_PROVIDER = 'openai';
    process.env.OPENAI_MODEL = 'gpt-4';
    const config = await manager.getModelConfigFromEnv();
    expect(config.provider).toBe('openai');
    expect(config.model).toBe('gpt-4');
    delete process.env.MODEL_PROVIDER;
    delete process.env.OPENAI_MODEL;
  });

  test('should use defaults when no env vars set', async () => {
    const config = await manager.getModelConfigFromEnv();
    expect(config.provider).toBe('openai');
    expect(config.temperature).toBe(0.7);
    expect(config.maxTokens).toBe(2000);
  });

  test('should fallback to mock client when provider fails', async () => {
    process.env.MODEL_PROVIDER = 'openai';
    delete process.env.OPENAI_API_KEY;
    await manager.setProvider('openai', { provider: 'openai', model: 'gpt-3.5-turbo' });
    expect(manager.clients.has('mock')).toBe(true);
    delete process.env.MODEL_PROVIDER;
  });
});
