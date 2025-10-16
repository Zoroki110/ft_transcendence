// frontend_B/src/components/Countdown/Countdown.tsx - COMPOSANT COUNTDOWN
import React, { useState, useEffect } from 'react';
import { Timer, Play } from 'lucide-react';
import './Countdown.css';

interface CountdownProps {
  initialSeconds: number;
  onComplete: () => void;
  title?: string;
  subtitle?: string;
}

const Countdown: React.FC<CountdownProps> = ({
  initialSeconds,
  onComplete,
  title = "Démarrage imminent",
  subtitle = "Le match va commencer dans"
}) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, onComplete]);

  const getCountdownColor = () => {
    if (seconds <= 3) return 'var(--danger)';
    if (seconds <= 5) return 'var(--warning)';
    return 'var(--success)';
  };

  return (
    <div className="countdown-overlay">
      <div className="countdown-container">
        <div className="countdown-icon">
          <Timer size={48} />
        </div>
        <h2 className="countdown-title">{title}</h2>
        <p className="countdown-subtitle">{subtitle}</p>

        <div
          className="countdown-circle"
          style={{
            '--countdown-color': getCountdownColor(),
            '--countdown-progress': `${(seconds / initialSeconds) * 100}%`
          } as React.CSSProperties}
        >
          <div className="countdown-number">{seconds}</div>
        </div>

        <div className="countdown-message">
          {seconds <= 3 ? (
            <div className="countdown-urgent">
              <Play size={20} />
              <span>C'est parti !</span>
            </div>
          ) : (
            <span>Préparez-vous...</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Countdown;
