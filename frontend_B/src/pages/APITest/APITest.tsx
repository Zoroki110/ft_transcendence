// frontend_B/src/pages/APITest/APITest.tsx - PAGE DE TEST DES APIS

import React, { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useTournaments } from '../../hooks/useTournaments';
import { useFriends, useUserSearch, useDashboard } from '../../hooks/useAPI';
import { authAPI, userAPI, tournamentAPI, gameAPI, healthAPI } from '../../services/api';

export default function APITest() {
  const { user, stats, isLoggedIn, login, register, logout } = useUser();
  const { tournaments, loading: tournamentsLoading, error: tournamentsError } = useTournaments();
  const { friends, loading: friendsLoading } = useFriends();
  const { data: dashboardData, loading: dashboardLoading } = useDashboard();
  const { searchResults, search, loading: searchLoading } = useUserSearch();

  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [activeTest, setActiveTest] = useState<string | null>(null);

  // Fonction utilitaire pour afficher les résultats de test
  const logTest = (testName: string, result: any, error?: any) => {
    const testResult = {
      success: !error,
      data: result,
      error: error?.message || error,
      timestamp: new Date().toISOString()
    };

    setTestResults(prev => ({
      ...prev,
      [testName]: testResult
    }));

    console.log(`🧪 Test ${testName}:`, testResult);
  };

  // Tests des APIs
  const testHealthAPI = async () => {
    setActiveTest('health');
    try {
      const result = await healthAPI.check();
      logTest('Health Check', result.data);
    } catch (error) {
      logTest('Health Check', null, error);
    } finally {
      setActiveTest(null);
    }
  };

  const testUserAPIs = async () => {
    setActiveTest('users');
    try {
      // Test get all users
      const allUsers = await userAPI.getAllUsers();
      logTest('Get All Users', allUsers.data);

      if (user) {
        // Test get user profile
        const profile = await userAPI.getUserProfile(user.id);
        logTest('Get User Profile', profile.data);

        // Test get user stats
        const userStats = await userAPI.getUserStats(user.id);
        logTest('Get User Stats', userStats.data);
      }
    } catch (error) {
      logTest('User APIs', null, error);
    } finally {
      setActiveTest(null);
    }
  };

  const testTournamentAPIs = async () => {
    setActiveTest('tournaments');
    try {
      // Test get tournaments
      const tournamentsList = await tournamentAPI.getTournaments();
      logTest('Get Tournaments', tournamentsList.data);

      if (tournamentsList.data.tournaments.length > 0) {
        const firstTournament = tournamentsList.data.tournaments[0];

        // Test get specific tournament
        const tournament = await tournamentAPI.getTournament(firstTournament.id);
        logTest('Get Tournament Detail', tournament.data);

        // Test get participants
        const participants = await tournamentAPI.getParticipants(firstTournament.id);
        logTest('Get Participants', participants.data);
      }
    } catch (error) {
      logTest('Tournament APIs', null, error);
    } finally {
      setActiveTest(null);
    }
  };

  const testGameAPIs = async () => {
    setActiveTest('games');
    try {
      // Test get matches
      const matches = await gameAPI.getMatches();
      logTest('Get Matches', matches.data);

      if (matches.data.length > 0) {
        // Test get specific match
        const match = await gameAPI.getMatch(matches.data[0].id);
        logTest('Get Match Detail', match.data);
      }
    } catch (error) {
      logTest('Game APIs', null, error);
    } finally {
      setActiveTest(null);
    }
  };

  const testSearchAPI = async () => {
    setActiveTest('search');
    try {
      await search('test');
      logTest('Search Users', searchResults);
    } catch (error) {
      logTest('Search API', null, error);
    } finally {
      setActiveTest(null);
    }
  };

  const createTestTournament = async () => {
    setActiveTest('create-tournament');
    try {
      const tournamentData = {
        name: `Test Tournament ${Date.now()}`,
        description: 'Tournament créé pour tester l\'API',
        type: 'single_elimination' as const,
        maxParticipants: 8,
        isPublic: true
      };

      const result = await tournamentAPI.createTournament(tournamentData);
      logTest('Create Tournament', result.data);
    } catch (error) {
      logTest('Create Tournament', null, error);
    } finally {
      setActiveTest(null);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🧪 Test des APIs Backend</h1>

      {/* État de connexion */}
      <div style={{ background: '#f0f0f0', padding: '15px', marginBottom: '20px', borderRadius: '5px' }}>
        <h2>État de connexion</h2>
        <p><strong>Connecté:</strong> {isLoggedIn ? '✅ Oui' : '❌ Non'}</p>
        {user && (
          <div>
            <p><strong>Utilisateur:</strong> {user.username} ({user.email})</p>
            <p><strong>ID:</strong> {user.id}</p>
            {stats && (
              <p><strong>Stats:</strong> {stats.gamesWon}W / {stats.gamesLost}L</p>
            )}
          </div>
        )}
      </div>

      {/* Données chargées automatiquement */}
      <div style={{ background: '#e8f4fd', padding: '15px', marginBottom: '20px', borderRadius: '5px' }}>
        <h2>Données chargées automatiquement</h2>

        <div style={{ marginBottom: '10px' }}>
          <strong>Tournois:</strong> {tournamentsLoading ? 'Chargement...' : `${tournaments.length} tournois`}
          {tournamentsError && <span style={{ color: 'red' }}> - Erreur: {tournamentsError}</span>}
        </div>

        <div style={{ marginBottom: '10px' }}>
          <strong>Amis:</strong> {friendsLoading ? 'Chargement...' : `${friends.length} amis`}
        </div>

        <div style={{ marginBottom: '10px' }}>
          <strong>Dashboard:</strong> {dashboardLoading ? 'Chargement...' : dashboardData ? 'Chargé' : 'Pas de données'}
        </div>
      </div>

      {/* Boutons de test */}
      <div style={{ marginBottom: '20px' }}>
        <h2>Tests manuels</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
          <button
            onClick={testHealthAPI}
            disabled={activeTest === 'health'}
            style={{ padding: '8px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            {activeTest === 'health' ? 'Test en cours...' : 'Test Health API'}
          </button>

          <button
            onClick={testUserAPIs}
            disabled={activeTest === 'users'}
            style={{ padding: '8px 15px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            {activeTest === 'users' ? 'Test en cours...' : 'Test User APIs'}
          </button>

          <button
            onClick={testTournamentAPIs}
            disabled={activeTest === 'tournaments'}
            style={{ padding: '8px 15px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            {activeTest === 'tournaments' ? 'Test en cours...' : 'Test Tournament APIs'}
          </button>

          <button
            onClick={testGameAPIs}
            disabled={activeTest === 'games'}
            style={{ padding: '8px 15px', backgroundColor: '#9C27B0', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            {activeTest === 'games' ? 'Test en cours...' : 'Test Game APIs'}
          </button>

          <button
            onClick={testSearchAPI}
            disabled={activeTest === 'search'}
            style={{ padding: '8px 15px', backgroundColor: '#607D8B', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            {activeTest === 'search' ? 'Test en cours...' : 'Test Search API'}
          </button>

          <button
            onClick={createTestTournament}
            disabled={activeTest === 'create-tournament' || !isLoggedIn}
            style={{ padding: '8px 15px', backgroundColor: '#F44336', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            {activeTest === 'create-tournament' ? 'Création...' : 'Créer Tournament Test'}
          </button>
        </div>
      </div>

      {/* Résultats des tests */}
      <div>
        <h2>Résultats des tests</h2>
        {Object.keys(testResults).length === 0 ? (
          <p>Aucun test effectué</p>
        ) : (
          <div>
            {Object.entries(testResults).map(([testName, result]) => (
              <div
                key={testName}
                style={{
                  background: result.success ? '#d4edda' : '#f8d7da',
                  border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
                  padding: '10px',
                  marginBottom: '10px',
                  borderRadius: '4px'
                }}
              >
                <h4>{result.success ? '✅' : '❌'} {testName}</h4>
                <p><strong>Temps:</strong> {new Date(result.timestamp).toLocaleTimeString()}</p>

                {result.success ? (
                  <details>
                    <summary>Voir les données (cliquer pour développer)</summary>
                    <pre style={{ background: '#f8f9fa', padding: '10px', overflow: 'auto', maxHeight: '200px' }}>
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                ) : (
                  <div style={{ color: '#721c24' }}>
                    <strong>Erreur:</strong> {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Console de développement */}
      <div style={{ marginTop: '30px', background: '#1e1e1e', color: '#fff', padding: '15px', borderRadius: '5px' }}>
        <h3>💻 Console</h3>
        <p>Ouvrez la console de développement (F12) pour voir les logs détaillés des tests.</p>
        <p>Les résultats s'affichent également ci-dessus avec le préfixe "🧪 Test"</p>
      </div>
    </div>
  );
}