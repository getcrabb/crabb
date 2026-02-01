'use client';

import { useState } from 'react';

export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <button
      onClick={handleCopy}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        command-box group relative overflow-hidden
        ${copied ? 'ring-2 ring-emerald-400 ring-offset-2' : ''}
      `}
    >
      {/* Shimmer effect on hover */}
      <div
        className={`
          absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
          transition-transform duration-700
          ${isHovered && !copied ? 'translate-x-full' : '-translate-x-full'}
        `}
      />

      {/* Prompt symbol */}
      <span className="prompt text-lg">$</span>

      {/* Command text */}
      <code className="relative">
        {command}
      </code>

      {/* Copy button */}
      <span
        className={`
          relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold
          transition-all duration-300
          ${copied
            ? 'bg-emerald-500 text-white'
            : 'bg-white/10 text-white hover:bg-white/20'
          }
        `}
      >
        {copied ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy
          </>
        )}
      </span>

      {/* Success particles */}
      {copied && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              className="absolute w-2 h-2 bg-emerald-400 rounded-full animate-ping"
              style={{
                left: `${20 + i * 15}%`,
                top: '50%',
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.6s',
              }}
            />
          ))}
        </div>
      )}
    </button>
  );
}
