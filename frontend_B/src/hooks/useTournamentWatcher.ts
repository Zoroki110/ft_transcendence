// frontend_B/src/hooks/useTournamentWatcher.ts
import { useEffect, useRef } from 'react';
import { tournamentAPI } from '../services/api';
import { useTabSync } from './useTabSync';

interface TournamentStatus {
  id: number;
  status: string;
  lastChecked: number;
}

export const useTournamentWatcher = () => {
  const { notifyTournamentStarted, notifyForceRefresh } = useTabSync();
  const tournamentStatusCache = useRef<Map<number, TournamentStatus>>(new Map());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkTournamentUpdates = async () => {
    try {
      // Récupérer la liste des tournois
      const response = await tournamentAPI.getTournaments();
      console.log('🔍 TOURNAMENT WATCHER: Raw API response:', response.data);
      
      // L'API retourne probablement { tournaments: [...], total: number }
      const tournaments = response.data.tournaments || response.data;
      
      if (!Array.isArray(tournaments)) {
        console.warn('🔍 TOURNAMENT WATCHER: tournaments is not an array:', tournaments);
        return;
      }

      for (const tournament of tournaments) {
        const cached = tournamentStatusCache.current.get(tournament.id);
        
        if (cached) {
          // Si le statut a changé de 'FULL' ou 'OPEN' vers 'IN_PROGRESS'
          if (
            (cached.status === 'FULL' || cached.status === 'OPEN') && 
            tournament.status === 'IN_PROGRESS'
          ) {
            console.log(`🏆 TOURNAMENT WATCHER: Tournoi ${tournament.id} vient de démarrer !`);
            
            // Notifier tous les onglets
            notifyTournamentStarted(tournament.id);
            
            // Aussi forcer un refresh général
            notifyForceRefresh(`Tournoi ${tournament.id} démarré`);
          }
        }

        // Mettre à jour le cache
        tournamentStatusCache.current.set(tournament.id, {
          id: tournament.id,
          status: tournament.status,
          lastChecked: Date.now()
        });
      }
    } catch (error) {
      console.error('🏆 TOURNAMENT WATCHER: Erreur lors de la vérification:', error);
    }
  };

  useEffect(() => {
    // Vérifier immédiatement
    checkTournamentUpdates();

    // Puis vérifier toutes les 5 secondes
    intervalRef.current = setInterval(checkTournamentUpdates, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [notifyTournamentStarted, notifyForceRefresh]);

  return {
    forceCheck: checkTournamentUpdates,
  };
};

// Hook spécialisé pour surveiller un tournoi spécifique
export const useSpecificTournamentWatcher = (tournamentId: number) => {
  const { notifyTournamentStarted } = useTabSync();
  const lastStatusRef = useRef<string | null>(null);

  const checkTournamentStatus = async () => {
    try {
      const response = await tournamentAPI.getTournament(tournamentId);
      const tournament = response.data;

      if (
        lastStatusRef.current &&
        (lastStatusRef.current === 'FULL' || lastStatusRef.current === 'OPEN') &&
        tournament.status === 'IN_PROGRESS'
      ) {
        console.log(`🏆 SPECIFIC WATCHER: Tournoi ${tournamentId} vient de démarrer !`);
        notifyTournamentStarted(tournamentId);
      }

      lastStatusRef.current = tournament.status;
    } catch (error) {
      console.error(`🏆 SPECIFIC WATCHER: Erreur pour tournoi ${tournamentId}:`, error);
    }
  };

  useEffect(() => {
    const interval = setInterval(checkTournamentStatus, 3000); // Toutes les 3 secondes

    return () => clearInterval(interval);
  }, [tournamentId, notifyTournamentStarted]);

  return {
    checkStatus: checkTournamentStatus,
  };
};