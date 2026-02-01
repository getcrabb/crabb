import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { findOpenClawPath, getOpenClawVersion, detectOpenClaw } from './detection.js';
import * as fs from 'node:fs';
import * as child_process from 'node:child_process';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

describe('detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findOpenClawPath', () => {
    it('returns null when openclaw not found', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = findOpenClawPath();

      expect(result).toBeNull();
    });

    it('returns local node_modules path if exists', () => {
      vi.mocked(fs.existsSync).mockImplementation((path) => {
        return String(path).includes('node_modules/.bin/openclaw');
      });

      const result = findOpenClawPath();

      expect(result).toContain('node_modules/.bin/openclaw');
    });
  });

  describe('getOpenClawVersion', () => {
    it('parses version from openclaw --version output', async () => {
      const mockProc = {
        stdout: {
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('openclaw v2.1.0\n'));
            }
          }),
        },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(0);
          }
        }),
      };

      vi.mocked(child_process.spawn).mockReturnValue(mockProc as any);

      const version = await getOpenClawVersion('/usr/bin/openclaw');

      expect(version).toBe('2.1.0');
    });

    it('returns null on error', async () => {
      const mockProc = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('Command not found'));
          }
        }),
      };

      vi.mocked(child_process.spawn).mockReturnValue(mockProc as any);

      const version = await getOpenClawVersion('/nonexistent');

      expect(version).toBeNull();
    });
  });
});
