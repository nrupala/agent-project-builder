import { jest } from '@jest/globals';
import { AgentOrchestrator } from '../src/agentOrchestrator.js';

describe('AgentOrchestrator', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new AgentOrchestrator();
  });

  test('should initialize without errors', async () => {
    orchestrator.configManager = {
      loadConfigs: jest.fn().mockResolvedValue()
    };
    orchestrator.modelManager = {
      initialize: jest.fn().mockResolvedValue()
    };
    orchestrator.gitManager = {
      initRepoIfNeeded: jest.fn().mockResolvedValue()
    };
    orchestrator.logger = {
      info: jest.fn()
    };

    await orchestrator.initialize();
    expect(orchestrator.configManager.loadConfigs).toHaveBeenCalled();
    expect(orchestrator.modelManager.initialize).toHaveBeenCalled();
    expect(orchestrator.gitManager.initRepoIfNeeded).toHaveBeenCalled();
  });

  test('should have required manager instances', () => {
    expect(orchestrator.configManager).toBeDefined();
    expect(orchestrator.modelManager).toBeDefined();
    expect(orchestrator.logger).toBeDefined();
    expect(orchestrator.gitManager).toBeDefined();
  });
});
