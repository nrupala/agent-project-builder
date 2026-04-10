import { Logger } from './logger.js';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const PROTECTED_FILES = [
  'package.json', 'package-lock.json', 'jest.config.js',
  '.gitignore', '.env', 'README.md', 'AGENTS.md'
];
const PROTECTED_DIRS = ['src', 'tests', 'node_modules', 'docs', 'coverage', '.git', '.github'];

export class FileManager {
  constructor(outputDir = null) {
    this.logger = new Logger({ prefix: '[FileManager]' });
    this.outputDir = outputDir;
  }

  getBaseDir() {
    return this.outputDir ? path.resolve(this.outputDir) : process.cwd();
  }

  _isInProjectRoot() {
    if (this.outputDir) return false;
    const cwd = process.cwd();
    return fs.existsSync(path.join(cwd, 'package.json')) && 
           fs.existsSync(path.join(cwd, 'src')) &&
           fs.existsSync(path.join(cwd, 'tests'));
  }

  _isProtected(filePath) {
    if (!this._isInProjectRoot()) return false;

    const resolved = path.resolve(filePath);
    const baseDir = this.getBaseDir();
    const relativePath = path.relative(baseDir, resolved);
    const segments = relativePath.split(path.sep);

    if (segments.length === 1 && PROTECTED_FILES.includes(segments[0])) {
      this.logger.error(`[PROTECT] Blocked write to protected file: ${relativePath}`);
      return true;
    }
    if (segments.length >= 1 && PROTECTED_DIRS.includes(segments[0])) {
      this.logger.error(`[PROTECT] Blocked write to protected dir: ${relativePath}`);
      return true;
    }
    return false;
  }

  async createProjectStructure(structure, basePath = '') {
    this.logger.info(`Creating project structure: ${JSON.stringify(structure)}`);
    
    for (const [dirName, dirContent] of Object.entries(structure)) {
      const dirPath = path.join(this.getBaseDir(), basePath, dirName);
      if (!this._isProtected(dirPath)) {
        await fsPromises.mkdir(dirPath, { recursive: true });
      }
      
      if (typeof dirContent === 'object' && dirContent !== null) {
        await this.createProjectStructure(dirContent, path.join(basePath, dirName));
      }
    }
  }

  async writeFile(filePath, content) {
    if (this._isProtected(filePath)) {
      this.logger.error(`Refusing to overwrite protected file: ${filePath}`);
      return;
    }
    
    const resolvedPath = path.join(this.getBaseDir(), filePath);
    const dirPath = path.dirname(resolvedPath);
    
    await fsPromises.mkdir(dirPath, { recursive: true });
    await fsPromises.writeFile(resolvedPath, content, 'utf8');
  }

  async readFile(filePath) {
    const resolvedPath = path.join(this.getBaseDir(), filePath);
    
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    return await fsPromises.readFile(resolvedPath, 'utf8');
  }

  async editFile(filePath, search, replace) {
    if (this._isProtected(filePath)) {
      this.logger.error(`Refusing to edit protected file: ${filePath}`);
      return;
    }
    
    const resolvedPath = path.join(this.getBaseDir(), filePath);
    
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const content = await fsPromises.readFile(resolvedPath, 'utf8');
    const newContent = content.replace(new RegExp(search, 'g'), replace);
    await fsPromises.writeFile(resolvedPath, newContent, 'utf8');
  }

  async installDependencies(dependencies) {
    if (!dependencies || dependencies.length === 0) {
      this.logger.info('No dependencies to install');
      return;
    }
    
    this.logger.info(`Installing dependencies: ${dependencies.join(', ')} in ${this.getBaseDir()}`);
    
    try {
      await execAsync('npm install', { 
        cwd: this.getBaseDir(),
        env: { ...process.env, npm_config_loglevel: 'error' } 
      });
      this.logger.info('Dependencies installed successfully via npm');
    } catch (npmError) {
      try {
        await execAsync('yarn install', { cwd: this.getBaseDir() });
        this.logger.info('Dependencies installed successfully via yarn');
      } catch (yarnError) {
        this.logger.warn('Failed to install dependencies with npm and yarn');
        throw new Error('Failed to install dependencies');
      }
    }
  }

  async setupConfigFiles(configs) {
    this.logger.info(`Setting up config files: ${Object.keys(configs).join(', ')}`);
    
    for (const [filePath, content] of Object.entries(configs)) {
      await this.writeFile(filePath, content);
    }
  }

  async runTests() {
    this.logger.info('Running tests');
    
    try {
      const { stdout } = await execAsync('npm test', { cwd: this.getBaseDir() });
      this.logger.info(`Tests completed: ${stdout}`);
    } catch (error) {
      this.logger.warn('Test command failed, continuing anyway');
    }
  }

  async runLinter() {
    this.logger.info('Running linter');
    
    try {
      const { stdout } = await execAsync('npm run lint', { cwd: this.getBaseDir() });
      this.logger.info(`Linting completed: ${stdout}`);
    } catch (error) {
      this.logger.warn('Lint command failed, continuing anyway');
    }
  }
}