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
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${className}`}
    >
      <defs>
        {/* Background Squircle Gradient */}
        <linearGradient id="spikeBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B132B" />
          <stop offset="100%" stopColor="#050814" />
        </linearGradient>

        {/* PayPal Deep Blue Monogram Layer */}
        <linearGradient id="ppDeepLayer" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#001C66" />
          <stop offset="100%" stopColor="#003087" />
        </linearGradient>

        {/* PayPal Electric Cyan Spike Layer */}
        <linearGradient id="ppCyanSpike" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="50%" stopColor="#0099FF" />
          <stop offset="100%" stopColor="#0066CC" />
        </linearGradient>

        {/* Luminous Intersection Glow */}
        <linearGradient id="ppCoreGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="100%" stopColor="#0052FF" />
        </linearGradient>

        <filter id="spikeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000B26" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Premium Dark Navy Squircle Base with Metallic Border */}
      <rect width="40" height="40" rx="10" fill="url(#spikeBgGrad)" />
      <rect
        width="40"
        height="40"
        rx="10"
        stroke="rgba(0, 229, 255, 0.25)"
        strokeWidth="1.2"
      />

      {/* PayPal Dual-Tone Interlocking Monogram Slanted at -11deg */}
      <g transform="skewX(-11) translate(5, 3)" filter="url(#spikeShadow)">
        {/* Base Layer: Deep PayPal Blue Foundation Path */}
        <path
          d="M10 8C10 6.9 10.9 6 12 6H18C22.4 6 25 8.5 25 12C25 15.2 22.8 17.5 19 17.9L16.2 18.2C15.5 18.3 15 18.9 15 19.6V26C15 27.1 14.1 28 13 28H10C8.9 28 8 27.1 8 26V10C8 8.9 8.9 8 10 8Z"
          fill="url(#ppDeepLayer)"
        />

        {/* Forward Dynamic Spike: Electric Cyan & Royal Blue Overlap forming 'S' */}
        <path
          d="M16 12C16 10.9 16.9 10 18 10H23C26.5 10 29 12.2 29 15.5C29 18.4 27 20.6 23.8 21.1L20.5 21.6C19.7 21.7 19 22.4 19 23.2V30C19 31.1 18.1 32 17 32H14C12.9 32 12 31.1 12 30V18C12 14.7 13.8 12 16 12Z"
          fill="url(#ppCyanSpike)"
          fillOpacity="0.95"
        />

        {/* Dynamic Forward Slash / Lightning Bolt Accent */}
        <path
          d="M14 20L22 14L18 25L26 19"
          stroke="url(#ppCoreGlow)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />

        {/* Luminous Apex Dot */}
        <circle cx="26" cy="19" r="1.8" fill="#FFFFFF" />
      </g>
    </svg>
  );
}
