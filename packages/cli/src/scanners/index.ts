import type { ScannerResult, Finding } from '../types/index.js';
import { scanCredentials } from './credentials.js';
import { scanSkills } from './skills.js';
import { scanPermissions } from './permissions.js';
import { scanNetwork } from './network.js';

export interface ScanOptions {
  openclawPath: string;
}

export async function runAllScanners(options: ScanOptions): Promise<ScannerResult[]> {
  const { openclawPath } = options;

  const results = await Promise.all([
    scanCredentials(openclawPath),
    scanSkills(openclawPath),
    scanPermissions(openclawPath),
    scanNetwork(openclawPath),
  ]);

  return results;
}

export function getAllFindings(results: ScannerResult[]): Finding[] {
  return results.flatMap(r => r.findings);
}

export function getTotalPenalty(results: ScannerResult[]): number {
  return results.reduce((sum, r) => sum + r.penalty, 0);
}

export { scanCredentials, scanSkills, scanPermissions, scanNetwork };
