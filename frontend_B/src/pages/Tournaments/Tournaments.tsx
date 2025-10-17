// frontend_B/src/pages/Tournaments/Tournaments.tsx - AVEC ICÔNES
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Plus,
  Globe,
  Star,
  Search,
  Filter,
  Users,
  Crown,
  CheckCircle,
  Calendar,
  Settings,
  LogIn,
  UserPlus,
  LogOut,
  Eye,
  CircleAlert,
  Loader2,
  Inbox,
  FileEdit,
  CircleX,
  CircleDashed,
  PlayCircle,
  CircleCheck,
  Lock
} from 'lucide-react';
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
      draft: {
        text: 'Brouillon',
        color: 'var(--gray-500)',
        icon: <FileEdit size={14} />
      },
      open: {
        text: 'Ouvert',
        color: 'var(--success)',
        icon: <CircleDashed size={14} />
      },
      full: {
        text: 'Complet',
        color: 'var(--warning)',
        icon: <CircleAlert size={14} />
      },
      in_progress: {
        text: 'En cours',
        color: 'var(--primary)',
        icon: <PlayCircle size={14} />
      },
      completed: {
        text: 'Terminé',
        color: 'var(--gray-600)',
        icon: <CircleCheck size={14} />
      },
      cancelled: {
        text: 'Annulé',
        color: 'var(--danger)',
        icon: <CircleX size={14} />
      }
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
      // Rediriger vers la page des brackets du tournoi
      window.location.href = `/tournaments/${tournamentId}/brackets`;
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
            {statusBadge.icon}
            <span>{statusBadge.text}</span>
          </span>
        </div>

        {tournament.description && (
          <p className="tournament-description">
            {tournament.description}
          </p>
        )}

        <div className="tournament-meta">
          <div className="tournament-meta-item">
            <span className="meta-label">
              <Trophy size={16} />
              <span>Type</span>
            </span>
            <span className="meta-value">Élimination simple</span>
          </div>
          <div className="tournament-meta-item">
            <span className="meta-label">
              <Users size={16} />
              <span>Participants</span>
            </span>
            <span className="meta-value">
              {tournament.currentParticipants}/{tournament.maxParticipants}
            </span>
          </div>
          <div className="tournament-meta-item">
            <span className="meta-label">
              <Crown size={16} />
              <span>Créateur</span>
            </span>
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
            <span className="indicator creator-indicator">
              <Crown size={14} />
              <span>Votre tournoi</span>
            </span>
          )}
          {permissions.isParticipant && !permissions.isCreator && (
            <span className="indicator participant-indicator">
              <CheckCircle size={14} />
              <span>Inscrit</span>
            </span>
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
                <Settings size={16} />
                <span>Gérer</span>
              </Link>
            )}

            {permissions.canJoin && (
              <button
                className="btn btn-success btn-sm"
                onClick={(e) => handleQuickJoin(tournament.id, e)}
              >
                <UserPlus size={16} />
                <span>Rejoindre</span>
              </button>
            )}

            {permissions.canLeave && (
              <button
                className="btn btn-danger btn-sm"
                onClick={(e) => handleQuickLeave(tournament.id, e)}
              >
                <LogOut size={16} />
                <span>Quitter</span>
              </button>
            )}

            {permissions.isFull && !permissions.isCreator && !permissions.isParticipant && tournament.status !== 'in_progress' && (
              <button className="btn btn-secondary btn-sm" disabled>
                <CircleAlert size={16} />
                <span>Complet</span>
              </button>
            )}

            {tournament.status === 'in_progress' && (
              <Link
                to={`/tournaments/${tournament.id}#spectator`}
                className="btn btn-primary btn-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <Eye size={16} />
                <span>Regarder</span>
              </Link>
            )}

            <Link
              to={`/tournaments/${tournament.id}`}
              className="btn btn-outline btn-sm"
            >
              <Eye size={16} />
              <span>Détails</span>
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
              <h1 className="page-title">
                <Trophy size={32} />
                <span>Tournois</span>
              </h1>
              <p className="page-subtitle">Rejoignez ou créez un tournoi</p>
            </div>
            <Link to="/create-tournament" className="btn btn-primary">
              <Plus size={20} />
              <span>Créer un tournoi</span>
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
            <Globe size={20} className="tab-icon" />
            <span className="tab-label">Tournois disponibles</span>
            <span className="tab-count">{availableTournaments.length}</span>
          </button>
          <button
            className={`tab ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            <Star size={20} className="tab-icon" />
            <span className="tab-label">Mes tournois</span>
            <span className="tab-count">{myTournaments.length}</span>
          </button>
        </div>

        {/* FILTRES */}
        <div className="card tournaments-filters">
          <div className="filters-row">
            <div className="form-group">
              <label className="form-label">
                <Search size={16} />
                <span>Recherche</span>
              </label>
              <input
                className="input"
                placeholder="Nom du tournoi..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            {activeTab === 'available' && (
              <div className="form-group">
                <label className="form-label">
                  <Filter size={16} />
                  <span>Statut</span>
                </label>
                <select
                  className="input"
                  value={filters.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="all">Tous</option>
                  <option value="open">Ouverts</option>
                  <option value="full">Complets</option>
                  <option value="in_progress">En cours</option>
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
                <Loader2 size={50} className="loading-spinner" />
                <p>Chargement des tournois...</p>
              </div>
            ) : availableError ? (
              <div className="tournaments-error">
                <CircleAlert size={48} className="error-icon" />
                <p className="error-message">{availableError}</p>
              </div>
            ) : filteredAvailableTournaments.length === 0 ? (
              <div className="card tournaments-empty">
                <Inbox size={64} className="empty-icon" />
                <p className="empty-text">Aucun tournoi disponible</p>
                <Link to="/create-tournament" className="btn btn-primary">
                  <Plus size={20} />
                  <span>Créer le premier tournoi</span>
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
                <Lock size={48} className="auth-icon" />
                <p>Vous devez être connecté pour voir vos tournois</p>
                <Link to="/login" className="btn btn-primary">
                  <LogIn size={20} />
                  <span>Se connecter</span>
                </Link>
              </div>
            ) : myTournamentsLoading ? (
              <div className="tournaments-loading">
                <Loader2 size={50} className="loading-spinner" />
                <p>Chargement de vos tournois...</p>
              </div>
            ) : myTournamentsError ? (
              <div className="tournaments-error">
                <CircleAlert size={48} className="error-icon" />
                <p className="error-message">{myTournamentsError}</p>
              </div>
            ) : filteredMyTournaments.length === 0 ? (
              <div className="card tournaments-empty">
                <Inbox size={64} className="empty-icon" />
                <p className="empty-text">Vous ne participez à aucun tournoi</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setActiveTab('available')}
                >
                  <Globe size={20} />
                  <span>Voir les tournois disponibles</span>
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
