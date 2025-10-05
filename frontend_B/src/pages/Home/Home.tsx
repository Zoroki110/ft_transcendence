// frontend_B/src/pages/Home/Home.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { gameAPI } from '../../services/api';
import Debug from '../../components/Debug';
import './Home.css';

const Home: React.FC = () => {
  const { isLoggedIn } = useUser();
  const navigate = useNavigate();
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [waitingRoomsCount, setWaitingRoomsCount] = useState(0);

  const handleCreateQuickGame = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    try {
      setIsCreatingGame(true);
      console.log('🟢 FRONTEND: Appel API createQuickMatch à', new Date().toISOString());
      const response = await gameAPI.createQuickMatch();
      console.log('🟢 FRONTEND: Réponse API reçue:', response.data);
      const gameId = response.data.gameId;
      console.log('🟢 FRONTEND: Navigation vers /matchmaking/' + gameId);
      navigate(`/matchmaking/${gameId}`);
    } catch (error) {
      console.error('🔴 FRONTEND: Erreur lors de la création de la partie:', error);
      alert('Impossible de créer une partie. Veuillez réessayer.');
    } finally {
      setIsCreatingGame(false);
    }
  };

  // Charger le nombre de parties en attente
  useEffect(() => {
    const fetchWaitingRooms = async () => {
      try {
        const response = await gameAPI.getWaitingRoomsCount();
        setWaitingRoomsCount(response.data.count);
      } catch (error) {
        console.error('Erreur lors de la récupération des parties en attente:', error);
      }
    };

    if (isLoggedIn) {
      fetchWaitingRooms();
      // Rafraîchir toutes les 10 secondes
      const interval = setInterval(fetchWaitingRooms, 10000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);
  
  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="container">
          <h1 className="home-hero-title">🏓 Transcendence</h1>
          <p className="home-hero-subtitle">
            Le meilleur jeu de Pong en ligne
          </p>
          <div className="home-hero-actions">
            <button
              onClick={handleCreateQuickGame}
              disabled={isCreatingGame || !isLoggedIn}
              className="btn btn-primary btn-large"
            >
              🚀 {isCreatingGame ? "Recherche..." : isLoggedIn ? "Partie rapide" : "Se connecter pour jouer"}
            </button>
            <Link to="/tournaments" className="btn btn-secondary btn-large">
              🏆 Voir les tournois
            </Link>
          </div>

        </div>
      </div>

      <div className="container">
        <div className="home-features">
          <h2 className="home-section-title">✨ Fonctionnalités</h2>
          <div className="grid grid-3">
            <div className="card home-feature-card">
              <div className="home-feature-icon">🎯</div>
              <h3>Matchmaking</h3>
              <p className="home-feature-description">
                Système automatique d'appariement pour trouver rapidement un adversaire
              </p>
            </div>

            <div className="card home-feature-card">
              <div className="home-feature-icon">🎮</div>
              <h3>Jeu en temps réel</h3>
              <p className="home-feature-description">
                Affrontez vos amis dans des parties de Pong multijoueur en temps réel
              </p>
            </div>

            <div className="card home-feature-card">
              <div className="home-feature-icon">🏆</div>
              <h3>Tournois</h3>
              <p className="home-feature-description">
                Créez et participez à des tournois avec système de brackets
              </p>
            </div>

            <div className="card home-feature-card">
              <div className="home-feature-icon">📊</div>
              <h3>Classement</h3>
              <p className="home-feature-description">
                Suivez vos stats et grimpez dans le classement mondial
              </p>
            </div>

            <div className="card home-feature-card">
              <div className="home-feature-icon">🔐</div>
              <h3>OAuth & 2FA</h3>
              <p className="home-feature-description">
                Connexion sécurisée avec 42, Google, GitHub et authentification 2FA
              </p>
            </div>

            <div className="card home-feature-card">
              <div className="home-feature-icon">👥</div>
              <h3>Social</h3>
              <p className="home-feature-description">
                Ajoutez des amis, chattez et suivez leurs performances
              </p>
            </div>

            <div className="card home-feature-card">
              <div className="home-feature-icon">🌍</div>
              <h3>Multilingue</h3>
              <p className="home-feature-description">
                Interface disponible en français et anglais
              </p>
            </div>
          </div>
        </div>

        <div className="card home-cta">
          <h2 className="home-cta-title">Prêt à jouer ? 🎮</h2>
          <p className="home-cta-subtitle">
            Rejoignez des milliers de joueurs et montrez vos compétences
          </p>
          <div className="home-cta-actions">
            <Link to={isLoggedIn ? "/game" : "/login"} className="btn btn-primary btn-large">
              🚀 {isLoggedIn ? "Jouer maintenant" : "S'inscrire gratuitement"}
            </Link>
            <Link to="/leaderboard" className="btn btn-secondary btn-large">
              📊 Voir le classement
            </Link>
          </div>
        </div>

        {/* Composant de debug en développement */}
        {import.meta.env.DEV && <Debug />}
      </div>
    </div>
  );
};

export default Home;