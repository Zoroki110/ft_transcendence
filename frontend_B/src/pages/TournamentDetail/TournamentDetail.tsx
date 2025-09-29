// frontend_B/src/pages/TournamentDetail/TournamentDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../../services/api';
import './TournamentDetail.css';

interface Tournament {
  id: number;
  name: string;
  description: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed';
  maxParticipants: number;
  currentParticipants: number;
  createdAt: string;
  startDate?: string;
  creator: {
    id: string;
    username: string;
  };
  participants: Array<{
    id: string;
    username: string;
    avatar: string;
  }>;
}

const TournamentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [isParticipant] = useState(false);
  const [currentUserId] = useState<string>('');

  useEffect(() => {
    const fetchTournament = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const response = await tournamentAPI.getTournament(parseInt(id));
        setTournament(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournament();
  }, [id]);

  const handleJoin = async () => {
    if (!tournament) return;

    setIsJoining(true);
    setMessage(null);

    try {
      await tournamentAPI.joinTournament(tournament.id);
      setMessage({ type: 'success', text: 'Vous avez rejoint le tournoi !' });
      
      const response = await tournamentAPI.getTournament(tournament.id);
      setTournament(response.data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur lors de l\'inscription' });
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!tournament) return;

    setIsLeaving(true);
    setMessage(null);

    try {
      await tournamentAPI.leaveTournament(tournament.id);
      setMessage({ type: 'success', text: 'Vous avez quitté le tournoi' });
      
      const response = await tournamentAPI.getTournament(tournament.id);
      setTournament(response.data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur lors du départ' });
    } finally {
      setIsLeaving(false);
    }
  };

  const handleStart = async () => {
    if (!tournament) return;

    try {
      await tournamentAPI.startTournament(tournament.id);
      setMessage({ type: 'success', text: 'Tournoi démarré !' });
      
      const response = await tournamentAPI.getTournament(tournament.id);
      setTournament(response.data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur au démarrage' });
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { text: '⏳ En attente', color: 'var(--warning)' },
      in_progress: { text: '▶️ En cours', color: 'var(--success)' },
      completed: { text: '✅ Terminé', color: 'var(--gray-600)' }
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getTypeName = (type: string) => {
    const types = {
      single_elimination: '🏆 Élimination simple',
      double_elimination: '🏆🏆 Élimination double',
      round_robin: '🔄 Round Robin'
    };
    return types[type as keyof typeof types] || type;
  };

  if (isLoading) {
    return (
      <div className="tournament-loading">
        <div className="loading-icon">⏳</div>
        <p>Chargement du tournoi...</p>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="tournament-error">
        <div className="error-icon">⚠️</div>
        <p className="error-message">{error || 'Tournoi introuvable'}</p>
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/tournaments')}
        >
          ← Retour aux tournois
        </button>
      </div>
    );
  }

  const statusBadge = getStatusBadge(tournament.status);
  const progress = (tournament.currentParticipants / tournament.maxParticipants) * 100;
  const isFull = tournament.currentParticipants >= tournament.maxParticipants;
  const canStart = tournament.status === 'pending' && tournament.currentParticipants >= 2;
  const isCreator = tournament.creator.id === currentUserId;

  return (
    <div className="tournament-detail-page">
      <div className="page-header">
        <div className="container">
          <div className="tournament-detail-header">
            <div>
              <h1 className="page-title">{tournament.name}</h1>
              <p className="page-subtitle">
                Par {tournament.creator.username} • {getTypeName(tournament.type)}
              </p>
            </div>
            <span 
              className="tournament-status-badge"
              style={{ 
                background: `${statusBadge.color}20`,
                color: statusBadge.color
              }}
            >
              {statusBadge.text}
            </span>
          </div>
        </div>
      </div>

      <div className="container">
        {message && (
          <div className={`tournament-message tournament-message-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-2">
          
          <div className="card">
            <h2 className="detail-section-title">📋 Informations</h2>
            
            <div className="detail-info">
              <h3 className="info-subtitle">Description</h3>
              <p className="info-text">
                {tournament.description || 'Pas de description'}
              </p>
            </div>

            <div className="detail-info">
              <h3 className="info-subtitle">Participants</h3>
              <div className="participant-progress">
                <div className="progress-info">
                  <span>{tournament.currentParticipants}/{tournament.maxParticipants} inscrits</span>
                  <span className={`progress-status ${isFull ? 'full' : 'available'}`}>
                    {isFull ? '🔴 Complet' : '🟢 Places disponibles'}
                  </span>
                </div>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill"
                  style={{ 
                    width: `${progress}%`,
                    background: isFull ? 'var(--danger)' : 'var(--success)'
                  }}
                ></div>
              </div>
            </div>

            {tournament.startDate && (
              <div className="detail-info">
                <h3 className="info-subtitle">Date de début</h3>
                <p className="info-text">
                  📅 {new Date(tournament.startDate).toLocaleString('fr-FR')}
                </p>
              </div>
            )}

            <div className="detail-info">
              <h3 className="info-subtitle">Créé le</h3>
              <p className="info-text">
                📅 {new Date(tournament.createdAt).toLocaleString('fr-FR')}
              </p>
            </div>

            <div className="detail-actions">
              {tournament.status === 'pending' && (
                <>
                  {isParticipant ? (
                    <button
                      className="btn btn-danger btn-full"
                      onClick={handleLeave}
                      disabled={isLeaving}
                    >
                      {isLeaving ? '⏳ Départ...' : '🚪 Quitter le tournoi'}
                    </button>
                  ) : (
                    <button
                      className="btn btn-success btn-full"
                      onClick={handleJoin}
                      disabled={isJoining || isFull}
                    >
                      {isJoining ? '⏳ Inscription...' : isFull ? '🔴 Complet' : '✅ Rejoindre'}
                    </button>
                  )}

                  {isCreator && canStart && (
                    <button
                      className="btn btn-primary btn-full"
                      onClick={handleStart}
                    >
                      🚀 Démarrer le tournoi
                    </button>
                  )}
                </>
              )}

              {tournament.status === 'in_progress' && (
                <div className="status-box status-in-progress">
                  <div className="status-icon">⚔️</div>
                  <div className="status-text">Tournoi en cours</div>
                </div>
              )}

              {tournament.status === 'completed' && (
                <div className="status-box status-completed">
                  <div className="status-icon">🏆</div>
                  <div className="status-text">Tournoi terminé</div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="detail-section-title">👥 Participants ({tournament.currentParticipants})</h2>
            
            {tournament.participants.length === 0 ? (
              <div className="participants-empty">
                <div className="empty-icon">😕</div>
                <p>Aucun participant pour le moment</p>
              </div>
            ) : (
              <div className="participants-list">
                {tournament.participants.map((participant, index) => (
                  <div key={participant.id} className="participant-item">
                    <span className="participant-rank">#{index + 1}</span>
                    <span className="participant-avatar">{participant.avatar}</span>
                    <span className="participant-username">{participant.username}</span>
                    {participant.id === tournament.creator.id && (
                      <span className="participant-badge">👑 Créateur</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {(tournament.status === 'in_progress' || tournament.status === 'completed') && (
          <div className="card tournament-brackets">
            <h2 className="detail-section-title">🎯 Brackets</h2>
            <div className="brackets-placeholder">
              <div className="placeholder-icon">🚧</div>
              <p>Les brackets seront affichés ici</p>
              <p className="placeholder-info">
                Fonctionnalité à venir depuis le backend
              </p>
            </div>
          </div>
        )}

        <div className="tournament-back">
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/tournaments')}
          >
            ← Retour aux tournois
          </button>
        </div>
      </div>
    </div>
  );
};

export default TournamentDetail;