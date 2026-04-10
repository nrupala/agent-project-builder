import { Logger } from './logger.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { promises as fs } from 'fs';

const execAsync = promisify(exec);

export class GitManager {
  constructor() {
    this.logger = new Logger({ prefix: '[GitManager]' });
  }

  async initRepoIfNeeded() {
    const gitDir = '.git';
    
    if (existsSync(gitDir)) {
      this.logger.info('Git repository already exists');
      return;
    }
    
    try {
      await execAsync('git init');
      await execAsync('git config user.name "Agent Project Builder"');
      await execAsync('git config user.email "agent@example.com"');
      this.logger.info('Initialized git repository');
    } catch (error) {
      this.logger.error(`Failed to initialize git repository: ${error.message}`);
      // Don't fail initialization if git setup fails
    }
  }

  async commitChanges(message) {
    this.logger.info(`Committing changes: ${message}`);
    
    try {
      // Check if there are changes to commit
      const { stdout: statusOutput } = await execAsync('git status --porcelain');
      
      if (!statusOutput.trim()) {
        this.logger.info('No changes to commit');
        return;
      }
      
      // Add all changes
      await execAsync('git add .');
      
      // Commit changes
      await execAsync(`git commit -m "${message}"`);
      
      this.logger.info('Changes committed successfully');
    } catch (error) {
      this.logger.error(`Failed to commit changes: ${error.message}`);
      throw error;
    }
  }

  async getCurrentBranch() {
    try {
      const { stdout } = await execAsync('git branch --show-current');
      return stdout.trim() || 'main';
    } catch (error) {
      this.logger.warn('Could not determine current branch');
      return 'main';
    }
  }
}