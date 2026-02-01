import { parseArgs } from 'node:util';
import { exit } from 'node:process';
import type { CliOptions } from './types/index.js';
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
  createSpinner,
} from './output/terminal.js';
import { formatJsonOutput } from './output/json.js';
import { shareResult } from './share/index.js';
import { fileExists } from './utils/fs.js';

function parseCliArgs(): CliOptions {
  const { values } = parseArgs({
    options: {
      path: {
        type: 'string',
        short: 'p',
      },
      json: {
        type: 'boolean',
        short: 'j',
        default: false,
      },
      share: {
        type: 'boolean',
        short: 's',
        default: false,
      },
      'no-color': {
        type: 'boolean',
        default: false,
      },
      help: {
        type: 'boolean',
        short: 'h',
        default: false,
      },
      version: {
        type: 'boolean',
        short: 'v',
        default: false,
      },
    },
    strict: true,
    allowPositionals: false,
  });

  return {
    path: values.path ?? getDefaultOpenClawPath(),
    json: values.json ?? false,
    share: values.share ?? false,
    noColor: values['no-color'] ?? false,
  };
}

function printHelp() {
  console.log(`
\u{1F980} CRABB - Security Scanner for OpenClaw AI Agents

Usage: crabb [options]

Options:
  -p, --path <dir>   Path to OpenClaw directory (default: ~/.openclaw/)
  -j, --json         Output results as JSON
  -s, --share        Share score card to crabb.ai
      --no-color     Disable colored output
  -h, --help         Show this help message
  -v, --version      Show version number

Examples:
  crabb                          # Scan default OpenClaw installation
  crabb --path ./my-openclaw     # Scan custom directory
  crabb --json                   # Output as JSON
  crabb --share                  # Create shareable score card

Exit codes:
  0 - Score >= 75, no Critical/High findings
  1 - Score < 75 or Critical/High findings present
  2 - Scan failed (IO error, OpenClaw not found)
`);
}

function printVersion() {
  console.log('crabb v0.1.0');
}

async function main() {
  let options: CliOptions;

  try {
    const { values } = parseArgs({
      options: {
        path: { type: 'string', short: 'p' },
        json: { type: 'boolean', short: 'j', default: false },
        share: { type: 'boolean', short: 's', default: false },
        'no-color': { type: 'boolean', default: false },
        help: { type: 'boolean', short: 'h', default: false },
        version: { type: 'boolean', short: 'v', default: false },
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

    options = {
      path: values.path ?? getDefaultOpenClawPath(),
      json: values.json ?? false,
      share: values.share ?? false,
      noColor: values['no-color'] ?? false,
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

  const spinner = options.json ? null : createSpinner('Scanning OpenClaw configuration...');
  spinner?.start();

  try {
    const scannerResults = await runAllScanners({ openclawPath: options.path });
    const result = buildScanResult(scannerResults, options.path);

    spinner?.stop();

    if (options.json) {
      console.log(formatJsonOutput(result));
    } else {
      printScore(result);
      printScannerSummary(result);
      printFindings(result.findings);
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
