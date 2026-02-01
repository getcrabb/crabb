'use client';

import { useEffect, useState } from 'react';

interface TypewriterTextProps {
  text: string;
  delay?: number;
  className?: string;
  onComplete?: () => void;
}

export function TypewriterText({
  text,
  delay = 50,
  className = '',
  onComplete
}: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay);
      return () => clearTimeout(timeout);
    } else if (!isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, text, delay, isComplete, onComplete]);

  return (
    <span className={className}>
      {displayText}
      {!isComplete && <span className="cursor bg-[#FF4D00] w-2 h-5 inline-block ml-1" />}
    </span>
  );
}
