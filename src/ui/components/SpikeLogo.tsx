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
      className={`flex-shrink-0 transition-transform duration-150 group-hover:scale-105 ${className}`}
    >
      <defs>
        {/* PayPal Signature Dual-Tone Palette */}
        {/* Primary Deep PayPal Blue */}
        <linearGradient id="ppDeep" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#001C66" />
          <stop offset="100%" stopColor="#00457C" />
        </linearGradient>

        {/* Vibrant Forward PayPal Blue */}
        <linearGradient id="ppVibrant" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0079C1" />
          <stop offset="100%" stopColor="#009CDE" />
        </linearGradient>

        {/* Intersection Overlay */}
        <linearGradient id="ppGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00B2FF" />
          <stop offset="100%" stopColor="#0079C1" />
        </linearGradient>
      </defs>

      {/* Rounded Brand Tile */}
      <rect width="36" height="36" rx="9" fill="#0A1128" />
      <rect width="36" height="36" rx="9" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      {/* Dual PayPal-inspired forward-leaning glyph forming the Spike 'S' & double-P monogram */}
      <g transform="skewX(-11) translate(4.5, 2)">
        {/* Back Layer: Deep PayPal Blue */}
        <path
          d="M17 5.5C19.8 5.5 22 7.2 22 10C22 12.5 19.8 14.5 16.5 15.2L13 16C10.5 16.5 9 18 9 20C9 22.5 11.2 24.5 14.5 24.5H19C19.6 24.5 20 25 20 25.5C20 26 19.6 26.5 19 26.5H14.5C9.8 26.5 6.5 23.5 6.5 19.5C6.5 16 9 14 12 13.2L15.5 12.5C18 12 19.5 10.8 19.5 9C19.5 7.5 18 6.5 16 6.5H10.5C9.9 6.5 9.5 6 9.5 5.5C9.5 5 9.9 4.5 10.5 4.5H16C16.3 4.5 16.7 4.8 17 5.5Z"
          fill="url(#ppDeep)"
        />

        {/* Front Layer: Vibrant PayPal Cyan-Blue */}
        <path
          d="M14 8C17 8 19.5 9.8 19.5 12.5C19.5 14.8 17.5 16.6 14.2 17.2L11 18C8.5 18.5 7 20 7 22C7 24.2 9.2 26 12.5 26H17C17.6 26 18 26.5 18 27C18 27.5 17.6 28 17 28H12.5C7.8 28 4.5 25 4.5 21C4.5 17.8 7 15.8 10 15L13.2 14.2C16 13.5 17.2 12.2 17.2 10.5C17.2 9 15.8 8 13.8 8H8.5C7.9 8 7.5 7.5 7.5 7C7.5 6.5 7.9 6 8.5 6H13C13.4 6 13.7 6.8 14 8Z"
          fill="url(#ppVibrant)"
        />

        {/* Monogram Overlap Blend Accent */}
        <path
          d="M13 14.2L14.2 17.2C15.5 16.5 16.8 15.2 17.2 13.8C16 14 14.5 14.1 13 14.2Z"
          fill="url(#ppGlow)"
          opacity="0.8"
        />
      </g>
    </svg>
  );
}
