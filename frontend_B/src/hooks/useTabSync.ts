// frontend_B/src/hooks/useTabSync.ts
import { useEffect, useCallback } from 'react';
import { tabSync, TabSyncEvents } from '../utils/tabSync';

export const useTabSync = () => {
  // Hook pour écouter les événements de tournoi
  const onTournamentStarted = useCallback((callback: (tournamentId: number) => void) => {
    return tabSync.on(TabSyncEvents.TOURNAMENT_STARTED, (data) => {
      callback(data.tournamentId);
    });
  }, []);

  // Hook pour écouter les lancements de jeu
  const onGameStarted = useCallback((callback: (gameId: string) => void) => {
    return tabSync.on(TabSyncEvents.GAME_STARTED, (data) => {
      callback(data.gameId);
    });
  }, []);

  // Hook pour écouter les demandes de refresh
  const onForceRefresh = useCallback((callback: (reason?: string) => void) => {
    return tabSync.on(TabSyncEvents.FORCE_REFRESH, (data) => {
      callback(data?.reason);
    });
  }, []);

  // Hook pour écouter les mises à jour de stats
  const onRefreshStats = useCallback((callback: (userId?: number) => void) => {
    return tabSync.on(TabSyncEvents.REFRESH_STATS, (data) => {
      callback(data?.userId);
    });
  }, []);

  // Méthodes pour envoyer des notifications
  const notifyTournamentStarted = useCallback((tournamentId: number) => {
    tabSync.notifyTournamentStarted(tournamentId);
  }, []);

  const notifyGameStarted = useCallback((gameId: string) => {
    tabSync.notifyGameStarted(gameId);
  }, []);

  const notifyForceRefresh = useCallback((reason?: string) => {
    tabSync.notifyForceRefresh(reason);
  }, []);

  const notifyRefreshStats = useCallback((userId?: number) => {
    tabSync.notifyRefreshStats(userId);
  }, []);

  return {
    // Listeners
    onTournamentStarted,
    onGameStarted,
    onForceRefresh,
    onRefreshStats,
    // Notifiers
    notifyTournamentStarted,
    notifyGameStarted,
    notifyForceRefresh,
    notifyRefreshStats,
  };
};

// Hook spécialisé pour l'auto-refresh sur les événements de tournoi
export const useTournamentAutoRefresh = () => {
  const { onTournamentStarted, onForceRefresh } = useTabSync();

  useEffect(() => {
    // S'abonner aux événements de tournoi
    const unsubscribeTournament = onTournamentStarted((tournamentId) => {
      console.log(`🏆 AUTO-REFRESH: Tournoi ${tournamentId} démarré, rechargement de la page...`);
      
      // Afficher une notification à l'utilisateur
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🏆 Tournoi Démarré !', {
          body: `Le tournoi ${tournamentId} vient de commencer. La page va se recharger.`,
          icon: '/favicon.ico',
        });
      }

      // Attendre 2 secondes puis recharger
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    });

    // S'abonner aux demandes de refresh forcé
    const unsubscribeRefresh = onForceRefresh((reason) => {
      console.log(`🔄 FORCE-REFRESH: ${reason || 'Raison non spécifiée'}`);
      
      // Attendre 1 seconde puis recharger
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    });

    // Nettoyer les abonnements
    return () => {
      unsubscribeTournament();
      unsubscribeRefresh();
    };
  }, [onTournamentStarted, onForceRefresh]);
};

// Hook pour la synchronisation des stats entre onglets
export const useStatsSync = (userId?: number) => {
  const { onRefreshStats, notifyRefreshStats } = useTabSync();

  useEffect(() => {
    const unsubscribe = onRefreshStats((targetUserId) => {
      // Si aucun userId spécifique ou si c'est notre utilisateur
      if (!targetUserId || targetUserId === userId) {
        console.log(`📊 STATS-SYNC: Rafraîchissement des stats pour userId=${targetUserId || 'all'}`);
        
        // Déclencher un événement personnalisé pour que les composants puissent réagir
        window.dispatchEvent(new CustomEvent('refreshStats', { 
          detail: { userId: targetUserId } 
        }));
      }
    });

    return unsubscribe;
  }, [userId, onRefreshStats]);

  return {
    triggerStatsRefresh: notifyRefreshStats,
  };
};