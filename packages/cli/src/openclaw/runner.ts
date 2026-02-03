import { spawn } from 'node:child_process';
import type { OpenClawRunResult } from '../types/index.js';
import { findOpenClawPath } from './detection.js';
import { createPathOverride, cleanupPathOverride, buildEnvWithOverride, type PathOverride } from './path-override.js';

export interface RunOptions {
  deep?: boolean;
  fix?: boolean;
  customPath?: string;
  timeout?: number;
  verbose?: boolean;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Patterns that indicate an unknown/unsupported flag.
 */
const UNKNOWN_FLAG_PATTERNS = [
  /unknown option[:\s]+['"]?(--[\w-]+)/i,
  /unrecognized option[:\s]+['"]?(--[\w-]+)/i,
  /invalid option[:\s]+['"]?(--[\w-]+)/i,
  /error[:\s]+unknown flag[:\s]+['"]?(--[\w-]+)/i,
];

/**
 * Parses stderr to find which flag caused the error.
 */
function parseFailedFlag(stderr: string): string | null {
  for (const pattern of UNKNOWN_FLAG_PATTERNS) {
    const match = stderr.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * Checks if OpenClaw output contains valid findings (not an error).
 * Used to interpret exit code 1 as "findings found" vs actual error.
 */
function hasValidFindings(stdout: string): boolean {
  const trimmed = stdout.trim();

  // Check for JSON output with findings
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const json = JSON.parse(trimmed);
      // Check for findings array in various formats
      if (Array.isArray(json) && json.length > 0) return true;
      if (json && typeof json === 'object') {
        if (Array.isArray(json.findings) && json.findings.length > 0) return true;
        if (Array.isArray(json.issues) && json.issues.length > 0) return true;
        // Even empty findings array is valid output (means scan succeeded)
        if ('findings' in json || 'issues' in json || 'score' in json) return true;
      }
    } catch {
      // Not valid JSON, check text patterns
    }
  }

  // Check for text output patterns that indicate successful scan with findings
  const textPatterns = [
    /\[CRITICAL\]/i,
    /\[HIGH\]/i,
    /\[MEDIUM\]/i,
    /\[LOW\]/i,
    /\d+\s+passed.*\d+\s+failed/i,
    /\d+\s+issue[s]?\s+found/i,
    /scan\s+complete/i,
    /audit\s+complete/i,
    /[✓✗✔✘]/,
  ];

  return textPatterns.some(pattern => pattern.test(trimmed));
}

/**
 * Interprets OpenClaw exit code with context from output.
 */
function interpretExitCode(
  code: number | null,
  stdout: string,
  stderr: string
): 'success' | 'findings' | 'error' {
  // Null code means process was killed or errored
  if (code === null) return 'error';

  // Exit code 0 is always success
  if (code === 0) return 'success';

  // Exit code 1 could be "findings found" or actual error
  if (code === 1) {
    // If there's valid output with findings, it's not an error
    if (hasValidFindings(stdout)) return 'findings';

    // If stderr has unknown flag pattern, it's a capability issue (will retry)
    if (parseFailedFlag(stderr)) return 'error';

    // If there's meaningful stdout but no findings, could be success with issues
    if (stdout.trim().length > 10) return 'findings';
  }

  // Other exit codes or no valid output means error
  return 'error';
}

interface ExecuteOptions {
  args: string[];
  env: NodeJS.ProcessEnv;
  timeout: number;
  openclawPath: string;
}

/**
 * Executes openclaw command with given arguments.
 */
function executeAudit(options: ExecuteOptions): Promise<OpenClawRunResult> {
  const { args, env, timeout, openclawPath } = options;

  return new Promise((resolve) => {
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
      resolve({
        success: false,
        stdout,
        stderr: stderr || err.message,
        exitCode: null,
      });
    });

    proc.on('close', (code) => {
      clearTimeout(timeoutId);

      if (timedOut) {
        resolve({
          success: false,
          stdout,
          stderr: 'Command timed out',
          exitCode: null,
        });
        return;
      }

      const interpretation = interpretExitCode(code, stdout, stderr);

      resolve({
        // success means either exit 0 OR exit 1 with valid findings
        success: interpretation === 'success' || interpretation === 'findings',
        stdout,
        stderr,
        exitCode: code,
      });
    });
  });
}

/**
 * Runs `openclaw security audit` command with capability probing and retry.
 */
export async function runOpenClawAudit(options: RunOptions = {}): Promise<OpenClawRunResult> {
  const { deep = false, fix = false, customPath, timeout = DEFAULT_TIMEOUT, verbose = false } = options;

  const openclawPath = findOpenClawPath();
  if (!openclawPath) {
    return {
      success: false,
      stdout: '',
      stderr: 'OpenClaw CLI not found in PATH or node_modules',
      exitCode: null,
    };
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

  // Build base environment
  const baseEnv = buildEnvWithOverride(pathOverride);

  // Track which flags to use (start with all, remove on failure)
  let useNoColor = true;
  let useDeep = deep;

  // First attempt with all requested flags
  const buildArgs = (): string[] => {
    const args = ['security', 'audit'];
    if (useNoColor) args.push('--no-color');
    if (useDeep) args.push('--deep');
    if (fix) args.push('--fix');
    return args;
  };

  // Build env with NO_COLOR fallback support
  const buildEnv = (): NodeJS.ProcessEnv => {
    const env = { ...baseEnv };
    // If --no-color failed, use NO_COLOR env var instead
    if (!useNoColor) {
      env['NO_COLOR'] = '1';
    }
    return env;
  };

  // Execute with retry logic
  let result = await executeAudit({
    args: buildArgs(),
    env: buildEnv(),
    timeout,
    openclawPath,
  });

  // Check for unknown flag errors and retry without the problematic flag
  const maxRetries = 2;
  for (let retry = 0; retry < maxRetries && !result.success; retry++) {
    const failedFlag = parseFailedFlag(result.stderr);

    if (!failedFlag) {
      // Not a flag issue, stop retrying
      break;
    }

    if (verbose) {
      console.error(`[crabb] OpenClaw doesn't support ${failedFlag}, retrying without it`);
    }

    // Remove the failed flag and retry
    if (failedFlag === '--no-color') {
      useNoColor = false;
    } else if (failedFlag === '--deep') {
      useDeep = false;
    } else {
      // Unknown flag we don't handle, stop retrying
      break;
    }

    result = await executeAudit({
      args: buildArgs(),
      env: buildEnv(),
      timeout,
      openclawPath,
    });
  }

  // Cleanup path override
  cleanupPathOverride(pathOverride);

  return result;
}
