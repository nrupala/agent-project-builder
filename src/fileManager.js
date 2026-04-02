import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export class FileManager {
  constructor() {
    this.logger = {
      info: (msg) => console.log(`[FileManager] ${msg}`),
      error: (msg) => console.error(`[FileManager] ${msg}`),
      warn: (msg) => console.warn(`[FileManager] ${msg}`)
    };
  }

  async createProjectStructure(structure) {
    this.logger.info('Creating project structure');
    
    for (const [dirName, dirContent] of Object.entries(structure)) {
      const dirPath = path.resolve(process.cwd(), dirName);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        this.logger.info(`Created directory: ${dirName}`);
      }
      
      // Recursively create subdirectories
      if (dirContent && typeof dirContent === 'object') {
        await this.createProjectStructure(dirContent);
      }
    }
  }

  async writeFile(filePath, content) {
    this.logger.info(`Writing file: ${filePath}`);
    
    const fullPath = path.resolve(process.cwd(), filePath);
    
    // Ensure directory exists
    const dirPath = path.dirname(fullPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(fullPath, content, 'utf8');
    this.logger.info(`File written: ${filePath}`);
  }

  async readFile(filePath) {
    this.logger.info(`Reading file: ${filePath}`);
    
    const fullPath = path.resolve(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    return fs.readFileSync(fullPath, 'utf8');
  }

  async editFile(filePath, oldString, newString) {
    this.logger.info(`Editing file: ${filePath}`);
    
    const fullPath = path.resolve(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    if (content.includes(oldString)) {
      content = content.replace(oldString, newString);
      fs.writeFileSync(fullPath, content, 'utf8');
      this.logger.info(`File edited: ${filePath}`);
    } else {
      this.logger.warn(`String not found in file: ${filePath}`);
      throw new Error(`String not found in file: ${filePath}`);
    }
  }

  async installDependencies(dependencies) {
    if (!dependencies || dependencies.length === 0) {
      this.logger.info('No dependencies to install');
      return;
    }
    
    this.logger.info(`Installing dependencies: ${dependencies.join(', ')}`);
    
    try {
      // Check if package.json exists
      const packageJsonPath = path.resolve(process.cwd(), 'package.json');
      let packageJson = {};
      
      if (fs.existsSync(packageJsonPath)) {
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      }
      
      // Add dependencies to package.json
      if (!packageJson.dependencies) {
        packageJson.dependencies = {};
      }
      
      for (const dep of dependencies) {
        // Assuming format is "package@version" or just "package"
        const [name, version] = dep.split('@');
        packageJson.dependencies[name] = version || 'latest';
      }
      
      // Write updated package.json
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
      
      // Install dependencies
      execSync('npm install', { stdio: 'inherit' });
      
      this.logger.info('Dependencies installed successfully');
    } catch (error) {
      this.logger.error(`Failed to install dependencies: ${error.message}`);
      throw error;
    }
  }

  async setupConfigFiles(configs) {
    this.logger.info('Setting up configuration files');
    
    for (const [fileName, content] of Object.entries(configs)) {
      await this.writeFile(fileName, content);
    }
  }

  async runTests() {
    this.logger.info('Running tests');
    
    try {
      // Check if test script exists in package.json
      const packageJsonPath = path.resolve(process.cwd(), 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        if (packageJson.scripts && packageJson.scripts.test) {
          execSync('npm test', { stdio: 'inherit' });
          this.logger.info('Tests completed');
          return;
        }
      }
      
      // Fallback to trying jest directly
      execSync('npx jest', { stdio: 'inherit' });
      this.logger.info('Tests completed with Jest');
    } catch (error) {
      this.logger.warn(`Tests failed or test runner not found: ${error.message}`);
      // Don't throw error - tests failing shouldn't stop the process
    }
  }

  async runLinter() {
    this.logger.info('Running linter');
    
    try {
      // Check if lint script exists in package.json
      const packageJsonPath = path.resolve(process.cwd(), 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        if (packageJson.scripts && packageJson.scripts.lint) {
          execSync('npm run lint', { stdio: 'inherit' });
          this.logger.info('Linting completed');
          return;
        }
      }
      
      // Fallback to trying eslint directly
      execSync('npx eslint src/', { stdio: 'inherit' });
      this.logger.info('Linting completed with ESLint');
    } catch (error) {
      this.logger.warn(`Linting failed or linter not found: ${error.message}`);
      // Don't throw error - linting issues shouldn't stop the process
    }
  }
}
