import { describe, it, expect } from 'vitest';
import { calculateDelta, formatDeltaSummary } from './delta.js';
import type { ScanResult, Finding } from '../types/index.js';

function createMockFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    scanner: 'credentials',
    severity: 'medium',
    title: 'Test Finding',
    description: 'Test description',
    confidence: 0.8,
    fingerprint: `fp_${Math.random().toString(36).slice(2)}`,
    ...overrides,
  };
}

function createMockResult(findings: Finding[], score: number): ScanResult {
  return {
    score,
    grade: score >= 90 ? 'A' : score >= 75 ? 'B' : 'C',
    scanners: [],
    findings,
    timestamp: new Date().toISOString(),
    openclawPath: '/test',
  };
}

describe('delta', () => {
  describe('calculateDelta', () => {
    it('identifies fixed findings', () => {
      const finding1 = createMockFinding({ title: 'Issue 1', fingerprint: 'fp_1' });
      const finding2 = createMockFinding({ title: 'Issue 2', fingerprint: 'fp_2' });

      const before = createMockResult([finding1, finding2], 70);
      const after = createMockResult([finding2], 85);

      const delta = calculateDelta(before, after);

      expect(delta.fixed).toHaveLength(1);
      expect(delta.fixed[0].title).toBe('Issue 1');
      expect(delta.previousScore).toBe(70);
      expect(delta.newScore).toBe(85);
    });

    it('identifies new findings', () => {
      const finding1 = createMockFinding({ title: 'Issue 1', fingerprint: 'fp_1' });
      const finding2 = createMockFinding({ title: 'New Issue', fingerprint: 'fp_new' });

      const before = createMockResult([finding1], 80);
      const after = createMockResult([finding1, finding2], 70);

      const delta = calculateDelta(before, after);

      expect(delta.newFindings).toHaveLength(1);
      expect(delta.newFindings[0].title).toBe('New Issue');
    });

    it('identifies unchanged findings', () => {
      const finding1 = createMockFinding({ title: 'Issue 1', fingerprint: 'fp_1' });
      const finding2 = createMockFinding({ title: 'Issue 2', fingerprint: 'fp_2' });

      const before = createMockResult([finding1, finding2], 70);
      const after = createMockResult([finding1, finding2], 70);

      const delta = calculateDelta(before, after);

      expect(delta.unchanged).toHaveLength(2);
      expect(delta.fixed).toHaveLength(0);
      expect(delta.newFindings).toHaveLength(0);
    });

    it('handles empty before state', () => {
      const finding = createMockFinding({ fingerprint: 'fp_1' });

      const before = createMockResult([], 100);
      const after = createMockResult([finding], 90);

      const delta = calculateDelta(before, after);

      expect(delta.fixed).toHaveLength(0);
      expect(delta.newFindings).toHaveLength(1);
      expect(delta.unchanged).toHaveLength(0);
    });

    it('handles empty after state', () => {
      const finding = createMockFinding({ fingerprint: 'fp_1' });

      const before = createMockResult([finding], 90);
      const after = createMockResult([], 100);

      const delta = calculateDelta(before, after);

      expect(delta.fixed).toHaveLength(1);
      expect(delta.newFindings).toHaveLength(0);
      expect(delta.unchanged).toHaveLength(0);
    });
  });

  describe('formatDeltaSummary', () => {
    it('formats positive score change', () => {
      const delta = {
        previousScore: 70,
        newScore: 85,
        fixed: [createMockFinding()],
        newFindings: [],
        unchanged: [],
      };

      const summary = formatDeltaSummary(delta);

      expect(summary).toContain('70 → 85');
      expect(summary).toContain('+15');
      expect(summary).toContain('Fixed: 1');
    });

    it('formats negative score change', () => {
      const delta = {
        previousScore: 85,
        newScore: 70,
        fixed: [],
        newFindings: [createMockFinding()],
        unchanged: [],
      };

      const summary = formatDeltaSummary(delta);

      expect(summary).toContain('85 → 70');
      expect(summary).toContain('-15');
      expect(summary).toContain('New: 1');
    });

    it('formats no change', () => {
      const delta = {
        previousScore: 80,
        newScore: 80,
        fixed: [],
        newFindings: [],
        unchanged: [createMockFinding()],
      };

      const summary = formatDeltaSummary(delta);

      expect(summary).toContain('80 → 80');
      expect(summary).toContain('Unchanged: 1');
    });
  });
});
