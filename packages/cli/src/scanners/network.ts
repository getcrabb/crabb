import { join } from 'node:path';
import { createConnection } from 'node:net';
import type { Finding, ScannerResult } from '../types/index.js';
import { readJsonFile } from '../utils/fs.js';

const CAP = 10;

interface GatewayConfig {
  bind?: string;
  port?: number;
  auth?: boolean;
  tls?: boolean;
}

interface OpenClawConfig {
  gateway?: GatewayConfig;
  [key: string]: unknown;
}

const DEFAULT_PORTS = [18789, 8080, 3000];
const PORT_SCAN_TIMEOUT = 1000;

async function checkPortOpen(port: number, host: string = 'localhost'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host, timeout: PORT_SCAN_TIMEOUT });

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function scanOpenPorts(): Promise<Finding[]> {
  const findings: Finding[] = [];

  for (const port of DEFAULT_PORTS) {
    const isOpen = await checkPortOpen(port);
    if (isOpen) {
      findings.push({
        scanner: 'network',
        severity: 'low',
        title: `Port ${port} is open`,
        description: `Localhost port ${port} is listening, verify if this is expected`,
        confidence: 0.5,
      });
    }
  }

  return findings;
}

function analyzeGatewayConfig(config: OpenClawConfig): Finding[] {
  const findings: Finding[] = [];
  const gateway = config.gateway;

  if (!gateway) return findings;

  const bind = gateway.bind ?? 'localhost';
  const isExposed = bind === '0.0.0.0' || bind === '::';

  if (isExposed) {
    if (!gateway.tls) {
      findings.push({
        scanner: 'network',
        severity: 'high',
        title: 'Exposed gateway without TLS',
        description: 'Gateway is exposed to network without TLS encryption',
        file: 'openclaw.json',
        confidence: 0.9,
      });
    }

    if (!gateway.auth) {
      findings.push({
        scanner: 'network',
        severity: 'critical',
        title: 'Exposed gateway without authentication',
        description: 'Gateway is exposed to network without authentication',
        file: 'openclaw.json',
        confidence: 0.95,
      });
    }
  }

  const port = gateway.port ?? 18789;
  if (port < 1024 && port !== 443 && port !== 80) {
    findings.push({
      scanner: 'network',
      severity: 'medium',
      title: 'Non-standard privileged port',
      description: `Gateway uses privileged port ${port}, requires elevated permissions`,
      file: 'openclaw.json',
      confidence: 0.7,
    });
  }

  return findings;
}

export async function scanNetwork(openclawPath: string): Promise<ScannerResult> {
  const findings: Finding[] = [];

  const configPath = join(openclawPath, 'openclaw.json');
  const config = await readJsonFile<OpenClawConfig>(configPath);

  if (config) {
    findings.push(...analyzeGatewayConfig(config));
  }

  findings.push(...await scanOpenPorts());

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
    scanner: 'network',
    findings,
    penalty: Math.min(penalty, CAP),
    cap: CAP,
  };
}
