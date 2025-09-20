import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { tournamentService } from '../../services/tournamentService';
import { Tournament } from '../../types';

const TournamentList: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const data = await tournamentService.getAllTournaments();
      setTournaments(data.tournaments);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Chargement des arènes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gradient mb-4">
          ⚔️ ARÈNES DE COMBAT
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          Choisissez votre bataille et prouvez votre valeur !
        </p>
        <Link to="/tournaments/create">
          <Button variant="primary" size="lg" icon="⚡" pulse>
            CRÉER NOUVELLE ARÈNE
          </Button>
        </Link>
      </div>

      {/* Grille des tournois */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tournaments.map(tournament => (
          <Card key={tournament.id} hover glow className="p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-white mb-2">{tournament.name}</h3>
              <p className="text-gray-400 text-sm">{tournament.description}</p>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Participants:</span>
                <span className="text-cyan-400">{tournament.currentParticipants}/{tournament.maxParticipants}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Type:</span>
                <span className="text-purple-400">{tournament.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Statut:</span>
                <span className={`${
                  tournament.status === 'OPEN' ? 'text-green-400' :
                  tournament.status === 'IN_PROGRESS' ? 'text-yellow-400' :
                  'text-gray-400'
                }`}>
                  {tournament.status}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Button variant="primary" className="w-full" icon="👁️">
                ENTRER DANS L'ARÈNE
              </Button>
              {tournament.status === 'OPEN' && (
                <Button variant="success" className="w-full" icon="⚡">
                  REJOINDRE LE COMBAT
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TournamentList;
