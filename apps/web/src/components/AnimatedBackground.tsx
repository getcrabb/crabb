'use client';

import { useEffect, useRef } from 'react';

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    // Wave parameters
    const waves = [
      { amplitude: 50, frequency: 0.02, speed: 0.02, color: 'rgba(255, 107, 107, 0.08)', yOffset: 0.3 },
      { amplitude: 40, frequency: 0.025, speed: 0.015, color: 'rgba(78, 205, 196, 0.08)', yOffset: 0.5 },
      { amplitude: 30, frequency: 0.03, speed: 0.025, color: 'rgba(255, 230, 109, 0.06)', yOffset: 0.7 },
    ];

    const drawWave = (wave: typeof waves[0], offset: number) => {
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);

      for (let x = 0; x <= canvas.width; x += 5) {
        const y = canvas.height * wave.yOffset +
          Math.sin(x * wave.frequency + offset) * wave.amplitude +
          Math.sin(x * wave.frequency * 0.5 + offset * 0.8) * wave.amplitude * 0.5;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fillStyle = wave.color;
      ctx.fill();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      waves.forEach((wave, index) => {
        drawWave(wave, time * wave.speed + index);
      });

      time += 1;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  );
}
