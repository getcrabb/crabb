import type { OpenClawInfo, ScanResult } from '../types/index.js';
import { runAllScanners } from '../scanners/index.js';
import { buildScanResult, getExitCode } from '../scoring/index.js';
import { runOpenClawAudit } from '../openclaw/index.js';
import { askFixConsent } from './consent.js';
import { calculateDelta } from './delta.js';
import { createBackup, formatBackupInfo, getRestoreCommand, type BackupResult } from './backup.js';
import {
  printScore,
  printFindings,
  printScannerSummary,
  printFixDelta,
  printError,
  printSuccess,
  printWarning,
  createSpinner,
} from '../output/terminal.js';
import chalk from 'chalk';

export interface FixFlowOptions {
  openclawPath: string;
  openclawInfo: OpenClawInfo;
  yes: boolean;
  json: boolean;
  deep: boolean;
  fixOnly?: boolean;
  noBackup?: boolean;
  cliVersion: string;
}

export interface FixFlowResult {
  exitCode: number;
  beforeResult: ScanResult;
  afterResult: ScanResult | null;
  applied: boolean;
  backup?: BackupResult;
}

/**
 * Runs the complete fix flow:
 * 1. Pre-scan
 * 2. Show findings + consent prompt
 * 3. Create backup (unless --no-backup)
 * 4. Run openclaw security audit --fix
 * 5. Post-scan
 * 6. Calculate and display delta
 */
export async function runFixFlow(options: FixFlowOptions): Promise<FixFlowResult> {
  const { openclawPath, openclawInfo, yes, json, deep, fixOnly = false, noBackup = false, cliVersion } = options;

  // Step 1: Pre-scan
  const preSpinner = json ? null : createSpinner('Pre-scan: analyzing current state...');
  preSpinner?.start();

  const preScanResults = await runAllScanners({
    openclawPath,
    auditMode: 'auto',
    openclawInfo,
    deep,
  });

  const beforeResult = buildScanResult(preScanResults, openclawPath, {
    auditMode: 'auto',
    openclawVersion: openclawInfo.version,
    openclawAvailable: openclawInfo.available,
    cliVersion,
  });

  preSpinner?.stop();

  if (!json) {
    console.log('\n--- Before Fix ---');
    printScore(beforeResult);
    printScannerSummary(beforeResult);
  }

  // Step 2: Consent prompt
  const hasFixableIssues = beforeResult.findings.length > 0;

  if (!hasFixableIssues) {
    if (!json) {
      printSuccess('No issues found. Nothing to fix.');
    } else {
      console.log(JSON.stringify({
        status: 'no_issues',
        before: beforeResult,
        after: null,
        applied: false,
      }, null, 2));
    }
    return {
      exitCode: 0,
      beforeResult,
      afterResult: null,
      applied: false,
    };
  }

  const confirmed = await askFixConsent(beforeResult.findings, yes);

  if (!confirmed) {
    if (!json) {
      console.log('\nFix cancelled by user.');
    } else {
      console.log(JSON.stringify({
        status: 'cancelled',
        before: beforeResult,
        after: null,
        applied: false,
      }, null, 2));
    }
    return {
      exitCode: 0,
      beforeResult,
      afterResult: null,
      applied: false,
    };
  }

  // Step 3: Create backup (unless --no-backup)
  let backup: BackupResult | undefined;

  if (!noBackup) {
    const backupSpinner = json ? null : createSpinner('Creating backup...');
    backupSpinner?.start();

    try {
      backup = await createBackup(openclawPath);
      backupSpinner?.stop();

      if (!json) {
        if (backup.filesCopied > 0) {
          console.log(chalk.dim(`\nBackup created: ${backup.path}`));
          console.log(chalk.dim(`Files backed up: ${backup.filesCopied}`));
          console.log(chalk.dim(`To restore: ${getRestoreCommand(backup, openclawPath)}\n`));
        } else {
          printWarning('No files to backup (directory may be empty)');
        }

        if (backup.errors.length > 0) {
          for (const error of backup.errors) {
            printWarning(`Backup warning: ${error}`);
          }
        }
      }
    } catch (err) {
      backupSpinner?.stop();
      printError(`Failed to create backup: ${err instanceof Error ? err.message : String(err)}`);

      if (!json) {
        console.log(chalk.yellow('\nProceeding without backup. Use --no-backup to suppress this warning.'));
      }
    }
  } else if (!json) {
    console.log(chalk.dim('\nSkipping backup (--no-backup specified)'));
  }

  // Step 4: Run fix
  const fixSpinner = json ? null : createSpinner('Applying fixes via OpenClaw...');
  fixSpinner?.start();

  const fixResult = await runOpenClawAudit({
    deep,
    fix: true,
    customPath: openclawPath,
    timeout: 60000, // Give more time for fix operations
  });

  fixSpinner?.stop();

  if (!fixResult.success) {
    printError(`Fix failed: ${fixResult.stderr || 'Unknown error'}`);

    if (backup && !json) {
      console.log(chalk.yellow(`\nTo restore from backup: ${getRestoreCommand(backup, openclawPath)}`));
    }

    if (json) {
      console.log(JSON.stringify({
        status: 'fix_failed',
        error: fixResult.stderr,
        before: beforeResult,
        after: null,
        applied: false,
        backup: backup ? { path: backup.path, filesCopied: backup.filesCopied } : null,
      }, null, 2));
    }

    return {
      exitCode: 2,
      beforeResult,
      afterResult: null,
      applied: false,
      backup,
    };
  }

  // --fix-only: exit after fix without post-scan
  if (fixOnly) {
    if (!json) {
      printSuccess('Fix applied. Skipping post-scan (--fix-only mode).');
      if (backup) {
        console.log(chalk.dim(`Backup available at: ${backup.path}`));
      }
    } else {
      console.log(JSON.stringify({
        status: 'fix_only',
        before: beforeResult,
        after: null,
        applied: true,
        backup: backup ? { path: backup.path, filesCopied: backup.filesCopied } : null,
      }, null, 2));
    }

    return {
      exitCode: 0,
      beforeResult,
      afterResult: null,
      applied: true,
      backup,
    };
  }

  // Step 5: Post-scan
  const postSpinner = json ? null : createSpinner('Post-scan: verifying fixes...');
  postSpinner?.start();

  const postScanResults = await runAllScanners({
    openclawPath,
    auditMode: 'auto',
    openclawInfo,
    deep,
  });

  const afterResult = buildScanResult(postScanResults, openclawPath, {
    auditMode: 'auto',
    openclawVersion: openclawInfo.version,
    openclawAvailable: openclawInfo.available,
    cliVersion,
  });

  postSpinner?.stop();

  // Step 6: Calculate and display delta
  const delta = calculateDelta(beforeResult, afterResult);

  if (json) {
    console.log(JSON.stringify({
      status: 'success',
      before: beforeResult,
      after: afterResult,
      delta: {
        previousScore: delta.previousScore,
        newScore: delta.newScore,
        previousGrade: beforeResult.grade,
        newGrade: afterResult.grade,
        fixedCount: delta.fixed.length,
        newCount: delta.newFindings.length,
        unchangedCount: delta.unchanged.length,
      },
      applied: true,
      backup: backup ? { path: backup.path, filesCopied: backup.filesCopied } : null,
    }, null, 2));
  } else {
    console.log('\n--- After Fix ---');
    printScore(afterResult);
    printScannerSummary(afterResult);

    if (afterResult.findings.length > 0) {
      printFindings(afterResult.findings);
    }

    printFixDelta(delta, beforeResult.grade, afterResult.grade);

    if (backup) {
      console.log(chalk.dim(`\nBackup saved at: ${backup.path}`));
    }
  }

  const exitCode = getExitCode(afterResult);

  return {
    exitCode,
    beforeResult,
    afterResult,
    applied: true,
    backup,
  };
}

export { askFixConsent } from './consent.js';
export { calculateDelta, formatDeltaSummary } from './delta.js';
export { createBackup, formatBackupInfo, getRestoreCommand } from './backup.js';
