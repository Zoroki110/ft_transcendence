// frontend_B/src/pages/Login/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTwoFA, setShowTwoFA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.login(email, password);
      
      if (response.data.requires2FA) {
        setShowTwoFA(true);
        setIsLoading(false);
        return;
      }

      localStorage.setItem('access_token', response.data.access_token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de connexion');
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
                <h2 className="login-title">Se connecter</h2>

                {error && (
                  <div className="login-error">
                    {error}
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

                <form onSubmit={handleLogin} className="login-form">
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
                    disabled={isLoading}
                  >
                    {isLoading ? '⏳ Connexion...' : '🔐 Se connecter'}
                  </button>
                </form>

                <div className="login-footer">
                  <a href="/forgot-password" className="login-link">
                    Mot de passe oublié ?
                  </a>
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