import { ModelSelector } from '../src/modelSelector.js';

describe('ModelSelector', () => {
  let selector;

  beforeEach(() => {
    selector = new ModelSelector();
  });

  test('should create instance with model registry', () => {
    expect(selector.modelRegistry.size).toBeGreaterThan(0);
    expect(selector.hardwareProfile).toBeNull();
  });

  test('should detect hardware profile', async () => {
    const hardware = await selector.detectHardware();
    expect(hardware).toHaveProperty('totalRamGB');
    expect(hardware).toHaveProperty('cpuCores');
    expect(hardware).toHaveProperty('platform');
    expect(hardware).toHaveProperty('gpu');
    expect(hardware).toHaveProperty('canRunModel');
  });

  test('should cache hardware detection', async () => {
    const hw1 = await selector.detectHardware();
    const hw2 = await selector.detectHardware();
    expect(hw1).toBe(hw2);
  });

  test('should select model for code-generation task', async () => {
    const model = await selector.selectModel('code-generation');
    expect(model).toHaveProperty('id');
    expect(model).toHaveProperty('name');
    expect(model).toHaveProperty('url');
    expect(model).toHaveProperty('vramRequired');
    expect(model).toHaveProperty('willUseGPU');
  });

  test('should select model for general-chat task', async () => {
    const model = await selector.selectModel('general-chat');
    expect(model).toHaveProperty('id');
    expect(model.specialty).toBe('general-chat');
  });

  test('should select model for reasoning task', async () => {
    const model = await selector.selectModel('reasoning');
    expect(model).toHaveProperty('id');
    expect(model.specialty).toBe('reasoning');
  });

  test('should select embedding model', async () => {
    const model = await selector.selectModel('embedding');
    expect(model).toHaveProperty('id');
    expect(model.specialty).toBe('embedding');
  });

  test('should default to code-generation for unknown task', async () => {
    const model = await selector.selectModel('unknown-task');
    expect(model).toBeDefined();
    expect(model.specialty).toBe('code-generation');
  });

  test('should select models for full pipeline', async () => {
    const pipeline = await selector.selectModelsForPipeline();
    expect(pipeline).toHaveProperty('codeGeneration');
    expect(pipeline).toHaveProperty('generalChat');
    expect(pipeline).toHaveProperty('reasoning');
    expect(pipeline).toHaveProperty('embedding');
    expect(pipeline).toHaveProperty('hardwareProfile');
  });
});
