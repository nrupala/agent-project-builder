export class Logger {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.level = options.level || 'info';
    this.prefix = options.prefix || '[Agent]';
  }

  info(message) {
    if (this.enabled && this.level !== 'error') {
      console.log(this.prefix + ' INFO: ' + message);
    }
  }

  warn(message) {
    if (this.enabled && (this.level === 'info' || this.level === 'warn')) {
      console.warn(this.prefix + ' WARN: ' + message);
    }
  }

  error(message) {
    if (this.enabled) {
      console.error(this.prefix + ' ERROR: ' + message);
    }
  }

  debug(message) {
    if (this.enabled && this.level === 'debug') {
      console.log(this.prefix + ' DEBUG: ' + message);
    }
  }
}
