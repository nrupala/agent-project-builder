import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export class FileManager {
  constructor(options = {}) {
    this.outputDir = options.outputDir || 'generated';
    this.logger = {
      info: (msg) => console.log('[FileManager] ' + msg),
      error: (msg) => console.error('[FileManager] ' + msg),
      warn: (msg) => console.warn('[FileManager] ' + msg)
    };
  }

  stripMarkdownFences(content) {
    let cleaned = content;
    
    cleaned = cleaned.replace(/^```[\w]*\n/g, '');
    cleaned = cleaned.replace(/^```$/gm, '');
    cleaned = cleaned.replace(/```$/gm, '');
    cleaned = cleaned.replace(/^```[\w]*$/gm, '');
    
    cleaned = cleaned.trim();
    
    return cleaned;
  }

  extractJson(content) {
    let cleaned = this.stripMarkdownFences(content);
    
    cleaned = cleaned.replace(/\/\/.*$/gm, '');
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
    
    cleaned = cleaned.trim();
    
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let try2 = jsonMatch[0];
        try2 = try2.replace(/\/\/.*$/gm, '');
        try2 = try2.replace(/\/\*[\s\S]*?\*\//g, '');
        try {
          return JSON.parse(try2);
        } catch (e2) {
          this.logger.warn('Could not extract JSON: ' + e2.message);
        }
      }
    }
    return null;
  }

  async createProjectStructure(structure, baseDir) {
    this.logger.info('Creating project structure');
    const root = baseDir || path.resolve(process.cwd(), this.outputDir);

    for (const [dirName, dirContent] of Object.entries(structure)) {
      const dirPath = path.resolve(root, dirName);

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        this.logger.info('Created directory: ' + dirName);
      }

      if (dirContent && typeof dirContent === 'object' && Object.keys(dirContent).length > 0) {
        await this._createSubDirs(dirContent, dirPath);
      }
    }
  }

  async _createSubDirs(structure, parentDir) {
    for (const [dirName, dirContent] of Object.entries(structure)) {
      const dirPath = path.resolve(parentDir, dirName);

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        this.logger.info('Created directory: ' + path.relative(process.cwd(), dirPath));
      }

      if (dirContent && typeof dirContent === 'object' && Object.keys(dirContent).length > 0) {
        await this._createSubDirs(dirContent, dirPath);
      }
    }
  }

  async writeFile(filePath, content) {
    this.logger.info('Writing file: ' + filePath);

    const fullPath = path.resolve(process.cwd(), this.outputDir, filePath);

    const dirPath = path.dirname(fullPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    let cleanedContent = content;
    if (filePath.endsWith('.json')) {
      const json = this.extractJson(content);
      if (json) {
        cleanedContent = JSON.stringify(json, null, 2);
      }
    } else {
      cleanedContent = this.stripMarkdownFences(content);
    }

    fs.writeFileSync(fullPath, cleanedContent, 'utf8');
    this.logger.info('File written: ' + filePath);
  }

  async readFile(filePath, useOutputDir = true) {
    this.logger.info('Reading file: ' + filePath);

    const basePath = useOutputDir ? path.resolve(process.cwd(), this.outputDir) : process.cwd();
    const fullPath = path.resolve(basePath, filePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error('File not found: ' + filePath);
    }

    return fs.readFileSync(fullPath, 'utf8');
  }

  async editFile(filePath, oldString, newString) {
    this.logger.info('Editing file: ' + filePath);

    const fullPath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error('File not found: ' + filePath);
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    if (content.includes(oldString)) {
      content = content.replace(oldString, newString);
      fs.writeFileSync(fullPath, content, 'utf8');
      this.logger.info('File edited: ' + filePath);
    } else {
      this.logger.warn('String not found in file: ' + filePath);
      throw new Error('String not found in file: ' + filePath);
    }
  }

  async installDependencies(dependencies, projectDir = null) {
    if (!dependencies || dependencies.length === 0) {
      this.logger.info('No dependencies to install');
      return;
    }

    const targetDir = projectDir || path.resolve(process.cwd(), this.outputDir);
    this.logger.info('Installing dependencies in ' + targetDir + ': ' + dependencies.join(', '));

    try {
      const packageJsonPath = path.resolve(targetDir, 'package.json');
      let packageJson = {};

      if (fs.existsSync(packageJsonPath)) {
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      }

      if (!packageJson.dependencies) {
        packageJson.dependencies = {};
      }

      for (const dep of dependencies) {
        const parts = dep.split('@');
        packageJson.dependencies[parts[0]] = parts[1] || 'latest';
      }

      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');

      execSync('npm install', { stdio: 'inherit', cwd: targetDir });

      this.logger.info('Dependencies installed successfully');
    } catch (error) {
      this.logger.error('Failed to install dependencies: ' + error.message);
      throw error;
    }
  }

  async setupConfigFiles(configs) {
    this.logger.info('Setting up configuration files');

    for (const [fileName, content] of Object.entries(configs)) {
      await this.writeFile(fileName, content);
    }
  }

  async runTests(projectDir = null) {
    const targetDir = projectDir || path.resolve(process.cwd(), this.outputDir);
    this.logger.info('Running tests in ' + targetDir);

    try {
      const packageJsonPath = path.resolve(targetDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        if (packageJson.scripts && packageJson.scripts.test) {
          execSync('npm test', { stdio: 'inherit', cwd: targetDir });
          this.logger.info('Tests completed');
          return;
        }
      }

      execSync('npx jest', { stdio: 'inherit', cwd: targetDir });
      this.logger.info('Tests completed with Jest');
    } catch (error) {
      this.logger.warn('Tests failed or test runner not found: ' + error.message);
    }
  }

  async runLinter(projectDir = null) {
    const targetDir = projectDir || path.resolve(process.cwd(), this.outputDir);
    this.logger.info('Running linter in ' + targetDir);

    try {
      const packageJsonPath = path.resolve(targetDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        if (packageJson.scripts && packageJson.scripts.lint) {
          execSync('npm run lint', { stdio: 'inherit', cwd: targetDir });
          this.logger.info('Linting completed');
          return;
        }
      }

      execSync('npx eslint src/', { stdio: 'inherit', cwd: targetDir });
      this.logger.info('Linting completed with ESLint');
    } catch (error) {
      this.logger.warn('Linting failed or linter not found: ' + error.message);
    }
  }
}
