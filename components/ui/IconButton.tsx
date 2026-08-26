import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ComponentType<{ className?: string }> | any;
  variant?: 'ghost' | 'danger' | 'success' | 'teal' | 'transparent' | 'secondary';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  title?: string;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  title,
  className = "",
  ...props
}) => {
  const baseStyles = 'rounded-xl transition-all flex items-center justify-center active:scale-95 duration-150 relative disabled:opacity-50 disabled:pointer-events-none';
  
  const sizeStyles = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const variantStyles = {
    ghost: 'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
    danger: 'text-slate-400 hover:text-rose-600 hover:bg-rose-50',
    success: 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50',
    teal: 'text-teal-600 hover:text-teal-700 hover:bg-teal-50',
    secondary: 'text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200',
    transparent: 'text-slate-400 hover:text-slate-600 bg-transparent',
  };

  const iconSizeStyles = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      title={title}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <Icon className={iconSizeStyles[size]} />
    </button>
  );
};

export default IconButton;
