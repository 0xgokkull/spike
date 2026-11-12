import React from 'react';

export interface SpikeLogoProps {
  className?: string;
  size?: number;
}

export function SpikeLogo({ className = '', size = 32 }: SpikeLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${className}`}
    >
      <defs>
        {/* PayPal Iconic Dual-Tone Gradients */}
        <linearGradient id="spikeBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00186B" />
          <stop offset="50%" stopColor="#003B99" />
          <stop offset="100%" stopColor="#0066CC" />
        </linearGradient>

        <linearGradient id="spikeCyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#0099FF" />
        </linearGradient>

        <linearGradient id="spikeWhite" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E0F2FE" />
        </linearGradient>

        <filter id="spikeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#001040" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Modern Gradient Squircle Base */}
      <rect width="36" height="36" rx="9" fill="url(#spikeBg)" />
      <rect
        width="36"
        height="36"
        rx="9"
        stroke="rgba(255, 255, 255, 0.18)"
        strokeWidth="1"
      />

      {/* Bold Forward-Leaning Spike Monogram (12-deg slant) */}
      <g transform="skewX(-10) translate(4, 2)" filter="url(#spikeGlow)">
        {/* Top Arc: Electric PayPal Cyan */}
        <path
          d="M17.5 7H11.5C9.5 7 8 8.5 8 10.5C8 12.5 9.5 14 11.5 14H15C16.8 14 18 15.2 18 17C18 18.8 16.5 20 14.5 20H8.5"
          stroke="url(#spikeCyan)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Dynamic Forward Spike / Bolt Accent */}
        <path
          d="M12.5 11L18.5 17L13 22.5"
          stroke="url(#spikeWhite)"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.95"
        />

        {/* PayPal Intersection Core Dot */}
        <circle cx="15" cy="14" r="1.5" fill="#00E5FF" />
      </g>
    </svg>
  );
}
