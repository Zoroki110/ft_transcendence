// frontend_B/src/components/ui/GlowText.tsx
import React from 'react';

interface GlowTextProps {
  children: React.ReactNode;
  color?: 'cyan' | 'purple' | 'green' | 'red';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const GlowText: React.FC<GlowTextProps> = ({ 
  children, 
  color = 'cyan', 
  size = 'md',
  className = '' 
}) => {
  const colors = {
    cyan: 'from-cyan-400 to-blue-400',
    purple: 'from-purple-400 to-pink-400',
    green: 'from-green-400 to-teal-400', 
    red: 'from-red-400 to-orange-400'
  };

  const sizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  return (
    <span className={`
      font-bold bg-gradient-to-r ${colors[color]} bg-clip-text text-transparent
      ${sizes[size]} ${className}
    `}>
      {children}
    </span>
  );
};
