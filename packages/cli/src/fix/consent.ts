import * as readline from 'node:readline';
import chalk from 'chalk';
import type { Finding } from '../types/index.js';
import { countBySeverity } from '../scoring/index.js';

/**
 * Shows fix consent prompt and waits for user confirmation.
 * Returns true if user agrees to proceed.
 */
export async function askFixConsent(findings: Finding[], skipPrompt: boolean = false): Promise<boolean> {
  if (skipPrompt) {
    return true;
  }

  if (findings.length === 0) {
    console.log(chalk.green('\nNo issues found. Nothing to fix.\n'));
    return false;
  }

  const counts = countBySeverity(findings);

  console.log('\n' + chalk.bold('Fix Preview:'));
  console.log(chalk.dim('OpenClaw will attempt to fix the following issues:\n'));

  // Show summary by severity
  if (counts.critical > 0) {
    console.log(chalk.red(`  Critical: ${counts.critical} issue(s)`));
  }
  if (counts.high > 0) {
    console.log(chalk.red(`  High:     ${counts.high} issue(s)`));
  }
  if (counts.medium > 0) {
    console.log(chalk.yellow(`  Medium:   ${counts.medium} issue(s)`));
  }
  if (counts.low > 0) {
    console.log(chalk.gray(`  Low:      ${counts.low} issue(s)`));
  }

  console.log();

  // Show first few findings as examples
  const topFindings = findings
    .sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity))
    .slice(0, 5);

  for (const finding of topFindings) {
    const color = getSeverityColor(finding.severity);
    console.log(`  ${color('•')} ${finding.title}`);
    if (finding.remediation) {
      console.log(chalk.dim(`    → ${finding.remediation}`));
    }
  }

  if (findings.length > 5) {
    console.log(chalk.dim(`  ... and ${findings.length - 5} more`));
  }

  console.log();
  console.log(chalk.yellow('⚠ This will modify your OpenClaw configuration.'));
  console.log(chalk.dim('  Use --yes to skip this prompt.\n'));

  return promptYesNo('Proceed with fix?');
}

function severityOrder(severity: string): number {
  const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return order[severity] ?? 4;
}

function getSeverityColor(severity: string): (text: string) => string {
  switch (severity) {
    case 'critical':
      return chalk.bgRed.white;
    case 'high':
      return chalk.red;
    case 'medium':
      return chalk.yellow;
    default:
      return chalk.gray;
  }
}

/**
 * Prompts user with a yes/no question.
 */
async function promptYesNo(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} [y/N] `, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === 'y' || normalized === 'yes');
    });
  });
}
