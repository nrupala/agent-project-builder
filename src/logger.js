export class Logger {
  constructor({ prefix = '[Logger]', enabled = true, level = 'debug' } = {}) {
    this.prefix = prefix;
    this.enabled = enabled !== false;
    this.level = level;
    this.levelOrder = { debug: 0, info: 1, warn: 2, error: 3 };
  }

  shouldLog(level) {
    return this.enabled && this.levelOrder[level] >= this.levelOrder[this.level];
  }

  info(message) {
    if (this.shouldLog('info')) {
      console.log(`${this.prefix} INFO: ${message}`);
    }
  }

  error(message) {
    if (this.shouldLog('error')) {
      console.error(`${this.prefix} ERROR: ${message}`);
    }
  }

  warn(message) {
    if (this.shouldLog('warn')) {
      console.warn(`${this.prefix} WARN: ${message}`);
    }
  }

  debug(message) {
    if (this.shouldLog('debug')) {
      console.debug(`${this.prefix} DEBUG: ${message}`);
    }
  }
}