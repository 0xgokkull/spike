import React from 'react';
import { formatMoney } from '@/lib/money';

interface MoneyProps {
  cents: number;
  className?: string;
}

export function Money({ cents, className = '' }: MoneyProps) {
  return <span className={`font-mono font-medium ${className}`}>{formatMoney(cents)}</span>;
}
