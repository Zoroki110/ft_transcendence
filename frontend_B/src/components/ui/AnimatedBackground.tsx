// frontend_B/src/components/ui/AnimatedBackground.tsx
import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

export const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const initParticles = () => {
      const particles: Particle[] = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 15000);

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.5 + 0.2,
          color: Math.random() > 0.5 ? '#06b6d4' : '#8b5cf6' // cyan ou purple
        });
      }

      particlesRef.current = particles;
    };

    initParticles();

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, index) => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap around edges
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.y > canvas.height) particle.y = 0;
        if (particle.y < 0) particle.y = canvas.height;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();

        // Draw connections
        particlesRef.current.forEach((otherParticle, otherIndex) => {
          if (index !== otherIndex) {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.strokeStyle = particle.color;
              ctx.globalAlpha = (100 - distance) / 100 * 0.2;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: 'transparent' }}
    />
  );
};

// frontend_B/src/components/ui/GradientBackground.tsx
export const GradientBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0">
      {/* Gradient de base */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
      
      {/* Orbes colorés animés */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      {/* Grille subtile */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}
      ></div>
    </div>
  );
};

// frontend_B/src/components/layout/Layout.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatedBackground } from '../ui/AnimatedBackground';
import { GradientBackground } from '../ui/GradientBackground';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      {/* Background animé */}
      <GradientBackground />
      <AnimatedBackground />
      
      {/* Navigation */}
      <nav className="relative z-50 bg-black/20 backdrop-blur-xl border-b border-gray-800/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center text-black font-bold text-xl group-hover:scale-110 transition-transform duration-300">
                  🏓
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg blur group-hover:blur-md transition-all duration-300 -z-10"></div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                PONG ARENA
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {[
                { path: '/', label: 'Accueil', icon: '🏠' },
                { path: '/tournaments', label: 'Tournois', icon: '🏆' },
                { path: '/tournaments/create', label: 'Créer', icon: '⚡' },
                { path: '/tournaments/my', label: 'Mes Tournois', icon: '👤' }
              ].map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2
                    ${location.pathname === link.path
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }
                  `}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden p-2 rounded-lg bg-gray-800/50 border border-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-black/20 backdrop-blur-xl border-t border-gray-800/50 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            Made with ⚡ by <span className="text-cyan-400 font-semibold">École 42</span>
          </p>
        </div>
      </footer>
    </div>
  );
};