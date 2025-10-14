import React, { useEffect, useState } from 'react';
import './tournament-celebration.css';

interface TournamentCelebrationProps {
  champion: {
    id: number;
    username: string;
    avatar?: string;
  };
  tournamentName: string;
  onAnimationEnd?: () => void;
  show: boolean;
}

export const TournamentCelebration: React.FC<TournamentCelebrationProps> = ({
  champion,
  tournamentName,
  onAnimationEnd,
  show
}) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      // Générer des particules aléatoirement
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        delay: Math.random() * 2
      }));
      setParticles(newParticles);

      // Auto-hide après 5 secondes
      const timer = setTimeout(() => {
        onAnimationEnd?.();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [show, onAnimationEnd]);

  if (!show) return null;

  return (
    <div className="tournament-celebration">
      {/* Overlay de fond */}
      <div className="celebration-overlay" />
      
      {/* Confettis */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={`confetti-${i}`}
          className="confetti"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${2 + Math.random() * 3}s`,
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      ))}

      {/* Particules de spray */}
      {particles.slice(0, 20).map((particle) => (
        <div
          key={`spray-${particle.id}`}
          className="spray-particle"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            animationDelay: `${particle.delay}s`,
            '--spray-x': `${(Math.random() - 0.5) * 400}px`,
            '--spray-y': `${-200 - Math.random() * 200}px`
          } as React.CSSProperties}
        />
      ))}

      {/* Feux d'artifice */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`firework-${i}`}
          className="firework"
          style={{
            left: `${20 + i * 10}%`,
            top: `${20 + Math.random() * 60}%`,
            animationDelay: `${i * 0.2}s`
          }}
        />
      ))}

      {/* Annonce du champion */}
      <div className="champion-announcement">
        <div className="trophy-icon">🏆</div>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          CHAMPION !
        </div>
        <div style={{ fontSize: '2rem', color: '#FFF', textShadow: '0 0 10px rgba(255,255,255,0.8)' }}>
          {champion.username}
        </div>
        <div style={{ fontSize: '1.2rem', color: '#FFD700', marginTop: '0.5rem', opacity: 0.9 }}>
          {tournamentName}
        </div>
        <div style={{ fontSize: '1rem', color: '#FFF', marginTop: '1rem', opacity: 0.7 }}>
          🎉 Félicitations ! 🎉
        </div>
      </div>

      {/* Particules dorées flottantes */}
      <div className="golden-particles">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={`golden-${i}`}
            className="golden-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Hook pour écouter les événements de fin de tournoi
export const useTournamentCelebration = () => {
  const [celebration, setCelebration] = useState<{
    show: boolean;
    champion?: { id: number; username: string; avatar?: string };
    tournamentName?: string;
  }>({ show: false });

  useEffect(() => {
    // Écouter l'événement WebSocket
    const handleTournamentCompleted = (data: any) => {
      if (data.celebration && data.champion) {
        setCelebration({
          show: true,
          champion: data.champion,
          tournamentName: data.tournamentName
        });
      }
    };

    // Si vous utilisez Socket.IO
    // socket.on('tournamentCompleted', handleTournamentCompleted);

    return () => {
      // socket.off('tournamentCompleted', handleTournamentCompleted);
    };
  }, []);

  const hideCelebration = () => {
    setCelebration({ show: false });
  };

  return { celebration, hideCelebration };
};

export default TournamentCelebration;