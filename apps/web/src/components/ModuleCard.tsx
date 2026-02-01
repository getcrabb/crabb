'use client';

import { useState } from 'react';

interface ModuleCardProps {
  icon: string;
  title: string;
  points: number;
  description: string;
  color: string;
}

export function ModuleCard({ icon, title, points, description, color }: ModuleCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="module-card group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        borderColor: isHovered ? color : 'transparent',
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, ${color}, ${color}80)`,
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Icon with background */}
      <div
        className="module-icon transition-all duration-300"
        style={{
          background: `${color}15`,
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        <span
          className="transition-transform duration-300"
          style={{ display: 'inline-block', transform: isHovered ? 'rotate(-10deg)' : 'rotate(0)' }}
        >
          {icon}
        </span>
      </div>

      {/* Title */}
      <h3
        className="text-xl font-bold mb-3 transition-colors duration-300"
        style={{ color: isHovered ? color : '#2C3E50' }}
      >
        {title}
      </h3>

      {/* Points badge */}
      <div className="mb-4">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all duration-300"
          style={{
            background: isHovered ? color : `${color}20`,
            color: isHovered ? 'white' : '#2C3E50',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isHovered ? 'currentColor' : color}
            strokeWidth="2"
            aria-hidden="true"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          {points} points max
        </span>
      </div>

      {/* Description */}
      <p className="text-[#34495E] leading-relaxed text-sm">
        {description}
      </p>

      {/* Bottom decoration */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full transition-all duration-300"
        style={{
          background: color,
          opacity: isHovered ? 0.5 : 0,
          transform: `translateX(-50%) scaleX(${isHovered ? 1 : 0})`,
        }}
      />
    </div>
  );
}
