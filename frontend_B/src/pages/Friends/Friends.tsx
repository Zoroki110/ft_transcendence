import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
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

const Friends: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'friends') {
      loadFriends();
    } else if (activeTab === 'requests') {
      loadPendingRequests();
    }
  }, [activeTab]);

  // Recharger les requests périodiquement pour détecter les nouvelles demandes
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
    }, 5000); // Toutes les 5 secondes

    return () => clearInterval(interval);
  }, [activeTab]);

  // Écouter l'événement de nouvelle demande d'ami
  useEffect(() => {
    const handleFriendRequestReceived = () => {
      loadPendingRequests();
    };

    window.addEventListener('friendRequestReceived', handleFriendRequestReceived);
    return () => window.removeEventListener('friendRequestReceived', handleFriendRequestReceived);
  }, []);

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

  return (
    <div className="friends-page">
      <h1>Friends</h1>

      <div className="tabs">
        <button
          className={activeTab === 'friends' ? 'active' : ''}
          onClick={() => setActiveTab('friends')}
        >
          My Friends ({friends.length})
        </button>
        <button
          className={activeTab === 'requests' ? 'active' : ''}
          onClick={() => setActiveTab('requests')}
        >
          Requests ({pendingRequests.length})
        </button>
        <button
          className={activeTab === 'search' ? 'active' : ''}
          onClick={() => setActiveTab('search')}
        >
          Search Users
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {activeTab === 'search' && (
        <div className="search-section">
          <input
            type="text"
            className="search-input"
            placeholder="Search users by username..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />

          <div className="user-list">
            {loading ? (
              <p>Searching...</p>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => (
                <div key={user.id} className="user-card">
                  <div className="user-info">
                    <h3>{user.displayName || user.username}</h3>
                    <p className="stats">
                      🏆 {user.gamesWon || 0} victoires • ❌ {user.gamesLost || 0} défaites
                    </p>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => sendFriendRequest(user.id)}
                  >
                    👥 Ajouter ami
                  </button>
                </div>
              ))
            ) : searchQuery.length >= 2 ? (
              <p>No users found</p>
            ) : null}
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="requests-section">
          {loading ? (
            <p>Loading...</p>
          ) : pendingRequests.length > 0 ? (
            pendingRequests.map((request) => (
              <div key={request.id} className="user-card">
                <div className="user-info">
                  <h3>{request.requester.displayName || request.requester.username}</h3>
                  <p className="request-date">
                    📅 Envoyée le {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="button-group">
                  <button
                    className="btn-success"
                    onClick={() => acceptFriendRequest(request.id)}
                  >
                    ✓ Accepter
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => rejectFriendRequest(request.id)}
                  >
                    ✕ Refuser
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No pending friend requests</p>
          )}
        </div>
      )}

      {activeTab === 'friends' && (
        <div className="friends-section">
          {loading ? (
            <p>Loading...</p>
          ) : friends.length > 0 ? (
            friends.map((friend) => (
              <div key={friend.id} className="user-card">
                <div className="user-info">
                  <h3>{friend.displayName || friend.username}</h3>
                  <p className="stats">
                    🏆 {friend.gamesWon || 0} victoires • ❌ {friend.gamesLost || 0} défaites
                  </p>
                </div>
                <div className="button-group">
                  <button className="btn-primary" onClick={() => navigate(`/profile/${friend.id}`)}>
                    👤 Profil
                  </button>
                  <button className="btn-warning" onClick={() => navigate(`/challenges?user=${friend.id}`)}>
                    ⚔️ Défier
                  </button>
                  <button className="btn-info" onClick={() => navigate(`/chat/${friend.id}`)}>
                    💬 Message
                  </button>
                  <button className="btn-danger" onClick={() => removeFriend(friend.id)}>
                    🗑️ Retirer
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No friends yet. Search for users to add friends!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Friends;
