import { join } from 'node:path';
import type { Finding, ScannerResult } from '../types/index.js';
import { readJsonFile, getFileStats, fileExists } from '../utils/fs.js';

const CAP = 20;

interface OpenClawConfig {
  sandbox?: {
    mode?: 'strict' | 'permissive' | 'disabled';
  };
  dmPolicy?: 'allow' | 'deny' | 'ask';
  allowlist?: string[];
  gateway?: {
    bind?: string;
    auth?: boolean;
    tls?: boolean;
  };
  [key: string]: unknown;
}

function checkSandboxMode(config: OpenClawConfig): Finding | null {
  const mode = config.sandbox?.mode;

  if (mode === 'disabled') {
    return {
      scanner: 'permissions',
      severity: 'critical',
      title: 'Sandbox disabled',
      description: 'Agent sandbox is completely disabled, allowing unrestricted system access',
      file: 'openclaw.json',
      confidence: 0.95,
    };
  }

  if (mode === 'permissive') {
    return {
      scanner: 'permissions',
      severity: 'high',
      title: 'Sandbox in permissive mode',
      description: 'Agent sandbox is in permissive mode, may allow unintended access',
      file: 'openclaw.json',
      confidence: 0.85,
    };
  }

  return null;
}

function checkDmPolicy(config: OpenClawConfig): Finding | null {
  const policy = config.dmPolicy;

  if (policy === 'allow') {
    return {
      scanner: 'permissions',
      severity: 'medium',
      title: 'DM policy allows all',
      description: 'Direct message policy allows all messages without filtering',
      file: 'openclaw.json',
      confidence: 0.7,
    };
  }

  return null;
}

function checkAllowlist(config: OpenClawConfig): Finding[] {
  const findings: Finding[] = [];
  const allowlist = config.allowlist ?? [];

  for (const entry of allowlist) {
    if (entry === '*' || entry === '**') {
      findings.push({
        scanner: 'permissions',
        severity: 'critical',
        title: 'Wildcard allowlist',
        description: 'Allowlist contains unrestricted wildcard, allowing all access',
        file: 'openclaw.json',
        confidence: 0.95,
      });
    } else if (entry.includes('*')) {
      findings.push({
        scanner: 'permissions',
        severity: 'medium',
        title: 'Broad allowlist pattern',
        description: `Allowlist pattern "${entry}" may be too permissive`,
        file: 'openclaw.json',
        confidence: 0.6,
      });
    }
  }

  return findings;
}

function checkGateway(config: OpenClawConfig): Finding[] {
  const findings: Finding[] = [];
  const gateway = config.gateway;

  if (!gateway) return findings;

  if (gateway.bind === '0.0.0.0' || gateway.bind === '::') {
    findings.push({
      scanner: 'permissions',
      severity: 'high',
      title: 'Gateway binds to all interfaces',
      description: 'Gateway is exposed on all network interfaces, should bind to localhost',
      file: 'openclaw.json',
      confidence: 0.9,
    });
  }

  if (gateway.auth === false) {
    findings.push({
      scanner: 'permissions',
      severity: 'high',
      title: 'Gateway authentication disabled',
      description: 'Gateway has authentication disabled, allowing unauthenticated access',
      file: 'openclaw.json',
      confidence: 0.9,
    });
  }

  if (gateway.tls === false && gateway.bind !== 'localhost' && gateway.bind !== '127.0.0.1') {
    findings.push({
      scanner: 'permissions',
      severity: 'medium',
      title: 'Gateway TLS disabled',
      description: 'Gateway TLS is disabled for non-localhost connections',
      file: 'openclaw.json',
      confidence: 0.75,
    });
  }

  return findings;
}

async function checkFilePermissions(openclawPath: string): Promise<Finding[]> {
  const findings: Finding[] = [];

  const rootStats = await getFileStats(openclawPath);
  if (rootStats) {
    const mode = rootStats.mode & 0o777;
    if ((mode & 0o077) !== 0) {
      findings.push({
        scanner: 'permissions',
        severity: 'medium',
        title: 'OpenClaw directory too permissive',
        description: `Directory permissions ${mode.toString(8)} allow group/other access, recommend 700`,
        file: openclawPath,
        confidence: 0.8,
      });
    }
  }

  const credentialsDir = join(openclawPath, 'credentials');
  if (await fileExists(credentialsDir)) {
    const credStats = await getFileStats(credentialsDir);
    if (credStats) {
      const mode = credStats.mode & 0o777;
      if ((mode & 0o077) !== 0) {
        findings.push({
          scanner: 'permissions',
          severity: 'high',
          title: 'Credentials directory too permissive',
          description: `Credentials permissions ${mode.toString(8)} allow group/other access, recommend 700`,
          file: 'credentials/',
          confidence: 0.9,
        });
      }
    }
  }

  return findings;
}

export async function scanPermissions(openclawPath: string): Promise<ScannerResult> {
  const findings: Finding[] = [];

  const configPath = join(openclawPath, 'openclaw.json');
  const config = await readJsonFile<OpenClawConfig>(configPath);

  if (config) {
    const sandboxFinding = checkSandboxMode(config);
    if (sandboxFinding) findings.push(sandboxFinding);

    const dmFinding = checkDmPolicy(config);
    if (dmFinding) findings.push(dmFinding);

    findings.push(...checkAllowlist(config));
    findings.push(...checkGateway(config));
  }

  findings.push(...await checkFilePermissions(openclawPath));

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
    scanner: 'permissions',
    findings,
    penalty: Math.min(penalty, CAP),
    cap: CAP,
  };
}
