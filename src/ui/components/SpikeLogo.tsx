import React from 'react';
import { LOGO_INK, LOGO_PAPER, LOGO_PATHS, LOGO_VIEWBOX } from '@/ui/brand/logo';

export interface SpikeLogoProps {
  className?: string;
  size?: number;
}

// Spike mark: a solid "P" split by an upward arrow (the agent resolving a case).
// Drawn on a light tile so it stays legible on the dark top navigation.
export function SpikeLogo({ className = '', size = 32 }: SpikeLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={LOGO_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Spike"
      className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${className}`}
    >
      <rect x="157" y="150" width="1000" height="1000" rx="230" fill={LOGO_PAPER} />
      <g fill={LOGO_INK}>
        {LOGO_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}
