import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { promisify } from 'node:util';

const copyFile = promisify(fs.copyFile);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

export interface BackupResult {
  path: string;
  timestamp: number;
  filesCopied: number;
  errors: string[];
}

/**
 * Patterns for files/directories to backup before fix.
 * These are critical configuration files that --fix might modify.
 */
const BACKUP_PATTERNS = [
  'openclaw.json',
  'credentials',
  'agents',
  'skills',
];

/**
 * Creates a backup of OpenClaw configuration before applying fixes.
 * Copies critical files to a temporary directory.
 */
export async function createBackup(openclawPath: string): Promise<BackupResult> {
  const timestamp = Date.now();
  const backupDir = path.join(os.tmpdir(), `crabb-backup-${timestamp}`);

  const result: BackupResult = {
    path: backupDir,
    timestamp,
    filesCopied: 0,
    errors: [],
  };

  try {
    // Create backup directory
    await mkdir(backupDir, { recursive: true });

    // Copy each pattern
    for (const pattern of BACKUP_PATTERNS) {
      const sourcePath = path.join(openclawPath, pattern);

      try {
        const stats = await stat(sourcePath);

        if (stats.isDirectory()) {
          const count = await copyDirectory(sourcePath, path.join(backupDir, pattern));
          result.filesCopied += count;
        } else if (stats.isFile()) {
          await copyFile(sourcePath, path.join(backupDir, pattern));
          result.filesCopied++;
        }
      } catch (err) {
        // File/directory doesn't exist, skip silently
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
          result.errors.push(`Failed to backup ${pattern}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  } catch (err) {
    result.errors.push(`Failed to create backup directory: ${err instanceof Error ? err.message : String(err)}`);
  }

  return result;
}

/**
 * Recursively copies a directory.
 * Returns the number of files copied.
 */
async function copyDirectory(source: string, dest: string): Promise<number> {
  await mkdir(dest, { recursive: true });

  const entries = await readdir(source, { withFileTypes: true });
  let filesCopied = 0;

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      filesCopied += await copyDirectory(sourcePath, destPath);
    } else if (entry.isFile()) {
      await copyFile(sourcePath, destPath);
      filesCopied++;
    }
  }

  return filesCopied;
}

/**
 * Formats backup result for display.
 */
export function formatBackupInfo(backup: BackupResult): string {
  const lines: string[] = [];

  lines.push(`Backup created at: ${backup.path}`);
  lines.push(`Files backed up: ${backup.filesCopied}`);

  if (backup.errors.length > 0) {
    lines.push(`Warnings: ${backup.errors.length}`);
    for (const error of backup.errors.slice(0, 3)) {
      lines.push(`  - ${error}`);
    }
  }

  lines.push('');
  lines.push(`To restore: cp -r ${backup.path}/* ${path.dirname(backup.path)}`);

  return lines.join('\n');
}

/**
 * Generates restore command for the backup.
 */
export function getRestoreCommand(backup: BackupResult, openclawPath: string): string {
  return `cp -r "${backup.path}"/* "${openclawPath}/"`;
}

/**
 * Cleans up old backup directories (older than 24 hours).
 * Called optionally to prevent accumulation of backups.
 */
export async function cleanupOldBackups(): Promise<number> {
  const tmpDir = os.tmpdir();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  const now = Date.now();
  let cleaned = 0;

  try {
    const entries = await readdir(tmpDir);

    for (const entry of entries) {
      if (entry.startsWith('crabb-backup-')) {
        const backupPath = path.join(tmpDir, entry);

        try {
          const stats = await stat(backupPath);

          if (now - stats.mtimeMs > maxAge) {
            await fs.promises.rm(backupPath, { recursive: true, force: true });
            cleaned++;
          }
        } catch {
          // Ignore errors during cleanup
        }
      }
    }
  } catch {
    // Ignore errors during cleanup
  }

  return cleaned;
}
