import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, userAPI } from '../../services/api';
import { socketService } from '../../services/socket';
import './Friends.css';

interface User {
  id: number;
  username: string;
  displayName?: string;
  avatar?: string;
  isOnline: boolean;
  gamesWon?: number;
  gamesLost?: number;
}

interface FriendRequest {
  id: number;
  requester: User;
  addressee: User;
  status: string;
  createdAt: string;
}

interface Challenge {
  id: number;
  challenger: User;
  challenged: User;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  createdAt: string;
  message?: string;
  gameId?: string;
}

const Friends: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search' | 'challenges'>('friends');
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentChallenges, setSentChallenges] = useState<Challenge[]>([]);
  const [receivedChallenges, setReceivedChallenges] = useState<Challenge[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challengeSubTab, setChallengeSubTab] = useState<'received' | 'sent'>('received');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    if (activeTab === 'friends') {
      loadFriends();
    } else if (activeTab === 'requests') {
      loadPendingRequests();
    } else if (activeTab === 'challenges') {
      loadChallenges();
    }
  }, [activeTab]);

  // Recharger les requests et challenges périodiquement pour détecter les nouvelles demandes
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'requests') {
        loadPendingRequests();
      } else {
        // Charger silencieusement le nombre sans changer d'onglet
        api.get('/users/me/friends/requests').then(response => {
          setPendingRequests(response.data);
        }).catch(() => {});
      }

      if (activeTab === 'challenges') {
        loadChallenges();
      } else {
        // Charger silencieusement les challenges sans changer d'onglet
        Promise.all([
          api.get('/challenges/received'),
          api.get('/challenges/sent')
        ]).then(([receivedResponse, sentResponse]) => {
          setReceivedChallenges(receivedResponse.data);
          setSentChallenges(sentResponse.data);
        }).catch(() => {});
      }
    }, 5000); // Toutes les 5 secondes

    return () => clearInterval(interval);
  }, [activeTab]);

  // Charger le profil de l'utilisateur et enregistrer pour les WebSocket
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await userAPI.getMyProfile();
        const userId = response.data.id;
        setCurrentUserId(userId);

        // Enregistrer l'utilisateur pour recevoir les notifications WebSocket
        socketService.registerUser(userId);
      } catch (err) {
        console.error('Failed to load user profile:', err);
      }
    };

    loadUserProfile();
  }, []);

  // Écouter l'événement de nouvelle demande d'ami
  useEffect(() => {
    const handleFriendRequestReceived = () => {
      loadPendingRequests();
    };

    window.addEventListener('friendRequestReceived', handleFriendRequestReceived);
    return () => window.removeEventListener('friendRequestReceived', handleFriendRequestReceived);
  }, []);

  // Écouter les notifications de défi accepté via WebSocket
  useEffect(() => {
    socketService.onChallengeAccepted((data) => {
      console.log('🎮 Challenge accepted notification:', data);
      alert(data.message);
      // Rediriger vers le jeu
      navigate(`/game/${data.gameId}`);
    });

    return () => {
      socketService.offChallengeEvents();
    };
  }, [navigate]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/me/friends');
      setFriends(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/me/friends/requests');
      setPendingRequests(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const [receivedResponse, sentResponse] = await Promise.all([
        api.get('/challenges/received'),
        api.get('/challenges/sent')
      ]);
      setReceivedChallenges(receivedResponse.data);
      setSentChallenges(sentResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId: number) => {
    try {
      await api.post('/users/friends/request', { addresseeId: userId });
      alert('Friend request sent!');
      setSearchResults(searchResults.filter(u => u.id !== userId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send friend request');
    }
  };

  const acceptFriendRequest = async (requestId: number) => {
    try {
      await api.patch(`/users/friends/requests/${requestId}`, { accept: true });
      loadPendingRequests();
      loadFriends();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept request');
    }
  };

  const rejectFriendRequest = async (requestId: number) => {
    try {
      await api.patch(`/users/friends/requests/${requestId}`, { accept: false });
      loadPendingRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject request');
    }
  };

  const removeFriend = async (friendId: number) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;

    try {
      await api.delete(`/users/friends/${friendId}`);
      loadFriends();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove friend');
    }
  };

  const sendChallenge = async (userId: number) => {
    try {
      const response = await api.post('/challenges', { challengedId: userId });
      const gameId = response.data?.gameId;

      if (gameId) {
        alert('Défi envoyé ! En attente de la réponse de votre adversaire...');
        // Rediriger vers le jeu en mode attente
        navigate(`/game/${gameId}`);
      } else {
        alert('Défi envoyé !');
        setActiveTab('challenges');
        loadChallenges();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send challenge');
    }
  };

  const acceptChallenge = async (challengeId: number) => {
    try {
      const response = await api.patch(`/challenges/${challengeId}/respond`, { accept: true });
      const gameId = response.data?.gameId;

      if (gameId) {
        alert('Défi accepté ! Redirection vers le jeu...');
        // Rediriger vers le jeu
        navigate(`/game/${gameId}`);
      } else {
        alert('Défi accepté mais impossible de trouver la partie');
        loadChallenges();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept challenge');
    }
  };

  const rejectChallenge = async (challengeId: number) => {
    try {
      await api.patch(`/challenges/${challengeId}/respond`, { accept: false });
      alert('Défi refusé');
      loadChallenges();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject challenge');
    }
  };

  const cancelChallenge = async (challengeId: number) => {
    try {
      await api.delete(`/challenges/${challengeId}`);
      alert('Défi annulé');
      loadChallenges();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel challenge');
    }
  };

  return (
    <div className="friends-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <div className="header-content">
            <div className="header-left">
              <div className="header-icon-wrapper">
                <svg className="header-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
              </div>
              <div className="header-text">
                <h1 className="page-title">Amis & Défis</h1>
                <p className="page-subtitle">
                  Gérez vos amis et lancez des défis
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Navigation Tabs */}
        <div className="tabs-card">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              <svg className="tab-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              <span className="tab-label">Mes Amis</span>
              <span className="tab-badge">{friends.length}</span>
            </button>
            <button
              className={`tab ${activeTab === 'challenges' ? 'active' : ''}`}
              onClick={() => setActiveTab('challenges')}
            >
              <svg className="tab-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z"/>
              </svg>
              <span className="tab-label">Défis</span>
              {receivedChallenges.length > 0 && (
                <span className="tab-badge notification">{receivedChallenges.length}</span>
              )}
            </button>
            <button
              className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              <svg className="tab-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span className="tab-label">Demandes</span>
              {pendingRequests.length > 0 && (
                <span className="tab-badge notification">{pendingRequests.length}</span>
              )}
            </button>
            <button
              className={`tab ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              <svg className="tab-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <span className="tab-label">Rechercher</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="error-card">
            <svg className="error-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <p>{error}</p>
          </div>
        )}

        {/* Search Section */}
        {activeTab === 'search' && (
          <div className="content-section">
            <div className="search-box">
              <svg className="search-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Rechercher un utilisateur par pseudo..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            <div className="user-list">
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Recherche en cours...</p>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div key={user.id} className="user-card">
                    <div className="user-avatar">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <div className="user-info">
                      <h3>{user.displayName || user.username}</h3>
                      <div className="user-stats">
                        <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z"/>
                        </svg>
                        <span>{user.gamesWon || 0} victoires</span>
                        <span className="stat-divider">•</span>
                        <span>{user.gamesLost || 0} défaites</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => sendFriendRequest(user.id)}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                      Ajouter
                    </button>
                  </div>
                ))
              ) : searchQuery.length >= 2 ? (
                <div className="empty-state">
                  <svg className="empty-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                  <h3>Aucun utilisateur trouvé</h3>
                  <p>Essayez avec un autre pseudo</p>
                </div>
              ) : (
                <div className="empty-state">
                  <svg className="empty-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                  <h3>Recherchez des joueurs</h3>
                  <p>Entrez au moins 2 caractères pour commencer</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Requests Section */}
        {activeTab === 'requests' && (
          <div className="content-section">
            <div className="user-list">
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Chargement...</p>
                </div>
              ) : pendingRequests.length > 0 ? (
                pendingRequests.map((request) => (
                  <div key={request.id} className="user-card">
                    <div className="user-avatar">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <div className="user-info">
                      <h3>{request.requester.displayName || request.requester.username}</h3>
                      <div className="user-stats">
                        <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                        </svg>
                        <span>Envoyée le {new Date(request.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    <div className="button-group">
                      <button
                        className="btn btn-success"
                        onClick={() => acceptFriendRequest(request.id)}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Accepter
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => rejectFriendRequest(request.id)}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                        Refuser
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <svg className="empty-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <h3>Aucune demande en attente</h3>
                  <p>Vous n'avez pas de demandes d'ami pour le moment</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Friends Section */}
        {activeTab === 'friends' && (
          <div className="content-section">
            <div className="user-list">
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Chargement...</p>
                </div>
              ) : friends.length > 0 ? (
                friends.map((friend) => (
                  <div key={friend.id} className="user-card">
                    <div className="user-avatar">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <div className="user-info">
                      <h3>{friend.displayName || friend.username}</h3>
                      <div className="user-stats">
                        <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z"/>
                        </svg>
                        <span>{friend.gamesWon || 0} victoires</span>
                        <span className="stat-divider">•</span>
                        <span>{friend.gamesLost || 0} défaites</span>
                      </div>
                    </div>
                    <div className="button-group">
                      <button className="btn btn-primary" onClick={() => navigate(`/profile/${friend.id}`)}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        Profil
                      </button>
                      <button className="btn btn-warning" onClick={() => sendChallenge(friend.id)}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z"/>
                        </svg>
                        Défier
                      </button>
                      <button className="btn btn-info" onClick={() => navigate(`/chat/${friend.id}`)}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                        </svg>
                        Message
                      </button>
                      <button className="btn btn-danger" onClick={() => removeFriend(friend.id)}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                        Retirer
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <svg className="empty-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                  </svg>
                  <h3>Aucun ami pour le moment</h3>
                  <p>Utilisez la recherche pour trouver et ajouter des amis !</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Challenges Section */}
        {activeTab === 'challenges' && (
          <div className="content-section">
            {/* Sub-tabs for challenges */}
            <div className="challenge-subtabs">
              <button
                className={`subtab ${challengeSubTab === 'received' ? 'active' : ''}`}
                onClick={() => setChallengeSubTab('received')}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z"/>
                </svg>
                <span>Défis reçus</span>
                {receivedChallenges.length > 0 && (
                  <span className="subtab-badge">{receivedChallenges.length}</span>
                )}
              </button>
              <button
                className={`subtab ${challengeSubTab === 'sent' ? 'active' : ''}`}
                onClick={() => setChallengeSubTab('sent')}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
                <span>Défis envoyés</span>
                {sentChallenges.length > 0 && (
                  <span className="subtab-badge">{sentChallenges.length}</span>
                )}
              </button>
            </div>

            <div className="user-list">
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Chargement...</p>
                </div>
              ) : challengeSubTab === 'received' ? (
                receivedChallenges.length > 0 ? (
                  receivedChallenges.map((challenge) => (
                    <div key={challenge.id} className="user-card challenge-card">
                      <div className="user-avatar">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                      <div className="user-info">
                        <h3>{challenge.challenger.displayName || challenge.challenger.username}</h3>
                        <div className="challenge-meta">
                          <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z"/>
                          </svg>
                          <span>Vous défie en duel</span>
                          <span className="stat-divider">•</span>
                          <span>{new Date(challenge.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                      <div className="button-group">
                        <button
                          className="btn btn-success"
                          onClick={() => acceptChallenge(challenge.id)}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                          Accepter
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => rejectChallenge(challenge.id)}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                          </svg>
                          Refuser
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <svg className="empty-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z"/>
                    </svg>
                    <h3>Aucun défi reçu</h3>
                    <p>Vous n'avez pas de défis en attente pour le moment</p>
                  </div>
                )
              ) : (
                sentChallenges.length > 0 ? (
                  sentChallenges.map((challenge) => (
                    <div key={challenge.id} className="user-card challenge-card">
                      <div className="user-avatar">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                      <div className="user-info">
                        <h3>{challenge.challenged.displayName || challenge.challenged.username}</h3>
                        <div className="challenge-meta">
                          <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                          <span>En attente de réponse</span>
                          <span className="stat-divider">•</span>
                          <span>{new Date(challenge.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                      <div className="button-group">
                        <button
                          className="btn btn-danger"
                          onClick={() => cancelChallenge(challenge.id)}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                          </svg>
                          Annuler
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <svg className="empty-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z"/>
                    </svg>
                    <h3>Aucun défi envoyé</h3>
                    <p>Défiez vos amis depuis l'onglet "Mes Amis" !</p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;
