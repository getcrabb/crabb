import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import type { ScanResult, Finding, Grade } from '../types/index.js';
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
