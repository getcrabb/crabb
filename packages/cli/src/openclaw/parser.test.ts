import { describe, it, expect } from 'vitest';
import { parseAuditOutput, extractSummary } from './parser.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesPath = join(__dirname, '../../fixtures/openclaw-output');

describe('parser', () => {
  describe('parseAuditOutput', () => {
    it('parses clean JSON output with no findings', () => {
      const json = readFileSync(join(fixturesPath, 'clean.json'), 'utf-8');
      const result = parseAuditOutput(json);

      expect(result.format).toBe('json');
      expect(result.findings).toHaveLength(0);
    });

    it('parses JSON output with findings', () => {
      const json = readFileSync(join(fixturesPath, 'findings.json'), 'utf-8');
      const result = parseAuditOutput(json);

      expect(result.format).toBe('json');
      expect(result.findings).toHaveLength(3);

      const critical = result.findings.filter(f => f.severity === 'critical');
      expect(critical).toHaveLength(2);

      const medium = result.findings.filter(f => f.severity === 'medium');
      expect(medium).toHaveLength(1);
    });

    it('parses text output with severity markers', () => {
      const text = readFileSync(join(fixturesPath, 'findings.txt'), 'utf-8');
      const result = parseAuditOutput(text);

      expect(result.format).toBe('text');
      expect(result.findings.length).toBeGreaterThan(0);

      // Should find CRITICAL and MEDIUM markers
      const severities = result.findings.map(f => f.severity);
      expect(severities).toContain('critical');
      expect(severities).toContain('medium');
    });

    it('handles malformed text gracefully', () => {
      const text = readFileSync(join(fixturesPath, 'malformed.txt'), 'utf-8');
      const result = parseAuditOutput(text);

      expect(result.format).toBe('text');
      // Should not crash, may return empty or minimal findings
      expect(Array.isArray(result.findings)).toBe(true);
    });

    it('auto-detects JSON format', () => {
      const jsonArray = '[{"severity":"high","title":"Test"}]';
      const result = parseAuditOutput(jsonArray);

      expect(result.format).toBe('json');
    });

    it('falls back to text when JSON is invalid', () => {
      const badJson = '{ invalid json [CRITICAL] Some issue';
      const result = parseAuditOutput(badJson);

      expect(result.format).toBe('text');
    });
  });

  describe('extractSummary', () => {
    it('extracts passed/failed counts', () => {
      const text = 'Summary: 7 passed, 3 failed';
      const summary = extractSummary(text);

      expect(summary).toEqual({ passed: 7, failed: 3 });
    });

    it('returns null for text without summary', () => {
      const text = 'No summary here';
      const summary = extractSummary(text);

      expect(summary).toBeNull();
    });
  });
});
