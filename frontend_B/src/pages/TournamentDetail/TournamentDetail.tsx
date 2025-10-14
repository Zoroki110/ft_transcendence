// frontend_B/src/pages/TournamentDetail/TournamentDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../../services/api';
import { useUser } from '../../contexts/UserContext';
import { Tournament } from '../../types';
import { useTournamentPermissions } from '../../hooks/useTournamentPermissions';
import { useTournamentActions } from '../../hooks/useTournamentActions';
import TournamentBrackets from '../../components/TournamentBrackets/TournamentBrackets';
import { socketService } from '../../services/socket';
import './TournamentDetail.css';

const TournamentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUser();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Utiliser le système de permissions et actions
  const permissions = useTournamentPermissions(tournament, user, isLoggedIn);
  const {
    state: actionState,
    joinTournament: hookJoinTournament,
    leaveTournament: hookLeaveTournament,
    startTournament: hookStartTournament,
    deleteTournament: hookDeleteTournament
  } = useTournamentActions();

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

  // Plus besoin d'auto-refresh car les brackets se génèrent seulement au démarrage

  const handleJoin = async () => {
    if (!tournament) return;

    console.log('🔍 DETAIL: Starting join process', {
      tournamentId: tournament.id,
      userId: user?.id,
      permissions
    });

    const updatedTournament = await hookJoinTournament(tournament.id);
    
    if (updatedTournament) {
      setTournament(updatedTournament);
      console.log('✅ DETAIL: Tournament state updated after join');
    }
  };

  const handleLeave = async () => {
    if (!tournament) return;

    console.log('🔍 DETAIL: Starting leave process', {
      tournamentId: tournament.id,
      userId: user?.id,
      permissions
    });

    const updatedTournament = await hookLeaveTournament(tournament.id);
    
    if (updatedTournament) {
      setTournament(updatedTournament);
      console.log('✅ DETAIL: Tournament state updated after leave');
    }
  };

  const handleStart = async () => {
    if (!tournament) return;

    console.log('🔍 DETAIL: Starting tournament start process', {
      tournamentId: tournament.id,
      userId: user?.id,
      permissions
    });

    const updatedTournament = await hookStartTournament(tournament.id);
    
    if (updatedTournament) {
      setTournament(updatedTournament);
      console.log('✅ DETAIL: Tournament state updated after start');
    }
  };

  const handleDelete = async () => {
    if (!tournament) return;

    console.log('🔍 DETAIL: Starting tournament delete process', {
      tournamentId: tournament.id,
      userId: user?.id,
      permissions
    });

    const success = await hookDeleteTournament(tournament.id);
    
    if (success) {
      console.log('✅ DETAIL: Tournament deleted successfully, redirecting to tournaments list');
      navigate('/tournaments');
    } else {
      console.error('❌ DETAIL: Failed to delete tournament');
    }
  };

  const handleResetBrackets = async () => {
    if (!tournament) return;

    if (!confirm('Êtes-vous sûr de vouloir réinitialiser les brackets ? Cette action supprimera tous les matches existants.')) {
      return;
    }

    try {
      console.log('🔄 DETAIL: Resetting tournament brackets', tournament.id);
      await tournamentAPI.resetTournamentBrackets(tournament.id);
      
      // Recharger les données du tournoi
      const response = await tournamentAPI.getTournament(tournament.id);
      setTournament(response.data);
      
      console.log('✅ DETAIL: Tournament brackets reset successfully');
    } catch (error: any) {
      console.error('❌ DETAIL: Failed to reset brackets', error);
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
                  disabled={actionState.isJoining}
                >
                  {actionState.isJoining ? '⏳ Inscription...' : '✅ Rejoindre le tournoi'}
                </button>
              )}

              {permissions.canLeave && (
                <button
                  className="btn btn-danger btn-full"
                  onClick={handleLeave}
                  disabled={actionState.isLeaving}
                >
                  {actionState.isLeaving ? '⏳ Départ...' : '🚪 Quitter le tournoi'}
                </button>
              )}

              {/* Actions pour créateurs */}
              {permissions.isCreator && (
                <div className="creator-actions">
                  <h3 className="creator-actions-title">🛠️ Gestion du tournoi</h3>
                  
                  {permissions.canEdit && (
                    <button
                      className="btn btn-secondary btn-full"
                      onClick={() => navigate(`/tournaments/${tournament.id}/manage`)}
                    >
                      ⚙️ Modifier le tournoi
                    </button>
                  )}

                  {permissions.canStart && (
                    <button
                      className="btn btn-primary btn-full"
                      onClick={handleStart}
                      disabled={actionState.isStarting}
                    >
                      {actionState.isStarting ? '⏳ Démarrage...' : '🚀 Démarrer le tournoi'}
                    </button>
                  )}

                  {/* Message informatif pour démarrer le tournoi */}
                  {permissions.isCreator && tournament.status === 'full' && !tournament.bracketGenerated && (
                    <div className="info-message">
                      <div className="info-icon">🎯</div>
                      <p>Tournoi prêt à démarrer !</p>
                      <small>Cliquez sur "Démarrer le tournoi" pour générer les brackets et lancer les matches.</small>
                    </div>
                  )}

                  {/* Message d'erreur pour brackets corrompus */}
                  {permissions.isCreator && permissions.hasBracketsIssue && (
                    <div className="error-message">
                      <div className="error-icon">⚠️</div>
                      <p>Problème détecté avec les brackets</p>
                      <small>Le tournoi a été marqué comme "en cours" mais il n'y a aucun match valide.</small>
                      <button
                        className="btn btn-warning btn-full"
                        onClick={handleResetBrackets}
                        style={{ marginTop: '10px' }}
                      >
                        🔧 Réparer les brackets
                      </button>
                    </div>
                  )}

                  {permissions.canDelete && (
                    <button
                      className="btn btn-danger btn-full"
                      onClick={() => {
                        if (confirm('Êtes-vous sûr de vouloir supprimer ce tournoi ? Cette action est irréversible.')) {
                          handleDelete();
                        }
                      }}
                      disabled={actionState.isDeleting}
                    >
                      {actionState.isDeleting ? '⏳ Suppression...' : '🗑️ Supprimer le tournoi'}
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

        {/* Section du gagnant pour les tournois terminés */}
        {tournament.status === 'completed' && tournament.winner && (
          <div className="card tournament-winner-section">
            <div className="winner-celebration">
              <div className="winner-header">
                <h2 className="detail-section-title">🏆 Champion du Tournoi</h2>
                <div className="celebration-animation">🎉</div>
              </div>
              
              <div className="winner-display">
                <div className="winner-trophy">
                  <span className="trophy-icon">🏆</span>
                </div>
                <div className="winner-info">
                  <h3 className="winner-name">{tournament.winner.username}</h3>
                  <p className="winner-title">Vainqueur du tournoi</p>
                  {tournament.endDate && (
                    <p className="tournament-completion-date">
                      🗓️ Tournoi terminé le {new Date(tournament.endDate).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="winner-celebration-message">
                <p>🎊 Félicitations au champion ! 🎊</p>
              </div>
            </div>
          </div>
        )}

        {(tournament.status === 'in_progress' || tournament.status === 'completed') && (
          <div className="card tournament-brackets-preview">
            <div className="brackets-preview-header">
              <h2 className="detail-section-title">🎯 Brackets</h2>
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/tournaments/${tournament.id}/brackets`)}
              >
                📊 Vue complète des brackets
              </button>
            </div>
            <TournamentBrackets
              tournamentId={tournament.id}
              isCreator={permissions.isCreator}
              onMatchUpdate={() => {
                // Recharger les données du tournoi après une mise à jour de match
                const fetchTournament = async () => {
                  try {
                    const response = await tournamentAPI.getTournament(tournament.id);
                    setTournament(response.data);
                  } catch (err) {
                    console.error('Error reloading tournament:', err);
                  }
                };
                fetchTournament();
              }}
            />
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