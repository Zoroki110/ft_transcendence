// frontend_B/src/components/tournaments/TournamentParticipants.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { tournamentService } from '../../services/tournamentService';
import { User } from '../../types/tournament';

interface TournamentParticipantsProps {
  tournamentId: number;
}

const TournamentParticipants: React.FC<TournamentParticipantsProps> = ({ tournamentId }) => {
  const { t } = useTranslation();
  const [participants, setParticipants] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournamentName, setTournamentName] = useState('');
  const [count, setCount] = useState(0);
  const [maxParticipants, setMaxParticipants] = useState(0);

  useEffect(() => {
    loadParticipants();
  }, [tournamentId]);

  const loadParticipants = async () => {
    try {
      const data = await tournamentService.getParticipants(tournamentId);
      setParticipants(data.participants || []);
      setTournamentName(data.tournamentName || '');
      setCount(data.count || 0);
      setMaxParticipants(data.maxParticipants || 0);
    } catch (error) {
      console.error('Erreur lors du chargement des participants:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">{t('common.loading')}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">{t('tournaments.participants')}</h3>
        <span className="text-sm text-gray-600">
          {count}/{maxParticipants} {t('tournaments.registered')}
        </span>
      </div>

      {participants.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {t('tournaments.noParticipants')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {participants.map((participant, index) => (
            <div
              key={participant.id}
              className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg"
            >
              <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                {participant.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-medium">{participant.username}</div>
                <div className="text-sm text-gray-500">#{index + 1}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium mb-2">{t('tournaments.registrationInfo')}</h4>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${(count / maxParticipants) * 100}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {maxParticipants - count} {t('tournaments.spotsRemaining')}
        </p>
      </div>
    </div>
  );
};

export default TournamentParticipants;