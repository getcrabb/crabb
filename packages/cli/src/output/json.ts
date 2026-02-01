import type { ScanResult, SharePayload } from '../types/index.js';
import { countBySeverity } from '../scoring/index.js';

export function formatJsonOutput(result: ScanResult): string {
  return JSON.stringify(result, null, 2);
}

export function buildSharePayload(result: ScanResult): SharePayload {
  const counts = countBySeverity(result.findings);

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
  };
}
