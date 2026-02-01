import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { scanPermissions } from './permissions.js';

const FIXTURES_PATH = join(import.meta.dirname, '../../fixtures');

describe('scanPermissions', () => {
  it('finds no config issues in clean fixture', async () => {
    const result = await scanPermissions(join(FIXTURES_PATH, 'clean'));
    // Filter out file permission findings (depend on local file system)
    const configFindings = result.findings.filter(f => !f.title.includes('permissive'));
    expect(configFindings).toHaveLength(0);
  });

  it('detects permission issues in vulnerable fixture', async () => {
    const result = await scanPermissions(join(FIXTURES_PATH, 'vulnerable'));
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.penalty).toBeGreaterThan(0);
  });

  it('caps penalty at 20', async () => {
    const result = await scanPermissions(join(FIXTURES_PATH, 'vulnerable'));
    expect(result.penalty).toBeLessThanOrEqual(20);
    expect(result.cap).toBe(20);
  });

  it('detects disabled sandbox', async () => {
    const result = await scanPermissions(join(FIXTURES_PATH, 'vulnerable'));
    const sandboxFinding = result.findings.find(f => f.title.includes('Sandbox disabled'));
    expect(sandboxFinding).toBeDefined();
    expect(sandboxFinding?.severity).toBe('critical');
  });

  it('detects wildcard allowlist', async () => {
    const result = await scanPermissions(join(FIXTURES_PATH, 'vulnerable'));
    const wildcardFinding = result.findings.find(f => f.title.includes('Wildcard'));
    expect(wildcardFinding).toBeDefined();
  });

  it('detects exposed gateway', async () => {
    const result = await scanPermissions(join(FIXTURES_PATH, 'vulnerable'));
    const gatewayFinding = result.findings.find(f => f.title.includes('Gateway'));
    expect(gatewayFinding).toBeDefined();
  });

  it('handles non-existent directory gracefully', async () => {
    const result = await scanPermissions('/non/existent/path');
    expect(result.findings).toHaveLength(0);
    expect(result.penalty).toBe(0);
  });
});
