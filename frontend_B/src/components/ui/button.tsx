// frontend_B/src/components/ui/Button.tsx
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button'
}) => {
  const baseClasses = "relative overflow-hidden font-semibold rounded-xl transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-cyan-500 to-purple-500 text-black hover:shadow-2xl hover:shadow-cyan-500/25 hover:scale-105",
    secondary: "bg-gray-800/80 backdrop-blur-sm border border-gray-700 text-white hover:border-gray-600 hover:bg-gray-700/80",
    danger: "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:shadow-2xl hover:shadow-red-500/25 hover:scale-105",
    success: "bg-gradient-to-r from-green-500 to-teal-500 text-black hover:shadow-2xl hover:shadow-green-500/25 hover:scale-105"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {/* Effet de brillance */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      
      <div className="relative flex items-center justify-center space-x-2">
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent"></div>
        ) : (
          <>
            {icon && <span className="text-lg">{icon}</span>}
            <span>{children}</span>
          </>
        )}
      </div>
    </button>
  );
};

// frontend_B/src/components/ui/Card.tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = true,
  glow = false 
}) => {
  return (
    <div className={`
      relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl
      ${hover ? 'hover:border-gray-700 hover:-translate-y-2 hover:shadow-2xl transition-all duration-500' : ''}
      ${glow ? 'hover:shadow-cyan-500/10' : ''}
      ${className}
    `}>
      {/* Effet de grille en arrière-plan */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}
      ></div>
      
      {/* Contenu */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Effet de brillance au hover */}
      {hover && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-2xl"></div>
      )}
    </div>
  );
};

// frontend_B/src/components/ui/LoadingSpinner.tsx
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text 
}) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16', 
    lg: 'h-24 w-24'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className={`animate-spin rounded-full border-t-2 border-r-2 border-cyan-400 ${sizes[size]}`}></div>
        <div className={`absolute inset-0 animate-ping rounded-full border border-cyan-400/20 ${sizes[size]}`}></div>
      </div>
      {text && (
        <p className="text-gray-300 animate-pulse">{text}</p>
      )}
      <div className="flex space-x-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          ></div>
        ))}
      </div>
    </div>
  );
};

// frontend_B/src/components/ui/StatusBadge.tsx
interface StatusBadgeProps {
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'FULL' | 'CANCELLED';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const configs = {
    OPEN: { 
      bg: 'bg-green-500/20', 
      text: 'text-green-400', 
      border: 'border-green-500/50',
      label: 'Ouvert',
      icon: '🟢'
    },
    IN_PROGRESS: { 
      bg: 'bg-blue-500/20', 
      text: 'text-blue-400', 
      border: 'border-blue-500/50',
      label: 'En cours',
      icon: '⚡'
    },
    COMPLETED: { 
      bg: 'bg-purple-500/20', 
      text: 'text-purple-400', 
      border: 'border-purple-500/50',
      label: 'Terminé',
      icon: '🏆'
    },
    FULL: { 
      bg: 'bg-yellow-500/20', 
      text: 'text-yellow-400', 
      border: 'border-yellow-500/50',
      label: 'Complet',
      icon: '🔥'
    },
    CANCELLED: { 
      bg: 'bg-red-500/20', 
      text: 'text-red-400', 
      border: 'border-red-500/50',
      label: 'Annulé',
      icon: '❌'
    }
  };

  const config = configs[status];
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`
      inline-flex items-center space-x-1 rounded-lg font-medium border backdrop-blur-sm
      ${config.bg} ${config.text} ${config.border} ${sizeClasses}
    `}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

// frontend_B/src/components/ui/ProgressBar.tsx
interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'cyan' | 'purple' | 'green' | 'red';
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  max,
  label,
  showPercentage = true,
  color = 'cyan',
  animated = true
}) => {
  const percentage = Math.round((current / max) * 100);
  
  const colors = {
    cyan: 'from-cyan-500 to-blue-500',
    purple: 'from-purple-500 to-pink-500', 
    green: 'from-green-500 to-teal-500',
    red: 'from-red-500 to-orange-500'
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-300 font-medium">{label}</span>
          {showPercentage && (
            <span className="text-gray-400 font-mono">
              {current}/{max} ({percentage}%)
            </span>
          )}
        </div>
      )}
      
      <div className="relative w-full bg-gray-800 rounded-full h-3 overflow-hidden">
        <div
          className={`
            absolute top-0 left-0 h-full rounded-full transition-all duration-1000 shadow-lg
            bg-gradient-to-r ${colors[color]}
            ${animated ? 'shadow-' + color + '-500/30' : ''}
          `}
          style={{ width: `${percentage}%` }}
        ></div>
        
        {animated && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
        )}
      </div>
    </div>
  );
};

// frontend_B/src/components/ui/GlowText.tsx
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