import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { scanSkills } from './skills.js';

const FIXTURES_PATH = join(import.meta.dirname, '../../fixtures');

describe('scanSkills', () => {
  it('finds no issues in clean fixture', async () => {
    const result = await scanSkills(join(FIXTURES_PATH, 'clean'));
    expect(result.findings).toHaveLength(0);
    expect(result.penalty).toBe(0);
  });

  it('detects dangerous patterns in vulnerable fixture', async () => {
    const result = await scanSkills(join(FIXTURES_PATH, 'vulnerable'));
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.penalty).toBeGreaterThan(0);
  });

  it('caps penalty at 30', async () => {
    const result = await scanSkills(join(FIXTURES_PATH, 'vulnerable'));
    expect(result.penalty).toBeLessThanOrEqual(30);
    expect(result.cap).toBe(30);
  });

  it('detects curl piped to bash', async () => {
    const result = await scanSkills(join(FIXTURES_PATH, 'vulnerable'));
    const curlFinding = result.findings.find(f => f.title.includes('Curl piped to shell'));
    expect(curlFinding).toBeDefined();
    expect(curlFinding?.severity).toBe('critical');
  });

  it('detects SSH key access', async () => {
    const result = await scanSkills(join(FIXTURES_PATH, 'vulnerable'));
    const sshFinding = result.findings.find(f => f.title.includes('SSH'));
    expect(sshFinding).toBeDefined();
  });

  it('handles non-existent directory gracefully', async () => {
    const result = await scanSkills('/non/existent/path');
    expect(result.findings).toHaveLength(0);
    expect(result.penalty).toBe(0);
  });
});
