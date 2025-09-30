// frontend_B/src/pages/TournamentDetail/TournamentDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../../services/api';
import { useUser } from '../../contexts/UserContext';
import { Tournament } from '../../types';
import { useTournamentPermissions } from '../../hooks/useTournamentPermissions';
import './TournamentDetail.css';

const TournamentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUser();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Utiliser le système de permissions
  const permissions = useTournamentPermissions(tournament, user, isLoggedIn);

  useEffect(() => {
    const fetchTournament = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const response = await tournamentAPI.getTournament(parseInt(id));
        console.log('🔍 DEBUG Tournoi chargé:', response.data);
        setTournament(response.data);
      } catch (err: any) {
        console.error('❌ Erreur chargement tournoi:', err.response?.data);
        setError(err.response?.data?.message || 'Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournament();
  }, [id]);

  const handleJoin = async () => {
    if (!tournament) return;

    console.log('🔍 DEBUG handleJoin:', {
      tournamentId: tournament.id,
      tournamentStatus: tournament.status,
      currentParticipants: tournament.currentParticipants,
      maxParticipants: tournament.maxParticipants,
      permissions: permissions
    });

    setIsJoining(true);
    setMessage(null);

    try {
      await tournamentAPI.joinTournament(tournament.id);
      setMessage({ type: 'success', text: 'Vous avez rejoint le tournoi !' });
      
      const response = await tournamentAPI.getTournament(tournament.id);
      setTournament(response.data);
    } catch (err: any) {
      console.error('❌ Erreur inscription:', err.response?.data);
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
      draft: { text: '📝 Brouillon', color: 'var(--gray-500)' },
      open: { text: '🟢 Ouvert', color: 'var(--success)' },
      full: { text: '🔴 Complet', color: 'var(--warning)' },
      in_progress: { text: '▶️ En cours', color: 'var(--primary)' },
      completed: { text: '✅ Terminé', color: 'var(--gray-600)' },
      cancelled: { text: '❌ Annulé', color: 'var(--danger)' }
    };
    return badges[status as keyof typeof badges] || badges.draft;
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

  return (
    <div className="tournament-detail-page">
      <div className="page-header">
        <div className="container">
          <div className="tournament-detail-header">
            <div>
              <h1 className="page-title">{tournament.name}</h1>
              <div className="tournament-creator-info">
                <div className="creator-details">
                  <span className="creator-label">
                    {permissions.isCreator ? '👑 Votre tournoi' : '👤 Créé par'}
                  </span>
                  <span className="creator-name">
                    {tournament.creator?.username || 'Inconnu'}
                  </span>
                  {permissions.isCreator && (
                    <span className="creator-badge">Organisateur</span>
                  )}
                </div>
                <div className="tournament-type">
                  {getTypeName(tournament.type)}
                </div>
              </div>
              <p className="page-subtitle">
                {permissions.statusMessage}
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
                  <span className={`progress-status ${permissions.isFull ? 'full' : 'available'}`}>
                    {permissions.isFull ? '🔴 Complet' : '🟢 Places disponibles'}
                  </span>
                </div>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill"
                  style={{ 
                    width: `${progress}%`,
                    background: permissions.isFull ? 'var(--danger)' : 'var(--success)'
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
              {/* Message d'aide */}
              <div className="action-message">
                <p>{permissions.joinMessage}</p>
              </div>

              {/* Actions pour participants */}
              {permissions.canJoin && (
                <button
                  className="btn btn-success btn-full"
                  onClick={handleJoin}
                  disabled={isJoining}
                >
                  {isJoining ? '⏳ Inscription...' : '✅ Rejoindre le tournoi'}
                </button>
              )}

              {permissions.canLeave && (
                <button
                  className="btn btn-danger btn-full"
                  onClick={handleLeave}
                  disabled={isLeaving}
                >
                  {isLeaving ? '⏳ Départ...' : '🚪 Quitter le tournoi'}
                </button>
              )}

              {/* Actions pour créateurs */}
              {permissions.isCreator && (
                <div className="creator-actions">
                  <h3 className="creator-actions-title">🛠️ Gestion du tournoi</h3>
                  
                  {permissions.canEdit && (
                    <button
                      className="btn btn-secondary btn-full"
                      onClick={() => navigate(`/tournaments/${tournament.id}/edit`)}
                    >
                      ⚙️ Modifier le tournoi
                    </button>
                  )}

                  {permissions.canStart && (
                    <button
                      className="btn btn-primary btn-full"
                      onClick={handleStart}
                    >
                      🚀 Démarrer le tournoi
                    </button>
                  )}

                  {permissions.canDelete && (
                    <button
                      className="btn btn-danger btn-full"
                      onClick={() => {
                        if (confirm('Êtes-vous sûr de vouloir supprimer ce tournoi ?')) {
                          // TODO: Implémenter la suppression
                        }
                      }}
                    >
                      🗑️ Supprimer le tournoi
                    </button>
                  )}
                </div>
              )}

              {/* Bouton de connexion pour utilisateurs non connectés */}
              {!isLoggedIn && (
                <button 
                  className="btn btn-primary btn-full"
                  onClick={() => navigate('/login')}
                >
                  🔓 Se connecter pour participer
                </button>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="detail-section-title">
              👥 Participants ({tournament.currentParticipants}/{tournament.maxParticipants})
            </h2>
            
            {/* Informations du créateur toujours en premier */}
            {tournament.creator && (
              <div className="creator-section">
                <h3 className="creator-section-title">👑 Organisateur</h3>
                <div className="participant-item creator-item">
                  <span className="participant-rank">👑</span>
                  <span className="participant-avatar">{tournament.creator.avatar || '👤'}</span>
                  <span className="participant-username">{tournament.creator.username}</span>
                  <span className="participant-badge creator">Organisateur</span>
                  {permissions.isCreator && <span className="you-badge">(Vous)</span>}
                </div>
              </div>
            )}

            {/* Liste des participants */}
            <div className="participants-section">
              <h3 className="participants-section-title">
                🎮 Participants ({tournament.participants.length})
              </h3>
              
              {tournament.participants.length === 0 ? (
                <div className="participants-empty">
                  <div className="empty-icon">😕</div>
                  <p>Aucun participant inscrit pour le moment</p>
                  {permissions.isCreator && tournament.status === 'draft' && (
                    <p className="empty-hint">Partagez le lien du tournoi pour inviter des joueurs !</p>
                  )}
                </div>
              ) : (
                <div className="participants-list">
                  {tournament.participants.map((participant, index) => (
                    <div key={participant.id} className="participant-item">
                      <span className="participant-rank">#{index + 1}</span>
                      <span className="participant-avatar">{participant.avatar || '👤'}</span>
                      <span className="participant-username">{participant.username}</span>
                      {participant.id === user?.id && (
                        <span className="you-badge">(Vous)</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
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