import { ConfigManager } from '../src/configManager.js';

describe('ConfigManager', () => {
  let configManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  test('should return default agent config when no file found', async () => {
    const config = await configManager.getAgentConfig('nonexistent');
    expect(config).toBeDefined();
    expect(config.name).toBe('nonexistent');
    expect(config.model).toBeDefined();
    expect(config.behavior).toBeDefined();
  });

  test('should return default config with expected structure', async () => {
    const config = await configManager.getAgentConfig('default');
    expect(config).toHaveProperty('name');
    expect(config).toHaveProperty('model');
    expect(config).toHaveProperty('capabilities');
    expect(config).toHaveProperty('tools');
    expect(config).toHaveProperty('behavior');
    expect(config.behavior).toHaveProperty('autoCommit');
    expect(config.behavior).toHaveProperty('runTests');
    expect(config.behavior).toHaveProperty('maxIterations');
  });

  test('should load configs from config directory', async () => {
    await configManager.loadConfigs();
    expect(configManager.configs).toBeDefined();
  });

  test('should return null for missing model config', () => {
    const config = configManager.getModelConfig('nonexistent');
    expect(config).toBeNull();
  });
});
