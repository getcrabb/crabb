import { describe, it, expect } from 'vitest';
import { mapOpenClawFinding, createCrabbFinding, normalizeCheckId } from './mapper.js';

describe('mapper', () => {
  describe('normalizeCheckId', () => {
    it('converts title to lowercase snake_case', () => {
      expect(normalizeCheckId('API Key Exposed')).toBe('api_key_exposed');
      expect(normalizeCheckId('Gateway Exposed No Auth')).toBe('gateway_exposed_no_auth');
    });

    it('removes punctuation', () => {
      expect(normalizeCheckId('API-Key: Exposed!')).toBe('apikey_exposed');
      expect(normalizeCheckId("Token's value (leaked)")).toBe('tokens_value_leaked');
    });

    it('collapses multiple spaces/underscores', () => {
      expect(normalizeCheckId('API   Key   Found')).toBe('api_key_found');
      expect(normalizeCheckId('Test  __  Case')).toBe('test_case');
    });

    it('trims leading/trailing underscores', () => {
      expect(normalizeCheckId('  API Key  ')).toBe('api_key');
      expect(normalizeCheckId('_test_')).toBe('test');
    });

    it('handles empty string', () => {
      expect(normalizeCheckId('')).toBe('');
    });
  });

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
      expect(finding.id).toBe('gateway_exposed_no_auth');
    });

    it('generates stable ID from title when not provided', () => {
      const finding = mapOpenClawFinding({
        severity: 'high',
        title: 'API Key Exposed In Config',
      });

      expect(finding.id).toBe('api_key_exposed_in_config');
    });

    it('uses normalized ID for mapping when raw ID not in mapping table', () => {
      // Title that matches a mapping after normalization
      const finding = mapOpenClawFinding({
        title: 'Sandbox Disabled',
      });

      expect(finding.id).toBe('sandbox_disabled');
      expect(finding.module).toBe('permissions');
      expect(finding.severity).toBe('critical'); // From mapping
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

    it('defaults to low severity for unknown checks without explicit severity', () => {
      const finding = mapOpenClawFinding({
        title: 'Unknown Check Type',
      });

      expect(finding.severity).toBe('low');
    });

    it('defaults to low for unrecognized severity values', () => {
      const finding = mapOpenClawFinding({
        severity: 'something_unknown',
        title: 'Test',
      });

      expect(finding.severity).toBe('low');
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

    it('uses mapping defaults for known IDs without explicit severity', () => {
      const finding = mapOpenClawFinding({
        id: 'sandbox_disabled',
        title: 'Sandbox is disabled',
      });

      expect(finding.severity).toBe('critical'); // From FINDING_MAPPING
    });

    it('explicit severity overrides mapping defaults', () => {
      const finding = mapOpenClawFinding({
        id: 'sandbox_disabled',
        title: 'Sandbox is disabled',
        severity: 'low', // Explicit override
      });

      expect(finding.severity).toBe('low');
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

    it('generates stable ID from title', () => {
      const finding = createCrabbFinding(
        'credentials',
        'high',
        'API Key Found In Config',
        'Found API key'
      );

      expect(finding.id).toBe('api_key_found_in_config');
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
