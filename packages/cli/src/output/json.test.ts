import { describe, it, expect } from 'vitest';
import type { ScanResult } from '../types/index.js';
import { buildSharePayload } from './json.js';

function createResult(): ScanResult {
  return {
    score: 82,
    grade: 'B',
    scanners: [
      { scanner: 'credentials', findings: [], penalty: 0, cap: 40 },
      { scanner: 'skills', findings: [], penalty: 0, cap: 30 },
      { scanner: 'permissions', findings: [], penalty: 0, cap: 20 },
      { scanner: 'network', findings: [], penalty: 0, cap: 10 },
    ],
    findings: [],
    timestamp: '2026-02-22T00:00:00.000Z',
    openclawPath: '/tmp/.openclaw',
    meta: {
      auditMode: 'auto',
      openclawVersion: '2.1.0',
      openclawAvailable: true,
      cliVersion: '1.1.1',
    },
  };
}

describe('buildSharePayload', () => {
  it('includes social metadata when provided', () => {
    const payload = buildSharePayload(createResult(), {
      source: 'social_x',
      campaign: 'share-card-challenge',
      theme: 'meme',
    });

    expect(payload.source).toBe('social_x');
    expect(payload.campaign).toBe('share-card-challenge');
    expect(payload.theme).toBe('meme');
    expect(payload.verified).toBe(true);
  });

  it('includes improvement delta when previous score differs', () => {
    const payload = buildSharePayload(createResult(), { previousScore: 70 });
    expect(payload.improvement).toEqual({
      previousScore: 70,
      delta: 12,
    });
  });
});
