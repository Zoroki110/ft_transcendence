// frontend_B/src/pages/Login/Login.tsx - CORRIGÉ AVEC CONTEXTE UTILISATEUR
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { authAPI } from '../../services/api';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login: contextLogin, register: contextRegister, isLoggedIn, loading: userLoading, error: userError } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showTwoFA, setShowTwoFA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

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

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.verify2FA(twoFACode);
      localStorage.setItem('access_token', response.data.access_token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Code 2FA incorrect');
      setIsLoading(false);
    }
  };

  const handleOAuth = (provider: '42' | 'google' | 'github') => {
    const redirectUri = window.location.origin + '/auth/callback';
    const oauthUrls = {
      '42': `${import.meta.env.VITE_API_URL}/auth/42?redirect_uri=${redirectUri}`,
      'google': `${import.meta.env.VITE_API_URL}/auth/google?redirect_uri=${redirectUri}`,
      'github': `${import.meta.env.VITE_API_URL}/auth/github?redirect_uri=${redirectUri}`
    };
    
    window.location.href = oauthUrls[provider];
  };

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
            
            {!showTwoFA ? (
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
                    onClick={() => handleOAuth('42')}
                    disabled={isLoading}
                    className="oauth-button oauth-42"
                  >
                    <span className="oauth-icon">🚀</span>
                    Se connecter avec 42
                  </button>

                  <button
                    onClick={() => handleOAuth('google')}
                    disabled={isLoading}
                    className="oauth-button oauth-google"
                  >
                    <span className="oauth-icon">🔍</span>
                    Se connecter avec Google
                  </button>

                  <button
                    onClick={() => handleOAuth('github')}
                    disabled={isLoading}
                    className="oauth-button oauth-github"
                  >
                    <span className="oauth-icon">🐙</span>
                    Se connecter avec GitHub
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

            ) : (
              <div className="card">
                <h2 className="login-title">🔒 Authentification 2FA</h2>
                <p className="login-2fa-subtitle">
                  Entrez le code de votre application
                </p>

                {error && (
                  <div className="login-error">
                    {error}
                  </div>
                )}

                <form onSubmit={handle2FA} className="login-form">
                  <div className="form-group">
                    <label htmlFor="twoFACode" className="form-label">
                      Code (6 chiffres)
                    </label>
                    <input
                      id="twoFACode"
                      type="text"
                      className="input input-2fa"
                      value={twoFACode}
                      onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      maxLength={6}
                      required
                    />
                  </div>

                  <div className="login-2fa-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowTwoFA(false);
                        setTwoFACode('');
                        setError('');
                      }}
                    >
                      ← Retour
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isLoading || twoFACode.length !== 6}
                    >
                      {isLoading ? '⏳ Vérification...' : '✅ Vérifier'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;