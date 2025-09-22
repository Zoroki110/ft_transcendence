// frontend_B/src/pages/Tournaments.tsx - VERSION CORRIGÉE AVEC CONTEXT

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTournaments } from '../contexts/TournamentContext';

const Tournaments: React.FC = () => {
  const { tournaments, joinTournament } = useTournaments();
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'completed'>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'var(--success)';
      case 'in_progress': return 'var(--warning)';
      case 'completed': return 'var(--gray-500)';
      case 'full': return 'var(--danger)';
      default: return 'var(--gray-500)';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '📝 Brouillon';
      case 'open': return '🟢 Ouvert';
      case 'in_progress': return '🟡 En cours';
      case 'completed': return '⚫ Terminé';
      case 'full': return '🔴 Complet';
      default: return status;
    }
  };

  const filteredTournaments = tournaments.filter(tournament => {
    if (filter === 'all') return true;
    return tournament.status === filter;
  });

  const handleJoinTournament = (tournamentId: number) => {
    joinTournament(tournamentId);
  };

  return (
    <div>
      <section className="page-header">
        <div className="container flex items-center justify-between">
          <div>
            <h1 className="page-title">🏆 Tournois</h1>
            <p className="page-subtitle">
              {tournaments.length === 0 
                ? "Aucun tournoi disponible pour le moment" 
                : `${tournaments.length} tournoi${tournaments.length > 1 ? 's' : ''} disponible${tournaments.length > 1 ? 's' : ''}`
              }
            </p>
          </div>
          <Link to="/create-tournament" className="btn" style={{ background: 'white', color: 'var(--primary)' }}>
            ➕ Créer un tournoi
          </Link>
        </div>
      </section>

      <div className="container">
        {/* Filtres */}
        <div className="card mb-4">
          <div className="flex gap-4">
            <button 
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('all')}
            >
              Tous ({tournaments.length})
            </button>
            <button 
              className={`btn ${filter === 'open' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('open')}
            >
              Ouverts ({tournaments.filter(t => t.status === 'open').length})
            </button>
            <button 
              className={`btn ${filter === 'in_progress' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('in_progress')}
            >
              En cours ({tournaments.filter(t => t.status === 'in_progress').length})
            </button>
            <button 
              className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('completed')}
            >
              Terminés ({tournaments.filter(t => t.status === 'completed').length})
            </button>
          </div>
        </div>

        {/* Message si aucun tournoi */}
        {tournaments.length === 0 ? (
          <div className="card text-center">
            <div style={{ padding: '3rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏆</div>
              <h3>Aucun tournoi créé</h3>
              <p style={{ color: 'var(--gray-700)', marginBottom: '2rem' }}>
                Soyez le premier à organiser un tournoi épique !
              </p>
              <Link to="/create-tournament" className="btn btn-primary">
                ➕ Créer le premier tournoi
              </Link>
            </div>
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="card text-center">
            <h3>Aucun tournoi trouvé</h3>
            <p style={{ color: 'var(--gray-700)', marginBottom: '1rem' }}>
              Aucun tournoi ne correspond au filtre "{filter}"
            </p>
            <button 
              onClick={() => setFilter('all')} 
              className="btn btn-secondary"
            >
              Voir tous les tournois
            </button>
          </div>
        ) : (
          /* Liste des tournois */
          <div className="grid grid-2">
            {filteredTournaments.map((tournament) => (
              <div key={tournament.id} className="card">
                <div className="flex justify-between items-center mb-4">
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{tournament.name}</h3>
                  <span style={{ color: getStatusColor(tournament.status), fontWeight: 'bold' }}>
                    {getStatusText(tournament.status)}
                  </span>
                </div>

                {tournament.description && (
                  <p style={{ color: 'var(--gray-700)', marginBottom: '1rem' }}>
                    {tournament.description}
                  </p>
                )}

                <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--gray-700)' }}>
                  <div style={{ marginBottom: '0.25rem' }}>
                    👤 Créé par: <strong>{tournament.creator}</strong>
                  </div>
                  <div style={{ marginBottom: '0.25rem' }}>
                    🎯 Type: <strong>{tournament.type.replace('_', ' ')}</strong>
                  </div>
                  <div style={{ marginBottom: '0.25rem' }}>
                    👥 Participants: <strong>{tournament.currentParticipants}/{tournament.maxParticipants}</strong>
                  </div>
                  <div>
                    📅 Créé: <strong>{new Date(tournament.createdAt).toLocaleDateString('fr-FR')}</strong>
                  </div>
                </div>

                {/* Barre de progression des participants */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ 
                    background: 'var(--gray-200)', 
                    height: '6px', 
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      background: tournament.currentParticipants === tournament.maxParticipants 
                        ? 'var(--danger)' 
                        : 'var(--success)',
                      height: '100%', 
                      width: `${(tournament.currentParticipants / tournament.maxParticipants) * 100}%`,
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Link 
                    to={`/tournaments/${tournament.id}`} 
                    className="btn btn-primary"
                  >
                    👁️ Voir détails
                  </Link>
                  
                  {tournament.status === 'open' && tournament.currentParticipants < tournament.maxParticipants && (
                    <button 
                      className="btn btn-success"
                      onClick={() => handleJoinTournament(tournament.id)}
                    >
                      ⚡ Rejoindre
                    </button>
                  )}

                  {tournament.status === 'full' && (
                    <button className="btn btn-secondary" disabled>
                      🔴 Complet
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message informatif */}
        {tournaments.length > 0 && (
          <div className="card" style={{ marginTop: '2rem', background: 'rgba(102, 126, 234, 0.05)' }}>
            <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>
              💡 Comment ça marche ?
            </h4>
            <ul style={{ color: 'var(--gray-700)', paddingLeft: '1.5rem' }}>
              <li>Cliquez sur "👁️ Voir détails" pour voir toutes les infos d'un tournoi</li>
              <li>Utilisez "⚡ Rejoindre" pour participer à un tournoi ouvert</li>
              <li>Créez votre propre tournoi avec le bouton "➕ Créer un tournoi"</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tournaments;