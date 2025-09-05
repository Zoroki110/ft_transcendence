import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TournamentList from './components/tournaments/TournamentList';
import CreateTournament from './components/tournaments/CreateTournament';
import TournamentDetail from './components/tournaments/TournamentDetail';
import MyTournaments from './components/tournaments/MyTournaments';

// Composant Home temporaire
const Home = () => (
  <div style={{ padding: '20px' }}>
    <h1>Accueil Transcendance</h1>
    <nav style={{ marginTop: '20px' }}>
      <a href="/tournaments" style={{ marginRight: '20px' }}>Tournois</a>
      <a href="/tournaments/create" style={{ marginRight: '20px' }}>Créer un tournoi</a>
      <a href="/tournaments/my">Mes tournois</a>
    </nav>
  </div>
);

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tournaments" element={<TournamentList />} />
          <Route path="/tournaments/create" element={<CreateTournament />} />
          <Route path="/tournaments/my" element={<MyTournaments />} />
          <Route path="/tournaments/:id" element={<TournamentDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
