'use client';

import { useEffect, useState } from 'react';

const icons = [
  { emoji: '🔑', x: 12, y: 18, size: 'text-4xl', speed: 0.03 },
  { emoji: '🛡️', x: 88, y: 28, size: 'text-3xl', speed: 0.02 },
  { emoji: '⚡', x: 8, y: 55, size: 'text-3xl', speed: 0.025 },
  { emoji: '🌐', x: 92, y: 70, size: 'text-4xl', speed: 0.015 },
  { emoji: '✨', x: 5, y: 38, size: 'text-2xl', speed: 0.035 },
  { emoji: '🔒', x: 90, y: 45, size: 'text-2xl', speed: 0.02 },
  { emoji: '💎', x: 78, y: 12, size: 'text-2xl', speed: 0.025 },
];

export function ParallaxIcons() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouse = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouse, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map((icon, index) => {
        const parallaxY = scrollY * icon.speed * 0.5;
        const mouseOffsetX = mousePos.x * 20 * icon.speed;
        const mouseOffsetY = mousePos.y * 20 * icon.speed;

        return (
          <div
            key={index}
            className={`absolute ${icon.size} opacity-30 transition-transform duration-300 ease-out`}
            style={{
              left: `${icon.x}%`,
              top: `${icon.y}%`,
              transform: `translate(${mouseOffsetX}px, ${-parallaxY + mouseOffsetY}px)`,
            }}
          >
            {icon.emoji}
          </div>
        );
      })}
    </div>
  );
}
