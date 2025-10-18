// frontend_B/src/pages/Login/Login.tsx - CORRIGÉ AVEC CONTEXTE UTILISATEUR
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { authAPI } from '../../services/api';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, login: contextLogin, register: contextRegister, isLoggedIn, loading: userLoading, error: userError, logout } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Rediriger si déjà connecté (avec délai pour permettre de voir la page)
useEffect(() => {
  if (!userLoading && isLoggedIn && user) {
    const timer = setTimeout(() => navigate('/'), 2000);
    return () => clearTimeout(timer);
  }
}, [userLoading, isLoggedIn, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await contextLogin(email, password);
      if (success) {
        navigate('/');
      } else {
        // Erreur gérée par le contexte, mais on peut vérifier userError
        setError(userError || 'Erreur de connexion');
      }
    } catch (err: any) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    console.log('🔄 Début handleRegister:', { username, email });

    try {
      const success = await contextRegister(username, email, password);
      console.log('📥 Résultat contextRegister:', success);

      if (success) {
        console.log('✅ Inscription réussie, redirection vers /');
        navigate('/');
      } else {
        const errorMsg = userError || 'Erreur d\'inscription';
        console.log('❌ Inscription échouée:', errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      console.error('❌ Exception dans handleRegister:', err);
      setError('Erreur d\'inscription: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };


  const handleOAuth42 = () => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // fallback
    const returnTo = `${window.location.origin}/auth/complete`;
    const url = `${API_BASE}/auth/42?return_to=${encodeURIComponent(returnTo)}`;
    console.log('[OAuth42] redirecting to:', url);
    window.location.assign(url);
  };

  // Si déjà connecté, afficher un message différent
  if (isLoggedIn && user) {
    return (
      <div className="login-page">
        <div className="page-header">
          <div className="container">
            <h1 className="page-title">✅ Déjà connecté</h1>
            <p className="page-subtitle">Vous êtes déjà connecté en tant que {user.username}</p>
          </div>
        </div>

        <div className="container">
          <div className="login-container">
            <div className="card">
              <div className="already-logged-message">
                <div className="success-icon">👋</div>
                <h2>Bonjour {user.displayName || user.username} !</h2>
                <p>Vous êtes déjà connecté à votre compte.</p>
                <p>Vous serez redirigé vers l'accueil dans quelques secondes...</p>

                <div className="form-actions">
                  <button
                    onClick={() => navigate('/')}
                    className="btn btn-primary"
                  >
                    🏠 Aller à l'accueil
                  </button>
                  <button
                    onClick={() => logout()}
                    className="btn btn-secondary"
                  >
                    🚪 Se déconnecter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">🔐 Connexion</h1>
          <p className="page-subtitle">Connectez-vous à Transcendence</p>
        </div>
      </div>

      <div className="container">
        <div className="login-container">
          <div className="login-box">

              <div className="card">
                <h2 className="login-title">
                  {isRegisterMode ? 'S\'inscrire' : 'Se connecter'}
                </h2>

                {(error || userError) && (
                  <div className="login-error">
                    {error || userError}
                  </div>
                )}

                <div className="login-oauth">
                  <button
                    type="button"
                    onClick={handleOAuth42}
                    disabled={isLoading}
                    className="oauth-button oauth-42"
                  >
                    <span className="oauth-icon">🚀</span>
                    Se connecter avec 42
                  </button>
                </div>

                <div className="login-divider">
                  <span>ou</span>
                </div>

                <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="login-form">
                  {isRegisterMode && (
                    <div className="form-group">
                      <label htmlFor="username" className="form-label">Nom d'utilisateur</label>
                      <input
                        id="username"
                        type="text"
                        className="input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        placeholder="votre_nom"
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      id="email"
                      type="email"
                      className="input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="votre@email.com"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password" className="form-label">Mot de passe</label>
                    <input
                      id="password"
                      type="password"
                      className="input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-full"
                    disabled={isLoading || userLoading}
                  >
                    {isLoading || userLoading
                      ? '⏳ Chargement...'
                      : isRegisterMode
                        ? '📝 S\'inscrire'
                        : '🔐 Se connecter'
                    }
                  </button>
                </form>

                <div className="login-footer">
                  <button
                    type="button"
                    className="login-link"
                    onClick={() => {
                      setIsRegisterMode(!isRegisterMode);
                      setError('');
                      setEmail('');
                      setPassword('');
                      setUsername('');
                    }}
                  >
                    {isRegisterMode
                      ? 'Déjà un compte ? Se connecter'
                      : 'Pas de compte ? S\'inscrire'
                    }
                  </button>
                </div>
              </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;