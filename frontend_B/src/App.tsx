import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/layout/Navigation';
import Home from './pages/Home';
import TournamentList from './pages/tournaments/TournamentList';
import CreateTournament from './pages/tournaments/CreateTournament';
import MyTournaments from './components/layout/MyTournaments';
import Game from './components/layout/Game';
import Profile from './components/layout/Profile';
import { useTranslations } from './hooks/useTranslations';
import './styles/app.css';

function App() {
  const { t } = useTranslations();

  return (
    <Router>
      <div className="App">
        <Navigation />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/game" element={<Game />} />
            <Route path="/tournaments" element={<TournamentList />} />
            <Route path="/create-tournament" element={<CreateTournament />} />
            <Route path="/my-tournaments" element={<MyTournaments />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;