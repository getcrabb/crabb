import type { ScannerResult, Finding, AuditMode, OpenClawInfo, ScannerType } from '../types/index.js';
import { scanCredentials } from './credentials.js';
import { scanSkills } from './skills.js';
import { scanPermissions } from './permissions.js';
import { scanNetwork } from './network.js';
import { runOpenClawAudit, parseAuditOutput } from '../openclaw/index.js';

export interface ScanOptions {
  openclawPath: string;
  auditMode?: AuditMode;
  openclawInfo?: OpenClawInfo;
  deep?: boolean;
  printOpenclaw?: boolean;
}

/**
 * Runs all scanners based on audit mode.
 * In 'auto' mode with OpenClaw available: hybrid (OpenClaw + Crabb extras)
 * In 'crabb' mode or OpenClaw unavailable: Crabb scanners only
 */
export async function runAllScanners(options: ScanOptions): Promise<ScannerResult[]> {
  const { openclawPath, auditMode = 'crabb', openclawInfo, deep = false, printOpenclaw = false } = options;

  if (auditMode === 'off') {
    return buildEmptyResults();
  }

  // Use Crabb-only scanners
  if (auditMode === 'crabb' || !openclawInfo?.available) {
    return runCrabbOnlyScanners(openclawPath);
  }

  // Hybrid mode: OpenClaw audit + Crabb extras (credentials, skills)
  try {
    const [openclawResult, crabbExtras] = await Promise.all([
      runOpenClawAudit({ deep, customPath: openclawPath }),
      runCrabbExtraScanners(openclawPath),
    ]);

    if (printOpenclaw) {
      console.log('\n--- OpenClaw Raw Output ---');
      console.log(openclawResult.stdout);
      if (openclawResult.stderr) {
        console.log('--- stderr ---');
        console.log(openclawResult.stderr);
      }
      console.log('--- End OpenClaw Output ---\n');
    }

    if (!openclawResult.success) {
      // OpenClaw failed, fallback to Crabb-only
      console.error(`OpenClaw audit failed: ${openclawResult.stderr}`);
      return runCrabbOnlyScanners(openclawPath);
    }

    // Parse OpenClaw output and merge with Crabb extras
    const parsed = parseAuditOutput(openclawResult.stdout);
    const openclawFindings = parsed.findings;

    // Convert OpenClaw findings to ScannerResults grouped by module
    const openclawResults = groupFindingsByScanner(openclawFindings);

    // Merge: OpenClaw for permissions/network, Crabb for credentials/skills
    return mergeResults(openclawResults, crabbExtras);
  } catch (err) {
    // Fallback to Crabb-only on any error
    console.error(`Hybrid scan error: ${err instanceof Error ? err.message : String(err)}`);
    return runCrabbOnlyScanners(openclawPath);
  }
}

/**
 * Runs Crabb-only scanners (full set).
 */
async function runCrabbOnlyScanners(openclawPath: string): Promise<ScannerResult[]> {
  const results = await Promise.all([
    scanCredentials(openclawPath),
    scanSkills(openclawPath),
    scanPermissions(openclawPath),
    scanNetwork(openclawPath),
  ]);

  return results;
}

function buildEmptyResults(): ScannerResult[] {
  return [
    { scanner: 'credentials', findings: [], penalty: 0, cap: 40 },
    { scanner: 'skills', findings: [], penalty: 0, cap: 30 },
    { scanner: 'permissions', findings: [], penalty: 0, cap: 20 },
    { scanner: 'network', findings: [], penalty: 0, cap: 10 },
  ];
}

/**
 * Runs Crabb extra scanners (credentials and skills only).
 * These are run alongside OpenClaw audit in hybrid mode.
 *
 * IMPORTANT: In hybrid mode, ONLY credentials and skills scanners run from Crabb.
 * Permissions and network scanning is handled by OpenClaw CLI.
 * This prevents duplicate scanning and ensures consistent results.
 */
async function runCrabbExtraScanners(openclawPath: string): Promise<ScannerResult[]> {
  // HYBRID MODE: Only credentials + skills
  // DO NOT add permissions or network scanners here
  const results = await Promise.all([
    scanCredentials(openclawPath),
    scanSkills(openclawPath),
  ]);

  return results;
}

/**
 * Groups findings by scanner type into ScannerResults.
 */
function groupFindingsByScanner(findings: Finding[]): ScannerResult[] {
  const caps: Record<ScannerType, number> = {
    credentials: 40,
    skills: 30,
    permissions: 20,
    network: 10,
  };

  const penaltyPerSeverity = {
    critical: 20,
    high: 10,
    medium: 5,
    low: 2,
  };

  const grouped: Record<ScannerType, Finding[]> = {
    credentials: [],
    skills: [],
    permissions: [],
    network: [],
  };

  for (const finding of findings) {
    const scanner = finding.module || finding.scanner;
    if (scanner in grouped) {
      grouped[scanner].push(finding);
    }
  }

  return Object.entries(grouped).map(([scanner, findings]) => {
    const scannerType = scanner as ScannerType;
    const rawPenalty = findings.reduce(
      (sum, f) => sum + penaltyPerSeverity[f.severity] * f.confidence,
      0
    );
    const penalty = Math.min(rawPenalty, caps[scannerType]);

    return {
      scanner: scannerType,
      findings,
      penalty,
      cap: caps[scannerType],
    };
  });
}

/**
 * Merges OpenClaw results with Crabb extra results.
 * OpenClaw provides permissions/network, Crabb provides credentials/skills.
 */
function mergeResults(
  openclawResults: ScannerResult[],
  crabbExtras: ScannerResult[]
): ScannerResult[] {
  // Build map of OpenClaw results
  const resultMap = new Map<ScannerType, ScannerResult>();

  // Add all OpenClaw results
  for (const result of openclawResults) {
    resultMap.set(result.scanner, result);
  }

  // Replace/add Crabb extras (credentials and skills)
  for (const result of crabbExtras) {
    if (result.scanner === 'credentials' || result.scanner === 'skills') {
      // If OpenClaw also found credentials/skills issues, merge them
      const existing = resultMap.get(result.scanner);
      if (existing) {
        // Deduplicate by fingerprint
        const seenFingerprints = new Set(existing.findings.map(f => f.fingerprint || ''));
        const newFindings = result.findings.filter(
          f => !seenFingerprints.has(f.fingerprint || '')
        );
        existing.findings.push(...newFindings);
        // Recalculate penalty
        existing.penalty = Math.min(
          existing.findings.reduce(
            (sum, f) => sum + getPenaltyForSeverity(f.severity) * f.confidence,
            0
          ),
          existing.cap
        );
      } else {
        resultMap.set(result.scanner, result);
      }
    }
  }

  // Ensure all scanners are present
  const scannerOrder: ScannerType[] = ['credentials', 'skills', 'permissions', 'network'];
  const caps: Record<ScannerType, number> = {
    credentials: 40,
    skills: 30,
    permissions: 20,
    network: 10,
  };

  return scannerOrder.map(scanner => {
    return resultMap.get(scanner) || {
      scanner,
      findings: [],
      penalty: 0,
      cap: caps[scanner],
    };
  });
}

function getPenaltyForSeverity(severity: string): number {
  const penalties: Record<string, number> = {
    critical: 20,
    high: 10,
    medium: 5,
    low: 2,
  };
  return penalties[severity] || 5;
}

export function getAllFindings(results: ScannerResult[]): Finding[] {
  return results.flatMap(r => r.findings);
}

export function getTotalPenalty(results: ScannerResult[]): number {
  return results.reduce((sum, r) => sum + r.penalty, 0);
}

export { scanCredentials, scanSkills, scanPermissions, scanNetwork };
