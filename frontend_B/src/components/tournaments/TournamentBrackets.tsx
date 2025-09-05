// frontend_B/src/components/tournaments/TournamentBrackets.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { tournamentService } from '../../services/tournamentService';
import { Match } from '../../types/tournament';

interface TournamentBracketsProps {
  tournamentId: number;
}

const TournamentBrackets: React.FC<TournamentBracketsProps> = ({ tournamentId }) => {
  const { t } = useTranslation();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBrackets();
  }, [tournamentId]);

  const loadBrackets = async () => {
    try {
      const data = await tournamentService.getBrackets(tournamentId);
      setMatches(data.matches || []);
    } catch (error) {
      console.error('Erreur lors du chargement des brackets:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupMatchesByRound = (matches: Match[]) => {
    return matches.reduce((acc, match) => {
      const round = match.round;
      if (!acc[round]) acc[round] = [];
      acc[round].push(match);
      return acc;
    }, {} as Record<number, Match[]>);
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'border-gray-300 bg-gray-50';
      case 'in_progress': return 'border-yellow-400 bg-yellow-50';
      case 'finished': return 'border-green-400 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  if (loading) return <div className="text-center py-8">{t('common.loading')}</div>;

  const roundsData = groupMatchesByRound(matches);
  const rounds = Object.keys(roundsData).map(Number).sort((a, b) => a - b);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-6">{t('tournaments.brackets')}</h3>
      
      {rounds.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {t('tournaments.noBrackets')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex space-x-8 min-w-full">
            {rounds.map(round => (
              <div key={round} className="flex-shrink-0">
                <h4 className="text-center font-medium mb-4 text-lg">
                  {round === Math.max(...rounds) ? t('tournaments.final') : `${t('tournaments.round')} ${round}`}
                </h4>
                
                <div className="space-y-4">
                  {roundsData[round].map(match => (
                    <div
                      key={match.id}
                      className={`w-64 p-4 rounded-lg border-2 transition-all ${getMatchStatusColor(match.status)}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-gray-600">
                          Match #{match.bracketPosition + 1}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          match.status === 'finished' ? 'bg-green-100 text-green-800' :
                          match.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {t(`tournaments.matchStatus.${match.status}`)}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className={`flex justify-between items-center p-2 rounded ${
                          match.status === 'finished' && match.player1Score > match.player2Score 
                            ? 'bg-green-200 font-semibold' : 'bg-white'
                        }`}>
                          <span className="truncate">{match.player1 || 'TBD'}</span>
                          <span className="font-bold">{match.player1Score || 0}</span>
                        </div>
                        
                        <div className="text-center text-xs text-gray-500">VS</div>
                        
                        <div className={`flex justify-between items-center p-2 rounded ${
                          match.status === 'finished' && match.player2Score > match.player1Score 
                            ? 'bg-green-200 font-semibold' : 'bg-white'
                        }`}>
                          <span className="truncate">{match.player2 || 'TBD'}</span>
                          <span className="font-bold">{match.player2Score || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentBrackets;