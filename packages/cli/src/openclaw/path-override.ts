import { mkdtempSync, symlinkSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export interface PathOverride {
  tempHome: string;
  originalPath: string;
  cleanup: () => void;
}

/**
 * Creates a temporary HOME directory with .openclaw symlinked to custom path.
 * This allows running openclaw with --path-like behavior.
 */
export function createPathOverride(customOpenclawPath: string): PathOverride {
  const tempHome = mkdtempSync(join(tmpdir(), 'crabb-openclaw-'));
  const symlinkTarget = join(tempHome, '.openclaw');

  symlinkSync(customOpenclawPath, symlinkTarget);

  const cleanup = () => {
    try {
      if (existsSync(tempHome)) {
        rmSync(tempHome, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup errors
    }
  };

  return {
    tempHome,
    originalPath: customOpenclawPath,
    cleanup,
  };
}

/**
 * Cleans up path override resources.
 */
export function cleanupPathOverride(override: PathOverride | null): void {
  if (override) {
    override.cleanup();
  }
}

/**
 * Builds environment variables for running openclaw with custom path.
 */
export function buildEnvWithOverride(override: PathOverride | null): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, NO_COLOR: '1' };

  if (override) {
    env['HOME'] = override.tempHome;
  }

  return env;
}
