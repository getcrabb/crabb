import type { OpenClawInfo, ScanResult } from '../types/index.js';
import { runAllScanners } from '../scanners/index.js';
import { buildScanResult, getExitCode } from '../scoring/index.js';
import { runOpenClawAudit } from '../openclaw/index.js';
import { askFixConsent } from './consent.js';
import { calculateDelta } from './delta.js';
import {
  printScore,
  printFindings,
  printScannerSummary,
  printFixDelta,
  printError,
  printSuccess,
  createSpinner,
} from '../output/terminal.js';

export interface FixFlowOptions {
  openclawPath: string;
  openclawInfo: OpenClawInfo;
  yes: boolean;
  json: boolean;
  deep: boolean;
  fixOnly?: boolean;
  cliVersion: string;
}

export interface FixFlowResult {
  exitCode: number;
  beforeResult: ScanResult;
  afterResult: ScanResult | null;
  applied: boolean;
}

/**
 * Runs the complete fix flow:
 * 1. Pre-scan
 * 2. Show findings + consent prompt
 * 3. Run openclaw security audit --fix
 * 4. Post-scan
 * 5. Calculate and display delta
 */
export async function runFixFlow(options: FixFlowOptions): Promise<FixFlowResult> {
  const { openclawPath, openclawInfo, yes, json, deep, fixOnly = false, cliVersion } = options;

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

  // Step 3: Run fix
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

    if (json) {
      console.log(JSON.stringify({
        status: 'fix_failed',
        error: fixResult.stderr,
        before: beforeResult,
        after: null,
        applied: false,
      }, null, 2));
    }

    return {
      exitCode: 2,
      beforeResult,
      afterResult: null,
      applied: false,
    };
  }

  // --fix-only: exit after fix without post-scan
  if (fixOnly) {
    if (!json) {
      printSuccess('Fix applied. Skipping post-scan (--fix-only mode).');
    } else {
      console.log(JSON.stringify({
        status: 'fix_only',
        before: beforeResult,
        after: null,
        applied: true,
      }, null, 2));
    }

    return {
      exitCode: 0,
      beforeResult,
      afterResult: null,
      applied: true,
    };
  }

  // Step 4: Post-scan
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

  // Step 5: Calculate and display delta
  const delta = calculateDelta(beforeResult, afterResult);

  if (json) {
    console.log(JSON.stringify({
      status: 'success',
      before: beforeResult,
      after: afterResult,
      delta: {
        previousScore: delta.previousScore,
        newScore: delta.newScore,
        fixedCount: delta.fixed.length,
        newCount: delta.newFindings.length,
        unchangedCount: delta.unchanged.length,
      },
      applied: true,
    }, null, 2));
  } else {
    console.log('\n--- After Fix ---');
    printScore(afterResult);
    printScannerSummary(afterResult);

    if (afterResult.findings.length > 0) {
      printFindings(afterResult.findings);
    }

    printFixDelta(delta);
  }

  const exitCode = getExitCode(afterResult);

  return {
    exitCode,
    beforeResult,
    afterResult,
    applied: true,
  };
}

export { askFixConsent } from './consent.js';
export { calculateDelta, formatDeltaSummary } from './delta.js';
