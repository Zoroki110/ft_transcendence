import React from 'react';
import { Link } from 'react-router-dom';
import I18nTest from '../components/i18n/I18nTest';
import { useTranslations } from '../hooks/useTranslations';

const Home: React.FC = () => {
  const { t } = useTranslations();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">{t('common.welcome')}</h1>
          <p className="hero-subtitle">
            Découvrez l'univers du Pong nouvelle génération avec des tournois épiques !
          </p>
          <div className="hero-actions">
            <Link to="/game" className="cta-primary">
              <span>🎮</span>
              Jouer maintenant
            </Link>
            <Link to="/tournaments" className="cta-secondary">
              <span>🏆</span>
              Voir les tournois
            </Link>
          </div>
        </div>
        
        {/* Hero Background Animation - EN DEHORS du hero-content */}
        <div className="hero-background">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
      </section>

      {/* Pong élargi, hors container limité */}
      <div className="pong-animation-parent">
        <canvas className="pong-animation" />
      </div>

      {/* Main Content pour les autres sections */}
      <main className="main-content home-content">
        {/* Features Section */}
        <section className="features-section">
          <div className="container">
            <h2 className="section-title">Fonctionnalités</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🎮</div>
                <h3>Jeu en Temps Réel</h3>
                <p>Jouez contre des adversaires du monde entier avec une synchronisation parfaite</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🏆</div>
                <h3>Tournois Épiques</h3>
                <p>Participez à des tournois passionnants et grimpez dans le classement</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">👥</div>
                <h3>Communauté</h3>
                <p>Rejoignez une communauté de joueurs passionnés de Pong</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>Statistiques</h3>
                <p>Suivez vos performances et analysez votre progression</p>
              </div>
            </div>
          </div>
        </section>

        {/* Test I18n Section */}
        <section className="test-section">
          <div className="container">
            <I18nTest />
          </div>
        </section>

        {/* Footer */}
        <footer className="app-footer">
          <div className="container">
            <div className="footer-content">
              <div className="footer-brand">
                <div className="brand-icon">🏓</div>
                <span>Pong Arena</span>
              </div>
              <p>&copy; 2025 Pong Arena. Tous droits réservés.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Home;