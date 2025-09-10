import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const MyTournaments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'created' | 'participating'>('participating');

  const myTournaments = [
    {
      id: 1,
      name: "Tournoi Hebdomadaire #42",
      status: "EN_COURS",
      participants: 8,
      maxParticipants: 16,
      myPosition: 3,
      nextMatch: "Demi-finale",
      createdAt: "2025-01-08"
    },
    {
      id: 2,
      name: "Championship Winter 2025",
      status: "INSCRIPTIONS",
      participants: 12,
      maxParticipants: 32,
      myPosition: null,
      nextMatch: null,
      createdAt: "2025-01-05"
    }
  ];

  const createdTournaments = [
    {
      id: 3,
      name: "Mon Tournoi Privé",
      status: "DRAFT",
      participants: 4,
      maxParticipants: 8,
      createdAt: "2025-01-10"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EN_COURS': return '#4ade80';
      case 'INSCRIPTIONS': return '#3b82f6';
      case 'DRAFT': return '#f59e0b';
      case 'TERMINE': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'EN_COURS': return 'En cours';
      case 'INSCRIPTIONS': return 'Inscriptions ouvertes';
      case 'DRAFT': return 'Brouillon';
      case 'TERMINE': return 'Terminé';
      default: return status;
    }
  };

  return (
    <div className="my-tournaments-page">
      <div className="page-header">
        <h1>Mes Tournois</h1>
        <Link to="/create-tournament" className="create-btn">
          Créer un tournoi
        </Link>
      </div>

      <div className="container">
        <div className="tournament-tabs">
          <button 
            className={`tab-btn ${activeTab === 'participating' ? 'active' : ''}`}
            onClick={() => setActiveTab('participating')}
          >
            Tournois rejoints ({myTournaments.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'created' ? 'active' : ''}`}
            onClick={() => setActiveTab('created')}
          >
            Tournois créés ({createdTournaments.length})
          </button>
        </div>

        <div className="tournaments-content">
          {activeTab === 'participating' && (
            <div className="tournaments-list">
              {myTournaments.length > 0 ? (
                myTournaments.map(tournament => (
                  <div key={tournament.id} className="tournament-card">
                    <div className="tournament-header">
                      <h3>{tournament.name}</h3>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(tournament.status) }}
                      >
                        {getStatusLabel(tournament.status)}
                      </span>
                    </div>
                    
                    <div className="tournament-info">
                      <div className="info-item">
                        <span className="label">Participants:</span>
                        <span className="value">{tournament.participants}/{tournament.maxParticipants}</span>
                      </div>
                      
                      {tournament.myPosition && (
                        <div className="info-item">
                          <span className="label">Ma position:</span>
                          <span className="value">#{tournament.myPosition}</span>
                        </div>
                      )}
                      
                      {tournament.nextMatch && (
                        <div className="info-item">
                          <span className="label">Prochain match:</span>
                          <span className="value">{tournament.nextMatch}</span>
                        </div>
                      )}
                      
                      <div className="info-item">
                        <span className="label">Créé le:</span>
                        <span className="value">{new Date(tournament.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    
                    <div className="tournament-actions">
                      <button className="action-btn primary">
                        Voir détails
                      </button>
                      {tournament.status === 'EN_COURS' && tournament.nextMatch && (
                        <button className="action-btn secondary">
                          Jouer maintenant
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">🏆</div>
                  <h3>Aucun tournoi rejoint</h3>
                  <p>Vous ne participez à aucun tournoi pour le moment.</p>
                  <Link to="/tournaments" className="empty-action">
                    Découvrir les tournois
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'created' && (
            <div className="tournaments-list">
              {createdTournaments.length > 0 ? (
                createdTournaments.map(tournament => (
                  <div key={tournament.id} className="tournament-card">
                    <div className="tournament-header">
                      <h3>{tournament.name}</h3>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(tournament.status) }}
                      >
                        {getStatusLabel(tournament.status)}
                      </span>
                    </div>
                    
                    <div className="tournament-info">
                      <div className="info-item">
                        <span className="label">Participants:</span>
                        <span className="value">{tournament.participants}/{tournament.maxParticipants}</span>
                      </div>
                      
                      <div className="info-item">
                        <span className="label">Créé le:</span>
                        <span className="value">{new Date(tournament.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    
                    <div className="tournament-actions">
                      <button className="action-btn primary">
                        Gérer tournoi
                      </button>
                      {tournament.status === 'DRAFT' && (
                        <button className="action-btn secondary">
                          Publier
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">➕</div>
                  <h3>Aucun tournoi créé</h3>
                  <p>Vous n'avez pas encore créé de tournoi.</p>
                  <Link to="/create-tournament" className="empty-action">
                    Créer mon premier tournoi
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTournaments;