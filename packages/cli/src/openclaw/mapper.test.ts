import { describe, it, expect } from 'vitest';
import { mapOpenClawFinding, createCrabbFinding } from './mapper.js';

describe('mapper', () => {
  describe('mapOpenClawFinding', () => {
    it('maps known finding ID to correct module and severity', () => {
      const raw = {
        id: 'gateway_exposed_no_auth',
        title: 'Gateway exposed',
        description: 'No auth enabled',
      };

      const finding = mapOpenClawFinding(raw);

      expect(finding.module).toBe('network');
      expect(finding.severity).toBe('critical');
      expect(finding.source).toBe('openclaw_audit');
    });

    it('normalizes severity strings', () => {
      const variants = [
        { severity: 'CRITICAL', expected: 'critical' },
        { severity: 'crit', expected: 'critical' },
        { severity: 'HIGH', expected: 'high' },
        { severity: 'error', expected: 'high' },
        { severity: 'warning', expected: 'medium' },
        { severity: 'INFO', expected: 'low' },
      ];

      for (const { severity, expected } of variants) {
        const finding = mapOpenClawFinding({
          severity,
          title: 'Test',
        });
        expect(finding.severity).toBe(expected);
      }
    });

    it('determines module from category', () => {
      const finding = mapOpenClawFinding({
        severity: 'high',
        title: 'API key exposed',
        category: 'credentials',
      });

      expect(finding.module).toBe('credentials');
    });

    it('determines module from title content', () => {
      const tests = [
        { title: 'API key found in config', expected: 'credentials' },
        { title: 'Skill has suspicious pattern', expected: 'skills' },
        { title: 'Sandbox is disabled', expected: 'permissions' },
        { title: 'Gateway exposed', expected: 'network' },
      ];

      for (const { title, expected } of tests) {
        const finding = mapOpenClawFinding({ severity: 'medium', title });
        expect(finding.module).toBe(expected);
      }
    });

    it('creates fingerprint for deduplication', () => {
      const finding = mapOpenClawFinding({
        severity: 'high',
        title: 'Test Finding',
        file: '/path/to/file.json',
        line: 10,
      });

      expect(finding.fingerprint).toBeDefined();
      expect(finding.fingerprint).toContain('test_finding');
    });

    it('preserves remediation hint', () => {
      const finding = mapOpenClawFinding({
        severity: 'medium',
        title: 'Issue',
        remediation: 'Fix by doing X',
      });

      expect(finding.remediation).toBe('Fix by doing X');
    });
  });

  describe('createCrabbFinding', () => {
    it('creates finding with correct source', () => {
      const finding = createCrabbFinding(
        'credentials',
        'high',
        'API Key Found',
        'Found exposed API key',
        { file: '/test.json', line: 5 }
      );

      expect(finding.source).toBe('crabb_credentials');
      expect(finding.scanner).toBe('credentials');
      expect(finding.module).toBe('credentials');
    });

    it('sets default confidence', () => {
      const finding = createCrabbFinding(
        'skills',
        'medium',
        'Suspicious Pattern',
        'Found suspicious pattern'
      );

      expect(finding.confidence).toBe(0.8);
    });

    it('allows custom confidence', () => {
      const finding = createCrabbFinding(
        'network',
        'low',
        'Info',
        'Just info',
        { confidence: 0.5 }
      );

      expect(finding.confidence).toBe(0.5);
    });
  });
});
