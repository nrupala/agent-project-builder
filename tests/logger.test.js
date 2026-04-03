import { jest } from '@jest/globals';
import { Logger } from '../src/logger.js';

describe('Logger', () => {
  let consoleLog;
  let consoleWarn;
  let consoleError;

  beforeEach(() => {
    consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLog.mockRestore();
    consoleWarn.mockRestore();
    consoleError.mockRestore();
  });

  test('should log info messages by default', () => {
    const logger = new Logger();
    logger.info('test message');
    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('test message'));
  });

  test('should log warning messages', () => {
    const logger = new Logger();
    logger.warn('warning message');
    expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('warning message'));
  });

  test('should log error messages', () => {
    const logger = new Logger();
    logger.error('error message');
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('error message'));
  });

  test('should respect custom prefix', () => {
    const logger = new Logger({ prefix: '[Custom]' });
    logger.info('test');
    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('[Custom]'));
  });

  test('should not log when disabled', () => {
    const logger = new Logger({ enabled: false });
    logger.info('test');
    logger.warn('test');
    logger.error('test');
    expect(consoleLog).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });

  test('should filter by log level error', () => {
    const logger = new Logger({ level: 'error' });
    logger.info('info');
    logger.warn('warn');
    logger.error('error');
    expect(consoleLog).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();
  });
});
