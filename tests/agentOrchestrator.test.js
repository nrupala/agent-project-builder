import { AgentOrchestrator } from '../src/agentOrchestrator.js';

describe('AgentOrchestrator', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new AgentOrchestrator();
  });

  test('should initialize without errors', async () => {
    // Mock the initialization methods
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
});
