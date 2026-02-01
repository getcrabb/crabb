import type { ScannerResult, Finding, Grade, ScanResult } from '../types/index.js';

export function calculateScore(results: ScannerResult[]): number {
  const totalPenalty = results.reduce((sum, r) => sum + r.penalty, 0);
  return Math.max(0, Math.round(100 - totalPenalty));
}

export function determineGrade(score: number, findings: Finding[]): Grade {
  const hasCritical = findings.some(f => f.severity === 'critical');

  if (hasCritical) {
    if (score >= 75) return 'C';
    if (score >= 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }

  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export function buildScanResult(
  results: ScannerResult[],
  openclawPath: string
): ScanResult {
  const findings = results.flatMap(r => r.findings);
  const score = calculateScore(results);
  const grade = determineGrade(score, findings);

  return {
    score,
    grade,
    scanners: results,
    findings,
    timestamp: new Date().toISOString(),
    openclawPath,
  };
}

export function getExitCode(result: ScanResult): number {
  const hasCriticalOrHigh = result.findings.some(
    f => f.severity === 'critical' || f.severity === 'high'
  );

  if (result.score < 75 || hasCriticalOrHigh) {
    return 1;
  }

  return 0;
}

export function countBySeverity(findings: Finding[]) {
  return {
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
  };
}
