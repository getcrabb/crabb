import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import type { ScanResult, Finding, Grade, AuditMode, OpenClawInfo, ScanDelta } from '../types/index.js';
import { countBySeverity } from '../scoring/index.js';
import { formatFindingLocation } from '../utils/redact.js';

const CRAB = '\u{1F980}';

const GRADE_COLORS: Record<Grade, (text: string) => string> = {
  A: chalk.green,
  B: chalk.greenBright,
  C: chalk.yellow,
  D: chalk.hex('#FFA500'),
  F: chalk.red,
};

const SEVERITY_COLORS = {
  critical: chalk.bgRed.white,
  high: chalk.red,
  medium: chalk.yellow,
  low: chalk.gray,
};

const SEVERITY_ICONS = {
  critical: '\u{1F6A8}',
  high: '\u26A0\uFE0F',
  medium: '\u{1F7E1}',
  low: '\u2139\uFE0F',
};

export function createSpinner(text: string) {
  return ora({
    text,
    spinner: 'dots',
  });
}

export function printHeader() {
  console.log(
    boxen(
      `${CRAB} ${chalk.bold('CRABB')} ${chalk.dim('Security Scanner for OpenClaw')}`,
      {
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        borderColor: 'cyan',
        borderStyle: 'round',
      }
    )
  );
  console.log();
}

export function printScore(result: ScanResult) {
  const gradeColor = GRADE_COLORS[result.grade];
  const counts = countBySeverity(result.findings);

  const scoreDisplay = boxen(
    [
      `${CRAB} ${chalk.bold('CRABB SCORE')}`,
      '',
      `   ${gradeColor(chalk.bold(`${result.score}`))} ${chalk.dim('/ 100')}`,
      `   Grade: ${gradeColor(chalk.bold(result.grade))}`,
      '',
      chalk.dim('─'.repeat(24)),
      '',
      `${SEVERITY_ICONS.critical} Critical: ${counts.critical > 0 ? chalk.red(counts.critical) : chalk.dim('0')}`,
      `${SEVERITY_ICONS.high} High:     ${counts.high > 0 ? chalk.red(counts.high) : chalk.dim('0')}`,
      `${SEVERITY_ICONS.medium} Medium:   ${counts.medium > 0 ? chalk.yellow(counts.medium) : chalk.dim('0')}`,
      `${SEVERITY_ICONS.low} Low:      ${counts.low > 0 ? chalk.gray(counts.low) : chalk.dim('0')}`,
    ].join('\n'),
    {
      padding: 1,
      borderColor: result.grade === 'A' || result.grade === 'B' ? 'green' : result.grade === 'C' ? 'yellow' : 'red',
      borderStyle: 'round',
    }
  );

  console.log(scoreDisplay);
  console.log();
}

export function printFindings(findings: Finding[]) {
  if (findings.length === 0) {
    console.log(chalk.green(`${CRAB} No security issues found!`));
    return;
  }

  const sortedFindings = [...findings].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });

  console.log(chalk.bold('Findings:\n'));

  for (const finding of sortedFindings) {
    const severityColor = SEVERITY_COLORS[finding.severity];
    const icon = SEVERITY_ICONS[finding.severity];

    console.log(`${icon} ${severityColor(finding.severity.toUpperCase())} ${chalk.bold(finding.title)}`);
    console.log(`   ${chalk.dim(finding.description)}`);
    if (finding.file) {
      console.log(`   ${chalk.cyan(formatFindingLocation(finding.file, finding.line))}`);
    }
    console.log();
  }
}

export function printScannerSummary(result: ScanResult) {
  console.log(chalk.bold('Scanner Summary:\n'));

  for (const scanner of result.scanners) {
    const penaltyColor = scanner.penalty > 0 ? chalk.red : chalk.green;
    const bar = createProgressBar(scanner.cap - scanner.penalty, scanner.cap);

    console.log(
      `  ${scanner.scanner.padEnd(12)} ${bar} ${penaltyColor(`-${scanner.penalty.toFixed(1)}`)} ${chalk.dim(`/ ${scanner.cap}`)}`
    );
  }

  console.log();
}

function createProgressBar(value: number, max: number, width: number = 20): string {
  const percentage = Math.max(0, Math.min(1, value / max));
  const filled = Math.round(percentage * width);
  const empty = width - filled;

  const color = percentage >= 0.75 ? chalk.green : percentage >= 0.5 ? chalk.yellow : chalk.red;

  return color('\u2588'.repeat(filled)) + chalk.dim('\u2591'.repeat(empty));
}

export function printError(message: string) {
  console.error(chalk.red(`\u2717 Error: ${message}`));
}

export function printSuccess(message: string) {
  console.log(chalk.green(`\u2713 ${message}`));
}

export function printWarning(message: string) {
  console.log(chalk.yellow(`\u26A0 ${message}`));
}

/**
 * Prints audit mode information and OpenClaw version if available.
 */
export function printAuditModeInfo(auditMode: AuditMode, openclawInfo: OpenClawInfo) {
  const modeLabels: Record<AuditMode, string> = {
    auto: 'auto (hybrid)',
    openclaw: 'openclaw',
    crabb: 'crabb-only',
    off: 'off',
  };

  const parts: string[] = [];

  if (openclawInfo.available) {
    parts.push(`OpenClaw: ${chalk.green('v' + (openclawInfo.version || 'unknown'))}`);
  } else {
    parts.push(`OpenClaw: ${chalk.dim('not found')}`);
  }

  parts.push(`Mode: ${chalk.cyan(modeLabels[auditMode])}`);

  console.log(chalk.dim(parts.join(' | ')));
  console.log();
}

/**
 * Prints next steps suggestions based on scan results.
 */
export function printNextSteps(result: ScanResult, openclawAvailable: boolean) {
  if (result.findings.length === 0) {
    return;
  }

  console.log(chalk.bold('Next steps:'));

  if (openclawAvailable) {
    const hasCriticalOrHigh = result.findings.some(
      f => f.severity === 'critical' || f.severity === 'high'
    );

    if (hasCriticalOrHigh) {
      console.log(chalk.yellow(`  npx getcrabb --fix`) + chalk.dim('    Apply recommended fixes'));
    }
  }

  console.log(chalk.dim(`  npx getcrabb --json`) + chalk.dim('   Machine-readable output'));
  console.log(chalk.dim(`  npx getcrabb --share`) + chalk.dim('  Share score card'));
  console.log();
}

/**
 * Prints fix delta (before/after comparison).
 */
export function printFixDelta(delta: ScanDelta) {
  const scoreChange = delta.newScore - delta.previousScore;
  const scoreSymbol = scoreChange > 0 ? '+' : '';
  const scoreColor = scoreChange > 0 ? chalk.green : scoreChange < 0 ? chalk.red : chalk.dim;

  console.log();
  console.log(
    boxen(
      [
        chalk.bold('Fix Summary'),
        '',
        `Score: ${delta.previousScore} \u2192 ${delta.newScore} (${scoreColor(scoreSymbol + scoreChange)})`,
        '',
        delta.fixed.length > 0
          ? chalk.green(`\u2713 Fixed: ${delta.fixed.length} issue(s)`)
          : chalk.dim('  Fixed: 0'),
        delta.newFindings.length > 0
          ? chalk.yellow(`\u26A0 New: ${delta.newFindings.length} issue(s)`)
          : chalk.dim('  New: 0'),
        delta.unchanged.length > 0
          ? chalk.dim(`  Unchanged: ${delta.unchanged.length} issue(s)`)
          : '',
      ]
        .filter(Boolean)
        .join('\n'),
      {
        padding: 1,
        borderColor: scoreChange > 0 ? 'green' : scoreChange < 0 ? 'red' : 'gray',
        borderStyle: 'round',
      }
    )
  );
  console.log();

  // Show fixed issues
  if (delta.fixed.length > 0) {
    console.log(chalk.green.bold('Fixed issues:'));
    for (const finding of delta.fixed.slice(0, 5)) {
      console.log(chalk.green(`  \u2713 ${finding.title}`));
    }
    if (delta.fixed.length > 5) {
      console.log(chalk.dim(`  ... and ${delta.fixed.length - 5} more`));
    }
    console.log();
  }

  // Show new issues (if any appeared after fix - unusual but possible)
  if (delta.newFindings.length > 0) {
    console.log(chalk.yellow.bold('New issues detected:'));
    for (const finding of delta.newFindings.slice(0, 3)) {
      console.log(chalk.yellow(`  \u26A0 ${finding.title}`));
    }
    console.log();
  }
}

/**
 * Prints findings grouped by source (OpenClaw vs Crabb).
 */
export function printFindingsBySource(findings: Finding[]) {
  const openclawFindings = findings.filter(f => f.source === 'openclaw_audit');
  const crabbFindings = findings.filter(f => f.source?.startsWith('crabb_'));

  if (openclawFindings.length > 0) {
    console.log(chalk.bold('\u2550\u2550\u2550 OpenClaw Audit \u2550\u2550\u2550\n'));
    printFindingsList(openclawFindings);
  }

  if (crabbFindings.length > 0) {
    console.log(chalk.bold('\u2550\u2550\u2550 Crabb Extras \u2550\u2550\u2550\n'));
    printFindingsList(crabbFindings);
  }

  // Findings without source (legacy)
  const otherFindings = findings.filter(f => !f.source);
  if (otherFindings.length > 0 && (openclawFindings.length > 0 || crabbFindings.length > 0)) {
    console.log(chalk.bold('\u2550\u2550\u2550 Other \u2550\u2550\u2550\n'));
    printFindingsList(otherFindings);
  } else if (otherFindings.length > 0) {
    // No source-tagged findings, just print normally
    printFindingsList(otherFindings);
  }
}

function printFindingsList(findings: Finding[]) {
  const sortedFindings = [...findings].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });

  for (const finding of sortedFindings) {
    const severityColor = SEVERITY_COLORS[finding.severity];
    const icon = SEVERITY_ICONS[finding.severity];

    console.log(`${icon} ${severityColor(finding.severity.toUpperCase())} ${chalk.bold(finding.title)}`);
    console.log(`   ${chalk.dim(finding.description)}`);
    if (finding.file) {
      console.log(`   ${chalk.cyan(formatFindingLocation(finding.file, finding.line))}`);
    }
    if (finding.remediation) {
      console.log(`   ${chalk.green('\u2192')} ${chalk.dim(finding.remediation)}`);
    }
    console.log();
  }
}
