import React from 'react';

const Game: React.FC = () => {
  return (
    <div className="game-page">
      <div className="page-header">
        <h1>🎮 Jouer au Pong</h1>
        <p>Choisissez votre mode de jeu</p>
      </div>

      <div className="container">
        <div className="game-modes">
          <div className="game-mode-card">
            <div className="game-mode-icon">🤖</div>
            <h3>Contre l'IA</h3>
            <p>Entraînez-vous contre notre intelligence artificielle</p>
            <button className="mode-btn primary">
              Jouer contre l'IA
            </button>
          </div>

          <div className="game-mode-card">
            <div className="game-mode-icon">👥</div>
            <h3>Multijoueur</h3>
            <p>Affrontez d'autres joueurs en temps réel</p>
            <button className="mode-btn primary">
              Chercher un adversaire
            </button>
          </div>

          <div className="game-mode-card">
            <div className="game-mode-icon">🏆</div>
            <h3>Tournoi</h3>
            <p>Participez à un tournoi en cours</p>
            <button className="mode-btn secondary">
              Voir les tournois
            </button>
          </div>

          <div className="game-mode-card">
            <div className="game-mode-icon">🎯</div>
            <h3>Entraînement</h3>
            <p>Mode entraînement libre</p>
            <button className="mode-btn secondary">
              S'entraîner
            </button>
          </div>
        </div>

        <div className="game-stats">
          <h2>Vos Statistiques</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">42</div>
              <div className="stat-label">Victoires</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">28</div>
              <div className="stat-label">Défaites</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">60%</div>
              <div className="stat-label">Ratio V/D</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">1247</div>
              <div className="stat-label">Points</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;