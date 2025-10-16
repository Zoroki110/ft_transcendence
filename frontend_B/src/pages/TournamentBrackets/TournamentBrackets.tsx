// frontend_B/src/pages/TournamentBrackets/TournamentBrackets.tsx - AVEC SUPPORT ATTENTE JOUEURS

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy,
  ArrowLeft,
  Users,
  Crown,
  Loader2,
  CircleAlert,
  ListTree,
  Info
} from 'lucide-react';
import { tournamentAPI } from '../../services/api';
import { useUser } from '../../contexts/UserContext';
import { Tournament } from '../../types';
import TournamentBrackets from '../../components/TournamentBrackets/TournamentBrackets';
import { useTournamentPermissions } from '../../hooks/useTournamentPermissions';
import './TournamentBrackets.css';

const TournamentBracketsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUser();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const permissions = useTournamentPermissions(tournament, user, isLoggedIn);

  useEffect(() => {
    const fetchTournament = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const response = await tournamentAPI.getTournament(parseInt(id));
        setTournament(response.data);
        console.log('🏆 Tournament loaded for brackets:', response.data);
      } catch (err: any) {
        console.error('❌ Error loading tournament:', err);
        setError(err.response?.data?.message || 'Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournament();

    // Rafraîchir automatiquement toutes les 5 secondes si en attente
    const interval = setInterval(() => {
      if (tournament && (tournament.status === 'open' || tournament.status === 'full')) {
        fetchTournament();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, tournament?.status]);

  const handleTournamentUpdate = async () => {
    if (!tournament) return;

    try {
      const response = await tournamentAPI.getTournament(tournament.id);
      setTournament(response.data);
      console.log('✅ Tournament data refreshed');
    } catch (err) {
      console.error('❌ Error refreshing tournament:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: {
        text: 'Brouillon',
        color: 'var(--gray-500)',
        icon: <Info size={16} />
      },
      open: {
        text: 'Ouvert',
        color: 'var(--success)',
        icon: <Users size={16} />
      },
      full: {
        text: 'Complet',
        color: 'var(--warning)',
        icon: <Users size={16} />
      },
      in_progress: {
        text: 'En cours',
        color: 'var(--primary)',
        icon: <Trophy size={16} />
      },
      completed: {
        text: 'Terminé',
        color: 'var(--gray-600)',
        icon: <Trophy size={16} />
      },
      cancelled: {
        text: 'Annulé',
        color: 'var(--danger)',
        icon: <CircleAlert size={16} />
      }
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  if (isLoading) {
    return (
      <div className="brackets-page-loading">
        <Loader2 size={50} className="loading-spinner" />
        <p>Chargement du tournoi...</p>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="brackets-page-error">
        <CircleAlert size={48} className="error-icon" />
        <p className="error-message">{error || 'Tournoi introuvable'}</p>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/tournaments')}
        >
          <ArrowLeft size={18} />
          <span>Retour aux tournois</span>
        </button>
      </div>
    );
  }

  const statusBadge = getStatusBadge(tournament.status);
  const isWaitingForPlayers = tournament.status === 'open' || tournament.status === 'full';
  const participantsNeeded = tournament.maxParticipants - tournament.currentParticipants;

  return (
    <div className="brackets-page">
      <div className="page-header">
        <div className="container">
          <div className="brackets-page-header">
            <div className="header-info">
              <div className="header-navigation">
                <button
                  className="btn btn-ghost"
                  onClick={() => navigate(`/tournaments/${tournament.id}`)}
                >
                  <ArrowLeft size={18} />
                  <span>{tournament.name}</span>
                </button>
              </div>
              <h1 className="page-title">
                <Trophy size={32} />
                <span>Brackets</span>
              </h1>
              <div className="tournament-info">
                <span
                  className="tournament-status-badge"
                  style={{
                    background: `${statusBadge.color}20`,
                    color: statusBadge.color
                  }}
                >
                  {statusBadge.icon}
                  <span>{statusBadge.text}</span>
                </span>
                <span className="tournament-participants">
                  <Users size={16} />
                  <span>{tournament.currentParticipants}/{tournament.maxParticipants} participants</span>
                </span>
                {permissions.isCreator && (
                  <span className="creator-badge">
                    <Crown size={16} />
                    <span>Votre tournoi</span>
                  </span>
                )}
              </div>
            </div>

            <div className="header-actions">
              <button
                className="btn btn-secondary"
                onClick={() => navigate(`/tournaments/${tournament.id}`)}
              >
                <Info size={18} />
                <span>Détails du tournoi</span>
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/tournaments')}
              >
                <ListTree size={18} />
                <span>Tous les tournois</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Message d'attente si le tournoi n'est pas démarré */}
        {isWaitingForPlayers && (
          <div className="card waiting-message">
            <div className="waiting-icon">
              <Users size={48} />
            </div>
            <h3>En attente de joueurs</h3>
            <p>
              {participantsNeeded === 0
                ? `Le tournoi est complet ! En attente du démarrage par l'organisateur.`
                : `${participantsNeeded} joueur${participantsNeeded > 1 ? 's' : ''} manquant${participantsNeeded > 1 ? 's' : ''} pour compléter le tournoi.`}
            </p>
            <div className="participants-preview">
              <h4>Participants inscrits :</h4>
              <div className="participants-list">
                {tournament.participants?.map((participant, index) => (
                  <div key={participant.id} className="participant-item">
                    <span className="participant-number">{index + 1}</span>
                    <span className="participant-name">{participant.username}</span>
                    {participant.id === tournament.creatorId && (
                      <Crown size={14} className="creator-icon" />
                    )}
                  </div>
                ))}
                {Array.from({ length: participantsNeeded }).map((_, index) => (
                  <div key={`waiting-${index}`} className="participant-item waiting">
                    <span className="participant-number">{tournament.currentParticipants + index + 1}</span>
                    <span className="participant-name waiting-text">En attente...</span>
                    <Loader2 size={14} className="waiting-spinner" />
                  </div>
                ))}
              </div>
            </div>
            {permissions.isCreator && tournament.currentParticipants >= 2 && (
              <div className="start-tournament-hint">
                <Info size={20} />
                <p>Vous pouvez démarrer le tournoi maintenant depuis la page de détails, même si tous les emplacements ne sont pas remplis.</p>
              </div>
            )}
          </div>
        )}

        {/* Brackets component - visible seulement si le tournoi a commencé */}
        {!isWaitingForPlayers && (
          <div className="brackets-page-content">
            <TournamentBrackets
              tournamentId={tournament.id}
              isCreator={permissions.isCreator}
              onMatchUpdate={handleTournamentUpdate}
            />
          </div>
        )}

        {/* Statistiques en bas */}
        {!isWaitingForPlayers && (
          <div className="brackets-stats-section">
            <div className="card">
              <h3>
                <Info size={20} />
                <span>Statistiques du tournoi</span>
              </h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Participants</span>
                  <span className="stat-value">{tournament.currentParticipants}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Type</span>
                  <span className="stat-value">Élimination simple</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Créateur</span>
                  <span className="stat-value">{tournament.creator?.username || 'Inconnu'}</span>
                </div>
                {(tournament as any).winner && (
                  <div className="stat-item champion">
                    <span className="stat-label">
                      <Trophy size={16} />
                      <span>Champion</span>
                    </span>
                    <span className="stat-value">{(tournament as any).winner.username}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentBracketsPage;
