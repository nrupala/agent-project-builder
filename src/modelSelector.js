import os from 'os';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const LM_STUDIO_PATH = 'C:\\Users\\HomeUser\\.lmstudio\\models';
const LOCAL_MODELS_PATH = process.cwd() + '\\models';

export class ModelSelector {
  constructor() {
    this.hardwareProfile = null;
    this.modelRegistry = new Map();
    this.localModelPaths = [
      { path: LM_STUDIO_PATH, name: 'LM Studio' },
      { path: LOCAL_MODELS_PATH, name: 'Local' }
    ];
    this._buildModelRegistry();
  }

  findLocalModel(nameOrPath) {
    for (const dir of this.localModelPaths) {
      if (!fs.existsSync(dir.path)) continue;
      const files = fs.readdirSync(dir.path, { recursive: true });
      for (const f of files) {
        if (String(f).toLowerCase().includes(nameOrPath.toLowerCase()) && String(f).endsWith('.gguf')) {
          return path.join(dir.path, String(f));
        }
      }
    }
    return null;
  }

  _buildModelRegistry() {
    const lmStudioPath = 'C:\\Users\\HomeUser\\.lmstudio\\models';
    
    const localModels = [
      { id: 'qwen2.5-coder-14b', name: 'Qwen2.5 Coder 14B', path: 'lmstudio-community\\Qwen2.5-Coder-14B-Instruct-GGUF\\Qwen2.5-Coder-14B-Instruct-Q3_K_L.gguf', params: '14B', vramRequired: 8, quality: 'high', specialty: 'code-generation' },
      { id: 'qwen2.5-coder-7b', name: 'Qwen2.5 Coder 7B', path: 'Qwen\\Qwen2.5-Coder-7B-Instruct-GGUF\\qwen2.5-coder-7b-instruct-q4_k_m.gguf', params: '7B', vramRequired: 5, quality: 'high', specialty: 'code-generation' },
      { id: 'rnj-1-instruct', name: 'RNJ-1 Instruct', path: 'lmstudio-community\\rnj-1-instruct-GGUF\\rnj-1-instruct-Q4_K_M.gguf', params: '7B', vramRequired: 5, quality: 'medium', specialty: 'code-generation' },
      { id: 'deepseek-r1-8b', name: 'DeepSeek R1 8B', path: 'lmstudio-community\\DeepSeek-R1-0528-Qwen3-8B-GGUF\\DeepSeek-R1-0528-Qwen3-8B-Q4_K_M.gguf', params: '8B', vramRequired: 6, quality: 'high', specialty: 'reasoning' },
      { id: 'ministral-3b', name: 'Ministral 3B', path: 'lmstudio-community\\Ministral-3-3B-Instruct-2512-GGUF\\Ministral-3-3B-Instruct-2512-Q4_K_M.gguf', params: '3B', vramRequired: 3, quality: 'medium', specialty: 'general-chat' },
      { id: 'qwen3-coder-next', name: 'Qwen3 Coder Next', path: 'bartowski\\Qwen_Qwen3-Coder-Next-GGUF\\Qwen_Qwen3-Coder-Next-imatrix.gguf', params: '14B', vramRequired: 8, quality: 'high', specialty: 'code-generation' }
    ];

    this.modelRegistry.set('local', localModels);
    this.modelRegistry.set('code-generation', [
      {
        id: 'qwen2.5-coder-7b-instruct',
        name: 'Qwen2.5 Coder 7B Instruct (lmstudio-community)',
        url: 'https://huggingface.co/lmstudio-community/Qwen2.5-Coder-7B-Instruct-GGUF/resolve/main/Qwen2.5-Coder-7B-Instruct-Q4_K_M.gguf',
        filename: 'Qwen2.5-Coder-7B-Instruct-Q4_K_M.gguf',
        quantization: 'Q4_K_M',
        params: '7B',
        vramRequired: 5.5,
        quality: 'high',
        specialty: 'code-generation',
        fallback: 'https://huggingface.co/bartowski/Qwen2.5-Coder-7B-Instruct-GGUF/resolve/main/Qwen2.5-Coder-7B-Instruct-Q4_K_M.gguf'
      },
      {
        id: 'qwen2.5-coder-3b-instruct',
        name: 'Qwen2.5 Coder 3B Instruct (lmstudio-community)',
        url: 'https://huggingface.co/lmstudio-community/Qwen2.5-Coder-3B-Instruct-GGUF/resolve/main/Qwen2.5-Coder-3B-Instruct-Q4_K_M.gguf',
        filename: 'Qwen2.5-Coder-3B-Instruct-Q4_K_M.gguf',
        quantization: 'Q4_K_M',
        params: '3B',
        vramRequired: 2.5,
        quality: 'medium',
        specialty: 'code-generation',
        fallback: 'https://huggingface.co/bartowski/Qwen2.5-Coder-3B-Instruct-GGUF/resolve/main/Qwen2.5-Coder-3B-Instruct-Q4_K_M.gguf'
      },
      {
        id: 'qwen2.5-coder-1.5b-instruct',
        name: 'Qwen2.5 Coder 1.5B Instruct (lmstudio-community)',
        url: 'https://huggingface.co/lmstudio-community/Qwen2.5-Coder-1.5B-Instruct-GGUF/resolve/main/Qwen2.5-Coder-1.5B-Instruct-Q4_K_M.gguf',
        filename: 'Qwen2.5-Coder-1.5B-Instruct-Q4_K_M.gguf',
        quantization: 'Q4_K_M',
        params: '1.5B',
        vramRequired: 1.2,
        quality: 'low',
        specialty: 'code-generation',
        fallback: 'https://huggingface.co/bartowski/Qwen2.5-Coder-1.5B-Instruct-GGUF/resolve/main/Qwen2.5-Coder-1.5B-Instruct-Q4_K_M.gguf'
      },
      {
        id: 'qwen2.5-coder-0.5b-instruct',
        name: 'Qwen2.5 Coder 0.5B Instruct (lmstudio-community)',
        url: 'https://huggingface.co/lmstudio-community/Qwen2.5-Coder-0.5B-Instruct-GGUF/resolve/main/Qwen2.5-Coder-0.5B-Instruct-Q8_0.gguf',
        filename: 'Qwen2.5-Coder-0.5B-Instruct-Q8_0.gguf',
        quantization: 'Q8_0',
        params: '0.5B',
        vramRequired: 0.8,
        quality: 'minimal',
        specialty: 'code-generation',
        fallback: 'https://huggingface.co/bartowski/Qwen2.5-Coder-0.5B-Instruct-GGUF/resolve/main/Qwen2.5-Coder-0.5B-Instruct-Q8_0.gguf'
      }
    ]);

    this.modelRegistry.set('general-chat', [
      {
        id: 'llama-3.2-3b-instruct',
        name: 'Llama 3.2 3B Instruct (lmstudio-community)',
        url: 'https://huggingface.co/lmstudio-community/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf',
        filename: 'Llama-3.2-3B-Instruct-Q4_K_M.gguf',
        quantization: 'Q4_K_M',
        params: '3B',
        vramRequired: 2.5,
        quality: 'medium',
        specialty: 'general-chat',
        fallback: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf'
      },
      {
        id: 'qwen2.5-7b-instruct',
        name: 'Qwen2.5 7B Instruct (lmstudio-community)',
        url: 'https://huggingface.co/lmstudio-community/Qwen2.5-7B-Instruct-GGUF/resolve/main/Qwen2.5-7B-Instruct-Q4_K_M.gguf',
        filename: 'Qwen2.5-7B-Instruct-Q4_K_M.gguf',
        quantization: 'Q4_K_M',
        params: '7B',
        vramRequired: 5.5,
        quality: 'high',
        specialty: 'general-chat',
        fallback: 'https://huggingface.co/bartowski/Qwen2.5-7B-Instruct-GGUF/resolve/main/Qwen2.5-7B-Instruct-Q4_K_M.gguf'
      }
    ]);

    this.modelRegistry.set('reasoning', [
      {
        id: 'qwen2.5-coder-7b-instruct',
        name: 'Qwen2.5 Coder 7B Instruct (lmstudio-community)',
        url: 'https://huggingface.co/lmstudio-community/Qwen2.5-Coder-7B-Instruct-GGUF/resolve/main/Qwen2.5-Coder-7B-Instruct-Q4_K_M.gguf',
        filename: 'Qwen2.5-Coder-7B-Instruct-Q4_K_M.gguf',
        quantization: 'Q4_K_M',
        params: '7B',
        vramRequired: 5.5,
        quality: 'high',
        specialty: 'reasoning',
        fallback: 'https://huggingface.co/bartowski/Qwen2.5-Coder-7B-Instruct-GGUF/resolve/main/Qwen2.5-Coder-7B-Instruct-Q4_K_M.gguf'
      },
      {
        id: 'deepseek-r1-distill-qwen-7b',
        name: 'DeepSeek R1 Distill Qwen 7B (lmstudio-community)',
        url: 'https://huggingface.co/lmstudio-community/DeepSeek-R1-Distill-Qwen-7B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-7B-Q4_K_M.gguf',
        filename: 'DeepSeek-R1-Distill-Qwen-7B-Q4_K_M.gguf',
        quantization: 'Q4_K_M',
        params: '7B',
        vramRequired: 5.5,
        quality: 'high',
        specialty: 'reasoning',
        fallback: 'https://huggingface.co/bartowski/DeepSeek-R1-Distill-Qwen-7B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-7B-Q4_K_M.gguf'
      }
    ]);

    this.modelRegistry.set('embedding', [
      {
        id: 'nomic-embed-text-v1.5',
        name: 'Nomic Embed Text v1.5 (lmstudio-community)',
        url: 'https://huggingface.co/lmstudio-community/nomic-embed-text-v1.5-GGUF/resolve/main/nomic-embed-text-v1.5-Q4_K_M.gguf',
        filename: 'nomic-embed-text-v1.5-Q4_K_M.gguf',
        quantization: 'Q4_K_M',
        params: '137M',
        vramRequired: 0.3,
        quality: 'high',
        specialty: 'embedding',
        fallback: 'https://huggingface.co/nomic-ai/nomic-embed-text-v1.5-GGUF/resolve/main/nomic-embed-text-v1.5.Q4_K_M.gguf'
      }
    ]);
  }

  async detectHardware() {
    if (this.hardwareProfile) return this.hardwareProfile;

    const totalRamGB = os.totalmem() / (1024 * 1024 * 1024);
    const cpuCores = os.cpus().length;
    const platform = os.platform();
    const arch = os.arch();

    let gpuInfo = { available: false, vramGB: 0, type: null };

    try {
      if (platform === 'linux') {
        const nvidiaSmi = execSync('nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits 2>/dev/null', { encoding: 'utf8' }).trim();
        if (nvidiaSmi) {
          const vramValues = nvidiaSmi.split('\n').map(v => parseInt(v.trim()));
          gpuInfo = { available: true, vramGB: Math.round(vramValues.reduce((a, b) => a + b, 0) / 1024), type: 'cuda' };
        }
      } else if (platform === 'darwin') {
        const memOutput = execSync('sysctl -n hw.memsize 2>/dev/null', { encoding: 'utf8' }).trim();
        const unifiedMemoryGB = parseInt(memOutput) / (1024 * 1024 * 1024);
        if (arch === 'arm64') {
          gpuInfo = { available: true, vramGB: Math.round(unifiedMemoryGB * 0.7), type: 'metal' };
        }
      }
    } catch (e) {
      gpuInfo = { available: false, vramGB: 0, type: null };
    }

    this.hardwareProfile = {
      totalRamGB: Math.round(totalRamGB * 10) / 10,
      availableRamGB: Math.round(totalRamGB * 0.7 * 10) / 10,
      cpuCores,
      platform,
      arch,
      gpu: gpuInfo,
      canRunModel: (vramRequired) => {
        if (gpuInfo.available) return gpuInfo.vramGB >= vramRequired;
        return totalRamGB >= vramRequired * 1.5;
      }
    };

    return this.hardwareProfile;
  }

  async selectModel(task = 'code-generation', quality = 'auto') {
    const hardware = await this.detectHardware();
    
    const localModels = this.modelRegistry.get('local') || [];
    if (localModels.length > 0) {
      const lmStudioPath = 'C:\\Users\\HomeUser\\.lmstudio\\models';
      for (const model of localModels) {
        const fullPath = path.join(lmStudioPath, model.path);
        if (fs.existsSync(fullPath)) {
          return { ...model, path: fullPath, local: true, hardwareProfile: hardware };
        }
      }
    }
    
    const models = this.modelRegistry.get(task) || this.modelRegistry.get('code-generation');

    let qualityFilter;
    if (quality === 'auto') {
      if (hardware.gpu.vramGB >= 6) qualityFilter = ['high', 'medium'];
      else if (hardware.gpu.vramGB >= 3 || hardware.totalRamGB >= 8) qualityFilter = ['medium', 'low'];
      else qualityFilter = ['low'];
    } else {
      qualityFilter = [quality];
    }

    for (const q of qualityFilter) {
      for (const model of models) {
        if (model.quality === q && hardware.canRunModel(model.vramRequired)) {
          return {
            ...model,
            hardwareProfile: hardware,
            willUseGPU: hardware.gpu.available && hardware.gpu.vramGB >= model.vramRequired,
            estimatedSpeed: hardware.gpu.available ? 'fast' : 'moderate'
          };
        }
      }
    }

    return {
      ...models[models.length - 1],
      hardwareProfile: hardware,
      willUseGPU: false,
      estimatedSpeed: 'slow',
      warning: 'Hardware is below recommended specs. Performance may be degraded.'
    };
  }

  async selectModelsForPipeline() {
    const hardware = await this.detectHardware();
    return {
      codeGeneration: await this.selectModel('code-generation'),
      generalChat: await this.selectModel('general-chat'),
      reasoning: await this.selectModel('reasoning'),
      embedding: await this.selectModel('embedding'),
      hardwareProfile: hardware
    };
  }
}
