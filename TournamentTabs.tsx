import React, { useState, useEffect } from 'react';

interface Tournament {
  id: number;
  name: string;
  status: string;
  type: string;
  currentParticipants: number;
  maxParticipants: number;
  winner?: {
    username: string;
    id: number;
  };
  endDate?: string;
  createdAt: string;
}

interface TournamentResponse {
  tournaments: Tournament[];
  total: number;
}

export const TournamentTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [activeTournaments, setActiveTournaments] = useState<TournamentResponse | null>(null);
  const [completedTournaments, setCompletedTournaments] = useState<TournamentResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Fonction pour récupérer les tournois actifs
  const fetchActiveTournaments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tournaments/active');
      const data = await response.json();
      setActiveTournaments(data);
    } catch (error) {
      console.error('Erreur lors du chargement des tournois actifs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les tournois terminés
  const fetchCompletedTournaments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tournaments/completed');
      const data = await response.json();
      setCompletedTournaments(data);
    } catch (error) {
      console.error('Erreur lors du chargement des tournois terminés:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'active' && !activeTournaments) {
      fetchActiveTournaments();
    } else if (activeTab === 'completed' && !completedTournaments) {
      fetchCompletedTournaments();
    }
  }, [activeTab, activeTournaments, completedTournaments]);

  const renderTournamentCard = (tournament: Tournament, isCompleted: boolean = false) => (
    <div key={tournament.id} className="tournament-card">
      <div className="tournament-header">
        <h3>{tournament.name}</h3>
        <span className={`status-badge status-${tournament.status}`}>
          {tournament.status}
        </span>
      </div>
      
      <div className="tournament-info">
        <p>Type: {tournament.type}</p>
        <p>Participants: {tournament.currentParticipants}/{tournament.maxParticipants}</p>
        
        {isCompleted && tournament.winner && (
          <div className="winner-info">
            <span className="trophy-icon">🏆</span>
            <span className="winner-name">{tournament.winner.username}</span>
          </div>
        )}
        
        {isCompleted && tournament.endDate && (
          <p className="end-date">
            Terminé le: {new Date(tournament.endDate).toLocaleDateString('fr-FR')}
          </p>
        )}
      </div>
      
      <div className="tournament-actions">
        <button 
          className="btn-primary"
          onClick={() => window.location.href = `/tournaments/${tournament.id}`}
        >
          {isCompleted ? 'Voir les résultats' : 'Voir le tournoi'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="tournament-tabs-container">
      {/* Navigation par onglets */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <span className="tab-icon">🎮</span>
          Tournois Actifs
          {activeTournaments && (
            <span className="badge">{activeTournaments.total}</span>
          )}
        </button>
        
        <button
          className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <span className="tab-icon">🏆</span>
          Tournois Terminés
          {completedTournaments && (
            <span className="badge">{completedTournaments.total}</span>
          )}
        </button>
      </div>

      {/* Contenu des onglets */}
      <div className="tab-content">
        {loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Chargement des tournois...</p>
          </div>
        )}

        {activeTab === 'active' && activeTournaments && !loading && (
          <div className="tournaments-grid">
            {activeTournaments.tournaments.length === 0 ? (
              <div className="empty-state">
                <h3>Aucun tournoi actif</h3>
                <p>Il n'y a actuellement aucun tournoi en cours.</p>
                <button className="btn-primary" onClick={() => window.location.href = '/tournaments/create'}>
                  Créer un tournoi
                </button>
              </div>
            ) : (
              activeTournaments.tournaments.map(tournament => 
                renderTournamentCard(tournament, false)
              )
            )}
          </div>
        )}

        {activeTab === 'completed' && completedTournaments && !loading && (
          <div className="tournaments-grid">
            {completedTournaments.tournaments.length === 0 ? (
              <div className="empty-state">
                <h3>Aucun tournoi terminé</h3>
                <p>Aucun tournoi n'a encore été terminé.</p>
              </div>
            ) : (
              completedTournaments.tournaments.map(tournament => 
                renderTournamentCard(tournament, true)
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentTabs;