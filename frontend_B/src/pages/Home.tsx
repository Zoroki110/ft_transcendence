import React from 'react';
import { useTranslations } from '../hooks/useTranslations';

const Home: React.FC = () => {
  const { t } = useTranslations();
  
  return (
    <div className="hero-section">
      <h1 className="main-title">TRANSCENDENCE</h1>
      <p style={{ fontSize: '1.2rem', color: 'rgba(0, 212, 255, 0.8)', marginBottom: '3rem' }}>
        Welcome to Transcendance dans l'univers du combat ultime
      </p>
      
      <div className="section-card">
        <h2 className="section-title">🏆 Tournois Épiques</h2>
        <p className="section-subtitle">Participez aux tournois les plus intenses</p>
        <button className="btn-neon-orange">Voir les Tournois</button>
      </div>
      
      <div className="section-card">
        <h2 className="section-title">⚔️ Créer l'Arène</h2>
        <p className="section-subtitle">Organisez votre propre tournoi</p>
        <button className="btn-neon-orange">Créer un Tournoi</button>
      </div>
      
      <div className="pong-container">
        <div className="pong-field">
          <div className="paddle paddle-left"></div>
          <div className="paddle paddle-right"></div>
          <div className="ball"></div>
        </div>
      </div>
    </div>
  );
};

export default Home;
