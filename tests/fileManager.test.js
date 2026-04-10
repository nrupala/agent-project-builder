import { FileManager } from '../src/fileManager.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('FileManager', () => {
  let fm;
  let testDir;

  beforeEach(() => {
    fm = new FileManager();
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apb-test-'));
    process.chdir(testDir);
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  test('should create project structure', async () => {
    const structure = { src: {}, tests: {}, docs: {} };
    await fm.createProjectStructure(structure);
    expect(fs.existsSync(path.join(testDir, 'src'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'tests'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'docs'))).toBe(true);
  });

  test('should write file to disk', async () => {
    await fm.writeFile('test.txt', 'hello world');
    const content = fs.readFileSync(path.join(testDir, 'test.txt'), 'utf8');
    expect(content).toBe('hello world');
  });

  test('should read file from disk', async () => {
    fs.writeFileSync(path.join(testDir, 'input.txt'), 'test content');
    const content = await fm.readFile('input.txt');
    expect(content).toBe('test content');
  });

  test('should throw error when reading nonexistent file', async () => {
    await expect(fm.readFile('nonexistent.txt')).rejects.toThrow('File not found');
  });

  test('should edit file content', async () => {
    await fm.writeFile('edit.txt', 'hello world');
    await fm.editFile('edit.txt', 'world', 'universe');
    const content = fs.readFileSync(path.join(testDir, 'edit.txt'), 'utf8');
    expect(content).toBe('hello universe');
  });

  test('should throw error when editing nonexistent file', async () => {
    await expect(fm.editFile('nope.txt', 'a', 'b')).rejects.toThrow('File not found');
  });

  test('should create nested directories', async () => {
    const structure = { src: { components: {}, utils: {} }, tests: {} };
    await fm.createProjectStructure(structure);
    expect(fs.existsSync(path.join(testDir, 'src', 'components'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'src', 'utils'))).toBe(true);
  });

  test('should setup config files', async () => {
    await fm.setupConfigFiles({ '.gitignore': 'node_modules\n', '.env': 'KEY=value\n' });
    expect(fs.existsSync(path.join(testDir, '.gitignore'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, '.env'))).toBe(true);
  });
});
