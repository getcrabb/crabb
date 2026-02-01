/**
 * Redaction utilities - NEVER output real secrets
 */

const REDACT_PATTERNS = [
  // API Keys with known prefixes
  /sk-[a-zA-Z0-9]{20,}/g,
  /sk-ant-[a-zA-Z0-9-]{20,}/g,
  /xoxb-[a-zA-Z0-9-]+/g,
  /xoxp-[a-zA-Z0-9-]+/g,
  /ghp_[a-zA-Z0-9]{36}/g,
  /gho_[a-zA-Z0-9]{36}/g,
  /github_pat_[a-zA-Z0-9_]{22,}/g,

  // Generic secrets
  /[a-zA-Z0-9_-]{32,}/g,
];

export function redactValue(value: string): string {
  if (value.length <= 8) {
    return '*'.repeat(value.length);
  }

  const visibleStart = 4;
  const visibleEnd = 4;
  const redactedLength = value.length - visibleStart - visibleEnd;

  return `${value.slice(0, visibleStart)}${'*'.repeat(Math.max(4, redactedLength))}${value.slice(-visibleEnd)}`;
}

export function redactLine(line: string): string {
  let result = line;

  for (const pattern of REDACT_PATTERNS) {
    result = result.replace(pattern, (match) => redactValue(match));
  }

  return result;
}

export function formatFindingLocation(file: string, line?: number): string {
  if (line !== undefined) {
    return `${file}:${line}`;
  }
  return file;
}
