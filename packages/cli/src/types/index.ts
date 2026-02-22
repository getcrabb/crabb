export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type ScannerType = 'credentials' | 'skills' | 'permissions' | 'network';

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

// v0.8: OpenClaw Audit Wrapper types
export type AuditMode = 'auto' | 'openclaw' | 'crabb' | 'off';

export type FindingSource =
  | 'openclaw_audit'
  | 'crabb_credentials'
  | 'crabb_skills'
  | 'crabb_permissions'
  | 'crabb_network';

export type FindingModule = 'credentials' | 'skills' | 'permissions' | 'network';

export interface Finding {
  scanner: ScannerType;
  severity: Severity;
  title: string;
  description: string;
  file?: string;
  line?: number;
  confidence: number; // 0.0 - 1.0
  // v0.8: Extended fields
  id?: string;              // stable identifier for dedup
  source?: FindingSource;   // origin of the finding
  module?: FindingModule;   // category
  remediation?: string;     // how to fix
  fingerprint?: string;     // dedup key
}

export interface ScannerResult {
  scanner: ScannerType;
  findings: Finding[];
  penalty: number;
  cap: number;
}

export interface ScanResultMeta {
  auditMode: AuditMode;
  openclawVersion: string | null;
  openclawAvailable: boolean;
  cliVersion: string;
}

export interface ScanResult {
  score: number;
  grade: Grade;
  scanners: ScannerResult[];
  findings: Finding[];
  timestamp: string;
  openclawPath: string;
  meta?: ScanResultMeta;
}

export interface CliOptions {
  path: string;
  json: boolean;
  share: boolean;
  source: ShareSource;
  campaign?: string;
  shareTheme: ShareTheme;
  noColor: boolean;
  // v0.8: Audit wrapper options
  audit: AuditMode;
  deep: boolean;
  fix: boolean;
  fixOnly: boolean;
  yes: boolean;
  noBackup: boolean;
  printOpenclaw: boolean;
}

export interface SharePayload {
  score: number;
  grade: Grade;
  source?: ShareSource;
  campaign?: string;
  theme?: ShareTheme;
  scannerSummary: {
    scanner: ScannerType;
    findingsCount: number;
    penalty: number;
  }[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  timestamp: string;
  // v0.8: Extended fields
  auditMode?: AuditMode;
  openclawVersion?: string | null;
  cliVersion?: string;
  // v0.8: Verified badge (score >= 75 && no critical)
  verified?: boolean;
  // v0.8: Improvement delta (for repeated scans after fix)
  improvement?: {
    previousScore: number;
    delta: number;
  };
}

export type ShareSource =
  | 'cli'
  | 'skill'
  | 'ci'
  | 'social_x'
  | 'social_tg'
  | 'github'
  | 'direct';

export type ShareTheme = 'cyber' | 'meme' | 'minimal';

export interface ShareResponse {
  id: string;
  url: string;
  deleteToken: string;
}

// v0.8: OpenClaw detection types
export interface OpenClawInfo {
  path: string | null;
  version: string | null;
  available: boolean;
}

// v0.8: OpenClaw runner types
export interface OpenClawRunResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export type OpenClawOutputFormat = 'json' | 'text';

export interface OpenClawAuditResult {
  findings: Finding[];
  format: OpenClawOutputFormat;
  raw: string;
}

// v0.8: Fix flow types
export interface ScanDelta {
  previousScore: number;
  newScore: number;
  fixed: Finding[];
  newFindings: Finding[];
  unchanged: Finding[];
}
