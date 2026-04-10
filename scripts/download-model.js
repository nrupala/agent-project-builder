#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import axios from 'axios';

const pump = promisify(pipeline);

const MODELS_DIR = path.resolve('models');
const DEFAULT_MODEL = {
  name: 'tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
  url: 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf?download=true',
  description: 'TinyLlama 1.1B Chat - Small, fast model suitable for testing'
};

async function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

async function downloadFile(url, filepath) {
  console.log(`Downloading ${path.basename(filepath)}...`);
  console.log(`From: ${url}`);
  
  const writer = fs.createWriteStream(filepath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
    followRedirect: true,
    maxRedirects: 5
  });

  await pump(response.data, writer);
  console.log(`Download completed: ${filepath}`);
}

async function main() {
  console.log('=== Agent Project Builder - Model Downloader ===\n');
  
  // Ensure models directory exists
  await ensureDirectory(MODELS_DIR);
  
  const modelPath = path.join(MODELS_DIR, DEFAULT_MODEL.name);
  
  // Check if model already exists
  if (fs.existsSync(modelPath)) {
    console.log(`Model already exists: ${modelPath}`);
    const stats = fs.statSync(modelPath);
    console.log(`Size: ${(stats.size / (1024*1024)).toFixed(2)} MB`);
    return;
  }
  
  // Ask user for confirmation
  console.log(`Model not found locally.`);
  console.log(`Model: ${DEFAULT_MODEL.name}`);
  console.log(`Description: ${DEFAULT_MODEL.description}`);
  console.log(`Size: ~4.5 GB (Q4 quantized)`);
  console.log(`Location: ${MODELS_DIR}\n`);
  
  // For automation, we'll proceed with download
  // In interactive mode, we would ask for confirmation
  try {
    await downloadFile(DEFAULT_MODEL.url, modelPath);
    console.log('\n=== Download Complete ===');
    console.log(`Model saved to: ${modelPath}`);
    console.log('\nTo use this model with Agent Project Builder:');
    console.log('1. Set LOCAL_MODEL_PATH in .env file');
    console.log(`   LOCAL_MODEL_PATH=${modelPath}`);
    console.log('2. Set MODEL_PROVIDER=local');
    console.log('3. Run: node src/index.js "your request" --local-only');
  } catch (error) {
    console.error('Download failed:', error.message);
    // Clean up partial download
    if (fs.existsSync(modelPath)) {
      fs.unlinkSync(modelPath);
    }
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});