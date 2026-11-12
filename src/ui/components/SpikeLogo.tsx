import React from 'react';

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
      viewBox="157 150 1000 1000"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Spike"
      className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${className}`}
    >
      <rect x="157" y="150" width="1000" height="1000" rx="230" fill="#EDEDEB" />
      <g fill="#3A3A3A">
        <path d="M407 278 H680 C820 278 920 390 920 540 C920 690 810 800 660 805 V600 L783 708 L632 462 L568 575 C470 590 395 560 395 500 V290 Q395 278 407 278 Z" />
        <path d="M395 1010 V770 C395 690 450 615 559 592 L495 705 L612 615 V1010 Q612 1022 600 1022 H407 Q395 1022 395 1010 Z" />
      </g>
    </svg>
  );
}
