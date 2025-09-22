// frontend_B/src/pages/Home.tsx - PAGE D'ACCUEIL SIMPLE ET FONCTIONNELLE

import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="page-header">
        <div className="container text-center">
          <h1 className="page-title">TRANSCENDENCE</h1>
          <p className="page-subtitle">
            Bienvenue dans l'arène du Pong nouvelle génération
          </p>
        </div>
      </section>

      {/* Actions principales */}
      <section className="container">
        <div className="grid grid-2 mb-8">
          <div className="card text-center">
            <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>🏆 Tournois</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--gray-700)' }}>
              Participez aux tournois en cours ou consultez les résultats
            </p>
            <Link to="/tournaments" className="btn btn-primary">
              Voir les tournois
            </Link>
          </div>

          <div className="card text-center">
            <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>⚔️ Créer</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--gray-700)' }}>
              Organisez votre propre tournoi et invitez vos amis
            </p>
            <Link to="/create-tournament" className="btn btn-success">
              Créer un tournoi
            </Link>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>📊 Statistiques rapides</h3>
          <div className="grid grid-3">
            <div className="text-center">
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                1,247
              </div>
              <div style={{ color: 'var(--gray-700)' }}>Joueurs actifs</div>
            </div>
            <div className="text-center">
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                89
              </div>
              <div style={{ color: 'var(--gray-700)' }}>Tournois organisés</div>
            </div>
            <div className="text-center">
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning)' }}>
                5,432
              </div>
              <div style={{ color: 'var(--gray-700)' }}>Parties jouées</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;