// frontend_B/src/App.tsx - AVEC USERPROVIDER AJOUTÉ

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TournamentProvider } from './contexts/TournamentContext';
import { UserProvider } from './contexts/UserContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Tournaments from './pages/Tournaments';
import CreateTournament from './pages/CreateTournament';
import TournamentDetail from './pages/TournamentDetail';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
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
                <Route path="/" element={<Home />} />
                <Route path="/tournaments" element={<Tournaments />} />
                <Route path="/tournaments/:id" element={<TournamentDetail />} />
                <Route path="/create-tournament" element={<CreateTournament />} />
                <Route path="/profile" element={<Profile />} />
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