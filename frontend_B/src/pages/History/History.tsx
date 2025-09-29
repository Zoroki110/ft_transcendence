// frontend_B/src/pages/History.tsx - EN ATTENTE BACKEND

import React from 'react';
import { useNavigate } from 'react-router-dom';

const History: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="history-page">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">📊 Historique</h1>
          <p className="page-subtitle">Historique des parties</p>
        </div>
      </div>

      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '5rem', marginBottom: '2rem', opacity: 0.5 }}>🚧</div>
          <h2 style={{ marginBottom: '1rem', color: 'var(--gray-700)' }}>
            Fonctionnalité en développement
          </h2>
          <p style={{ color: 'var(--gray-600)', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
            L'historique des parties sera disponible une fois que le backend aura implémenté l'endpoint <code style={{ 
              background: 'var(--gray-100)', 
              padding: '0.25rem 0.5rem', 
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}>GET /users/me/matches</code>
          </p>
          
          <div style={{ 
            background: 'var(--gray-100)', 
            padding: '1.5rem', 
            borderRadius: '8px',
            marginTop: '2rem',
            textAlign: 'left',
            maxWidth: '600px',
            margin: '2rem auto 0'
          }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>📋 Fonctionnalités prévues :</h3>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0,
              display: 'grid',
              gap: '0.5rem'
            }}>
              <li>✅ Liste de toutes vos parties jouées</li>
              <li>✅ Filtres par résultat (victoire/défaite)</li>
              <li>✅ Filtres par mode de jeu</li>
              <li>✅ Détails de chaque match</li>
              <li>✅ Statistiques détaillées</li>
              <li>✅ Pagination</li>
            </ul>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              onClick={() => navigate('/profile')}
              className="btn btn-secondary"
            >
              ← Retour au profil
            </button>
            <button 
              onClick={() => navigate('/tournaments')}
              className="btn btn-primary"
            >
              🏆 Voir les tournois
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;