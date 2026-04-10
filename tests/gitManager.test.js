import { jest } from '@jest/globals';
import { GitManager } from '../src/gitManager.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

describe('GitManager', () => {
  let gm;
  let testDir;

  beforeEach(() => {
    gm = new GitManager();
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apb-git-test-'));
    process.chdir(testDir);
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  test('should initialize git repo in empty directory', async () => {
    await gm.initRepoIfNeeded();
    expect(fs.existsSync(path.join(testDir, '.git'))).toBe(true);
  });

  test('should not reinitialize existing git repo', async () => {
    await gm.initRepoIfNeeded();
    await gm.initRepoIfNeeded();
    expect(fs.existsSync(path.join(testDir, '.git'))).toBe(true);
  });

  test('should commit changes', async () => {
    await gm.initRepoIfNeeded();
    fs.writeFileSync(path.join(testDir, 'test.txt'), 'hello');
    await gm.commitChanges('test commit');
    const status = execSync('git log --oneline', { cwd: testDir, encoding: 'utf8' });
    expect(status).toContain('test commit');
  });

  test('should handle no changes to commit', async () => {
    await gm.initRepoIfNeeded();
    await gm.commitChanges('nothing to commit');
  });

  test('should get current branch', async () => {
    await gm.initRepoIfNeeded();
    fs.writeFileSync(path.join(testDir, 'init.txt'), 'init');
    await gm.commitChanges('initial');
    const branch = await gm.getCurrentBranch();
    expect(typeof branch).toBe('string');
    expect(branch.length).toBeGreaterThan(0);
  });
});
