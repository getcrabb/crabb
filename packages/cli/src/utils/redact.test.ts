import { describe, it, expect } from 'vitest';
import { redactValue, redactLine, formatFindingLocation } from './redact.js';

describe('redactValue', () => {
  it('fully redacts short values', () => {
    expect(redactValue('abc')).toBe('***');
    expect(redactValue('12345678')).toBe('********');
  });

  it('partially redacts long values', () => {
    const result = redactValue('sk-ant-api03-1234567890abcdef');
    expect(result).toMatch(/^sk-a.*cdef$/);
    expect(result).toContain('****');
  });

  it('preserves first and last 4 characters for long values', () => {
    const value = 'sk-ant-api03-ABCDEFGHIJKLMNOP';
    const result = redactValue(value);
    expect(result.slice(0, 4)).toBe('sk-a');
    expect(result.slice(-4)).toBe('MNOP');
  });
});

describe('redactLine', () => {
  it('redacts API keys in line', () => {
    const line = 'api_key = sk-ant-api03-1234567890abcdefghij';
    const result = redactLine(line);
    expect(result).not.toContain('1234567890abcdefghij');
    expect(result).toContain('****');
  });

  it('redacts GitHub tokens', () => {
    const line = 'token: ghp_1234567890ABCDEFGHIJKLMNOPQRSTUVWXyz';
    const result = redactLine(line);
    expect(result).not.toContain('1234567890ABCDEFGHIJKLMNOPQRSTUVWX');
  });

  it('leaves normal text unchanged', () => {
    const line = 'This is a normal line of code';
    expect(redactLine(line)).toBe(line);
  });
});

describe('formatFindingLocation', () => {
  it('formats file with line number', () => {
    expect(formatFindingLocation('config.json', 42)).toBe('config.json:42');
  });

  it('formats file without line number', () => {
    expect(formatFindingLocation('config.json')).toBe('config.json');
  });
});
