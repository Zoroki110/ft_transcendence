// frontend_B/src/components/TabSyncManager.tsx
import React, { useEffect } from 'react';
import { useTournamentAutoRefresh, useStatsSync } from '../hooks/useTabSync';
import { useTournamentWatcher } from '../hooks/useTournamentWatcher';
import { useUser } from '../contexts/UserContext';

const TabSyncManager: React.FC = () => {
  const { user } = useUser();
  
  // Active l'auto-refresh pour les tournois
  useTournamentAutoRefresh();
  
  // Active la synchronisation des stats
  useStatsSync(user?.id);
  
  // Active la surveillance des tournois
  useTournamentWatcher();

  // Demander la permission pour les notifications
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Notifications permission:', permission);
      });
    }
  }, []);

  return null; // Ce composant est invisible, il gère juste la logique
};

export default TabSyncManager;