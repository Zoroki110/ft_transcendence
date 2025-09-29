// frontend_B/src/components/OnlineStatusManager.tsx - Composant pour gérer le statut en ligne globalement
import { useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const OnlineStatusManager: React.FC = () => {
  // Ce composant utilise le hook useOnlineStatus qui gère automatiquement
  // tous les événements de statut en ligne (focus, blur, beforeunload, etc.)
  useOnlineStatus();
  
  // Ce composant ne rend rien visuellement, il gère juste le statut
  return null;
};

export default OnlineStatusManager;