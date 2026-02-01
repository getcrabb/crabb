import { join } from 'node:path';
import type { Finding, ScannerResult } from '../types/index.js';
import { readTextFile, walkDirectory, fileExists } from '../utils/fs.js';

const CAP = 40;

interface CredentialPattern {
  name: string;
  pattern: RegExp;
  severity: 'critical' | 'high' | 'medium';
  confidence: number;
}

const CREDENTIAL_PATTERNS: CredentialPattern[] = [
  // Anthropic
  {
    name: 'Anthropic API Key',
    pattern: /sk-ant-[a-zA-Z0-9-]{20,}/g,
    severity: 'critical',
    confidence: 0.95,
  },
  // OpenAI
  {
    name: 'OpenAI API Key',
    pattern: /sk-[a-zA-Z0-9]{20,}(?!-ant)/g,
    severity: 'critical',
    confidence: 0.9,
  },
  // Discord
  {
    name: 'Discord Bot Token',
    pattern: /[MN][A-Za-z\d]{23,}\.[\w-]{6}\.[\w-]{27,}/g,
    severity: 'critical',
    confidence: 0.95,
  },
  // Telegram
  {
    name: 'Telegram Bot Token',
    pattern: /\d{8,10}:[A-Za-z0-9_-]{35}/g,
    severity: 'critical',
    confidence: 0.9,
  },
  // AWS
  {
    name: 'AWS Access Key ID',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'critical',
    confidence: 0.95,
  },
  {
    name: 'AWS Secret Access Key',
    pattern: /(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])/g,
    severity: 'high',
    confidence: 0.6,
  },
  // GitHub
  {
    name: 'GitHub Personal Access Token',
    pattern: /ghp_[a-zA-Z0-9]{36}/g,
    severity: 'critical',
    confidence: 0.95,
  },
  {
    name: 'GitHub OAuth Token',
    pattern: /gho_[a-zA-Z0-9]{36}/g,
    severity: 'critical',
    confidence: 0.95,
  },
  {
    name: 'GitHub Fine-grained PAT',
    pattern: /github_pat_[a-zA-Z0-9_]{22,}/g,
    severity: 'critical',
    confidence: 0.95,
  },
  // Slack
  {
    name: 'Slack Bot Token',
    pattern: /xoxb-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}/g,
    severity: 'critical',
    confidence: 0.95,
  },
  {
    name: 'Slack User Token',
    pattern: /xoxp-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}/g,
    severity: 'critical',
    confidence: 0.95,
  },
  // Stripe
  {
    name: 'Stripe Secret Key',
    pattern: /sk_live_[0-9a-zA-Z]{24,}/g,
    severity: 'critical',
    confidence: 0.95,
  },
  {
    name: 'Stripe Test Key',
    pattern: /sk_test_[0-9a-zA-Z]{24,}/g,
    severity: 'medium',
    confidence: 0.9,
  },
  // Generic patterns
  {
    name: 'Generic API Key',
    pattern: /(?:api[_-]?key|apikey|api[_-]?token)\s*[=:]\s*["']?([a-zA-Z0-9_-]{20,})["']?/gi,
    severity: 'high',
    confidence: 0.7,
  },
  {
    name: 'Generic Secret',
    pattern: /(?:secret|password|passwd|pwd)\s*[=:]\s*["']?([a-zA-Z0-9_!@#$%^&*-]{8,})["']?/gi,
    severity: 'high',
    confidence: 0.6,
  },
  // Private Keys
  {
    name: 'Private Key',
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    severity: 'critical',
    confidence: 0.99,
  },
];

const PLACEHOLDER_PATTERNS = [
  /^your[-_]?api[-_]?key[-_]?here$/i,
  /^xxx+$/i,
  /^placeholder$/i,
  /^example$/i,
  /^test[-_]?key$/i,
  /^\$\{[^}]+\}$/,
  /^<[^>]+>$/,
  /^{{[^}]+}}$/,
  /^%[^%]+%$/,
  /^INSERT[-_]?YOUR[-_]?KEY$/i,
  /^REPLACE[-_]?ME$/i,
  /^TODO$/i,
  /^changeme$/i,
];

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(value.trim()));
}

function extractValue(match: RegExpMatchArray): string {
  return match[1] ?? match[0];
}

async function scanFile(
  filePath: string,
  relativePath: string
): Promise<Finding[]> {
  const content = await readTextFile(filePath);
  if (!content) return [];

  const findings: Finding[] = [];
  const lines = content.split('\n');

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum]!;

    for (const credPattern of CREDENTIAL_PATTERNS) {
      credPattern.pattern.lastIndex = 0;

      let match: RegExpExecArray | null;
      while ((match = credPattern.pattern.exec(line)) !== null) {
        const value = extractValue(match);

        if (isPlaceholder(value)) {
          continue;
        }

        if (value.length < 8) {
          continue;
        }

        findings.push({
          scanner: 'credentials',
          severity: credPattern.severity,
          title: credPattern.name,
          description: `Detected ${credPattern.name} in configuration file`,
          file: relativePath,
          line: lineNum + 1,
          confidence: credPattern.confidence,
        });
      }
    }
  }

  return findings;
}

export async function scanCredentials(openclawPath: string): Promise<ScannerResult> {
  const findings: Finding[] = [];

  const filesToScan = [
    { path: join(openclawPath, 'openclaw.json'), relative: 'openclaw.json' },
    { path: join(openclawPath, '.env'), relative: '.env' },
  ];

  const credentialsDir = join(openclawPath, 'credentials');
  if (await fileExists(credentialsDir)) {
    for await (const file of walkDirectory(credentialsDir, openclawPath)) {
      filesToScan.push({ path: file.path, relative: file.relativePath });
    }
  }

  const agentsDir = join(openclawPath, 'agents');
  if (await fileExists(agentsDir)) {
    for await (const file of walkDirectory(agentsDir, openclawPath)) {
      if (
        file.relativePath.includes('auth-profiles.json') ||
        file.relativePath.endsWith('.jsonl') ||
        file.relativePath.endsWith('.json')
      ) {
        filesToScan.push({ path: file.path, relative: file.relativePath });
      }
    }
  }

  for (const file of filesToScan) {
    if (await fileExists(file.path)) {
      const fileFindings = await scanFile(file.path, file.relative);
      findings.push(...fileFindings);
    }
  }

  const severityScores = {
    critical: 27.5,
    high: 17.5,
    medium: 7.5,
    low: 2.5,
  };

  let penalty = 0;
  for (const finding of findings) {
    penalty += severityScores[finding.severity] * finding.confidence;
  }

  return {
    scanner: 'credentials',
    findings,
    penalty: Math.min(penalty, CAP),
    cap: CAP,
  };
}
