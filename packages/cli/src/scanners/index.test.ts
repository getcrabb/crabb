import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for hybrid mode verification.
 * In hybrid mode:
 * - OpenClaw handles permissions/network scanning
 * - Crabb provides "extra" scanners (credentials, skills)
 * - Crabb NEVER runs permissions/network scanners in hybrid mode
 */

// Track which scanners are called
const scannerCalls: string[] = [];

// Mock the scanner modules to track which are called
vi.mock('./credentials.js', () => ({
  scanCredentials: vi.fn(() => {
    scannerCalls.push('credentials');
    return Promise.resolve({
      scanner: 'credentials',
      findings: [],
      penalty: 0,
      cap: 40,
    });
  }),
}));

vi.mock('./skills.js', () => ({
  scanSkills: vi.fn(() => {
    scannerCalls.push('skills');
    return Promise.resolve({
      scanner: 'skills',
      findings: [],
      penalty: 0,
      cap: 30,
    });
  }),
}));

vi.mock('./permissions.js', () => ({
  scanPermissions: vi.fn(() => {
    scannerCalls.push('permissions');
    return Promise.resolve({
      scanner: 'permissions',
      findings: [],
      penalty: 0,
      cap: 20,
    });
  }),
}));

vi.mock('./network.js', () => ({
  scanNetwork: vi.fn(() => {
    scannerCalls.push('network');
    return Promise.resolve({
      scanner: 'network',
      findings: [],
      penalty: 0,
      cap: 10,
    });
  }),
}));

vi.mock('../openclaw/index.js', () => ({
  runOpenClawAudit: vi.fn(() =>
    Promise.resolve({
      success: true,
      stdout: JSON.stringify({ findings: [] }),
      stderr: '',
      exitCode: 0,
    })
  ),
  parseAuditOutput: vi.fn(() => ({
    findings: [],
    format: 'json',
    raw: '',
  })),
}));

describe('scanners hybrid mode', () => {
  beforeEach(() => {
    scannerCalls.length = 0;
    vi.clearAllMocks();
  });

  it('in crabb-only mode runs all 4 scanners', async () => {
    const { runAllScanners } = await import('./index.js');

    await runAllScanners({
      openclawPath: '/test/path',
      auditMode: 'crabb',
    });

    expect(scannerCalls).toContain('credentials');
    expect(scannerCalls).toContain('skills');
    expect(scannerCalls).toContain('permissions');
    expect(scannerCalls).toContain('network');
  });

  it('in hybrid mode with available OpenClaw only runs credentials and skills', async () => {
    const { runAllScanners } = await import('./index.js');

    await runAllScanners({
      openclawPath: '/test/path',
      auditMode: 'auto',
      openclawInfo: {
        available: true,
        path: '/usr/bin/openclaw',
        version: '2.0.0',
      },
    });

    // In hybrid mode, only credentials and skills should run from Crabb
    expect(scannerCalls).toContain('credentials');
    expect(scannerCalls).toContain('skills');

    // Permissions and network should NOT run - handled by OpenClaw
    expect(scannerCalls).not.toContain('permissions');
    expect(scannerCalls).not.toContain('network');
  });

  it('falls back to crabb-only if OpenClaw not available in auto mode', async () => {
    const { runAllScanners } = await import('./index.js');

    await runAllScanners({
      openclawPath: '/test/path',
      auditMode: 'auto',
      openclawInfo: {
        available: false,
        path: null,
        version: null,
      },
    });

    // When OpenClaw not available, all 4 Crabb scanners should run
    expect(scannerCalls).toContain('credentials');
    expect(scannerCalls).toContain('skills');
    expect(scannerCalls).toContain('permissions');
    expect(scannerCalls).toContain('network');
  });

  it('in off mode skips all scanners', async () => {
    const { runAllScanners } = await import('./index.js');

    await runAllScanners({
      openclawPath: '/test/path',
      auditMode: 'off',
    });

    // In 'off' mode, no scanners should run
    expect(scannerCalls).toHaveLength(0);
  });
});
