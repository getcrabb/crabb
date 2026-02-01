import type { Finding, ScanDelta, ScanResult } from '../types/index.js';

/**
 * Calculates the delta between two scan results (before and after fix).
 */
export function calculateDelta(before: ScanResult, after: ScanResult): ScanDelta {
  const beforeFingerprints = new Set(
    before.findings.map(f => f.fingerprint || createTempFingerprint(f))
  );
  const afterFingerprints = new Set(
    after.findings.map(f => f.fingerprint || createTempFingerprint(f))
  );

  // Fixed: findings that were in before but not in after
  const fixed = before.findings.filter(
    f => !afterFingerprints.has(f.fingerprint || createTempFingerprint(f))
  );

  // New: findings that are in after but not in before
  const newFindings = after.findings.filter(
    f => !beforeFingerprints.has(f.fingerprint || createTempFingerprint(f))
  );

  // Unchanged: findings present in both
  const unchanged = after.findings.filter(
    f => beforeFingerprints.has(f.fingerprint || createTempFingerprint(f))
  );

  return {
    previousScore: before.score,
    newScore: after.score,
    fixed,
    newFindings,
    unchanged,
  };
}

/**
 * Creates a temporary fingerprint for comparison if finding doesn't have one.
 */
function createTempFingerprint(finding: Finding): string {
  return [
    finding.scanner,
    finding.severity,
    finding.title,
    finding.file || '',
    finding.line?.toString() || '',
  ].join(':').toLowerCase();
}

/**
 * Formats delta for display.
 */
export function formatDeltaSummary(delta: ScanDelta): string {
  const scoreChange = delta.newScore - delta.previousScore;
  const scoreSymbol = scoreChange > 0 ? '+' : '';

  const lines: string[] = [];

  lines.push(`Score: ${delta.previousScore} → ${delta.newScore} (${scoreSymbol}${scoreChange})`);

  if (delta.fixed.length > 0) {
    lines.push(`Fixed: ${delta.fixed.length} issue(s)`);
  }

  if (delta.newFindings.length > 0) {
    lines.push(`New: ${delta.newFindings.length} issue(s)`);
  }

  if (delta.unchanged.length > 0) {
    lines.push(`Unchanged: ${delta.unchanged.length} issue(s)`);
  }

  return lines.join('\n');
}
