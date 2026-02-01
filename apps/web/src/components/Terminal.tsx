'use client';

import { useState, useEffect, useRef } from 'react';

interface TerminalLine {
  text: string;
  type: 'prompt' | 'success' | 'warning' | 'error' | 'info' | 'muted' | 'default' | 'score';
}

type Scenario = 'good' | 'bad';

const scenarios: Record<Scenario, { lines: TerminalLine[]; score: number; grade: string }> = {
  good: {
    score: 92,
    grade: 'A',
    lines: [
      { text: '$ npx getcrabb', type: 'prompt' },
      { text: '', type: 'default' },
      { text: '🦀 CRABB Security Scanner v1.0.0', type: 'info' },
      { text: '', type: 'default' },
      { text: '✓ OpenClaw installation found', type: 'success' },
      { text: '  Scanning credentials...', type: 'muted' },
      { text: '✓ No exposed credentials', type: 'success' },
      { text: '  Scanning skills...', type: 'muted' },
      { text: '✓ All skills look safe', type: 'success' },
      { text: '  Checking permissions...', type: 'muted' },
      { text: '✓ Permissions configured correctly', type: 'success' },
      { text: '  Checking network...', type: 'muted' },
      { text: '✓ Network config secure', type: 'success' },
      { text: '', type: 'default' },
      { text: '┌──────────────────────────────────┐', type: 'muted' },
      { text: '│                                  │', type: 'muted' },
      { text: '│   YOUR CRABB SCORE:  92/100  A   │', type: 'score' },
      { text: '│                                  │', type: 'muted' },
      { text: '│   🦀🦀🦀🦀🦀🦀🦀🦀🦀⬜   │', type: 'default' },
      { text: '│                                  │', type: 'muted' },
      { text: '└──────────────────────────────────┘', type: 'muted' },
      { text: '', type: 'default' },
      { text: '🎉 Excellent! Your setup is secure.', type: 'success' },
      { text: '', type: 'default' },
      { text: 'Run with --share to brag about it! ✨', type: 'muted' },
    ],
  },
  bad: {
    score: 41,
    grade: 'D',
    lines: [
      { text: '$ npx getcrabb', type: 'prompt' },
      { text: '', type: 'default' },
      { text: '🦀 CRABB Security Scanner v1.0.0', type: 'info' },
      { text: '', type: 'default' },
      { text: '✓ OpenClaw installation found', type: 'success' },
      { text: '  Scanning credentials...', type: 'muted' },
      { text: '✗ Found 2 exposed API keys', type: 'error' },
      { text: '  Scanning skills...', type: 'muted' },
      { text: '⚠ 1 skill with suspicious patterns', type: 'warning' },
      { text: '  Checking permissions...', type: 'muted' },
      { text: '✗ Sandbox mode is disabled', type: 'error' },
      { text: '⚠ DM policy is set to "open"', type: 'warning' },
      { text: '  Checking network...', type: 'muted' },
      { text: '⚠ Gateway exposed to LAN', type: 'warning' },
      { text: '', type: 'default' },
      { text: '┌──────────────────────────────────┐', type: 'muted' },
      { text: '│                                  │', type: 'muted' },
      { text: '│   YOUR CRABB SCORE:  41/100  D   │', type: 'score' },
      { text: '│                                  │', type: 'muted' },
      { text: '│   🦀🦀🦀🦀⬜⬜⬜⬜⬜⬜   │', type: 'default' },
      { text: '│                                  │', type: 'muted' },
      { text: '└──────────────────────────────────┘', type: 'muted' },
      { text: '', type: 'default' },
      { text: 'Top risks to fix:', type: 'default' },
      { text: '  1. [CRITICAL] Exposed Anthropic API key', type: 'error' },
      { text: '  2. [HIGH] Sandbox mode disabled', type: 'error' },
      { text: '  3. [MEDIUM] Open DM policy', type: 'warning' },
      { text: '', type: 'default' },
      { text: '💡 Run crabb --help for remediation tips', type: 'info' },
    ],
  },
};

export function Terminal() {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [scenario, setScenario] = useState<Scenario>('good');
  const terminalRef = useRef<HTMLDivElement>(null);

  const currentScenario = scenarios[scenario];

  const startTyping = (newScenario?: Scenario) => {
    if (newScenario) setScenario(newScenario);
    setLines([]);
    setCurrentLineIndex(0);
    setCurrentCharIndex(0);
    setIsTyping(true);
    setIsComplete(false);
  };

  useEffect(() => {
    // Auto-start on mount
    const timer = setTimeout(() => startTyping('good'), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isTyping || currentLineIndex >= currentScenario.lines.length) {
      if (currentLineIndex >= currentScenario.lines.length) {
        setIsTyping(false);
        setIsComplete(true);
      }
      return;
    }

    const currentLine = currentScenario.lines[currentLineIndex];

    // For empty lines or special types, add immediately
    if (currentLine.text === '' || currentLine.type === 'muted') {
      const timer = setTimeout(() => {
        setLines(prev => [...prev, currentLine]);
        setCurrentLineIndex(prev => prev + 1);
        setCurrentCharIndex(0);
      }, currentLine.text === '' ? 80 : 40);
      return () => clearTimeout(timer);
    }

    // Typing effect for other lines
    if (currentCharIndex < currentLine.text.length) {
      const typingSpeed = currentLine.type === 'prompt' ? 60 : 20;
      const timer = setTimeout(() => {
        setCurrentCharIndex(prev => prev + 1);
      }, typingSpeed);
      return () => clearTimeout(timer);
    } else {
      // Line complete, move to next
      const delay = currentLine.type === 'score' ? 400 : 100;
      const timer = setTimeout(() => {
        setLines(prev => [...prev, currentLine]);
        setCurrentLineIndex(prev => prev + 1);
        setCurrentCharIndex(0);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isTyping, currentLineIndex, currentCharIndex, currentScenario.lines]);

  // Auto-scroll
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines, currentCharIndex]);

  const getLineClass = (type: TerminalLine['type']) => {
    const classes: Record<string, string> = {
      prompt: 'text-[#4ECDC4]',
      success: 'text-emerald-400',
      warning: 'text-amber-400',
      error: 'text-red-400',
      info: 'text-blue-400',
      muted: 'text-slate-500',
      score: 'text-[#4ECDC4] font-bold',
      default: 'text-slate-300',
    };
    return classes[type] || 'text-slate-300';
  };

  const currentLine = currentScenario.lines[currentLineIndex];
  const typingText = currentLine && currentCharIndex > 0
    ? currentLine.text.slice(0, currentCharIndex)
    : '';

  return (
    <div className="terminal max-w-2xl mx-auto overflow-hidden shadow-2xl">
      {/* Window chrome */}
      <div className="terminal-header flex items-center">
        <div className="flex gap-2">
          <div className="terminal-dot red" />
          <div className="terminal-dot yellow" />
          <div className="terminal-dot green" />
        </div>
        <div className="flex-1 text-center">
          <span className="text-xs text-slate-500 font-medium">Terminal — crabb</span>
        </div>
        <div className="w-14" />
      </div>

      {/* Terminal content */}
      <div
        ref={terminalRef}
        className="terminal-body h-[400px] overflow-y-auto font-mono text-sm"
      >
        {/* Completed lines */}
        {lines.map((line, index) => (
          <div key={index} className={`${getLineClass(line.type)} leading-relaxed`}>
            {line.text || '\u00A0'}
          </div>
        ))}

        {/* Currently typing line */}
        {isTyping && currentLine && currentCharIndex > 0 && (
          <div className={`${getLineClass(currentLine.type)} leading-relaxed`}>
            {typingText}
            <span className="inline-block w-2 h-4 bg-[#4ECDC4] ml-0.5 animate-pulse" />
          </div>
        )}

        {/* Cursor when idle but typing */}
        {isTyping && (!currentLine || currentCharIndex === 0) && (
          <div className="leading-relaxed">
            <span className="inline-block w-2 h-4 bg-[#4ECDC4] animate-pulse" />
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="p-4 border-t border-white/10 bg-[#1a2332]">
        <div className="flex gap-3">
          <button
            onClick={() => startTyping('good')}
            disabled={isTyping}
            className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm
              ${isTyping
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : scenario === 'good' && isComplete
                  ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500'
                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              }`}
          >
            <span>🎉</span>
            Good Score
          </button>
          <button
            onClick={() => startTyping('bad')}
            disabled={isTyping}
            className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm
              ${isTyping
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : scenario === 'bad' && isComplete
                  ? 'bg-red-500/20 text-red-400 border-2 border-red-500'
                  : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
              }`}
          >
            <span>⚠️</span>
            Bad Score
          </button>
        </div>
        {isTyping && (
          <div className="mt-3 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            Scanning...
          </div>
        )}
      </div>
    </div>
  );
}
