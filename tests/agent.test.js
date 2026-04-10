import { jest } from '@jest/globals';
import { Agent } from '../src/agent.js';

describe('Agent', () => {
  let agent;
  let mockConfigManager;
  let mockModelManager;
  let mockLogger;
  let mockGitManager;

  beforeEach(() => {
    mockConfigManager = {
      getAgentConfig: jest.fn().mockResolvedValue({
        name: 'test-agent',
        model: { provider: 'mock', model: 'mock-model', temperature: 0.7, maxTokens: 100 },
        behavior: { autoCommit: false, runTests: false, lintBeforeCommit: false, maxIterations: 3 }
      })
    };

    mockModelManager = {
      setProvider: jest.fn().mockResolvedValue(),
      generateCompletion: jest.fn().mockResolvedValue('Mock AI response for testing purposes')
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    mockGitManager = {
      commitChanges: jest.fn().mockResolvedValue()
    };

    agent = new Agent({
      type: 'test-agent',
      modelProvider: 'mock',
      configManager: mockConfigManager,
      modelManager: mockModelManager,
      logger: mockLogger,
      gitManager: mockGitManager
    });
  });

  test('should initialize agent', async () => {
    await agent.initialize();
    expect(mockConfigManager.getAgentConfig).toHaveBeenCalledWith('test-agent');
    expect(mockModelManager.setProvider).toHaveBeenCalledWith('mock', expect.any(Object));
    expect(mockLogger.info).toHaveBeenCalledWith('Agent initialized successfully');
  });

  test('should set callbacks', () => {
    const onProgress = jest.fn();
    const onFileGenerated = jest.fn();
    agent.setCallbacks({ onProgress, onFileGenerated });
    expect(agent.onProgress).toBe(onProgress);
    expect(agent.onFileGenerated).toBe(onFileGenerated);
  });

  test('should emit progress when callback is set', async () => {
    const onProgress = jest.fn();
    agent.setCallbacks({ onProgress });
    await agent.initialize();
    await agent.analyzeRequest('test request');
    expect(onProgress).toHaveBeenCalledWith('analysis', 'Analyzing request...');
  });

  test('should detect javascript technology', () => {
    const analysis = agent.parseAnalysis('This is a node.js javascript project');
    expect(analysis.technology).toBe('javascript');
  });

  test('should detect python technology', () => {
    const analysis = agent.parseAnalysis('This is a python django project');
    expect(analysis.technology).toBe('python');
  });

  test('should detect typescript technology', () => {
    const analysis = agent.parseAnalysis('This is a typescript ts project');
    expect(analysis.technology).toBe('typescript');
  });

  test('should default to javascript for unknown tech', () => {
    const analysis = agent.parseAnalysis('Some random text with no tech keywords');
    expect(analysis.technology).toBe('javascript');
  });

  test('should parse analysis with requirements', () => {
    const response = 'A web app\n- Feature one\n- Feature two\n- Feature three';
    const analysis = agent.parseAnalysis(response);
    expect(analysis.requirements).toContain('- Feature one');
    expect(analysis.requirements).toContain('- Feature two');
    expect(analysis.type).toBe('project');
  });

  test('should return valid plan structure', () => {
    const plan = agent.parsePlan('any response');
    expect(plan).toHaveProperty('name');
    expect(plan).toHaveProperty('files');
    expect(plan).toHaveProperty('structure');
    expect(plan).toHaveProperty('dependencies');
    expect(Array.isArray(plan.files)).toBe(true);
  });

  test('should build project end-to-end with mock', async () => {
    await agent.initialize();
    const result = await agent.buildProject('Create a simple todo app');
    expect(result).toBeDefined();
    expect(result.status).toBe('executed');
    expect(result.plan).toBeDefined();
  });
});
