import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const VARIANTS = {
  primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium shadow-xs border border-blue-700/40',
  secondary: 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-medium border border-slate-200 shadow-xs',
  danger: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-medium shadow-xs border border-rose-700/40',
  outline: 'bg-transparent hover:bg-slate-50 text-slate-700 font-medium border border-slate-300 shadow-xs',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 font-medium border border-transparent',
};

const SIZES = {
  sm: 'px-2.5 py-1 text-xs rounded-md',
  md: 'px-3.5 py-1.5 text-xs rounded-md',
  lg: 'px-4 py-2 text-sm rounded-md',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const variantCls = VARIANTS[variant] || VARIANTS.primary;
  const sizeCls = SIZES[size] || SIZES.md;
  const disabledCls = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'active:scale-[0.98]';

  return (
    <button
      className={`inline-flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 select-none ${variantCls} ${sizeCls} ${disabledCls} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
