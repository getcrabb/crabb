'use client';

import { useEffect, useState } from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'span' | 'div';
}

export function GlitchText({ text, className = '', as: Tag = 'span' }: GlitchTextProps) {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 200);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(glitchInterval);
  }, []);

  return (
    <Tag
      className={`glitch-text ${className}`}
      data-text={text}
      style={{
        animation: isGlitching ? 'glitch-skew 0.1s linear' : undefined
      }}
    >
      {text}
    </Tag>
  );
}
