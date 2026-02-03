import type { ScanResult, SharePayload } from '../types/index.js';
import { countBySeverity } from '../scoring/index.js';

export interface JsonOutput {
  meta: {
    cliVersion: string;
    auditMode: string;
    openclawVersion: string | null;
    openclawAvailable: boolean;
    timestamp: string;
  };
  score: number;
  grade: string;
  scanners: ScanResult['scanners'];
  findings: ScanResult['findings'];
  openclawPath: string;
}

export function formatJsonOutput(result: ScanResult): string {
  const output: JsonOutput = {
    meta: {
      cliVersion: result.meta?.cliVersion || '0.8.0',
      auditMode: result.meta?.auditMode || 'crabb',
      openclawVersion: result.meta?.openclawVersion || null,
      openclawAvailable: result.meta?.openclawAvailable || false,
      timestamp: result.timestamp,
    },
    score: result.score,
    grade: result.grade,
    scanners: result.scanners,
    findings: result.findings,
    openclawPath: result.openclawPath,
  };

  return JSON.stringify(output, null, 2);
}

export function buildSharePayload(result: ScanResult, previousScore?: number): SharePayload {
  const counts = countBySeverity(result.findings);

  // Verified: score >= 75 AND no critical findings
  const verified = result.score >= 75 && counts.critical === 0;

  // Improvement delta (for post-fix shares)
  const improvement = previousScore !== undefined && previousScore !== result.score
    ? {
        previousScore,
        delta: result.score - previousScore,
      }
    : undefined;

  return {
    score: result.score,
    grade: result.grade,
    scannerSummary: result.scanners.map(s => ({
      scanner: s.scanner,
      findingsCount: s.findings.length,
      penalty: s.penalty,
    })),
    criticalCount: counts.critical,
    highCount: counts.high,
    mediumCount: counts.medium,
    lowCount: counts.low,
    timestamp: result.timestamp,
    // v0.8 fields
    auditMode: result.meta?.auditMode,
    openclawVersion: result.meta?.openclawVersion,
    cliVersion: result.meta?.cliVersion,
    verified,
    improvement,
  };
}
