// frontend_B/src/pages/GamesList/GamesList.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameAPI } from '../../services/api';
import { useUser } from '../../contexts/UserContext';
import './GamesList.css';

interface Lobby {
  id: string;
  creatorId: number;
  creatorUsername?: string;
  status: 'waiting' | 'in_progress' | 'finished';
  playersCount: number;
  maxPlayers: number;
  createdAt: string;
}

const GamesList: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUser();
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingLobby, setIsCreatingLobby] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    fetchLobbies();
  }, [isLoggedIn, navigate]);

  const fetchLobbies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await gameAPI.getAllLobbys();
      setLobbies(response.data);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des lobbies:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des parties');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLobby = async () => {
    try {
      setIsCreatingLobby(true);
      const response = await gameAPI.createLobby();
      const lobbyId = response.data.id || response.data.gameId;
      navigate(`/matchmaking/${lobbyId}`);
    } catch (err: any) {
      console.error('Erreur lors de la création du lobby:', err);
      alert(err.response?.data?.message || 'Impossible de créer une partie');
    } finally {
      setIsCreatingLobby(false);
    }
  };

  const handleJoinLobby = async (lobbyId: string) => {
    try {
      await gameAPI.joinLobby(lobbyId);
      navigate(`/matchmaking/${lobbyId}`);
    } catch (err: any) {
      console.error('Erreur lors de la jonction au lobby:', err);
      alert(err.response?.data?.message || 'Impossible de rejoindre cette partie');
    }
  };

  const handleQuickMatch = async () => {
    try {
      setIsCreatingLobby(true);
      const response = await gameAPI.createQuickMatch();
      const gameId = response.data.gameId;
      navigate(`/matchmaking/${gameId}`);
    } catch (err: any) {
      console.error('Erreur lors de la création de la partie rapide:', err);
      alert(err.response?.data?.message || 'Impossible de créer une partie rapide');
    } finally {
      setIsCreatingLobby(false);
    }
  };

  if (isLoading) {
    return (
      <div className="games-list-loading">
        <div className="loading-spinner"></div>
        <p>Chargement des parties disponibles...</p>
      </div>
    );
  }

  return (
    <div className="games-list-page">
      <div className="games-list-container">
        <div className="games-list-header">
          <h1>🎮 Parties disponibles</h1>
          <p className="games-list-subtitle">
            Rejoignez une partie existante ou créez la vôtre
          </p>
        </div>

        <div className="games-list-actions">
          <button
            className="btn btn-primary btn-large"
            onClick={handleQuickMatch}
            disabled={isCreatingLobby}
          >
            🚀 Partie rapide
          </button>
          <button
            className="btn btn-secondary btn-large"
            onClick={handleCreateLobby}
            disabled={isCreatingLobby}
          >
            ➕ Créer une partie
          </button>
          <button
            className="btn btn-outline"
            onClick={fetchLobbies}
            disabled={isLoading}
          >
            🔄 Rafraîchir
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="lobbies-list">
          {lobbies.length === 0 ? (
            <div className="no-lobbies">
              <div className="no-lobbies-icon">🏓</div>
              <h3>Aucune partie disponible</h3>
              <p>Soyez le premier à créer une partie !</p>
              <button
                className="btn btn-primary"
                onClick={handleCreateLobby}
                disabled={isCreatingLobby}
              >
                ➕ Créer une partie
              </button>
            </div>
          ) : (
            <div className="lobbies-grid">
              {lobbies.map((lobby) => (
                <div key={lobby.id} className="lobby-card">
                  <div className="lobby-card-header">
                    <div className="lobby-status">
                      <span className={`status-badge status-${lobby.status}`}>
                        {lobby.status === 'waiting' ? '⏳ En attente' :
                         lobby.status === 'in_progress' ? '🎮 En cours' :
                         '✅ Terminée'}
                      </span>
                    </div>
                    <div className="lobby-players">
                      <span className="players-icon">👥</span>
                      <span className="players-count">
                        {lobby.playersCount}/{lobby.maxPlayers}
                      </span>
                    </div>
                  </div>

                  <div className="lobby-card-body">
                    <h3 className="lobby-title">
                      Partie de {lobby.creatorUsername || `Joueur #${lobby.creatorId}`}
                    </h3>
                    <p className="lobby-info">
                      <span className="info-icon">🕐</span>
                      Créée {new Date(lobby.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>

                  <div className="lobby-card-footer">
                    {lobby.status === 'waiting' && lobby.playersCount < lobby.maxPlayers ? (
                      <button
                        className="btn btn-primary btn-block"
                        onClick={() => handleJoinLobby(lobby.id)}
                      >
                        🎯 Rejoindre
                      </button>
                    ) : lobby.status === 'in_progress' ? (
                      <button className="btn btn-disabled btn-block" disabled>
                        🔒 En cours
                      </button>
                    ) : (
                      <button className="btn btn-disabled btn-block" disabled>
                        ✅ Complète
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamesList;
