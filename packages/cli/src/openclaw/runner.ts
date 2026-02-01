import { spawn } from 'node:child_process';
import type { OpenClawRunResult } from '../types/index.js';
import { findOpenClawPath } from './detection.js';
import { createPathOverride, cleanupPathOverride, buildEnvWithOverride, type PathOverride } from './path-override.js';

export interface RunOptions {
  deep?: boolean;
  fix?: boolean;
  customPath?: string;
  timeout?: number;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Runs `openclaw security audit` command.
 */
export async function runOpenClawAudit(options: RunOptions = {}): Promise<OpenClawRunResult> {
  const { deep = false, fix = false, customPath, timeout = DEFAULT_TIMEOUT } = options;

  const openclawPath = findOpenClawPath();
  if (!openclawPath) {
    return {
      success: false,
      stdout: '',
      stderr: 'OpenClaw CLI not found in PATH or node_modules',
      exitCode: null,
    };
  }

  // Build command arguments
  const args = ['security', 'audit', '--no-color'];
  if (deep) {
    args.push('--deep');
  }
  if (fix) {
    args.push('--fix');
  }

  // Set up path override if custom path specified
  let pathOverride: PathOverride | null = null;
  if (customPath) {
    try {
      pathOverride = createPathOverride(customPath);
    } catch (err) {
      return {
        success: false,
        stdout: '',
        stderr: `Failed to create path override: ${err instanceof Error ? err.message : String(err)}`,
        exitCode: null,
      };
    }
  }

  return new Promise((resolve) => {
    const env = buildEnvWithOverride(pathOverride);

    const proc = spawn(openclawPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env,
      timeout,
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGTERM');
    }, timeout);

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('error', (err) => {
      clearTimeout(timeoutId);
      cleanupPathOverride(pathOverride);
      resolve({
        success: false,
        stdout,
        stderr: stderr || err.message,
        exitCode: null,
      });
    });

    proc.on('close', (code) => {
      clearTimeout(timeoutId);
      cleanupPathOverride(pathOverride);

      if (timedOut) {
        resolve({
          success: false,
          stdout,
          stderr: 'Command timed out',
          exitCode: null,
        });
        return;
      }

      resolve({
        success: code === 0,
        stdout,
        stderr,
        exitCode: code,
      });
    });
  });
}
