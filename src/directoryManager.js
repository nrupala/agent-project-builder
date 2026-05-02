import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class DirectoryManager {
  constructor() {
    this.baseDir = process.cwd();
    this.programDir = path.resolve(__dirname, '..');
    
    this.workspace = this.programDir;
    this.tempDir = path.join(this.programDir, '.temp');
    this.outputDir = path.join(this.programDir, 'generated');
    this.cacheDir = path.join(this.programDir, '.cache');
    this.stateDir = path.join(this.programDir, '.state');
  }

  setBaseDirectory(dir) {
    if (!path.isAbsolute(dir)) {
      dir = path.resolve(this.baseDir, dir);
    }
    this.baseDir = dir;
  }

  setDirectories(config = {}) {
    if (config.workspace) this.workspace = path.resolve(this.baseDir, config.workspace);
    if (config.tempDir) this.tempDir = path.resolve(this.baseDir, config.tempDir);
    if (config.outputDir) this.outputDir = path.resolve(this.baseDir, config.outputDir);
    if (config.cacheDir) this.cacheDir = path.resolve(this.baseDir, config.cacheDir);
    if (config.stateDir) this.stateDir = path.resolve(this.baseDir, config.stateDir);
  }

  ensureDirectories() {
    const dirs = [this.tempDir, this.outputDir, this.cacheDir, this.stateDir];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  getWorkspace() {
    return this.workspace;
  }

  getTempDir() {
    return this.tempDir;
  }

  getOutputDir() {
    return this.outputDir;
  }

  getCacheDir() {
    return this.cacheDir;
  }

  getStateDir() {
    return this.stateDir;
  }

  resolveInWorkspace(relativePath) {
    return path.resolve(this.workspace, relativePath);
  }

  resolveInOutput(relativePath) {
    return path.resolve(this.outputDir, relativePath);
  }

  resolveInTemp(relativePath) {
    return path.resolve(this.tempDir, relativePath);
  }

  resolveInState(relativePath) {
    return path.resolve(this.stateDir, relativePath);
  }

  saveState(agentId, state) {
    const stateFile = path.join(this.stateDir, `${agentId}.json`);
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');
  }

  loadState(agentId) {
    const stateFile = path.join(this.stateDir, `${agentId}.json`);
    if (fs.existsSync(stateFile)) {
      return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    }
    return null;
  }

  clearTemp() {
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  clearState() {
    if (fs.existsSync(this.stateDir)) {
      const files = fs.readdirSync(this.stateDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(this.stateDir, file));
        }
      }
    }
  }
}

export const directoryManager = new DirectoryManager();