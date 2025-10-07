import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameAPI } from '../../services/api';
import { useUser } from '../../contexts/UserContext';
import './Matchmaking.css';

interface GameLobby {
  id: string;
  host: {
    id: string;
    username: string;
    avatar?: string;
  };
  status: 'waiting' | 'full';
  createdAt: string;
  playersCount: number;
  maxPlayers: 2;
}

const Matchmaking: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [lobbys, setLobbys] = useState<GameLobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingLobby, setIsCreatingLobby] = useState(false);

  // Charger la liste des lobbys
  const loadLobbys = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer les lobbys en attente via la nouvelle API
      const response = await gameAPI.getAllLobbys();
      console.log('📡 Lobbys récupérés:', response.data);
      
      setLobbys(response.data || []);
      setError(null);
    } catch (err: any) {
      console.error('❌ Erreur chargement lobbys:', err);
      setError('Erreur lors du chargement des lobbys');
      setLobbys([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLobbys();
    
    // Rafraîchir toutes les 5 secondes
    const interval = setInterval(loadLobbys, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateLobby = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setIsCreatingLobby(true);
      console.log('🎮 Création d\'un nouveau lobby...');
      
      // Utiliser la nouvelle API createLobby
      const response = await gameAPI.createLobby();
      const data = response.data;
      
      console.log('📡 Lobby créé:', data);
      
      // Rediriger vers le lobby créé
      navigate(`/lobby/${data.gameId}`);
    } catch (err: any) {
      console.error('❌ Erreur création lobby:', err);
      alert('Erreur lors de la création du lobby: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsCreatingLobby(false);
    }
  };

  const handleJoinLobby = async (lobbyId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      console.log(`🎯 Rejoindre le lobby: ${lobbyId}`);
      
      // Appeler l'API pour rejoindre le lobby
      const response = await gameAPI.joinLobby(lobbyId);
      const data = response.data;
      
      console.log('📡 Lobby rejoint:', data);
      
      // Si le lobby est complet, aller directement au jeu
      if (!data.isWaiting) {
        navigate(`/game/${data.gameId}`);
      } else {
        navigate(`/lobby/${lobbyId}`);
      }
    } catch (err: any) {
      console.error('❌ Erreur rejoindre lobby:', err);
      alert('Erreur: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    const diffHours = Math.floor(diffMins / 60);
    return `Il y a ${diffHours}h${diffMins % 60}min`;
  };

  if (isLoading) {
    return (
      <div className="matchmaking-loading">
        <div className="loading-icon">⏳</div>
        <p>Chargement des lobbys...</p>
      </div>
    );
  }

  return (
    <div className="matchmaking-page">
      <div className="container">
        <div className="matchmaking-header">
          <h1 className="page-title">🎮 Lobbys de Matchmaking</h1>
          <p className="page-subtitle">Rejoins un lobby ou crée le tien pour jouer en 1v1</p>
          
          <div className="header-actions">
            <button 
              className="btn btn-primary btn-large"
              onClick={handleCreateLobby}
              disabled={isCreatingLobby}
            >
              {isCreatingLobby ? '⏳ Création...' : '➕ Créer un lobby'}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={loadLobbys}
            >
              🔄 Actualiser
            </button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        <div className="lobbys-section">
          <div className="section-header">
            <h2>🏓 Lobbys disponibles ({lobbys.filter(l => l.status === 'waiting').length})</h2>
          </div>

          {lobbys.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <h3>Aucun lobby disponible</h3>
              <p>Sois le premier à créer un lobby !</p>
              <button 
                className="btn btn-primary"
                onClick={handleCreateLobby}
                disabled={isCreatingLobby}
              >
                ➕ Créer le premier lobby
              </button>
            </div>
          ) : (
            <div className="lobbys-grid">
              {lobbys.map((lobby) => (
                <div key={lobby.id} className="lobby-card">
                  <div className="lobby-header">
                    <div className="lobby-host">
                      <div className="host-avatar">
                        {lobby.host.avatar || '👤'}
                      </div>
                      <div className="host-info">
                        <div className="host-name">{lobby.host.username}</div>
                        <div className="lobby-time">{formatTimeAgo(lobby.createdAt)}</div>
                      </div>
                    </div>
                    <div className={`lobby-status ${lobby.status}`}>
                      {lobby.status === 'waiting' ? '🟡 En attente' : '🔴 Complet'}
                    </div>
                  </div>

                  <div className="lobby-info">
                    <div className="lobby-players">
                      <span className="players-icon">👥</span>
                      <span className="players-count">
                        {lobby.playersCount}/{lobby.maxPlayers} joueurs
                      </span>
                    </div>
                    <div className="lobby-type">
                      <span className="type-icon">🏓</span>
                      <span>Partie rapide 1v1</span>
                    </div>
                  </div>

                  <div className="lobby-actions">
                    {lobby.status === 'waiting' ? (
                      <button 
                        className="btn btn-primary btn-block"
                        onClick={() => handleJoinLobby(lobby.id)}
                      >
                        🚀 Rejoindre le lobby
                      </button>
                    ) : (
                      <button className="btn btn-disabled btn-block" disabled>
                        🔒 Lobby complet
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="help-section">
          <h3>💡 Comment ça marche ?</h3>
          <div className="help-grid">
            <div className="help-item">
              <div className="help-number">1</div>
              <div className="help-content">
                <h4>Crée un lobby</h4>
                <p>Clique sur "Créer un lobby" pour ouvrir une salle d'attente</p>
              </div>
            </div>
            <div className="help-item">
              <div className="help-number">2</div>
              <div className="help-content">
                <h4>Attends un adversaire</h4>
                <p>Ton lobby apparaît dans la liste pour que d'autres puissent te rejoindre</p>
              </div>
            </div>
            <div className="help-item">
              <div className="help-number">3</div>
              <div className="help-content">
                <h4>Joue !</h4>
                <p>Dès qu'un 2ème joueur rejoint, la partie démarre automatiquement</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Matchmaking;