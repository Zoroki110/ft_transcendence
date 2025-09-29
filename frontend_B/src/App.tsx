// frontend_B/src/App.tsx - AVEC TOUTES LES ROUTES

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TournamentProvider } from './contexts/TournamentContext';
import { UserProvider } from './contexts/UserContext';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';
// import OnlineStatusManager from './components/OnlineStatusManager'; // ← DÉSACTIVÉ temporairement
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home/Home';
import Tournaments from './pages/Tournaments/Tournaments';
import CreateTournament from './pages/CreatTournament/CreateTournament';
import TournamentDetail from './pages/TournamentDetail/TournamentDetail';
import Profile from './pages/Profile/Profile';
import Leaderboard from './pages/Leaderboard/Leaderboard';
import Game from './pages/Game/Game';
import Login from './pages/Login/Login';
import Settings from './pages/Settings/Settings';
import History from './pages/History/History';
import APITest from './pages/APITest/APITest';
import TestSignup from './pages/TestSignup';

import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <TournamentProvider>
          <Router>
            <div className="app">
              {/* <OnlineStatusManager /> */}
              <Navigation />
              <main className="main-content">
                <Routes>
                {/* Pages publiques */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                
                {/* Tournois */}
                <Route path="/tournaments" element={<Tournaments />} />
                <Route path="/tournaments/:id" element={<TournamentDetail />} />
                <Route path="/create-tournament" element={<ProtectedRoute><CreateTournament /></ProtectedRoute>} />
                
                {/* Jeu */}
                <Route path="/game" element={<ProtectedRoute><Game /></ProtectedRoute>} />
                <Route path="/game/:gameId" element={<Game />} />
                
                {/* Utilisateur - Routes protégées */}
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                
                {/* Classement */}
                <Route path="/leaderboard" element={<Leaderboard />} />

                {/* Page de test des APIs */}
                <Route path="/api-test" element={<APITest />} />
                <Route path="/test-signup" element={<TestSignup />} />
              </Routes>
            </main>
          </div>
        </Router>
      </TournamentProvider>
    </UserProvider>
    </ErrorBoundary>
  );
}

export default App;