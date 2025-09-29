// frontend_B/src/hooks/useOnlineStatus.ts - Hook pour gérer le statut en ligne dynamique
import { useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

export function useOnlineStatus() {
  const { user, setOnlineStatus } = useUser();

  // Marquer comme en ligne au montage du composant
  useEffect(() => {
    if (user) {
      setOnlineStatus(true);
    }
  }, [user, setOnlineStatus]);

  // Gérer les événements de visibilité de la page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (user) {
        const isOnline = !document.hidden;
        setOnlineStatus(isOnline);
      }
    };

    // Gérer la fermeture de la page/onglet
    const handleBeforeUnload = () => {
      if (user) {
        // Utiliser sendBeacon pour une requête asynchrone même si la page se ferme
        navigator.sendBeacon(
          `${import.meta.env.VITE_API_URL}/users/me/status/offline`,
          JSON.stringify({}),
        );
      }
    };

    // Gérer la perte de focus de la fenêtre
    const handleBlur = () => {
      if (user) {
        setTimeout(() => {
          if (document.hidden) {
            setOnlineStatus(false);
          }
        }, 5000); // Attendre 5 secondes avant de marquer comme hors ligne
      }
    };

    const handleFocus = () => {
      if (user) {
        setOnlineStatus(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, setOnlineStatus]);

  // Heartbeat pour maintenir le statut en ligne
  useEffect(() => {
    if (!user) return;

    const heartbeat = setInterval(() => {
      if (!document.hidden && user) {
        setOnlineStatus(true);
      }
    }, 30000); // Heartbeat toutes les 30 secondes

    return () => clearInterval(heartbeat);
  }, [user, setOnlineStatus]);

  return {
    isOnline: user?.isOnline || false,
    setOnline: () => setOnlineStatus(true),
    setOffline: () => setOnlineStatus(false)
  };
}