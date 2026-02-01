'use client';

import { useState, useRef, useEffect } from 'react';

interface ScannerCardProps {
  icon: string;
  title: string;
  points: number;
  description: string;
  status: 'active' | 'warning' | 'critical';
  index: number;
}

export function ScannerCard({ icon, title, points, description, status, index }: ScannerCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current || !isHovered) return;
      const rect = cardRef.current.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isHovered]);

  const statusColor = {
    active: '#00FF41',
    warning: '#FF6600',
    critical: '#FF0040'
  }[status];

  return (
    <div
      ref={cardRef}
      className="scanner-card p-6 perspective-card opacity-0"
      style={{
        animation: `bootUp 0.5s ease-out ${0.1 + index * 0.1}s forwards`,
        transform: isHovered
          ? `rotateY(${(mousePos.x - 50) / 10}deg) rotateX(${-(mousePos.y - 50) / 10}deg)`
          : 'rotateY(0) rotateX(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Spotlight effect */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(0,255,65,0.15) 0%, transparent 50%)`
          }}
        />
      )}

      {/* Data flow lines */}
      {isHovered && (
        <>
          <div className="data-flow" style={{ left: '20%', animationDelay: '0s' }} />
          <div className="data-flow" style={{ left: '80%', animationDelay: '0.5s' }} />
        </>
      )}

      {/* Corner markers */}
      <div className="absolute top-2 left-2 w-4 h-4">
        <div className="absolute top-0 left-0 w-full h-px bg-[#00FF41]" />
        <div className="absolute top-0 left-0 w-px h-full bg-[#00FF41]" />
      </div>
      <div className="absolute top-2 right-2 w-4 h-4">
        <div className="absolute top-0 right-0 w-full h-px bg-[#00FF41]" />
        <div className="absolute top-0 right-0 w-px h-full bg-[#00FF41]" />
      </div>
      <div className="absolute bottom-2 left-2 w-4 h-4">
        <div className="absolute bottom-0 left-0 w-full h-px bg-[#00FF41]" />
        <div className="absolute bottom-0 left-0 w-px h-full bg-[#00FF41]" />
      </div>
      <div className="absolute bottom-2 right-2 w-4 h-4">
        <div className="absolute bottom-0 right-0 w-full h-px bg-[#00FF41]" />
        <div className="absolute bottom-0 right-0 w-px h-full bg-[#00FF41]" />
      </div>

      {/* Header with status */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="text-4xl transition-transform duration-300"
          style={{
            transform: isHovered ? 'scale(1.2)' : 'scale(1)',
            filter: isHovered ? `drop-shadow(0 0 20px ${statusColor})` : 'none'
          }}
        >
          {icon}
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`status-dot ${status}`}
            style={{ background: statusColor, boxShadow: `0 0 10px ${statusColor}` }}
          />
          <span className="text-xs uppercase tracking-wider opacity-60">
            {status}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3
        className="text-lg font-bold mb-2 tracking-wider"
        style={{
          fontFamily: 'var(--font-display)',
          color: isHovered ? statusColor : '#00FF41'
        }}
      >
        [{title}]
      </h3>

      {/* Points */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="px-3 py-1 text-xs font-bold uppercase tracking-wider border"
          style={{
            borderColor: statusColor,
            color: statusColor,
            background: `${statusColor}10`
          }}
        >
          {points} POINTS MAX
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-[#00FF41]/60 leading-relaxed">
        {description}
      </p>

      {/* Progress bar */}
      <div className="mt-4 progress-bar" style={{ '--progress': `${points}%` } as React.CSSProperties} />

      {/* Hover scan line */}
      {isHovered && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="scan-line" style={{ animationDuration: '1s' }} />
        </div>
      )}
    </div>
  );
}
