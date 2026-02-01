import { homedir } from 'node:os';
import { join } from 'node:path';

export function getDefaultOpenClawPath(): string {
  return join(homedir(), '.openclaw');
}

export function getOpenClawPaths(basePath: string) {
  return {
    root: basePath,
    config: join(basePath, 'openclaw.json'),
    credentials: join(basePath, 'credentials'),
    agents: join(basePath, 'agents'),
    skills: join(basePath, 'skills'),
    workspaceSkills: join(basePath, 'workspace', 'skills'),
  };
}

export const SCAN_FILE_PATTERNS = {
  credentials: [
    'openclaw.json',
    'credentials/**/*',
    'agents/*/agent/auth-profiles.json',
    'agents/*/sessions/*.jsonl',
    '.env',
    '.env.*',
  ],
  skills: [
    'skills/**/*.md',
    'skills/**/SKILL.md',
    'workspace/skills/**/*.md',
  ],
} as const;
