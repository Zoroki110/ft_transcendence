// frontend_B/src/pages/Matchmaking/Matchmaking.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gameAPI } from '../../services/api';
import { useUser } from '../../contexts/UserContext';
import './Matchmaking.css';

interface MatchmakingData {
  id: string;
  status: 'waiting' | 'found' | 'error';
  waitingTime: number;
  playersWaiting: number;
}

const Matchmaking: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [matchmakingData, setMatchmakingData] = useState<MatchmakingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeMatchmaking = async () => {
      if (!gameId) {
        setError('ID de partie manquant');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Pour les parties rapides, créer la session de matchmaking
        if (gameId.startsWith('quick_')) {
          setMatchmakingData({
            id: gameId,
            status: 'waiting',
            waitingTime: 0,
            playersWaiting: 1
          });
        } else {
          // Pour d'autres types de parties, rediriger directement vers le jeu
          navigate(`/game/${gameId}`);
          return;
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur de matchmaking');
      } finally {
        setIsLoading(false);
      }
    };

    initializeMatchmaking();
  }, [gameId, navigate]);

  // Timer pour le temps d'attente
  useEffect(() => {
    if (matchmakingData?.status === 'waiting') {
      const interval = setInterval(() => {
        setMatchmakingData(prev => prev ? {
          ...prev,
          waitingTime: prev.waitingTime + 1
        } : null);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [matchmakingData?.status]);

  // Simulation de match trouvé après 5 secondes (pour les tests)
  useEffect(() => {
    if (matchmakingData?.status === 'waiting') {
      const timeout = setTimeout(() => {
        console.log('🎉 Match trouvé ! Redirection vers le jeu...');
        navigate(`/game/${gameId}`);
      }, 5000); // 5 secondes pour les tests

      return () => clearTimeout(timeout);
    }
  }, [matchmakingData?.status, gameId, navigate]);

  const handleCancelMatchmaking = () => {
    navigate('/');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="matchmaking-loading">
        <div className="loading-icon">⏳</div>
        <p>Initialisation du matchmaking...</p>
      </div>
    );
  }

  if (error || !matchmakingData) {
    return (
      <div className="matchmaking-error">
        <div className="error-icon">⚠️</div>
        <p className="error-message">{error || 'Erreur de matchmaking'}</p>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/')}
        >
          ← Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="matchmaking-page">
      <div className="matchmaking-container">
        <div className="matchmaking-header">
          <h1 className="matchmaking-title">🎮 Recherche d'adversaire</h1>
          <p className="matchmaking-subtitle">Nous cherchons un adversaire pour vous...</p>
        </div>

        <div className="matchmaking-content">
          <div className="searching-animation">
            <div className="searching-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            <p className="searching-text">Recherche en cours...</p>
          </div>

          <div className="matchmaking-stats">
            <div className="stat-item">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <div className="stat-label">Temps d'attente</div>
                <div className="stat-value">{formatTime(matchmakingData.waitingTime)}</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-label">Joueurs en attente</div>
                <div className="stat-value">{matchmakingData.playersWaiting}</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">🏓</div>
              <div className="stat-content">
                <div className="stat-label">Type de partie</div>
                <div className="stat-value">Partie rapide</div>
              </div>
            </div>
          </div>

          <div className="matchmaking-tips">
            <h3>💡 Conseils pendant l'attente</h3>
            <ul>
              <li>Assurez-vous d'avoir une connexion stable</li>
              <li>Préparez-vous mentalement pour la partie</li>
              <li>Le matchmaking trouve généralement un adversaire en moins de 30 secondes</li>
            </ul>
          </div>
        </div>

        <div className="matchmaking-actions">
          <button 
            className="btn btn-danger"
            onClick={handleCancelMatchmaking}
          >
            ❌ Annuler la recherche
          </button>
        </div>
      </div>
    </div>
  );
};

export default Matchmaking;