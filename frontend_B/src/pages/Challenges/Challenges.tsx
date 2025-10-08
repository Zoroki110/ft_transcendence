import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import './Challenges.css';

interface User {
  id: number;
  username: string;
  displayName?: string;
  avatar?: string;
  isOnline: boolean;
}

interface Challenge {
  id: number;
  challenger: User;
  challenged: User;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  message?: string;
  createdAt: string;
  matchId?: number;
}

const Challenges: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preSelectedUserId = searchParams.get('user');

  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'history'>('received');
  const [receivedChallenges, setReceivedChallenges] = useState<Challenge[]>([]);
  const [sentChallenges, setSentChallenges] = useState<Challenge[]>([]);
  const [challengeHistory, setChallengeHistory] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New challenge modal
  const [showNewChallengeModal, setShowNewChallengeModal] = useState(!!preSelectedUserId);
  const [challengeUserId, setChallengeUserId] = useState(preSelectedUserId || '');
  const [challengeMessage, setChallengeMessage] = useState('');

  useEffect(() => {
    loadChallenges();
  }, [activeTab]);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      let endpoint = '';

      if (activeTab === 'received') {
        endpoint = '/challenges/received';
      } else if (activeTab === 'sent') {
        endpoint = '/challenges/sent';
      } else {
        endpoint = '/challenges/history';
      }

      const response = await api.get(endpoint);

      if (activeTab === 'received') {
        setReceivedChallenges(response.data);
      } else if (activeTab === 'sent') {
        setSentChallenges(response.data);
      } else {
        setChallengeHistory(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const sendChallenge = async () => {
    if (!challengeUserId) {
      alert('Please enter a user ID');
      return;
    }

    try {
      const response = await api.post('/challenges', {
        challengedId: parseInt(challengeUserId),
        message: challengeMessage || undefined,
      });

      // Si le backend retourne un gameId, rediriger vers la room d'attente
      if (response.data && response.data.gameId) {
        const gameId = response.data.gameId;
        alert('Challenge sent! Redirecting to waiting room...');
        window.location.href = `/game/${gameId}`;
      } else {
        alert('Challenge sent!');
        setShowNewChallengeModal(false);
        setChallengeUserId('');
        setChallengeMessage('');
        setActiveTab('sent');
        loadChallenges();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send challenge');
    }
  };

  const acceptChallenge = async (challengeId: number) => {
    try {
      const response = await api.patch(`/challenges/${challengeId}/respond`, { accept: true });

      // Si le backend retourne un gameId, rediriger vers le jeu
      if (response.data && response.data.gameId) {
        const gameId = response.data.gameId;
        alert('Challenge accepted! Redirecting to game...');
        window.location.href = `/game/${gameId}`;
      } else {
        alert('Challenge accepted! Match will be created.');
        loadChallenges();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept challenge');
    }
  };

  const declineChallenge = async (challengeId: number) => {
    try {
      await api.patch(`/challenges/${challengeId}/respond`, { accept: false });
      loadChallenges();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to decline challenge');
    }
  };

  const cancelChallenge = async (challengeId: number) => {
    if (!confirm('Are you sure you want to cancel this challenge?')) return;

    try {
      await api.delete(`/challenges/${challengeId}`);
      loadChallenges();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel challenge');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'badge-warning';
      case 'accepted':
        return 'badge-success';
      case 'declined':
      case 'cancelled':
        return 'badge-danger';
      case 'completed':
        return 'badge-info';
      default:
        return '';
    }
  };

  return (
    <div className="challenges-page">
      <div className="challenges-header">
        <h1>Challenges</h1>
        <button className="btn-primary" onClick={() => setShowNewChallengeModal(true)}>
          + New Challenge
        </button>
      </div>

      <div className="tabs">
        <button
          className={activeTab === 'received' ? 'active' : ''}
          onClick={() => setActiveTab('received')}
        >
          Received ({receivedChallenges.length})
        </button>
        <button
          className={activeTab === 'sent' ? 'active' : ''}
          onClick={() => setActiveTab('sent')}
        >
          Sent ({sentChallenges.length})
        </button>
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="challenges-content">
        {loading ? (
          <p>Loading...</p>
        ) : activeTab === 'received' ? (
          receivedChallenges.length > 0 ? (
            receivedChallenges.map((challenge) => (
              <div key={challenge.id} className="challenge-card">
                <div className="challenge-info">
                  <img
                    src={challenge.challenger.avatar || '/default-avatar.png'}
                    alt={challenge.challenger.username}
                    className="user-avatar"
                  />
                  <div>
                    <h3>
                      {challenge.challenger.displayName || challenge.challenger.username}
                    </h3>
                    <p className="challenge-date">
                      {new Date(challenge.createdAt).toLocaleDateString()}
                    </p>
                    {challenge.message && (
                      <p className="challenge-message">"{challenge.message}"</p>
                    )}
                  </div>
                </div>
                <div className="challenge-actions">
                  <button
                    className="btn-success"
                    onClick={() => acceptChallenge(challenge.id)}
                  >
                    Accept
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => declineChallenge(challenge.id)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-state">No pending challenges received</p>
          )
        ) : activeTab === 'sent' ? (
          sentChallenges.length > 0 ? (
            sentChallenges.map((challenge) => (
              <div key={challenge.id} className="challenge-card">
                <div className="challenge-info">
                  <img
                    src={challenge.challenged.avatar || '/default-avatar.png'}
                    alt={challenge.challenged.username}
                    className="user-avatar"
                  />
                  <div>
                    <h3>
                      Challenge to {challenge.challenged.displayName || challenge.challenged.username}
                    </h3>
                    <p className="challenge-date">
                      Sent {new Date(challenge.createdAt).toLocaleDateString()}
                    </p>
                    {challenge.message && (
                      <p className="challenge-message">"{challenge.message}"</p>
                    )}
                  </div>
                </div>
                <div className="challenge-actions">
                  <span className={`badge ${getStatusBadgeClass(challenge.status)}`}>
                    {challenge.status}
                  </span>
                  <button
                    className="btn-danger"
                    onClick={() => cancelChallenge(challenge.id)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-state">No sent challenges</p>
          )
        ) : (
          challengeHistory.length > 0 ? (
            challengeHistory.map((challenge) => (
              <div key={challenge.id} className="challenge-card history">
                <div className="challenge-info">
                  <div>
                    <h3>
                      {challenge.challenger.displayName || challenge.challenger.username} vs{' '}
                      {challenge.challenged.displayName || challenge.challenged.username}
                    </h3>
                    <p className="challenge-date">
                      {new Date(challenge.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`badge ${getStatusBadgeClass(challenge.status)}`}>
                  {challenge.status}
                </span>
              </div>
            ))
          ) : (
            <p className="empty-state">No challenge history</p>
          )
        )}
      </div>

      {showNewChallengeModal && (
        <div className="modal-overlay" onClick={() => setShowNewChallengeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Send Challenge</h2>
            <div className="form-group">
              <label>User ID to Challenge:</label>
              <input
                type="number"
                className="form-input"
                value={challengeUserId}
                onChange={(e) => setChallengeUserId(e.target.value)}
                placeholder="Enter user ID"
              />
            </div>
            <div className="form-group">
              <label>Message (optional):</label>
              <textarea
                className="form-input"
                value={challengeMessage}
                onChange={(e) => setChallengeMessage(e.target.value)}
                placeholder="Add a message with your challenge..."
                rows={3}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={sendChallenge}>
                Send Challenge
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowNewChallengeModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Challenges;
