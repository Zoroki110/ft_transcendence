import React from 'react';
import { ButtonProps } from '../../types';

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  pulse = false
}) => {
  const baseClasses = `
    relative overflow-hidden font-semibold rounded-2xl transition-all duration-300 
    transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-4 group
  `;
  
  const variants = {
    primary: 'bg-gradient-to-r from-cyan-500 to-purple-500 text-black hover:shadow-2xl hover:shadow-cyan-500/25 hover:scale-105 focus:ring-cyan-500/30',
    secondary: 'glass text-white border border-gray-700 hover:border-gray-600 hover:scale-105 focus:ring-gray-500/30',
    danger: 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:shadow-2xl hover:shadow-red-500/25 hover:scale-105 focus:ring-red-500/30',
    success: 'bg-gradient-to-r from-green-500 to-teal-500 text-black hover:shadow-2xl hover:shadow-green-500/25 hover:scale-105 focus:ring-green-500/30',
    ghost: 'bg-transparent border-2 border-gray-600 text-gray-300 hover:border-cyan-400 hover:text-cyan-400 focus:ring-cyan-500/30'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseClasses} ${variants[variant]} ${sizes[size]} 
        ${pulse ? 'animate-pulse-glow' : ''} ${className}
      `}
    >
      {/* Effet de brillance */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      
      <div className="relative flex items-center justify-center space-x-2">
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent"></div>
        ) : (
          <>
            {icon && <span>{icon}</span>}
            <span>{children}</span>
          </>
        )}
      </div>
    </button>
  );
};
