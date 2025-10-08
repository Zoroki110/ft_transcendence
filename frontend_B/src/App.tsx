// frontend_B/src/App.tsx - AVEC TOUTES LES ROUTES

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TournamentProvider } from './contexts/TournamentContext';
import { UserProvider } from './contexts/UserContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';
// import OnlineStatusManager from './components/OnlineStatusManager'; // ← DÉSACTIVÉ temporairement
import ProtectedRoute from './components/ProtectedRoute';
import TabSyncManager from './components/TabSyncManager';

// Pages
import Home from './pages/Home/Home';
import Tournaments from './pages/Tournaments/Tournaments';
import CreateTournament from './pages/CreatTournament/CreateTournament';
import TournamentDetail from './pages/TournamentDetail/TournamentDetail';
import TournamentBracketsPage from './pages/TournamentBrackets/TournamentBrackets';
import BracketsDemo from './components/TournamentBrackets/BracketsDemo';
import ManageTournament from './pages/ManageTournament/ManageTournament';
import Profile from './pages/Profile/Profile';
import Leaderboard from './pages/Leaderboard/Leaderboard';
import Game from './pages/Game/Game';
import GamesList from './pages/GamesList/GamesList';
import Matchmaking from './pages/Matchmaking/Matchmaking';
import Login from './pages/Login/Login';
import Settings from './pages/Settings/Settings';
import History from './pages/History/History';
import APITest from './pages/APITest/APITest';
import TestSignup from './pages/TestSignup';
import Friends from './pages/Friends/Friends';
import Challenges from './pages/Challenges/Challenges';
import Chat from './pages/Chat/Chat';

import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <NotificationProvider>
          <TournamentProvider>
            <Router>
              <div className="app">
                {/* <OnlineStatusManager /> */}
                <TabSyncManager />
                <Navigation />
                <main className="main-content">
                <Routes>
                {/* Pages publiques */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                
                {/* Tournois */}
                <Route path="/tournaments" element={<Tournaments />} />
                <Route path="/tournaments/:id" element={<TournamentDetail />} />
                <Route path="/tournaments/:id/brackets" element={<TournamentBracketsPage />} />
                <Route path="/tournaments/:id/manage" element={<ProtectedRoute><ManageTournament /></ProtectedRoute>} />
                <Route path="/create-tournament" element={<ProtectedRoute><CreateTournament /></ProtectedRoute>} />
                <Route path="/brackets-demo" element={<BracketsDemo />} />
                
                {/* Jeu */}
                <Route path="/matchmaking" element={<ProtectedRoute><GamesList /></ProtectedRoute>} />
                <Route path="/matchmaking/:gameId" element={<ProtectedRoute><Matchmaking /></ProtectedRoute>} />
                <Route path="/game/:gameId" element={<Game />} />
                
                {/* Utilisateur - Routes protégées */}
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/profile/:id" element={<Profile />} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />

                {/* Social - Routes protégées */}
                <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
                <Route path="/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
                <Route path="/chat/:userId?" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

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
        </NotificationProvider>
      </UserProvider>
    </ErrorBoundary>
  );
}

export default App;