import { PromptEngine } from '../src/promptEngine.js';

describe('PromptEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new PromptEngine();
  });

  test('should create analysis prompt with user request', () => {
    const prompt = engine.createAnalysisPrompt('Build a todo app', {});
    expect(prompt).toContain('Build a todo app');
    expect(prompt).toContain('Analyze');
  });

  test('should create planning prompt with analysis data', () => {
    const analysis = { type: 'web app', technology: 'javascript' };
    const prompt = engine.createPlanningPrompt(analysis, {});
    expect(prompt).toContain('project plan');
    expect(prompt).toContain('technology');
  });

  test('should create file generation prompt with file spec', () => {
    const fileSpec = { path: 'src/index.js', type: 'source', description: 'Main entry' };
    const prompt = engine.createFileGenerationPrompt(fileSpec, { projectContext: 'A todo app' });
    expect(prompt).toContain('src/index.js');
    expect(prompt).toContain('source');
    expect(prompt).toContain('A todo app');
  });

  test('should handle empty options gracefully', () => {
    const fileSpec = { path: 'test.js', type: 'source', description: 'Test' };
    const prompt = engine.createFileGenerationPrompt(fileSpec, {});
    expect(prompt).toBeDefined();
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(0);
  });
});
