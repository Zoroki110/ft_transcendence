// frontend_B/src/App.tsx - AVEC TOUTES LES ROUTES

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TournamentProvider } from './contexts/TournamentContext';
import { UserProvider } from './contexts/UserContext';
import Navigation from './components/Navigation';

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

import './App.css';

function App() {
  return (
    <UserProvider>
      <TournamentProvider>
        <Router>
          <div className="app">
            <Navigation />
            <main className="main-content">
              <Routes>
                {/* Pages publiques */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                
                {/* Tournois */}
                <Route path="/tournaments" element={<Tournaments />} />
                <Route path="/tournaments/:id" element={<TournamentDetail />} />
                <Route path="/create-tournament" element={<CreateTournament />} />
                
                {/* Jeu */}
                <Route path="/game/:gameId" element={<Game />} />
                
                {/* Utilisateur */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/history" element={<History />} />
                
                {/* Classement */}
                <Route path="/leaderboard" element={<Leaderboard />} />
              </Routes>
            </main>
          </div>
        </Router>
      </TournamentProvider>
    </UserProvider>
  );
}

export default App;