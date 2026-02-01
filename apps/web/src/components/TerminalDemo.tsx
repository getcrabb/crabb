'use client';

import { useEffect, useState, useRef } from 'react';

interface Line {
  text: string;
  delay: number;
  color?: string;
  typing?: boolean;
}

const initialLines: Line[] = [
  { text: '> npx getcrabb', delay: 0, color: 'text-gray-400', typing: true },
  { text: '', delay: 800 },
  { text: '░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░', delay: 1000, color: 'text-[#1a1a24]' },
  { text: '█▀▀ █▀█ ▄▀█ █▄▄ █▄▄   █▀ █▀▀ ▄▀█ █▄░█', delay: 1100, color: 'text-[#FF4D00]' },
  { text: '█▄▄ █▀▄ █▀█ █▄█ █▄█   ▄█ █▄▄ █▀█ █░▀█', delay: 1200, color: 'text-[#FF4D00]' },
  { text: '░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░', delay: 1300, color: 'text-[#1a1a24]' },
  { text: '', delay: 1500 },
  { text: '[SYS] Initializing security scanners...', delay: 1700, color: 'text-[#00FFF0]' },
  { text: '[MOD] Loading credentials scanner ████████ OK', delay: 2000, color: 'text-gray-600' },
  { text: '[MOD] Loading skills scanner     ████████ OK', delay: 2200, color: 'text-gray-600' },
  { text: '[MOD] Loading permissions scanner████████ OK', delay: 2400, color: 'text-gray-600' },
  { text: '[MOD] Loading network scanner    ████████ OK', delay: 2600, color: 'text-gray-600' },
  { text: '', delay: 2800 },
  { text: '[SCAN] Target: ~/.openclaw/', delay: 3000, color: 'text-[#FF00AA]' },
  { text: '[SCAN] Analyzing 47 files...', delay: 3300, color: 'text-gray-500' },
];

const resultLines = [
  '',
  '╔═══════════════════════════════════════════════════╗',
  '║                                                   ║',
  '║    ▄████▄   ██▀███   ▄▄▄       ▄▄▄▄   ▄▄▄▄       ║',
  '║   ▒██▀ ▀█  ▓██ ▒ ██▒▒████▄    ▓█████▄ ▓█████▄    ║',
  '║   ▒▓█    ▄ ▓██ ░▄█ ▒▒██  ▀█▄  ▒██▒ ▄██▒██▒ ▄██   ║',
  '║   ▒▓▓▄ ▄██▒▒██▀▀█▄  ░██▄▄▄▄██ ▒██░█▀  ▒██░█▀     ║',
  '║   ▒ ▓███▀ ░░██▓ ▒██▒ ▓█   ▓██▒░▓█  ▀█▓░▓█  ▀█▓   ║',
  '║   ░ ░▒ ▒  ░░ ▒▓ ░▒▓░ ▒▒   ▓▒█░░▒▓███▀▒░▒▓███▀▒   ║',
  '║                                                   ║',
  '║              S E C U R I T Y   S C O R E          ║',
  '║                                                   ║',
  '║                    ╔═══════╗                      ║',
  '║                    ║  85   ║                      ║',
  '║                    ╚═══════╝                      ║',
  '║                     / 100                         ║',
  '║                                                   ║',
  '║                  Grade: [ B ]                     ║',
  '║                                                   ║',
  '╠═══════════════════════════════════════════════════╣',
  '║  THREAT SUMMARY                                   ║',
  '╠═══════════════════════════════════════════════════╣',
  '║  🚨 CRITICAL   0  │  ⚠️  HIGH      1             ║',
  '║  🟡 MEDIUM     2  │  ℹ️  LOW       3             ║',
  '╚═══════════════════════════════════════════════════╝',
];

export function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [showResult, setShowResult] = useState(false);
  const [resultVisible, setResultVisible] = useState<number>(0);
  const [typedText, setTypedText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Typing effect for first line
  useEffect(() => {
    const command = '> npx getcrabb';
    let i = 0;
    const typeInterval = setInterval(() => {
      if (i <= command.length) {
        setTypedText(command.slice(0, i));
        i++;
      } else {
        clearInterval(typeInterval);
      }
    }, 80);
    return () => clearInterval(typeInterval);
  }, []);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    initialLines.forEach((line, index) => {
      if (index === 0) return; // Skip first line (typed)
      timers.push(
        setTimeout(() => {
          setVisibleLines(index + 1);
        }, line.delay)
      );
    });

    // Show result box
    timers.push(
      setTimeout(() => {
        setShowResult(true);
      }, 3600)
    );

    // Animate result lines
    resultLines.forEach((_, index) => {
      timers.push(
        setTimeout(() => {
          setResultVisible(index + 1);
        }, 3600 + index * 40)
      );
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleLines, resultVisible]);

  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-[#FF4D00]/20 via-[#FF00AA]/10 to-[#00FFF0]/20 blur-3xl opacity-50" />

      <div className="relative cyber-card overflow-hidden">
        {/* Terminal header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#0a0a0e] border-b border-[#1a1a24]">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF0055] hover:brightness-125 transition-all cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-[#FFEE00] hover:brightness-125 transition-all cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-[#00FF66] hover:brightness-125 transition-all cursor-pointer" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-xs text-gray-600 uppercase tracking-[0.3em]">crabb@security</span>
          </div>
          <div className="text-xs text-gray-700">zsh</div>
        </div>

        {/* Terminal content */}
        <div
          ref={containerRef}
          className="p-6 text-sm leading-relaxed font-mono h-[500px] overflow-y-auto bg-[#030305]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {/* Typed command */}
          <div className="text-gray-400">
            {typedText}
            {typedText.length < 15 && <span className="cursor bg-[#FF4D00] w-2 h-4 inline-block ml-0.5" />}
          </div>

          {/* Rest of lines */}
          {initialLines.slice(1, visibleLines).map((line, index) => (
            <div key={index} className={`${line.color || ''} ${!line.text ? 'h-4' : ''} whitespace-pre`}>
              {line.text}
            </div>
          ))}

          {/* Result box */}
          {showResult && (
            <div className="mt-2">
              {resultLines.slice(0, resultVisible).map((line, index) => (
                <div
                  key={index}
                  className={`whitespace-pre ${
                    index >= 3 && index <= 8 ? 'text-[#FF4D00] font-bold' :
                    index === 10 ? 'text-[#00FFF0]' :
                    index >= 13 && index <= 15 ? 'text-[#88FF00] font-bold' :
                    index === 17 ? 'text-[#88FF00]' :
                    index >= 22 ? 'text-gray-500' :
                    'text-gray-600'
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>
          )}

          {/* Cursor at end */}
          {visibleLines >= initialLines.length && resultVisible >= resultLines.length && (
            <div className="mt-4 flex items-center text-gray-400">
              <span>&gt; </span>
              <span className="w-2 h-4 bg-[#FF4D00] ml-1 cursor" />
            </div>
          )}
        </div>

        {/* Scan line overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute w-full h-px bg-gradient-to-r from-transparent via-[#00FFF0]/50 to-transparent"
            style={{ animation: 'scan-sweep 2s linear infinite' }}
          />
        </div>
      </div>
    </div>
  );
}
