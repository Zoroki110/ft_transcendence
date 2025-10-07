import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gameAPI } from '../../services/api';
import { useUser } from '../../contexts/UserContext';
import { socketService } from '../../services/socket';
import './Lobby.css';

interface LobbyData {
  id: string;
  host: {
    id: string;
    username: string;
    avatar?: string;
  };
  players: Array<{
    id: string;
    username: string;
    avatar?: string;
  }>;
  maxPlayers: 2;
  status: 'waiting' | 'ready' | 'starting';
  createdAt: string;
  waitingTime: number;
}

const Lobby: React.FC = () => {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [lobby, setLobby] = useState<LobbyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeLobby = () => {
      if (!lobbyId) {
        setError('ID de lobby manquant');
        setIsLoading(false);
        return;
      }

      if (!user) {
        navigate('/login');
        return;
      }

      console.log(`🏓 LOBBY: Initialisation du lobby ${lobbyId}`);
      
      // Créer le lobby avec le joueur actuel comme host
      const newLobby: LobbyData = {
        id: lobbyId,
        host: {
          id: user.id.toString(),
          username: user.username,
          avatar: user.avatar
        },
        players: [{
          id: user.id.toString(),
          username: user.username,
          avatar: user.avatar
        }],
        maxPlayers: 2,
        status: 'waiting',
        createdAt: new Date().toISOString(),
        waitingTime: 0
      };

      setLobby(newLobby);
      setIsLoading(false);

      // Connexion WebSocket pour ce lobby
      socketService.joinLobby(lobbyId, user.id, user.username);
    };

    initializeLobby();
  }, [lobbyId, navigate, user]);

  // Timer pour le temps d'attente
  useEffect(() => {
    if (lobby?.status === 'waiting') {
      const interval = setInterval(() => {
        setLobby(prev => prev ? {
          ...prev,
          waitingTime: prev.waitingTime + 1
        } : null);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [lobby?.status]);

  // Écouter les événements WebSocket du lobby
  useEffect(() => {
    if (!lobbyId || !user) return;

    console.log(`🔌 Setting up WebSocket listeners for lobby ${lobbyId}`);

    // Quand le lobby est complet, rediriger vers le jeu
    socketService.onLobbyComplete((data) => {
      console.log('🎉 Lobby complet ! WebSocket event:', data);
      
      setLobby(prev => prev ? { 
        ...prev, 
        status: 'starting',
        players: [
          ...prev.players,
          { id: 'player2', username: 'Adversaire', avatar: '🎮' }
        ]
      } : null);
      
      // Petit délai pour l'animation puis redirection
      setTimeout(() => {
        navigate(data.gameUrl);
      }, 3000);
    });

    // Quand un joueur se connecte au lobby
    socketService.onLobbyPlayerConnected((data) => {
      console.log('👤 Joueur connecté au lobby:', data);
    });

    // Quand un joueur quitte le lobby  
    socketService.onLobbyPlayerDisconnected((data) => {
      console.log('👤 Joueur déconnecté du lobby:', data);
    });

    // Nettoyage lors du démontage
    return () => {
      console.log(`🔌 Cleaning up WebSocket listeners for lobby ${lobbyId}`);
      socketService.offLobbyEvents();
      if (user) {
        socketService.leaveLobby(lobbyId, user.id, user.username);
      }
    };
  }, [lobbyId, navigate, user]);

  const handleLeaveLobby = () => {
    console.log('🚪 Quitter le lobby');
    
    // Nettoyer la connexion WebSocket
    if (lobbyId && user) {
      socketService.leaveLobby(lobbyId, user.id, user.username);
    }
    socketService.offLobbyEvents();
    
    navigate('/matchmaking');
  };

  const copyLobbyLink = () => {
    if (lobby?.id) {
      const lobbyLink = `${window.location.origin}/lobby/${lobby.id}`;
      navigator.clipboard.writeText(lobbyLink);
      alert('Lien du lobby copié ! Partage-le avec ton adversaire.');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="lobby-loading">
        <div className="loading-icon">⏳</div>
        <p>Chargement du lobby...</p>
      </div>
    );
  }

  if (error || !lobby) {
    return (
      <div className="lobby-error">
        <div className="error-icon">⚠️</div>
        <p className="error-message">{error || 'Lobby introuvable'}</p>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/matchmaking')}
        >
          ← Retour aux lobbys
        </button>
      </div>
    );
  }

  // Si partie en cours de démarrage
  if (lobby.status === 'starting') {
    return (
      <div className="lobby-page">
        <div className="lobby-container">
          <div className="lobby-starting">
            <div className="success-icon">🎉</div>
            <h1>Lobby complet !</h1>
            <p>Les 2 joueurs sont prêts. Lancement de la partie...</p>
            <div className="starting-animation">
              <div className="countdown">3</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Affichage du lobby d'attente
  return (
    <div className="lobby-page">
      <div className="lobby-container">
        <div className="lobby-header">
          <h1 className="lobby-title">🏓 Lobby #{lobby.id.slice(-6)}</h1>
          <p className="lobby-subtitle">En attente du 2ème joueur...</p>
        </div>

        <div className="lobby-content">
          {/* Joueurs du lobby */}
          <div className="lobby-players">
            <h3>👥 Joueurs ({lobby.players.length}/{lobby.maxPlayers})</h3>
            <div className="players-slots">
              {Array.from({ length: lobby.maxPlayers }).map((_, index) => {
                const player = lobby.players[index];
                return (
                  <div key={index} className={`player-slot ${player ? 'occupied' : 'empty'}`}>
                    {player ? (
                      <>
                        <div className="player-avatar">
                          {player.avatar || '👤'}
                        </div>
                        <div className="player-info">
                          <div className="player-name">{player.username}</div>
                          <div className="player-status">
                            {player.id === user?.id.toString() ? 'Toi (Host)' : 'Prêt'}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="player-avatar empty">
                          <div className="waiting-animation">
                            <div className="dot"></div>
                            <div className="dot"></div>
                            <div className="dot"></div>
                          </div>
                        </div>
                        <div className="player-info">
                          <div className="player-name">En attente...</div>
                          <div className="player-status">Recherche d'un joueur</div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Informations du lobby */}
          <div className="lobby-info">
            <div className="info-items">
              <div className="info-item">
                <span className="info-icon">⏱️</span>
                <span className="info-label">Temps d'attente:</span>
                <span className="info-value">{formatTime(lobby.waitingTime)}</span>
              </div>
              <div className="info-item">
                <span className="info-icon">🆔</span>
                <span className="info-label">ID du lobby:</span>
                <span className="info-value">{lobby.id}</span>
              </div>
              <div className="info-item">
                <span className="info-icon">🎮</span>
                <span className="info-label">Type:</span>
                <span className="info-value">Partie rapide 1v1</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="lobby-instructions">
            <h3>💡 Comment inviter un ami ?</h3>
            <div className="instructions">
              <div className="instruction">
                <span className="step">1.</span>
                <span>Copie le lien du lobby</span>
              </div>
              <div className="instruction">
                <span className="step">2.</span>
                <span>Envoie-le à ton adversaire</span>
              </div>
              <div className="instruction">
                <span className="step">3.</span>
                <span>Il clique sur le lien pour rejoindre</span>
              </div>
              <div className="instruction">
                <span className="step">4.</span>
                <span>La partie démarre automatiquement !</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lobby-actions">
          <button 
            className="btn btn-primary"
            onClick={copyLobbyLink}
          >
            📋 Copier le lien du lobby
          </button>
          <button 
            className="btn btn-danger"
            onClick={handleLeaveLobby}
          >
            🚪 Quitter le lobby
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;