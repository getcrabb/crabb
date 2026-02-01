import { readFile, readdir, stat, access } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { constants } from 'node:fs';

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function readTextFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return null;
  }
}

export async function readJsonFile<T>(path: string): Promise<T | null> {
  const content = await readTextFile(path);
  if (!content) return null;
  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function getFileStats(path: string) {
  try {
    return await stat(path);
  } catch {
    return null;
  }
}

export async function* walkDirectory(
  dir: string,
  basePath: string = dir
): AsyncGenerator<{ path: string; relativePath: string }> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = relative(basePath, fullPath);

      if (entry.isDirectory()) {
        yield* walkDirectory(fullPath, basePath);
      } else if (entry.isFile()) {
        yield { path: fullPath, relativePath };
      }
    }
  } catch {
    // Directory doesn't exist or not accessible
  }
}

export function matchesPattern(filePath: string, pattern: string): boolean {
  // Simple glob matching
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\{\{GLOBSTAR\}\}/g, '.*');

  return new RegExp(`^${regexPattern}$`).test(filePath);
}

export function matchesAnyPattern(filePath: string, patterns: readonly string[]): boolean {
  return patterns.some(pattern => matchesPattern(filePath, pattern));
}
