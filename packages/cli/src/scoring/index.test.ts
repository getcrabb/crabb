import { describe, it, expect } from 'vitest';
import { calculateScore, determineGrade, countBySeverity, getExitCode, buildScanResult } from './index.js';
import type { ScannerResult, Finding, ScanResult } from '../types/index.js';

describe('calculateScore', () => {
  it('returns 100 for no penalties', () => {
    const results: ScannerResult[] = [
      { scanner: 'credentials', findings: [], penalty: 0, cap: 40 },
      { scanner: 'skills', findings: [], penalty: 0, cap: 30 },
    ];
    expect(calculateScore(results)).toBe(100);
  });

  it('subtracts penalties from 100', () => {
    const results: ScannerResult[] = [
      { scanner: 'credentials', findings: [], penalty: 20, cap: 40 },
      { scanner: 'skills', findings: [], penalty: 10, cap: 30 },
    ];
    expect(calculateScore(results)).toBe(70);
  });

  it('returns 0 for maximum penalties', () => {
    const results: ScannerResult[] = [
      { scanner: 'credentials', findings: [], penalty: 40, cap: 40 },
      { scanner: 'skills', findings: [], penalty: 30, cap: 30 },
      { scanner: 'permissions', findings: [], penalty: 20, cap: 20 },
      { scanner: 'network', findings: [], penalty: 10, cap: 10 },
    ];
    expect(calculateScore(results)).toBe(0);
  });
});

describe('determineGrade', () => {
  it('returns A for score >= 90 with no critical', () => {
    expect(determineGrade(95, [])).toBe('A');
    expect(determineGrade(90, [])).toBe('A');
  });

  it('returns B for score >= 75', () => {
    expect(determineGrade(85, [])).toBe('B');
    expect(determineGrade(75, [])).toBe('B');
  });

  it('returns C for score >= 60', () => {
    expect(determineGrade(70, [])).toBe('C');
    expect(determineGrade(60, [])).toBe('C');
  });

  it('returns D for score >= 40', () => {
    expect(determineGrade(50, [])).toBe('D');
    expect(determineGrade(40, [])).toBe('D');
  });

  it('returns F for score < 40', () => {
    expect(determineGrade(30, [])).toBe('F');
    expect(determineGrade(0, [])).toBe('F');
  });

  it('caps grade at C when critical findings exist', () => {
    const critical: Finding[] = [{
      scanner: 'credentials',
      severity: 'critical',
      title: 'Test',
      description: 'Test',
      confidence: 1,
    }];
    expect(determineGrade(95, critical)).toBe('C');
    expect(determineGrade(75, critical)).toBe('C');
    expect(determineGrade(60, critical)).toBe('C');
  });
});

describe('countBySeverity', () => {
  it('counts findings by severity correctly', () => {
    const findings: Finding[] = [
      { scanner: 'credentials', severity: 'critical', title: '', description: '', confidence: 1 },
      { scanner: 'credentials', severity: 'critical', title: '', description: '', confidence: 1 },
      { scanner: 'skills', severity: 'high', title: '', description: '', confidence: 1 },
      { scanner: 'permissions', severity: 'medium', title: '', description: '', confidence: 1 },
      { scanner: 'network', severity: 'low', title: '', description: '', confidence: 1 },
      { scanner: 'network', severity: 'low', title: '', description: '', confidence: 1 },
    ];

    const counts = countBySeverity(findings);
    expect(counts.critical).toBe(2);
    expect(counts.high).toBe(1);
    expect(counts.medium).toBe(1);
    expect(counts.low).toBe(2);
  });

  it('returns zeros for empty findings', () => {
    const counts = countBySeverity([]);
    expect(counts.critical).toBe(0);
    expect(counts.high).toBe(0);
    expect(counts.medium).toBe(0);
    expect(counts.low).toBe(0);
  });
});

describe('getExitCode', () => {
  it('returns 0 for score >= 75 with no critical/high', () => {
    const result: ScanResult = {
      score: 80,
      grade: 'B',
      scanners: [],
      findings: [
        { scanner: 'network', severity: 'low', title: '', description: '', confidence: 1 },
      ],
      timestamp: '',
      openclawPath: '',
    };
    expect(getExitCode(result)).toBe(0);
  });

  it('returns 1 for score < 75', () => {
    const result: ScanResult = {
      score: 70,
      grade: 'C',
      scanners: [],
      findings: [],
      timestamp: '',
      openclawPath: '',
    };
    expect(getExitCode(result)).toBe(1);
  });

  it('returns 1 for critical findings', () => {
    const result: ScanResult = {
      score: 90,
      grade: 'C',
      scanners: [],
      findings: [
        { scanner: 'credentials', severity: 'critical', title: '', description: '', confidence: 1 },
      ],
      timestamp: '',
      openclawPath: '',
    };
    expect(getExitCode(result)).toBe(1);
  });

  it('returns 1 for high findings', () => {
    const result: ScanResult = {
      score: 85,
      grade: 'B',
      scanners: [],
      findings: [
        { scanner: 'permissions', severity: 'high', title: '', description: '', confidence: 1 },
      ],
      timestamp: '',
      openclawPath: '',
    };
    expect(getExitCode(result)).toBe(1);
  });
});
