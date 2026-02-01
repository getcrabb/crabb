'use client';

import { useState, useEffect } from 'react';
import { Confetti } from '@/components/Confetti';

export function ConfettiTrigger({ grade }: { grade: string }) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Trigger confetti for grade A after a short delay
    if (grade === 'A') {
      const timer = setTimeout(() => {
        setShowConfetti(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [grade]);

  return <Confetti trigger={showConfetti} />;
}
