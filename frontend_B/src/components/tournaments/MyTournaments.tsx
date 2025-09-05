// frontend_B/src/components/tournaments/MyTournaments.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { tournamentService } from '../../services/tournamentService';
import { Tournament } from '../../types/tournament';

const MyTournaments: React.FC = () => {
  const { t } = useTranslation();
  const [created, setCreated] = useState<Tournament[]>([]);
  const [participated, setParticipated] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('created');

  useEffect(() => {
    loadMyTournaments();
  }, []);

  const loadMyTournaments = async () => {
    try {
      const data = await tournamentService.getMyTournaments();
      setCreated(data.created || []);
      setParticipated(data.participated || []);
    } catch (error) {
      console.error('Erreur lors du chargement de mes tournois:', error);
    } finally {
      setLoading(false);
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

  const renderTournamentCard = (tournament: Tournament, isCreator: boolean = false) => (
    <div key={tournament.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">{tournament.name}</h3>
        <div className="flex space-x-2">
          {isCreator && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
              {t('tournaments.creator')}
            </span>
          )}
          <span className={`px-2 py-1 rounded text-xs text-white ${getStatusBadge(tournament.status)}`}>
            {t(`tournaments.status.${tournament.status.toLowerCase()}`)}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span>{t('tournaments.participants')}:</span>
          <span>{tournament.currentParticipants}/{tournament.maxParticipants}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>{t('tournaments.type')}:</span>
          <span>{tournament.type}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>{t('tournaments.created')}:</span>
          <span>{new Date(tournament.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <Link
        to={`/tournaments/${tournament.id}`}
        className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
      >
        {t('tournaments.view')}
      </Link>
    </div>
  );

  if (loading) return <div className="text-center py-8">{t('common.loading')}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('tournaments.myTournaments')}</h1>

      {/* Onglets */}
      <div className="border-b mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('created')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'created'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('tournaments.created')} ({created.length})
          </button>
          <button
            onClick={() => setActiveTab('participated')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'participated'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('tournaments.participated')} ({participated.length})
          </button>
        </nav>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'created' && (
        <div>
          {created.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">{t('tournaments.noCreatedTournaments')}</p>
              <Link
                to="/tournaments/create"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
              >
                {t('tournaments.createFirst')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {created.map(tournament => renderTournamentCard(tournament, true))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'participated' && (
        <div>
          {participated.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">{t('tournaments.noParticipatedTournaments')}</p>
              <Link
                to="/tournaments"
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg"
              >
                {t('tournaments.findTournaments')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {participated.map(tournament => renderTournamentCard(tournament, false))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyTournaments;