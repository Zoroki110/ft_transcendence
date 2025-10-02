// frontend_B/src/pages/TournamentBrackets/TournamentBrackets.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  }, [id]);

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
      draft: { text: '📝 Brouillon', color: 'var(--gray-500)' },
      open: { text: '🟢 Ouvert', color: 'var(--success)' },
      full: { text: '🔴 Complet', color: 'var(--warning)' },
      in_progress: { text: '▶️ En cours', color: 'var(--primary)' },
      completed: { text: '✅ Terminé', color: 'var(--gray-600)' },
      cancelled: { text: '❌ Annulé', color: 'var(--danger)' }
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  if (isLoading) {
    return (
      <div className="brackets-page-loading">
        <div className="loading-icon">⏳</div>
        <p>Chargement du tournoi...</p>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="brackets-page-error">
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

  // Vérifier si les brackets sont disponibles
  if (tournament.status !== 'in_progress' && tournament.status !== 'completed') {
    return (
      <div className="brackets-page-unavailable">
        <div className="unavailable-icon">🚧</div>
        <h2>Brackets non disponibles</h2>
        <p>Les brackets ne sont disponibles que pour les tournois en cours ou terminés.</p>
        <p>Statut actuel: <strong>{tournament.status}</strong></p>
        <div className="unavailable-actions">
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate(`/tournaments/${tournament.id}`)}
          >
            ← Retour au tournoi
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/tournaments')}
          >
            Liste des tournois
          </button>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(tournament.status);

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
                  ← {tournament.name}
                </button>
              </div>
              <h1 className="page-title">🏆 Brackets</h1>
              <div className="tournament-info">
                <span 
                  className="tournament-status-badge"
                  style={{ 
                    background: `${statusBadge.color}20`,
                    color: statusBadge.color
                  }}
                >
                  {statusBadge.text}
                </span>
                <span className="tournament-participants">
                  {tournament.currentParticipants} participants
                </span>
                {permissions.isCreator && (
                  <span className="creator-badge">👑 Votre tournoi</span>
                )}
              </div>
            </div>

            <div className="header-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => navigate(`/tournaments/${tournament.id}`)}
              >
                📊 Détails du tournoi
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => navigate('/tournaments')}
              >
                📋 Tous les tournois
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="brackets-page-content">
          <TournamentBrackets
            tournamentId={tournament.id}
            isCreator={permissions.isCreator}
            onMatchUpdate={handleTournamentUpdate}
          />
        </div>

        {/* Statistiques en bas */}
        <div className="brackets-stats-section">
          <div className="card">
            <h3>📊 Statistiques du tournoi</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Participants</span>
                <span className="stat-value">{tournament.currentParticipants}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Type</span>
                <span className="stat-value">{tournament.type}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Créateur</span>
                <span className="stat-value">{tournament.creator?.username || 'Inconnu'}</span>
              </div>
              {(tournament as any).winner && (
                <div className="stat-item champion">
                  <span className="stat-label">🏆 Champion</span>
                  <span className="stat-value">{(tournament as any).winner.username}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentBracketsPage;