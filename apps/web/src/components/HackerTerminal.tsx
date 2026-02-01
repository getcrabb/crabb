'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'success' | 'error' | 'warning' | 'system';
  typing?: boolean;
}

const bootSequence: TerminalLine[] = [
  { text: '> CRABB Security Scanner v1.0.0', type: 'system' },
  { text: '> Initializing kernel modules...', type: 'system' },
  { text: '[OK] Credentials scanner loaded', type: 'success' },
  { text: '[OK] Skills analyzer loaded', type: 'success' },
  { text: '[OK] Permissions auditor loaded', type: 'success' },
  { text: '[OK] Network scanner loaded', type: 'success' },
  { text: '', type: 'output' },
  { text: '> Target: ~/.openclaw/', type: 'warning' },
  { text: '> Starting security scan...', type: 'system' },
  { text: '', type: 'output' },
];

const scanOutput: TerminalLine[] = [
  { text: '[SCAN] Analyzing credentials...', type: 'output' },
  { text: '  └─ Checking config files', type: 'output' },
  { text: '  └─ Scanning session logs', type: 'output' },
  { text: '  └─ Validating auth profiles', type: 'output' },
  { text: '[WARN] Exposed API key detected in session.jsonl', type: 'warning' },
  { text: '', type: 'output' },
  { text: '[SCAN] Analyzing skills...', type: 'output' },
  { text: '  └─ Parsing SKILL.md files', type: 'output' },
  { text: '  └─ Detecting dangerous patterns', type: 'output' },
  { text: '[OK] No critical skill vulnerabilities', type: 'success' },
  { text: '', type: 'output' },
  { text: '[SCAN] Checking permissions...', type: 'output' },
  { text: '  └─ Sandbox mode: ENABLED', type: 'success' },
  { text: '  └─ DM policy: RESTRICTED', type: 'success' },
  { text: '[WARN] Gateway allowlist too permissive', type: 'warning' },
  { text: '', type: 'output' },
  { text: '[SCAN] Network analysis...', type: 'output' },
  { text: '  └─ Gateway: localhost:8080', type: 'output' },
  { text: '  └─ TLS: ENABLED', type: 'success' },
  { text: '[OK] Network configuration secure', type: 'success' },
];

const resultBox = `
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   ▄████▄   ██▀███   ▄▄▄       ▄▄▄▄   ▄▄▄▄           ║
║  ▒██▀ ▀█  ▓██ ▒ ██▒▒████▄    ▓█████▄ ▓█████▄        ║
║  ▒▓█    ▄ ▓██ ░▄█ ▒▒██  ▀█▄  ▒██▒ ▄██▒██▒ ▄██       ║
║  ▒▓▓▄ ▄██▒▒██▀▀█▄  ░██▄▄▄▄██ ▒██░█▀  ▒██░█▀         ║
║  ▒ ▓███▀ ░░██▓ ▒██▒ ▓█   ▓██▒░▓█  ▀█▓░▓█  ▀█▓       ║
║  ░ ░▒ ▒  ░░ ▒▓ ░▒▓░ ▒▒   ▓▒█░░▒▓███▀▒░▒▓███▀▒       ║
║                                                      ║
║              ═══════════════════════                 ║
║                  SECURITY  SCORE                     ║
║              ═══════════════════════                 ║
║                                                      ║
║                 ████████████████                     ║
║                 ██            ██                     ║
║                 ██     85     ██                     ║
║                 ██            ██                     ║
║                 ████████████████                     ║
║                     / 100                            ║
║                                                      ║
║                  GRADE:  [ B ]                       ║
║                                                      ║
╠══════════════════════════════════════════════════════╣
║  FINDINGS                                            ║
╠══════════════════════════════════════════════════════╣
║  ▸ CRITICAL    0   ║  ▸ HIGH      1                 ║
║  ▸ MEDIUM      2   ║  ▸ LOW       3                 ║
╚══════════════════════════════════════════════════════╝
`;

export function HackerTerminal() {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [phase, setPhase] = useState<'boot' | 'scan' | 'result' | 'done'>('boot');
  const [showResult, setShowResult] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineIndexRef = useRef(0);
  const charIndexRef = useRef(0);

  const typeText = useCallback((text: string, onComplete: () => void) => {
    charIndexRef.current = 0;
    const typeChar = () => {
      if (charIndexRef.current < text.length) {
        setCurrentText(text.slice(0, charIndexRef.current + 1));
        charIndexRef.current++;
        setTimeout(typeChar, 15 + Math.random() * 25);
      } else {
        onComplete();
      }
    };
    typeChar();
  }, []);

  useEffect(() => {
    const processLine = () => {
      const currentSequence = phase === 'boot' ? bootSequence : scanOutput;

      if (lineIndexRef.current < currentSequence.length) {
        const line = currentSequence[lineIndexRef.current];

        if (line.text === '') {
          setLines(prev => [...prev, line]);
          lineIndexRef.current++;
          setTimeout(processLine, 100);
        } else {
          typeText(line.text, () => {
            setLines(prev => [...prev, { ...line, text: currentText }]);
            setCurrentText('');
            lineIndexRef.current++;
            setTimeout(processLine, 50 + Math.random() * 100);
          });
        }
      } else if (phase === 'boot') {
        setPhase('scan');
        lineIndexRef.current = 0;
        setTimeout(processLine, 500);
      } else if (phase === 'scan') {
        setPhase('result');
        setTimeout(() => setShowResult(true), 500);
      }
    };

    if (phase !== 'done') {
      const timer = setTimeout(processLine, phase === 'boot' ? 500 : 100);
      return () => clearTimeout(timer);
    }
  }, [phase, typeText, currentText]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines, currentText, showResult]);

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'success': return 'text-[#00FF41]';
      case 'error': return 'text-[#FF0040]';
      case 'warning': return 'text-[#FF6600]';
      case 'system': return 'text-[#00D4FF]';
      case 'input': return 'text-white';
      default: return 'text-[#00FF41]/70';
    }
  };

  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-[#00FF41]/5 blur-3xl" />

      <div className="terminal-window relative corner-brackets">
        {/* Header */}
        <div className="terminal-header">
          <div className="terminal-dot bg-[#FF0040]" />
          <div className="terminal-dot bg-[#FF6600]" />
          <div className="terminal-dot bg-[#00FF41]" />
          <span className="ml-4 text-xs text-[#00FF41]/60">crabb@security:~</span>
          <span className="ml-auto text-xs text-[#00FF41]/40">pts/0</span>
        </div>

        {/* Body */}
        <div
          ref={containerRef}
          className="terminal-body h-[500px] overflow-y-auto text-sm"
        >
          {/* Scan line */}
          <div className="scan-line opacity-30" />

          {/* Lines */}
          {lines.map((line, i) => (
            <div key={i} className={`${getLineColor(line.type)} whitespace-pre`}>
              {line.text}
            </div>
          ))}

          {/* Current typing line */}
          {currentText && (
            <div className="text-[#00FF41] whitespace-pre">
              {currentText}
              <span className="typing-cursor" />
            </div>
          )}

          {/* Result box */}
          {showResult && (
            <pre className="text-[#00FF41] whitespace-pre mt-4 text-glow">
              {resultBox}
            </pre>
          )}

          {/* Cursor at end */}
          {phase === 'done' || (showResult && !currentText) ? (
            <div className="mt-4 text-[#00FF41]">
              {'>'} <span className="typing-cursor" />
            </div>
          ) : null}
        </div>

        {/* Status bar */}
        <div className="px-4 py-2 border-t border-[#00FF41]/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className={`status-dot ${phase === 'scan' ? 'warning' : ''}`} />
            <span className="text-[#00FF41]/60">
              {phase === 'boot' && 'Initializing...'}
              {phase === 'scan' && 'Scanning...'}
              {(phase === 'result' || phase === 'done') && 'Complete'}
            </span>
          </div>
          <span className="text-[#00FF41]/40">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}
