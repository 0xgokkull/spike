import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const VARIANTS = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm border border-transparent',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 font-medium border border-slate-200',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-sm border border-transparent',
  outline: 'bg-transparent hover:bg-slate-50 text-slate-700 font-medium border border-slate-300',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 font-medium border border-transparent',
};

const SIZES = {
  sm: 'px-2.5 py-1 text-xs rounded',
  md: 'px-3.5 py-1.5 text-sm rounded-md',
  lg: 'px-4 py-2 text-base rounded-md',
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
  const disabledCls = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';

  return (
    <button
      className={`inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${variantCls} ${sizeCls} ${disabledCls} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
