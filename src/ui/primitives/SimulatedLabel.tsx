import React from 'react';

interface SimulatedLabelProps {
  tooltip?: string;
  className?: string;
}

export function SimulatedLabel({ tooltip, className = '' }: SimulatedLabelProps) {
  return (
    <span
      title={tooltip || 'This case or action runs in sandbox simulation mode'}
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold tracking-wider uppercase bg-purple-50 text-purple-700 border border-purple-200/80 shadow-xs ${className}`}
    >
      SIMULATED
    </span>
  );
}
