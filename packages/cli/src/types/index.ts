export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type ScannerType = 'credentials' | 'skills' | 'permissions' | 'network';

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface Finding {
  scanner: ScannerType;
  severity: Severity;
  title: string;
  description: string;
  file?: string;
  line?: number;
  confidence: number; // 0.0 - 1.0
}

export interface ScannerResult {
  scanner: ScannerType;
  findings: Finding[];
  penalty: number;
  cap: number;
}

export interface ScanResult {
  score: number;
  grade: Grade;
  scanners: ScannerResult[];
  findings: Finding[];
  timestamp: string;
  openclawPath: string;
}

export interface CliOptions {
  path: string;
  json: boolean;
  share: boolean;
  noColor: boolean;
}

export interface SharePayload {
  score: number;
  grade: Grade;
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
}

export interface ShareResponse {
  id: string;
  url: string;
  deleteToken: string;
}
