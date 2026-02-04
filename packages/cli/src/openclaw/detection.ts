import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, delimiter } from 'node:path';
import type { OpenClawInfo } from '../types/index.js';

/**
 * Searches for openclaw CLI in PATH or local node_modules/.bin
 */
export function findOpenClawPath(): string | null {
  // Check local node_modules first
  const localBin = join(process.cwd(), 'node_modules', '.bin', 'openclaw');
  if (existsSync(localBin)) {
    return localBin;
  }

  // Check PATH - try to resolve 'openclaw' command
  const pathDirs = (process.env['PATH'] || '').split(delimiter);
  for (const dir of pathDirs) {
    const candidate = join(dir, 'openclaw');
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Gets OpenClaw version by running `openclaw --version`
 */
export async function getOpenClawVersion(openclawPath: string): Promise<string | null> {
  return new Promise((resolve) => {
    const proc = spawn(openclawPath, ['--version'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 5000,
      env: { ...process.env, NO_COLOR: '1' },
    });

    let stdout = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.on('error', () => {
      resolve(null);
    });

    proc.on('close', (code) => {
      if (code === 0 && stdout.trim()) {
        // Parse version from output like "openclaw v2.1.0" or "2.1.0"
        const match = stdout.trim().match(/v?(\d+\.\d+\.\d+)/);
        resolve(match?.[1] ?? stdout.trim());
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Detects OpenClaw CLI availability and version
 */
export async function detectOpenClaw(): Promise<OpenClawInfo> {
  const path = findOpenClawPath();

  if (!path) {
    return {
      path: null,
      version: null,
      available: false,
    };
  }

  const version = await getOpenClawVersion(path);

  return {
    path,
    version,
    available: true,
  };
}
