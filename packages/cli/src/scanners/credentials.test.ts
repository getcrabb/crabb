import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { scanCredentials } from './credentials.js';

const FIXTURES_PATH = join(import.meta.dirname, '../../fixtures');

describe('scanCredentials', () => {
  it('finds no credentials in clean fixture', async () => {
    const result = await scanCredentials(join(FIXTURES_PATH, 'clean'));
    expect(result.findings).toHaveLength(0);
    expect(result.penalty).toBe(0);
  });

  it('detects credentials in vulnerable fixture', async () => {
    const result = await scanCredentials(join(FIXTURES_PATH, 'vulnerable'));
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.penalty).toBeGreaterThan(0);
  });

  it('caps penalty at 40', async () => {
    const result = await scanCredentials(join(FIXTURES_PATH, 'vulnerable'));
    expect(result.penalty).toBeLessThanOrEqual(40);
    expect(result.cap).toBe(40);
  });

  it('detects Anthropic API keys', async () => {
    const result = await scanCredentials(join(FIXTURES_PATH, 'vulnerable'));
    const anthropicFinding = result.findings.find(f => f.title === 'Anthropic API Key');
    expect(anthropicFinding).toBeDefined();
    expect(anthropicFinding?.severity).toBe('critical');
  });

  it('detects GitHub tokens', async () => {
    const result = await scanCredentials(join(FIXTURES_PATH, 'vulnerable'));
    const githubFinding = result.findings.find(f => f.title.includes('GitHub'));
    expect(githubFinding).toBeDefined();
  });

  it('handles non-existent directory gracefully', async () => {
    const result = await scanCredentials('/non/existent/path');
    expect(result.findings).toHaveLength(0);
    expect(result.penalty).toBe(0);
  });
});
