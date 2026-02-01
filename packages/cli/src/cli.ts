import { parseArgs } from 'node:util';
import { exit } from 'node:process';
import type { CliOptions, AuditMode, OpenClawInfo } from './types/index.js';
import { getDefaultOpenClawPath } from './config/paths.js';
import { runAllScanners } from './scanners/index.js';
import { buildScanResult, getExitCode } from './scoring/index.js';
import {
  printHeader,
  printScore,
  printFindings,
  printScannerSummary,
  printError,
  printSuccess,
  printWarning,
  printAuditModeInfo,
  printNextSteps,
  createSpinner,
} from './output/terminal.js';
import { formatJsonOutput } from './output/json.js';
import { shareResult } from './share/index.js';
import { fileExists } from './utils/fs.js';
import { detectOpenClaw } from './openclaw/index.js';
import { runFixFlow } from './fix/index.js';

const CLI_VERSION = '0.8.0';

function parseAuditMode(value: string | undefined): AuditMode {
  if (!value) return 'auto';
  const lower = value.toLowerCase();
  if (lower === 'auto' || lower === 'openclaw' || lower === 'crabb' || lower === 'off') {
    return lower as AuditMode;
  }
  throw new Error(`Invalid audit mode: ${value}. Use: auto, openclaw, crabb, or off`);
}

function resolveAuditMode(requested: AuditMode, openclawAvailable: boolean): AuditMode {
  if (requested === 'openclaw' && !openclawAvailable) {
    printError('OpenClaw CLI not found. Install openclaw or use --audit crabb');
    exit(2);
  }
  if (requested === 'auto') {
    return openclawAvailable ? 'auto' : 'crabb';
  }
  return requested;
}

function printHelp() {
  console.log(`
\u{1F980} CRABB v${CLI_VERSION} - Security Scanner for OpenClaw AI Agents

Usage: crabb [options]

Options:
  -p, --path <dir>              Path to OpenClaw directory (default: ~/.openclaw/)
  -j, --json                    Output results as JSON
  -s, --share                   Share score card to crabb.ai
      --no-color                Disable colored output

Audit Mode:
      --audit <mode>            Audit mode: auto|openclaw|crabb|off (default: auto)
                                  auto     - Use OpenClaw if available, else Crabb-only
                                  openclaw - Require OpenClaw CLI
                                  crabb    - Use Crabb scanners only
                                  off      - Skip audit entirely
      --deep                    Request deep audit (OpenClaw only)

Fix Mode:
      --fix                     Run OpenClaw --fix after scan
      --fix-only                Apply fix and exit (no post-rescan)
      --yes                     Skip confirmation prompt for --fix

Debug:
      --print-openclaw          Show raw OpenClaw output

Help:
  -h, --help                    Show this help message
  -v, --version                 Show version number

Examples:
  crabb                          # Auto-detect and scan
  crabb --path ./my-openclaw     # Scan custom directory
  crabb --audit crabb            # Crabb scanners only
  crabb --fix                    # Scan and apply fixes
  crabb --json                   # Output as JSON

Exit codes:
  0 - Score >= 75, no Critical/High findings
  1 - Score < 75 or Critical/High findings present
  2 - Scan failed (IO error, OpenClaw not found)
`);
}

function printVersion() {
  console.log(`crabb v${CLI_VERSION}`);
}

async function main() {
  let options: CliOptions;
  let openclawInfo: OpenClawInfo = { path: null, version: null, available: false };

  try {
    const { values } = parseArgs({
      options: {
        path: { type: 'string', short: 'p' },
        json: { type: 'boolean', short: 'j', default: false },
        share: { type: 'boolean', short: 's', default: false },
        'no-color': { type: 'boolean', default: false },
        help: { type: 'boolean', short: 'h', default: false },
        version: { type: 'boolean', short: 'v', default: false },
        // v0.8 flags
        audit: { type: 'string', default: 'auto' },
        deep: { type: 'boolean', default: false },
        fix: { type: 'boolean', default: false },
        'fix-only': { type: 'boolean', default: false },
        yes: { type: 'boolean', default: false },
        'print-openclaw': { type: 'boolean', default: false },
      },
      strict: true,
      allowPositionals: false,
    });

    if (values.help) {
      printHelp();
      exit(0);
    }

    if (values.version) {
      printVersion();
      exit(0);
    }

    const requestedAuditMode = parseAuditMode(values.audit);

    options = {
      path: values.path ?? getDefaultOpenClawPath(),
      json: values.json ?? false,
      share: values.share ?? false,
      noColor: values['no-color'] ?? false,
      audit: requestedAuditMode,
      deep: values.deep ?? false,
      fix: values.fix ?? false,
      fixOnly: values['fix-only'] ?? false,
      yes: values.yes ?? false,
      printOpenclaw: values['print-openclaw'] ?? false,
    };
  } catch (err) {
    printError(`Invalid arguments: ${err instanceof Error ? err.message : String(err)}`);
    printHelp();
    exit(2);
  }

  if (options.noColor) {
    process.env['FORCE_COLOR'] = '0';
  }

  if (!options.json) {
    printHeader();
  }

  if (!await fileExists(options.path)) {
    printError(`OpenClaw directory not found: ${options.path}`);
    exit(2);
  }

  // Detect OpenClaw CLI
  const detectSpinner = options.json ? null : createSpinner('Detecting OpenClaw CLI...');
  detectSpinner?.start();

  try {
    openclawInfo = await detectOpenClaw();
    detectSpinner?.stop();
  } catch {
    detectSpinner?.stop();
    // Ignore detection errors, just treat as not available
  }

  // Resolve audit mode based on availability
  const auditMode = resolveAuditMode(options.audit, openclawInfo.available);

  if (!options.json) {
    printAuditModeInfo(auditMode, openclawInfo);
  }

  // Handle fix flow separately
  if (options.fix || options.fixOnly) {
    if (!openclawInfo.available) {
      printError('--fix requires OpenClaw CLI. Install openclaw first.');
      exit(2);
    }

    try {
      const fixResult = await runFixFlow({
        openclawPath: options.path,
        openclawInfo,
        yes: options.yes,
        json: options.json,
        deep: options.deep,
        fixOnly: options.fixOnly,
        cliVersion: CLI_VERSION,
      });

      exit(fixResult.exitCode);
    } catch (err) {
      printError(`Fix failed: ${err instanceof Error ? err.message : String(err)}`);
      exit(2);
    }
  }

  // Regular scan flow
  const spinner = options.json ? null : createSpinner('Scanning OpenClaw configuration...');
  spinner?.start();

  try {
    const scannerResults = await runAllScanners({
      openclawPath: options.path,
      auditMode,
      openclawInfo,
      deep: options.deep,
      printOpenclaw: options.printOpenclaw,
    });
    const result = buildScanResult(scannerResults, options.path, {
      auditMode,
      openclawVersion: openclawInfo.version,
      openclawAvailable: openclawInfo.available,
      cliVersion: CLI_VERSION,
    });

    spinner?.stop();

    if (options.json) {
      console.log(formatJsonOutput(result));
    } else {
      printScore(result);
      printScannerSummary(result);
      printFindings(result.findings);

      // Show next steps if there are findings
      if (result.findings.length > 0 && openclawInfo.available) {
        printNextSteps(result, openclawInfo.available);
      }
    }

    if (options.share) {
      const shareSpinner = options.json ? null : createSpinner('Sharing score card...');
      shareSpinner?.start();

      try {
        const shareResponse = await shareResult(result);
        shareSpinner?.stop();

        if (options.json) {
          console.log(JSON.stringify({ shared: shareResponse }, null, 2));
        } else {
          printSuccess(`Score card shared: ${shareResponse.url}`);
          console.log(`   Delete token: ${shareResponse.deleteToken}`);
        }
      } catch (err) {
        shareSpinner?.stop();
        printError(`Failed to share: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const exitCode = getExitCode(result);
    exit(exitCode);
  } catch (err) {
    spinner?.stop();
    printError(`Scan failed: ${err instanceof Error ? err.message : String(err)}`);
    exit(2);
  }
}

main();
