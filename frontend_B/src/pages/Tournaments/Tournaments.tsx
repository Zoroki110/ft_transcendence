// frontend_B/src/pages/Tournaments/Tournaments.tsx - AMÉLIORÉ AVEC TABS
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTournaments } from '../../hooks/useTournaments';
import { useUser } from '../../contexts/UserContext';
import { getTournamentPermissions } from '../../utils/tournamentPermissions';
import { useTournamentActions } from '../../hooks/useTournamentActions';
import { tournamentAPI } from '../../services/api';
import { Tournament } from '../../types';
import './Tournaments.css';

const Tournaments: React.FC = () => {
  const { user, isLoggedIn } = useUser();
  const [activeTab, setActiveTab] = useState<'available' | 'my'>('available');
  const [filters, setFilters] = useState({
    status: 'open',
    search: ''
  });

  // Hook pour les tournois disponibles (publics)
  const {
    tournaments: availableTournaments,
    loading: availableLoading,
    error: availableError,
    updateQuery,
    refetch: refetchAvailable
  } = useTournaments({ status: 'open' });

  // État pour mes tournois
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [myTournamentsLoading, setMyTournamentsLoading] = useState(false);
  const [myTournamentsError, setMyTournamentsError] = useState<string | null>(null);

  const {
    state: actionState,
    joinTournament: hookJoinTournament,
    leaveTournament: hookLeaveTournament
  } = useTournamentActions();

  // Fonction pour charger mes tournois
  const loadMyTournaments = async () => {
    if (!isLoggedIn) {
      setMyTournaments([]);
      return;
    }

    try {
      setMyTournamentsLoading(true);
      setMyTournamentsError(null);
      const response = await tournamentAPI.getMyTournaments();
      setMyTournaments(response.data.tournaments);
    } catch (err: any) {
      setMyTournamentsError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setMyTournamentsLoading(false);
    }
  };

  // Charger mes tournois quand l'onglet change ou quand l'utilisateur se connecte
  useEffect(() => {
    if (activeTab === 'my' && isLoggedIn) {
      loadMyTournaments();
    }
  }, [activeTab, isLoggedIn]);

  // Mettre à jour les filtres API quand les filtres locaux changent
  const handleStatusChange = (status: string) => {
    setFilters(prev => ({ ...prev, status }));
    if (status !== 'all') {
      updateQuery({ status: status as any });
    } else {
      updateQuery({ status: undefined });
    }
  };

  // Filtrer les tournois selon la recherche
  const filterTournaments = (tournaments: Tournament[]) => {
    return tournaments.filter(tournament =>
      (tournament.name || '').toLowerCase().includes(filters.search.toLowerCase()) ||
      (tournament.description || '').toLowerCase().includes(filters.search.toLowerCase())
    );
  };

  const filteredAvailableTournaments = filterTournaments(availableTournaments);
  const filteredMyTournaments = filterTournaments(myTournaments);

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

  // Fonctions pour gérer l'inscription/désinscription rapide
  const handleQuickJoin = async (tournamentId: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isLoggedIn) {
      alert('Vous devez être connecté pour rejoindre un tournoi');
      return;
    }

    const result = await hookJoinTournament(tournamentId);

    if (result) {
      await refetchAvailable();
      if (activeTab === 'my') {
        await loadMyTournaments();
      }
    }
  };

  const handleQuickLeave = async (tournamentId: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const result = await hookLeaveTournament(tournamentId);

    if (result) {
      await refetchAvailable();
      if (activeTab === 'my') {
        await loadMyTournaments();
      }
    }
  };

  // Composant de carte de tournoi
  const TournamentCard = ({ tournament }: { tournament: Tournament }) => {
    const statusBadge = getStatusBadge(tournament.status);
    const progress = (tournament.currentParticipants / tournament.maxParticipants) * 100;
    const permissions = getTournamentPermissions(tournament, user, isLoggedIn);

    return (
      <div className="card tournament-card">
        <div className="tournament-card-header">
          <h3 className="tournament-name">{tournament.name}</h3>
          <span
            className="tournament-badge"
            style={{
              background: `${statusBadge.color}20`,
              color: statusBadge.color
            }}
          >
            {statusBadge.text}
          </span>
        </div>

        {tournament.description && (
          <p className="tournament-description">
            {tournament.description}
          </p>
        )}

        <div className="tournament-meta">
          <div className="tournament-meta-item">
            <span className="meta-label">🏆 Type</span>
            <span className="meta-value">Élimination simple</span>
          </div>
          <div className="tournament-meta-item">
            <span className="meta-label">👥 Participants</span>
            <span className="meta-value">
              {tournament.currentParticipants}/{tournament.maxParticipants}
            </span>
          </div>
          <div className="tournament-meta-item">
            <span className="meta-label">👑 Créateur</span>
            <span className="meta-value">{tournament.creator?.username || 'Inconnu'}</span>
          </div>
        </div>

        <div className="tournament-progress">
          <div className="tournament-progress-bar">
            <div
              className="tournament-progress-fill"
              style={{
                width: `${progress}%`,
                background: progress >= 100 ? 'var(--danger)' : 'var(--success)'
              }}
            ></div>
          </div>
        </div>

        <div className="tournament-indicators">
          {permissions.isCreator && (
            <span className="indicator creator-indicator">👑 Votre tournoi</span>
          )}
          {permissions.isParticipant && !permissions.isCreator && (
            <span className="indicator participant-indicator">✓ Inscrit</span>
          )}
        </div>

        <div className="tournament-card-footer">
          <div className="tournament-actions">
            {permissions.isCreator && (
              <Link
                to={`/tournaments/${tournament.id}/manage`}
                className="btn btn-primary btn-sm"
                onClick={(e) => e.stopPropagation()}
              >
                ⚙️ Gérer
              </Link>
            )}

            {permissions.canJoin && (
              <button
                className="btn btn-success btn-sm"
                onClick={(e) => handleQuickJoin(tournament.id, e)}
              >
                ✅ Rejoindre
              </button>
            )}

            {permissions.canLeave && (
              <button
                className="btn btn-danger btn-sm"
                onClick={(e) => handleQuickLeave(tournament.id, e)}
              >
                🚪 Quitter
              </button>
            )}

            {permissions.isFull && !permissions.isCreator && !permissions.isParticipant && (
              <button className="btn btn-secondary btn-sm" disabled>
                🔴 Complet
              </button>
            )}

            <Link
              to={`/tournaments/${tournament.id}`}
              className="btn btn-outline btn-sm"
            >
              Voir détails →
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="tournaments-page">
      <div className="page-header">
        <div className="container">
          <div className="tournaments-header-content">
            <div>
              <h1 className="page-title">🏆 Tournois</h1>
              <p className="page-subtitle">Rejoignez ou créez un tournoi</p>
            </div>
            <Link to="/create-tournament" className="btn btn-primary">
              ➕ Créer un tournoi
            </Link>
          </div>
        </div>
      </div>

      <div className="container">
        {/* TABS DE NAVIGATION */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            <span className="tab-icon">🌐</span>
            <span className="tab-label">Tournois disponibles</span>
            <span className="tab-count">{availableTournaments.length}</span>
          </button>
          <button
            className={`tab ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            <span className="tab-icon">⭐</span>
            <span className="tab-label">Mes tournois</span>
            <span className="tab-count">{myTournaments.length}</span>
          </button>
        </div>

        {/* FILTRES */}
        <div className="card tournaments-filters">
          <div className="filters-row">
            <div className="form-group">
              <label className="form-label">🔍 Recherche</label>
              <input
                className="input"
                placeholder="Nom du tournoi..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            {activeTab === 'available' && (
              <div className="form-group">
                <label className="form-label">📊 Statut</label>
                <select
                  className="input"
                  value={filters.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="all">Tous</option>
                  <option value="open">🟢 Ouverts</option>
                  <option value="full">🔴 Complets</option>
                  <option value="in_progress">▶️ En cours</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* CONTENU DES TABS */}
        {activeTab === 'available' ? (
          // TOURNOIS DISPONIBLES
          <>
            {availableLoading ? (
              <div className="tournaments-loading">
                <div className="loading-spinner"></div>
                <p>Chargement des tournois...</p>
              </div>
            ) : availableError ? (
              <div className="tournaments-error">
                <div className="error-icon">⚠️</div>
                <p className="error-message">{availableError}</p>
              </div>
            ) : filteredAvailableTournaments.length === 0 ? (
              <div className="card tournaments-empty">
                <div className="empty-icon">😕</div>
                <p className="empty-text">Aucun tournoi disponible</p>
                <Link to="/create-tournament" className="btn btn-primary">
                  ➕ Créer le premier tournoi
                </Link>
              </div>
            ) : (
              <div className="tournaments-grid">
                {filteredAvailableTournaments.map(tournament => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            )}
          </>
        ) : (
          // MES TOURNOIS
          <>
            {!isLoggedIn ? (
              <div className="card auth-required">
                <p>🔒 Vous devez être connecté pour voir vos tournois</p>
                <Link to="/login" className="btn btn-primary">
                  Se connecter
                </Link>
              </div>
            ) : myTournamentsLoading ? (
              <div className="tournaments-loading">
                <div className="loading-spinner"></div>
                <p>Chargement de vos tournois...</p>
              </div>
            ) : myTournamentsError ? (
              <div className="tournaments-error">
                <div className="error-icon">⚠️</div>
                <p className="error-message">{myTournamentsError}</p>
              </div>
            ) : filteredMyTournaments.length === 0 ? (
              <div className="card tournaments-empty">
                <div className="empty-icon">📭</div>
                <p className="empty-text">Vous ne participez à aucun tournoi</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setActiveTab('available')}
                >
                  🌐 Voir les tournois disponibles
                </button>
              </div>
            ) : (
              <div className="tournaments-grid">
                {filteredMyTournaments.map(tournament => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Tournaments;
