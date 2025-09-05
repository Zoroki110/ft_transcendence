// frontend_B/src/components/tournaments/TournamentDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { tournamentService } from '../../services/tournamentService';
import { Tournament } from '../../types/tournament';
import TournamentBrackets from './TournamentBrackets';
import TournamentParticipants from './TournamentParticipants';

const TournamentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      loadTournament(parseInt(id));
    }
  }, [id]);

  const loadTournament = async (tournamentId: number) => {
    try {
      const data = await tournamentService.getTournament(tournamentId);
      setTournament(data);
    } catch (error) {
      console.error('Erreur lors du chargement du tournoi:', error);
      navigate('/tournaments');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!tournament) return;
    
    try {
      await tournamentService.joinTournament(tournament.id);
      await loadTournament(tournament.id); // Recharger les données
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
    }
  };

  const handleLeave = async () => {
    if (!tournament) return;
    
    try {
      await tournamentService.leaveTournament(tournament.id);
      await loadTournament(tournament.id);
    } catch (error) {
      console.error('Erreur lors de la désinscription:', error);
    }
  };

  const handleGenerateBrackets = async () => {
    if (!tournament) return;
    
    try {
      await tournamentService.generateBrackets(tournament.id);
      await loadTournament(tournament.id);
      setActiveTab('brackets'); // Basculer vers l'onglet brackets
    } catch (error) {
      console.error('Erreur lors de la génération des brackets:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      DRAFT: 'bg-gray-500',
      OPEN: 'bg-green-500',
      FULL: 'bg-yellow-500',
      IN_PROGRESS: 'bg-blue-500',
      COMPLETED: 'bg-purple-500',
      CANCELLED: 'bg-red-500'
    };
    return statusColors[status] || 'bg-gray-500';
  };

  if (loading) return <div className="text-center py-8">{t('common.loading')}</div>;
  if (!tournament) return <div className="text-center py-8">{t('tournaments.notFound')}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold">{tournament.name}</h1>
            <p className="text-gray-600 mt-2">{tournament.description}</p>
          </div>
          <span className={`px-3 py-1 rounded text-sm text-white ${getStatusBadge(tournament.status)}`}>
            {t(`tournaments.status.${tournament.status.toLowerCase()}`)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-blue-600">{tournament.currentParticipants}</div>
            <div className="text-sm text-gray-600">{t('tournaments.participants')}</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-green-600">{tournament.maxParticipants}</div>
            <div className="text-sm text-gray-600">{t('tournaments.maxParticipants')}</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded">
            <div className="text-xl font-bold text-purple-600">{tournament.type}</div>
            <div className="text-sm text-gray-600">{t('tournaments.type')}</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded">
            <div className="text-xl font-bold text-orange-600">
              {tournament.bracketGenerated ? t('tournaments.started') : t('tournaments.notStarted')}
            </div>
            <div className="text-sm text-gray-600">{t('tournaments.status')}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          {tournament.status === 'OPEN' && !tournament.isFull && (
            <button
              onClick={handleJoin}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded"
            >
              {t('tournaments.join')}
            </button>
          )}
          
          {tournament.status === 'OPEN' && (
            <button
              onClick={handleLeave}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded"
            >
              {t('tournaments.leave')}
            </button>
          )}

          {tournament.canStart && !tournament.bracketGenerated && (
            <button
              onClick={handleGenerateBrackets}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
            >
              {t('tournaments.generateBrackets')}
            </button>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            >
              {t('tournaments.tabs.overview')}
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`px-6 py-3 ${activeTab === 'participants' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            >
              {t('tournaments.tabs.participants')}
            </button>
            {tournament.bracketGenerated && (
              <button
                onClick={() => setActiveTab('brackets')}
                className={`px-6 py-3 ${activeTab === 'brackets' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              >
                {t('tournaments.tabs.brackets')}
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('tournaments.overview')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">{t('tournaments.details')}</h4>
                  <ul className="space-y-1 text-sm">
                    <li><strong>{t('tournaments.type')}:</strong> {tournament.type}</li>
                    <li><strong>{t('tournaments.maxParticipants')}:</strong> {tournament.maxParticipants}</li>
                    <li><strong>{t('tournaments.status')}:</strong> {tournament.status}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">{t('tournaments.dates')}</h4>
                  <ul className="space-y-1 text-sm">
                    {tournament.registrationStart && (
                      <li><strong>{t('tournaments.registrationStart')}:</strong> {new Date(tournament.registrationStart).toLocaleString()}</li>
                    )}
                    {tournament.registrationEnd && (
                      <li><strong>{t('tournaments.registrationEnd')}:</strong> {new Date(tournament.registrationEnd).toLocaleString()}</li>
                    )}
                    {tournament.startDate && (
                      <li><strong>{t('tournaments.startDate')}:</strong> {new Date(tournament.startDate).toLocaleString()}</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'participants' && (
            <TournamentParticipants tournamentId={tournament.id} />
          )}

          {activeTab === 'brackets' && tournament.bracketGenerated && (
            <TournamentBrackets tournamentId={tournament.id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentDetail;