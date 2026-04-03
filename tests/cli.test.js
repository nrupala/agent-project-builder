import { jest } from '@jest/globals';
import { CLI } from '../src/cli.js';

describe('CLI', () => {
  let cli;

  beforeEach(() => {
    cli = new CLI();
    jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should parse --help flag', () => {
    process.argv = ['node', 'index.js', '--help'];
    const result = cli.parseArgs();
    expect(result.help).toBe(true);
  });

  test('should parse --version flag', () => {
    process.argv = ['node', 'index.js', '--version'];
    const result = cli.parseArgs();
    expect(result.version).toBe(true);
  });

  test('should parse --interactive flag', () => {
    process.argv = ['node', 'index.js', '--interactive'];
    const result = cli.parseArgs();
    expect(result.interactive).toBe(true);
  });

  test('should parse --server flag', () => {
    process.argv = ['node', 'index.js', '--server'];
    const result = cli.parseArgs();
    expect(result.server).toBe(true);
  });

  test('should parse --port flag with value', () => {
    process.argv = ['node', 'index.js', '--port', '8080'];
    const result = cli.parseArgs();
    expect(result.port).toBe(8080);
  });

  test('should parse --request flag with value', () => {
    process.argv = ['node', 'index.js', '--request', 'Build a todo app'];
    const result = cli.parseArgs();
    expect(result.request).toBe('Build a todo app');
  });

  test('should parse --model-provider flag', () => {
    process.argv = ['node', 'index.js', '-m', 'lmstudio'];
    const result = cli.parseArgs();
    expect(result.options.modelProvider).toBe('lmstudio');
  });

  test('should parse --agent-type flag', () => {
    process.argv = ['node', 'index.js', '-a', 'vscode-agent'];
    const result = cli.parseArgs();
    expect(result.options.agentType).toBe('vscode-agent');
  });

  test('should parse --local-only flag', () => {
    process.argv = ['node', 'index.js', '--local-only'];
    const result = cli.parseArgs();
    expect(result.options.localOnly).toBe(true);
  });

  test('should parse positional argument as request', () => {
    process.argv = ['node', 'index.js', 'Create a REST API'];
    const result = cli.parseArgs();
    expect(result.request).toBe('Create a REST API');
  });

  test('should parse combined flags', () => {
    process.argv = ['node', 'index.js', '-s', '-p', '5000', '-m', 'ollama'];
    const result = cli.parseArgs();
    expect(result.server).toBe(true);
    expect(result.port).toBe(5000);
    expect(result.options.modelProvider).toBe('ollama');
  });

  test('should show help when --help is passed', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    cli.showHelp();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Agent Project Builder'));
    logSpy.mockRestore();
  });

  test('should show version', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    cli.showVersion();
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
