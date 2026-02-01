'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function NotFound() {
  const [crabPosition, setCrabPosition] = useState({ x: 50, direction: 1 });
  const [isSearching, setIsSearching] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCrabPosition(prev => {
        let newX = prev.x + prev.direction * 2;
        let newDirection = prev.direction;

        if (newX > 80) {
          newDirection = -1;
          setIsSearching(s => !s);
        } else if (newX < 20) {
          newDirection = 1;
          setIsSearching(s => !s);
        }

        return { x: newX, direction: newDirection };
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background waves */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#4ECDC4]/20 to-transparent" />
        <div className="blob blob-coral w-[400px] h-[400px] -top-32 -right-32 opacity-30" />
        <div className="blob blob-ocean w-[300px] h-[300px] -bottom-32 -left-32 opacity-30" />
      </div>

      {/* Wandering crab */}
      <div
        className="absolute bottom-32 transition-all duration-100 ease-linear"
        style={{
          left: `${crabPosition.x}%`,
          transform: `translateX(-50%) scaleX(${crabPosition.direction})`,
        }}
      >
        <div className="text-6xl animate-bounce-soft">
          🦀
        </div>
        {isSearching && (
          <div
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-medium text-[#34495E] bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm"
            style={{ transform: `translateX(-50%) scaleX(${crabPosition.direction})` }}
          >
            Where is it? 🔍
          </div>
        )}
      </div>

      {/* Footprints trail */}
      <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-8 opacity-20">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-xl" style={{ opacity: 1 - i * 0.2 }}>
            ...
          </span>
        ))}
      </div>

      <div className="relative z-10 text-center px-4">
        {/* 404 with style */}
        <div className="relative mb-8">
          <h1
            className="text-[150px] md:text-[200px] font-black leading-none"
            style={{
              background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 20px 40px rgba(255, 107, 107, 0.2)',
            }}
          >
            404
          </h1>
          {/* Sand dune decoration */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-4 bg-gradient-to-r from-transparent via-[#FFE66D]/30 to-transparent rounded-full" />
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-[#2C3E50] mb-4">
          Page got pinched away!
        </h2>

        <p className="text-lg text-[#34495E] mb-8 max-w-md mx-auto">
          Our crab searched everywhere but couldn't find this page.
          It might have expired or never existed.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-8 py-4 bg-gradient-to-r from-[#FF6B6B] to-[#E85555] text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M9 22V12h6v10" />
            </svg>
            Go Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="px-8 py-4 bg-white/80 backdrop-blur-sm text-[#34495E] rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all border-2 border-[#E2E8F0] flex items-center justify-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Go Back
          </button>
        </div>

        {/* Fun fact */}
        <div className="mt-12 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-[#E2E8F0] max-w-sm mx-auto">
          <p className="text-sm text-[#64748B]">
            <span className="font-semibold text-[#4ECDC4]">Fun fact:</span> Crabs can walk in any direction,
            but prefer to scuttle sideways. Unlike this page, which went nowhere.
          </p>
        </div>
      </div>

      {/* Bubbles decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#4ECDC4]/10 animate-float"
            style={{
              width: 10 + Math.random() * 20,
              height: 10 + Math.random() * 20,
              left: `${10 + Math.random() * 80}%`,
              bottom: `${10 + Math.random() * 30}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </main>
  );
}
