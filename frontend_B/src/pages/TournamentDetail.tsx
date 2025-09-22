// frontend_B/src/pages/TournamentDetail.tsx - PAGE DÉTAIL TOURNOI COMPLÈTE

import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTournaments } from '../contexts/TournamentContext';

const TournamentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournaments, joinTournament, leaveTournament, deleteTournament } = useTournaments();
  
  // Trouver le tournoi par ID
  const tournament = tournaments.find(t => t.id === parseInt(id || '0'));

  if (!tournament) {
    return (
      <div>
        <section className="page-header">
          <div className="container">
            <h1 className="page-title">❌ Tournoi Introuvable</h1>
            <p className="page-subtitle">Le tournoi demandé n'existe pas</p>
          </div>
        </section>
        <div className="container">
          <div className="card text-center">
            <h2>Oups !</h2>
            <p>Ce tournoi n'existe pas ou a été supprimé.</p>
            <Link to="/tournaments" className="btn btn-primary">
              ← Retour aux tournois
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fonctions d'action
  const handleJoin = () => {
    joinTournament(tournament.id);
  };

  const handleLeave = () => {
    leaveTournament(tournament.id);
  };

  const handleDelete = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce tournoi ?')) {
      deleteTournament(tournament.id);
      navigate('/tournaments');
    }
  };

  // Helpers pour l'affichage
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'var(--success)';
      case 'full': return 'var(--warning)';
      case 'in_progress': return 'var(--primary)';
      case 'completed': return 'var(--gray-500)';
      case 'draft': return 'var(--gray-400)';
      default: return 'var(--gray-500)';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '📝 Brouillon';
      case 'open': return '🟢 Ouvert aux inscriptions';
      case 'full': return '🔴 Complet';
      case 'in_progress': return '🟡 En cours';
      case 'completed': return '✅ Terminé';
      case 'cancelled': return '❌ Annulé';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'single_elimination': return '🏆 Élimination simple';
      case 'double_elimination': return '🏆🏆 Élimination double';
      case 'round_robin': return '🔄 Round Robin';
      default: return type;
    }
  };

  const canJoin = tournament.status === 'open' && tournament.currentParticipants < tournament.maxParticipants;
  const canLeave = tournament.currentParticipants > 0 && tournament.status !== 'in_progress';

  return (
    <div>
      {/* Header avec info principale */}
      <section className="page-header">
        <div className="container">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">{tournament.name}</h1>
              <p className="page-subtitle">
                {tournament.description || 'Aucune description'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                color: getStatusColor(tournament.status), 
                fontWeight: 'bold', 
                fontSize: '1.2rem',
                marginBottom: '0.5rem'
              }}>
                {getStatusText(tournament.status)}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)' }}>
                ID: #{tournament.id}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <Link to="/tournaments" className="btn btn-secondary">
            ← Retour aux tournois
          </Link>
        </div>

        {/* Informations principales */}
        <div className="grid grid-2 mb-4">
          <div className="card">
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
              📋 Informations Générales
            </h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>Type de tournoi:</strong><br />
              <span style={{ color: 'var(--primary)' }}>{getTypeText(tournament.type)}</span>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <strong>Participants:</strong><br />
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {tournament.currentParticipants} / {tournament.maxParticipants}
              </span>
              <div style={{ 
                background: 'var(--gray-200)', 
                height: '8px', 
                borderRadius: '4px', 
                marginTop: '0.5rem',
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

            <div>
              <strong>Créé par:</strong><br />
              <span style={{ color: 'var(--primary)' }}>👤 {tournament.creator}</span>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
              📅 Détails Temporels
            </h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>Créé le:</strong><br />
              {new Date(tournament.createdAt).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>

            {tournament.status === 'draft' && (
              <div style={{ 
                background: 'rgba(102, 126, 234, 0.1)', 
                padding: '1rem', 
                borderRadius: '8px',
                border: '1px solid var(--primary)'
              }}>
                <strong>📝 En attente</strong><br />
                Ce tournoi est encore en préparation
              </div>
            )}

            {tournament.status === 'open' && (
              <div style={{ 
                background: 'rgba(16, 185, 129, 0.1)', 
                padding: '1rem', 
                borderRadius: '8px',
                border: '1px solid var(--success)'
              }}>
                <strong>🎯 Inscriptions ouvertes</strong><br />
                Vous pouvez rejoindre ce tournoi
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
            ⚡ Actions Disponibles
          </h3>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {canJoin && (
              <button onClick={handleJoin} className="btn btn-success">
                ✅ Rejoindre le tournoi
              </button>
            )}

            {canLeave && (
              <button onClick={handleLeave} className="btn btn-secondary">
                ❌ Quitter le tournoi
              </button>
            )}

            {tournament.creator === 'Jacob' && (
              <>
                {tournament.status === 'draft' && (
                  <button className="btn btn-primary">
                    🚀 Ouvrir les inscriptions
                  </button>
                )}
                
                <button onClick={handleDelete} className="btn btn-danger">
                  🗑️ Supprimer le tournoi
                </button>
              </>
            )}

            {tournament.status === 'full' && tournament.creator === 'Jacob' && (
              <button className="btn btn-primary">
                🎯 Démarrer le tournoi
              </button>
            )}
          </div>

          {!canJoin && tournament.status === 'open' && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '8px',
              color: 'var(--danger)'
            }}>
              ⚠️ Impossible de rejoindre : tournoi complet
            </div>
          )}
        </div>

        {/* Participants (simulation) */}
        {tournament.currentParticipants > 0 && (
          <div className="card">
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
              👥 Participants ({tournament.currentParticipants})
            </h3>
            
            <div className="grid grid-3">
              {Array.from({ length: tournament.currentParticipants }, (_, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  background: 'var(--gray-100)',
                  borderRadius: '6px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'var(--primary)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span>Joueur {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Brackets (si disponibles) */}
        {tournament.status === 'in_progress' || tournament.status === 'completed' && (
          <div className="card">
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
              🏆 Brackets
            </h3>
            <div style={{ 
              padding: '2rem', 
              textAlign: 'center', 
              background: 'var(--gray-100)',
              borderRadius: '8px'
            }}>
              <p>🚧 Brackets à implémenter</p>
              <small>Cette fonctionnalité sera ajoutée plus tard</small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentDetail;