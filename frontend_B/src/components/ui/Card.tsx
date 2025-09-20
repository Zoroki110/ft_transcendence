import React from 'react';

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
      glass rounded-2xl
      ${hover ? 'hover:scale-105 hover:shadow-2xl transition-all duration-500 group' : ''}
      ${glow ? 'hover:shadow-cyan-500/20' : ''}
      ${className}
    `}>
      {/* Effet de grille en arrière-plan */}
      <div 
        className="absolute inset-0 opacity-5 rounded-2xl"
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
