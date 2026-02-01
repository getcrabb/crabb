'use client';

import { useEffect, useState } from 'react';

export function CyberCrab() {
  const [frame, setFrame] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const frames = [
    `
      ▄▄      ▄▄
    ▄████▄  ▄████▄
   ██▀▀▀██▄▄██▀▀▀██
   ██  ●══════●  ██
    ██▄▄▄████▄▄▄██
      ████████████
     ██░░░░░░░░░░██
    ██░░░░░░░░░░░░██
   ▀▀ ▀▀      ▀▀ ▀▀
    `,
    `
      ▄▄      ▄▄
    ▄████▄  ▄████▄
   ██▀▀▀██▄▄██▀▀▀██
   ██  ◉══════◉  ██
    ██▄▄▄████▄▄▄██
      ████████████
     ██░░░░░░░░░░██
    ██░░░░░░░░░░░░██
   ▀▀ ▀▀      ▀▀ ▀▀
    `,
  ];

  const hoverFrame = `
    ╔══╗    ╔══╗
   ╔╝██╚════╝██╚╗
   ║ ██ ◈◈◈◈ ██ ║
   ║ ██ ▓▓▓▓ ██ ║
   ╚═╗██████████╔═╝
     ║▒▒▒▒▒▒▒▒▒▒║
     ║▒▒▒▒▒▒▒▒▒▒║
    ╔╝▒▒▒▒▒▒▒▒▒▒╚╗
   ═╩═╝        ╚═╩═
  `;

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % frames.length);
    }, 500);
    return () => clearInterval(interval);
  }, [isHovered, frames.length]);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 blur-3xl opacity-50 bg-gradient-to-r from-[#FF4D00] via-[#FF00AA] to-[#00FFF0] rounded-full scale-75" />

      <pre
        className={`relative font-mono text-xs md:text-sm lg:text-base leading-tight select-none transition-all duration-300 ${
          isHovered ? 'text-[#00FFF0] scale-110' : 'text-[#FF4D00]'
        }`}
        style={{
          textShadow: isHovered
            ? '0 0 10px #00FFF0, 0 0 20px #00FFF0, 0 0 40px #00FFF0'
            : '0 0 10px #FF4D00, 0 0 20px #FF4D00, 0 0 40px #FF4D00'
        }}
      >
        {isHovered ? hoverFrame : frames[frame]}
      </pre>

      {/* Scan line on hover */}
      {isHovered && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-[#00FFF0] to-transparent animate-[scan-sweep_1s_linear_infinite]" />
        </div>
      )}
    </div>
  );
}
