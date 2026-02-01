import type { Finding, OpenClawAuditResult, Severity } from '../types/index.js';
import { mapOpenClawFinding, type RawOpenClawFinding } from './mapper.js';

/**
 * Parses OpenClaw audit output, auto-detecting JSON vs text format.
 */
export function parseAuditOutput(stdout: string): OpenClawAuditResult {
  const trimmed = stdout.trim();

  // Try JSON auto-detect: if starts with { or [, attempt JSON parse
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const json = JSON.parse(trimmed);
      return {
        findings: parseJsonFindings(json),
        format: 'json',
        raw: stdout,
      };
    } catch {
      // JSON parse failed, fall through to text parsing
    }
  }

  // Fallback to text parsing
  return {
    findings: parseTextFindings(stdout),
    format: 'text',
    raw: stdout,
  };
}

/**
 * Parses JSON output from openclaw audit.
 */
function parseJsonFindings(json: unknown): Finding[] {
  if (!json || typeof json !== 'object') {
    return [];
  }

  // Handle array of findings
  if (Array.isArray(json)) {
    return json
      .filter(isRawFinding)
      .map((f) => mapOpenClawFinding(f));
  }

  // Handle object with findings array
  const obj = json as Record<string, unknown>;
  if (Array.isArray(obj['findings'])) {
    return (obj['findings'] as unknown[])
      .filter(isRawFinding)
      .map((f) => mapOpenClawFinding(f));
  }

  // Handle object with issues array (alternative format)
  if (Array.isArray(obj['issues'])) {
    return (obj['issues'] as unknown[])
      .filter(isRawFinding)
      .map((f) => mapOpenClawFinding(f));
  }

  return [];
}

function isRawFinding(value: unknown): value is RawOpenClawFinding {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  // Must have at least severity or level, and some kind of message/title
  return (
    (typeof obj['severity'] === 'string' || typeof obj['level'] === 'string') &&
    (typeof obj['message'] === 'string' || typeof obj['title'] === 'string' || typeof obj['description'] === 'string')
  );
}

/**
 * Parses text output from openclaw audit.
 * Detects patterns like [CRITICAL], [HIGH], [MEDIUM], [LOW]
 */
function parseTextFindings(text: string): Finding[] {
  const findings: Finding[] = [];
  const lines = text.split('\n');

  // Pattern: [SEVERITY] Title or description
  const severityPattern = /^\s*\[?(CRITICAL|HIGH|MEDIUM|LOW)\]?\s*[:\-]?\s*(.+)/i;

  // Pattern: checkmark patterns (✓ passed, ✗ failed)
  const checkPattern = /^\s*([✓✗✔✘])\s*(.+)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check severity pattern
    const severityMatch = line.match(severityPattern);
    if (severityMatch) {
      const severity = severityMatch[1].toLowerCase() as Severity;
      const title = severityMatch[2].trim();

      // Look for description in next line if it's indented or starts with common patterns
      let description = title;
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (nextLine.match(/^\s{2,}/) || nextLine.match(/^[\t]/)) {
          description = nextLine.trim();
        }
      }

      findings.push(
        mapOpenClawFinding({
          severity,
          title,
          description: description !== title ? description : undefined,
        })
      );
      continue;
    }

    // Check for failure pattern (✗)
    const checkMatch = line.match(checkPattern);
    if (checkMatch && (checkMatch[1] === '✗' || checkMatch[1] === '✘')) {
      const message = checkMatch[2].trim();
      // Failed checks without explicit severity default to medium
      findings.push(
        mapOpenClawFinding({
          severity: 'medium',
          title: message,
        })
      );
    }
  }

  return findings;
}

/**
 * Extracts summary information from openclaw output.
 */
export function extractSummary(text: string): { passed: number; failed: number } | null {
  // Look for patterns like "X passed, Y failed" or "Score: X/Y"
  const summaryPattern = /(\d+)\s*passed.*?(\d+)\s*failed/i;
  const match = text.match(summaryPattern);

  if (match) {
    return {
      passed: parseInt(match[1], 10),
      failed: parseInt(match[2], 10),
    };
  }

  return null;
}
