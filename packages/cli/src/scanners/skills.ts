import { join } from 'node:path';
import type { Finding, ScannerResult } from '../types/index.js';
import { readTextFile, walkDirectory, fileExists } from '../utils/fs.js';

const CAP = 30;

interface SkillPattern {
  name: string;
  pattern: RegExp;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  description: string;
}

const SKILL_PATTERNS: SkillPattern[] = [
  // Critical: Remote code execution
  {
    name: 'Curl piped to shell',
    pattern: /curl\s+[^|]*\|\s*(?:bash|sh|zsh)/gi,
    severity: 'critical',
    confidence: 0.95,
    description: 'Downloading and executing remote scripts is extremely dangerous',
  },
  {
    name: 'Wget piped to shell',
    pattern: /wget\s+[^|]*\|\s*(?:bash|sh|zsh)/gi,
    severity: 'critical',
    confidence: 0.95,
    description: 'Downloading and executing remote scripts is extremely dangerous',
  },
  {
    name: 'Code execution function',
    pattern: /\b(?:eval|Function)\s*\(/gi,
    severity: 'critical',
    confidence: 0.8,
    description: 'Dynamic code execution can lead to arbitrary code execution',
  },
  {
    name: 'System command execution',
    pattern: /\b(?:os\.system|subprocess\.call|subprocess\.run|child_process)\s*\(/gi,
    severity: 'critical',
    confidence: 0.85,
    description: 'System command execution may allow arbitrary command injection',
  },
  // Critical: Sensitive file access
  {
    name: 'SSH key access',
    pattern: /\.ssh\/(?:id_rsa|id_ed25519|id_dsa|authorized_keys)/gi,
    severity: 'critical',
    confidence: 0.9,
    description: 'Accessing SSH keys can compromise authentication',
  },
  {
    name: 'Password file access',
    pattern: /\/etc\/(?:passwd|shadow)/gi,
    severity: 'critical',
    confidence: 0.95,
    description: 'Accessing system password files is a security risk',
  },
  // High: Data exfiltration patterns
  {
    name: 'POST request with data',
    pattern: /(?:curl|wget|fetch|axios|request)\s+.*(?:-d|--data|POST)/gi,
    severity: 'high',
    confidence: 0.7,
    description: 'Outbound data transmission may indicate exfiltration',
  },
  {
    name: 'Base64 encode and send',
    pattern: /base64.*(?:curl|wget|fetch|send|post)/gi,
    severity: 'high',
    confidence: 0.75,
    description: 'Encoding and transmitting data may indicate exfiltration',
  },
  {
    name: 'Environment variable dump',
    pattern: /\benv\b|\$ENV|\bprocess\.env\b|\bos\.environ\b/gi,
    severity: 'high',
    confidence: 0.6,
    description: 'Environment access may expose sensitive configuration',
  },
  // Medium: File system access
  {
    name: 'Unrestricted file read',
    pattern: /(?:fs\.readFile|open\s*\(|read\s*\().*(?:\*|\.\.)/gi,
    severity: 'medium',
    confidence: 0.6,
    description: 'Broad file read patterns may access unintended files',
  },
  {
    name: 'Home directory access',
    pattern: /~\/|\/home\/|\$HOME/gi,
    severity: 'medium',
    confidence: 0.5,
    description: 'Accessing user home directory may expose sensitive data',
  },
  {
    name: 'Recursive directory operations',
    pattern: /(?:-r|--recursive|walk|glob\*\*)/gi,
    severity: 'medium',
    confidence: 0.4,
    description: 'Recursive operations may access more files than intended',
  },
  // Low: Suspicious but not necessarily harmful
  {
    name: 'Network connection',
    pattern: /(?:socket|connect|http|https):\/\//gi,
    severity: 'low',
    confidence: 0.3,
    description: 'Network connections should be reviewed for necessity',
  },
  {
    name: 'File write operation',
    pattern: /(?:fs\.writeFile|open\s*\([^)]*['"]\s*w|>+\s*[a-zA-Z])/gi,
    severity: 'low',
    confidence: 0.4,
    description: 'File write operations should be reviewed',
  },
];

async function scanSkillFile(
  filePath: string,
  relativePath: string
): Promise<Finding[]> {
  const content = await readTextFile(filePath);
  if (!content) return [];

  const findings: Finding[] = [];
  const lines = content.split('\n');

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum]!;

    for (const skillPattern of SKILL_PATTERNS) {
      skillPattern.pattern.lastIndex = 0;

      if (skillPattern.pattern.test(line)) {
        findings.push({
          scanner: 'skills',
          severity: skillPattern.severity,
          title: skillPattern.name,
          description: skillPattern.description,
          file: relativePath,
          line: lineNum + 1,
          confidence: skillPattern.confidence,
        });
      }
    }
  }

  return findings;
}

export async function scanSkills(openclawPath: string): Promise<ScannerResult> {
  const findings: Finding[] = [];

  const skillsDirs = [
    join(openclawPath, 'skills'),
    join(openclawPath, 'workspace', 'skills'),
  ];

  for (const skillsDir of skillsDirs) {
    if (await fileExists(skillsDir)) {
      for await (const file of walkDirectory(skillsDir, openclawPath)) {
        if (file.relativePath.endsWith('.md')) {
          const fileFindings = await scanSkillFile(file.path, file.relativePath);
          findings.push(...fileFindings);
        }
      }
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
    scanner: 'skills',
    findings,
    penalty: Math.min(penalty, CAP),
    cap: CAP,
  };
}
