// frontend_B/src/hooks/useTournamentPermissions.ts

import { useMemo } from 'react';
import { Tournament, User } from '../types';
import { getTournamentPermissions } from '../utils/tournamentPermissions';

// Réexporter le type pour la compatibilité
export type { TournamentPermissions } from '../utils/tournamentPermissions';

export function useTournamentPermissions(
  tournament: Tournament | null, 
  user: User | null,
  isLoggedIn: boolean
) {
  return useMemo(() => {
    return getTournamentPermissions(tournament, user, isLoggedIn);
  }, [tournament, user, isLoggedIn]);
}