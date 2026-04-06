import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export class GitManager {
  constructor() {
    this.logger = {
      info: (msg) => console.log('[GitManager] ' + msg),
      error: (msg) => console.error('[GitManager] ' + msg)
    };
  }

  async initRepoIfNeeded() {
    try {
      execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
      this.logger.info('Git repository already initialized');
    } catch (error) {
      try {
        execSync('git init', { stdio: 'ignore' });
        execSync('git config user.name "OpenCode Agent"', { stdio: 'ignore' });
        execSync('git config user.email "agent@opencode.ai"', { stdio: 'ignore' });
        this.logger.info('Git repository initialized');
        await this.commitInitial();
      } catch (initError) {
        this.logger.error('Failed to initialize git repository: ' + initError.message);
      }
    }
  }

  async commitInitial() {
    try {
      execSync('git add .', { stdio: 'ignore' });
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        execSync('git commit -m "Initial commit by OpenCode Agent"', { stdio: 'ignore' });
        this.logger.info('Initial commit created');
      } else {
        this.logger.info('No files to commit initially');
      }
    } catch (error) {
      this.logger.error('Failed to create initial commit: ' + error.message);
    }
  }

  async commitChanges(message) {
    try {
      execSync('git add .', { stdio: 'ignore' });
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        execSync('git commit -m "' + message + '"', { stdio: 'ignore' });
        this.logger.info('Changes committed: ' + message);
      } else {
        this.logger.info('No changes to commit');
      }
    } catch (error) {
      this.logger.error('Failed to commit changes: ' + error.message);
      throw error;
    }
  }

  async getCurrentBranch() {
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' });
      return branch.trim();
    } catch (error) {
      this.logger.error('Failed to get current branch: ' + error.message);
      return 'main';
    }
  }

  async pushToRemote(remote = 'origin', branch = null) {
    try {
      const targetBranch = branch || await this.getCurrentBranch();
      execSync('git push ' + remote + ' ' + targetBranch, { stdio: 'ignore' });
      this.logger.info('Pushed to ' + remote + '/' + targetBranch);
    } catch (error) {
      this.logger.error('Failed to push to remote: ' + error.message);
      throw error;
    }
  }
}
