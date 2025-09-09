import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { useTranslations } from './hooks/useTranslations';

// Import des pages (à créer)
import Home from './pages/Home';
import TournamentList from './pages/tournaments/TournamentList';
import CreateTournament from './pages/tournaments/CreateTournament';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tournaments" element={<TournamentList />} />
          <Route path="/tournaments/create" element={<CreateTournament />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
