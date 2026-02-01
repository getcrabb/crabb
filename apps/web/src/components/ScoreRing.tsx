'use client';

import { useEffect, useState } from 'react';

interface ScoreRingProps {
  score: number;
  grade: string;
  color: string;
  size?: number;
}

export function ScoreRing({ score, grade, color, size = 220 }: ScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showGrade, setShowGrade] = useState(false);

  const radius = (size - 32) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    // Animate score counting up
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
        // Show grade after score animation
        setTimeout(() => setShowGrade(true), 200);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  const strokeDashoffset = circumference * (1 - animatedScore / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow effect */}
      <div
        className="absolute inset-4 rounded-full blur-xl opacity-30 transition-opacity duration-1000"
        style={{ background: color, opacity: showGrade ? 0.4 : 0 }}
      />

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="16"
        />

        {/* Animated progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            transition: 'stroke-dashoffset 0.1s ease-out',
          }}
        />

        {/* Decorative dots at start/end */}
        <circle
          cx={size / 2}
          cy={16}
          r="4"
          fill={color}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: `${size / 2}px ${size / 2}px`,
          }}
        />
      </svg>

      {/* Score text in center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-6xl font-black transition-all duration-300"
          style={{
            color,
            transform: showGrade ? 'scale(1)' : 'scale(0.9)',
          }}
        >
          {animatedScore}
        </span>
        <span className="text-lg text-[#64748B] font-medium">out of 100</span>
      </div>

      {/* Pulse ring on complete */}
      {showGrade && (
        <div
          className="absolute inset-0 rounded-full animate-ping pointer-events-none"
          style={{
            border: `2px solid ${color}`,
            opacity: 0.3,
            animationDuration: '1.5s',
            animationIterationCount: '1',
          }}
        />
      )}
    </div>
  );
}
