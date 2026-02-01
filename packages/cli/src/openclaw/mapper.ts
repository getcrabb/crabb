import type { Finding, Severity, FindingModule, ScannerType } from '../types/index.js';

export interface RawOpenClawFinding {
  id?: string;
  severity?: string;
  level?: string;
  title?: string;
  message?: string;
  description?: string;
  file?: string;
  line?: number;
  remediation?: string;
  category?: string;
  module?: string;
}

/**
 * Known OpenClaw finding types with their mappings.
 */
const FINDING_MAPPING: Record<string, { module: FindingModule; defaultSeverity: Severity }> = {
  // Network findings
  'gateway_exposed_no_auth': { module: 'network', defaultSeverity: 'critical' },
  'gateway_exposed': { module: 'network', defaultSeverity: 'high' },
  'gateway_insecure_bind': { module: 'network', defaultSeverity: 'high' },
  'tls_disabled': { module: 'network', defaultSeverity: 'high' },
  'localhost_exposed': { module: 'network', defaultSeverity: 'medium' },

  // Permissions findings
  'sandbox_disabled': { module: 'permissions', defaultSeverity: 'critical' },
  'dm_policy_allow': { module: 'permissions', defaultSeverity: 'medium' },
  'dm_policy_permissive': { module: 'permissions', defaultSeverity: 'medium' },
  'allowlist_empty': { module: 'permissions', defaultSeverity: 'low' },
  'allowlist_too_broad': { module: 'permissions', defaultSeverity: 'medium' },

  // Credentials findings (from OpenClaw audit, not Crabb scanner)
  'api_key_exposed': { module: 'credentials', defaultSeverity: 'critical' },
  'token_in_config': { module: 'credentials', defaultSeverity: 'high' },
  'secret_in_log': { module: 'credentials', defaultSeverity: 'high' },

  // Skills findings
  'skill_suspicious_pattern': { module: 'skills', defaultSeverity: 'high' },
  'skill_shell_access': { module: 'skills', defaultSeverity: 'critical' },
  'skill_network_access': { module: 'skills', defaultSeverity: 'medium' },
};

/**
 * Maps severity string to normalized Severity type.
 */
function normalizeSeverity(severity: string | undefined): Severity {
  if (!severity) return 'medium';

  const lower = severity.toLowerCase();
  switch (lower) {
    case 'critical':
    case 'crit':
    case 'fatal':
      return 'critical';
    case 'high':
    case 'error':
      return 'high';
    case 'medium':
    case 'med':
    case 'warning':
    case 'warn':
      return 'medium';
    case 'low':
    case 'info':
    case 'notice':
      return 'low';
    default:
      return 'medium';
  }
}

/**
 * Determines the module for a finding based on id or category.
 */
function determineModule(raw: RawOpenClawFinding): FindingModule {
  // Check explicit module field
  if (raw.module) {
    const lower = raw.module.toLowerCase();
    if (lower === 'credentials' || lower === 'credential' || lower === 'secrets') return 'credentials';
    if (lower === 'skills' || lower === 'skill') return 'skills';
    if (lower === 'permissions' || lower === 'permission' || lower === 'sandbox') return 'permissions';
    if (lower === 'network' || lower === 'gateway') return 'network';
  }

  // Check known ID mappings
  if (raw.id && FINDING_MAPPING[raw.id]) {
    return FINDING_MAPPING[raw.id].module;
  }

  // Check category
  if (raw.category) {
    const lower = raw.category.toLowerCase();
    if (lower.includes('credential') || lower.includes('secret') || lower.includes('key')) return 'credentials';
    if (lower.includes('skill')) return 'skills';
    if (lower.includes('permission') || lower.includes('sandbox')) return 'permissions';
    if (lower.includes('network') || lower.includes('gateway')) return 'network';
  }

  // Guess from title/message content
  const text = (raw.title || raw.message || '').toLowerCase();
  if (text.includes('api key') || text.includes('token') || text.includes('secret') || text.includes('credential')) {
    return 'credentials';
  }
  if (text.includes('skill')) return 'skills';
  if (text.includes('sandbox') || text.includes('permission') || text.includes('dm policy')) return 'permissions';
  if (text.includes('gateway') || text.includes('network') || text.includes('tls')) return 'network';

  return 'permissions'; // Default to permissions for unknown
}

/**
 * Maps module to scanner type.
 */
function moduleToScannerType(module: FindingModule): ScannerType {
  return module; // They're identical in this codebase
}

/**
 * Creates a fingerprint for deduplication.
 */
function createFingerprint(finding: Partial<Finding>): string {
  const parts = [
    finding.scanner || 'unknown',
    finding.title || '',
    finding.file || '',
    finding.line?.toString() || '',
  ];
  return parts.join(':').toLowerCase().replace(/\s+/g, '_');
}

/**
 * Maps raw OpenClaw finding to unified Finding format.
 */
export function mapOpenClawFinding(raw: RawOpenClawFinding): Finding {
  const severity = normalizeSeverity(raw.severity || raw.level);
  const module = determineModule(raw);
  const scanner = moduleToScannerType(module);

  const title = raw.title || raw.message || 'Unknown finding';
  const description = raw.description || raw.message || title;

  // Apply known mapping defaults if available
  let finalSeverity = severity;
  if (raw.id && FINDING_MAPPING[raw.id]) {
    // Use mapped severity only if raw severity wasn't explicit
    if (!raw.severity && !raw.level) {
      finalSeverity = FINDING_MAPPING[raw.id].defaultSeverity;
    }
  }

  const finding: Finding = {
    scanner,
    severity: finalSeverity,
    title,
    description,
    file: raw.file,
    line: raw.line,
    confidence: 0.9, // OpenClaw findings are generally high confidence
    id: raw.id,
    source: 'openclaw_audit',
    module,
    remediation: raw.remediation,
  };

  finding.fingerprint = createFingerprint(finding);

  return finding;
}

/**
 * Creates a Crabb-native finding (for credentials/skills scanners).
 */
export function createCrabbFinding(
  scanner: ScannerType,
  severity: Severity,
  title: string,
  description: string,
  options?: {
    file?: string;
    line?: number;
    confidence?: number;
    remediation?: string;
  }
): Finding {
  const sourceMap: Record<ScannerType, Finding['source']> = {
    credentials: 'crabb_credentials',
    skills: 'crabb_skills',
    permissions: 'crabb_permissions',
    network: 'crabb_network',
  };

  const finding: Finding = {
    scanner,
    severity,
    title,
    description,
    file: options?.file,
    line: options?.line,
    confidence: options?.confidence ?? 0.8,
    source: sourceMap[scanner],
    module: scanner,
    remediation: options?.remediation,
  };

  finding.fingerprint = createFingerprint(finding);

  return finding;
}
