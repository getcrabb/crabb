'use client';

import { useEffect, useRef, useState } from 'react';

export function InteractiveCrab() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) / 50;
      const deltaY = (e.clientY - centerY) / 50;

      setMousePos({ x: e.clientX, y: e.clientY });
      setEyeOffset({
        x: Math.max(-3, Math.min(3, deltaX)),
        y: Math.max(-2, Math.min(2, deltaY))
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsScanning(true);
      setTimeout(() => setIsScanning(false), 500);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const leftEye = `(${isScanning ? '◉' : '●'})`;
  const rightEye = `(${isScanning ? '◉' : '●'})`;

  return (
    <div
      ref={containerRef}
      className="relative select-none"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 blur-3xl opacity-30 bg-[#00FF41] rounded-full scale-50" />

      {/* Scan line effect */}
      {isScanning && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="scan-line" />
        </div>
      )}

      <pre
        className={`relative text-[#00FF41] text-xs md:text-sm leading-tight transition-all duration-200 ${
          isScanning ? 'text-glow' : ''
        }`}
        style={{
          transform: `rotateY(${eyeOffset.x * 2}deg) rotateX(${-eyeOffset.y * 2}deg)`,
          textShadow: isScanning
            ? '0 0 10px #00FF41, 0 0 20px #00FF41, 0 0 40px #00FF41'
            : '0 0 5px #00FF41'
        }}
      >
{`
      ╔══════════════════════════════════╗
      ║    ▄▄▄▄      ▄▄▄▄▄▄      ▄▄▄▄    ║
      ║  ▄█▀▀▀▀█▄  ▄█▀▀▀▀▀▀█▄  ▄█▀▀▀▀█▄  ║
      ║ █        ▀▀          ▀▀        █ ║
      ║ █   ${leftEye}              ${rightEye}   █ ║
      ║ █      ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀      █ ║
      ║  ▀█▄  ╔══════════════════╗  ▄█▀  ║
      ║    ▀▀█║  C R A B B  v1.0 ║█▀▀    ║
      ║      ╚══════════════════╝        ║
      ║    ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄    ║
      ║   █░░░░░░░░░░░░░░░░░░░░░░░░░░█   ║
      ║   █░░░░░░░░░░░░░░░░░░░░░░░░░░█   ║
      ║  ▄█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█▄  ║
      ║ ▀▀                            ▀▀ ║
      ╠══════════════════════════════════╣
      ║  STATUS: ${isScanning ? '■ SCANNING...' : '● READY      '}           ║
      ╚══════════════════════════════════╝
`}
      </pre>

      {/* Targeting lines */}
      <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#00FF41]/30 to-transparent" />
      <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-[#00FF41]/30 to-transparent" />

      {/* Corner brackets */}
      <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-[#00FF41]" />
      <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-[#00FF41]" />
      <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-[#00FF41]" />
      <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-[#00FF41]" />
    </div>
  );
}
