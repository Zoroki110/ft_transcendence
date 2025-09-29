// frontend_B/src/pages/Tournaments/Tournaments.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tournamentAPI } from '../../services/api';
import './Tournaments.css';

interface Tournament {
  id: number;
  name: string;
  description: string;
  type: 'single_elimination' | 'double_elimination' | 'round_robin';
  status: 'pending' | 'in_progress' | 'completed';
  maxParticipants: number;
  currentParticipants: number;
  createdAt: string;
  creator: {
    username: string;
  };
}

const Tournaments: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: ''
  });

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setIsLoading(true);
        const params: any = {};

        if (filters.status !== 'all') {
          params.status = filters.status;
        }
        if (filters.type !== 'all') {
          params.type = filters.type;
        }

        const response = await tournamentAPI.getTournaments(params);
        setTournaments(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournaments();
  }, [filters.status, filters.type]);

  const filteredTournaments = tournaments.filter(tournament => 
    tournament.name.toLowerCase().includes(filters.search.toLowerCase()) ||
    tournament.description.toLowerCase().includes(filters.search.toLowerCase())
  );

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
        <div className="card tournaments-filters">
          <h3 className="filters-title">🔍 Filtres</h3>
          <div className="filters-grid">
            <div className="form-group">
              <label className="form-label">Statut</label>
              <select
                className="input"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">📊 Tous</option>
                <option value="pending">⏳ En attente</option>
                <option value="in_progress">▶️ En cours</option>
                <option value="completed">✅ Terminés</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                className="input"
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="all">🎮 Tous</option>
                <option value="single_elimination">🏆 Élimination simple</option>
                <option value="double_elimination">🏆🏆 Élimination double</option>
                <option value="round_robin">🔄 Round Robin</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Recherche</label>
              <input
                className="input"
                placeholder="Nom du tournoi..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="tournaments-loading">
            <div className="loading-icon">⏳</div>
            <p>Chargement des tournois...</p>
          </div>
        ) : error ? (
          <div className="tournaments-error">
            <div className="error-icon">⚠️</div>
            <p className="error-message">{error}</p>
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="card tournaments-empty">
            <div className="empty-icon">😕</div>
            <p className="empty-text">Aucun tournoi trouvé</p>
            <Link to="/create-tournament" className="btn btn-primary">
              ➕ Créer le premier tournoi
            </Link>
          </div>
        ) : (
          <div className="grid grid-2">
            {filteredTournaments.map(tournament => {
              const statusBadge = getStatusBadge(tournament.status);
              const progress = (tournament.currentParticipants / tournament.maxParticipants) * 100;

              return (
                <div key={tournament.id} className="card tournament-card">
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

                  <p className="tournament-description">
                    {tournament.description || 'Pas de description'}
                  </p>

                  <div className="tournament-progress">
                    <div className="tournament-progress-info">
                      <span>{getTypeName(tournament.type)}</span>
                      <span className="tournament-participants">
                        {tournament.currentParticipants}/{tournament.maxParticipants}
                      </span>
                    </div>
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

                  <div className="tournament-card-footer">
                    <span className="tournament-creator">
                      Par {tournament.creator.username}
                    </span>
                    <Link 
                      to={`/tournaments/${tournament.id}`} 
                      className="btn btn-primary btn-sm"
                    >
                      Voir détails →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tournaments;