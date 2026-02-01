'use client';

import { useState, useEffect } from 'react';

const messages = [
  "Let's check your security! 🔍",
  "I'm here to help! ✨",
  "One scan, peace of mind 🛡️",
  "Click me! 👋",
];

export function CrabMascot({ size = 'large' }: { size?: 'small' | 'medium' | 'large' }) {
  const [isClicked, setIsClicked] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [showMessage, setShowMessage] = useState(false);

  const sizeMap = {
    small: { width: 80, height: 64 },
    medium: { width: 120, height: 96 },
    large: { width: 180, height: 144 },
  };

  const { width, height } = sizeMap[size];

  useEffect(() => {
    // Show initial message after a delay
    const timer = setTimeout(() => setShowMessage(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    setIsClicked(true);
    setMessageIndex((prev) => (prev + 1) % messages.length);
    setShowMessage(true);
    setTimeout(() => setIsClicked(false), 600);
  };

  return (
    <div className="relative inline-block">
      {/* Speech bubble */}
      <div
        className={`absolute -top-16 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-2xl shadow-lg
          transition-all duration-300 whitespace-nowrap z-10
          ${showMessage ? 'opacity-100 -translate-y-2' : 'opacity-0 translate-y-0'}`}
      >
        <span className="text-sm font-semibold text-[#2C3E50]">{messages[messageIndex]}</span>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45" />
      </div>

      {/* SVG Crab */}
      <button
        onClick={handleClick}
        className="focus:outline-none transition-transform hover:scale-105"
        aria-label="CRABB mascot"
      >
        <svg
          width={width}
          height={height}
          viewBox="0 0 180 144"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Friendly crab mascot"
          className={isClicked ? 'animate-wiggle' : ''}
        >
          {/* Left claw */}
          <g className={`origin-[45px_72px] ${isClicked ? 'animate-pinch' : ''}`}>
            <ellipse cx="25" cy="65" rx="22" ry="16" fill="#FF6B6B" />
            <ellipse cx="12" cy="55" rx="10" ry="8" fill="#FF6B6B" />
            <ellipse cx="12" cy="75" rx="10" ry="8" fill="#FF6B6B" />
            <ellipse cx="25" cy="65" rx="18" ry="12" fill="#FF8E8E" />
          </g>

          {/* Right claw */}
          <g className={`origin-[135px_65px] ${isClicked ? 'animate-pinch-right' : ''}`}>
            <ellipse cx="155" cy="65" rx="22" ry="16" fill="#FF6B6B" />
            <ellipse cx="168" cy="55" rx="10" ry="8" fill="#FF6B6B" />
            <ellipse cx="168" cy="75" rx="10" ry="8" fill="#FF6B6B" />
            <ellipse cx="155" cy="65" rx="18" ry="12" fill="#FF8E8E" />
          </g>

          {/* Body */}
          <ellipse cx="90" cy="85" rx="55" ry="45" fill="#FF6B6B" />
          <ellipse cx="90" cy="80" rx="48" ry="38" fill="#FF8E8E" />

          {/* Shell pattern */}
          <ellipse cx="90" cy="75" rx="35" ry="25" fill="#FF6B6B" opacity="0.5" />
          <ellipse cx="90" cy="70" rx="20" ry="15" fill="#FF8E8E" opacity="0.5" />

          {/* Eyes */}
          <g>
            {/* Eye stalks */}
            <ellipse cx="70" cy="50" rx="8" ry="12" fill="#FF6B6B" />
            <ellipse cx="110" cy="50" rx="8" ry="12" fill="#FF6B6B" />

            {/* Eye whites */}
            <circle cx="70" cy="42" r="12" fill="white" />
            <circle cx="110" cy="42" r="12" fill="white" />

            {/* Pupils - animated */}
            <circle cx="72" cy="44" r="6" fill="#2C3E50">
              <animate
                attributeName="cx"
                values="72;68;72;76;72"
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="112" cy="44" r="6" fill="#2C3E50">
              <animate
                attributeName="cx"
                values="112;108;112;116;112"
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Eye shine */}
            <circle cx="74" cy="40" r="3" fill="white" opacity="0.8" />
            <circle cx="114" cy="40" r="3" fill="white" opacity="0.8" />
          </g>

          {/* Smile */}
          <path
            d="M 75 95 Q 90 110 105 95"
            stroke="#E85555"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />

          {/* Legs */}
          <g>
            {/* Left legs */}
            <ellipse cx="45" cy="105" rx="15" ry="6" fill="#FF6B6B" transform="rotate(-20, 45, 105)" />
            <ellipse cx="50" cy="115" rx="15" ry="6" fill="#FF6B6B" transform="rotate(-5, 50, 115)" />
            <ellipse cx="50" cy="125" rx="15" ry="6" fill="#FF6B6B" transform="rotate(10, 50, 125)" />

            {/* Right legs */}
            <ellipse cx="135" cy="105" rx="15" ry="6" fill="#FF6B6B" transform="rotate(20, 135, 105)" />
            <ellipse cx="130" cy="115" rx="15" ry="6" fill="#FF6B6B" transform="rotate(5, 130, 115)" />
            <ellipse cx="130" cy="125" rx="15" ry="6" fill="#FF6B6B" transform="rotate(-10, 130, 125)" />
          </g>
        </svg>
      </button>
    </div>
  );
}
