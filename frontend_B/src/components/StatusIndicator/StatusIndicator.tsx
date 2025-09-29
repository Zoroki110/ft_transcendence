// frontend_B/src/components/StatusIndicator/StatusIndicator.tsx
import React from 'react';
import { useUser } from '../../contexts/UserContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import './StatusIndicator.css';

interface StatusIndicatorProps {
  userId?: number;
  username?: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  userId, 
  username, 
  size = 'medium', 
  showLabel = false 
}) => {
  const { user } = useUser();
  const { isOnline } = useOnlineStatus();
  
  // Si c'est pour l'utilisateur actuel, utiliser le statut du contexte
  const isCurrentUser = !userId || userId === user?.id;
  const displayStatus = isCurrentUser ? isOnline : false; // TODO: récupérer le statut des autres users
  const displayName = username || user?.username || 'Utilisateur';

  return (
    <div className={`status-indicator status-indicator-${size}`}>
      <div className={`status-dot ${displayStatus ? 'online' : 'offline'}`}>
        {displayStatus ? '🟢' : '⚫'}
      </div>
      {showLabel && (
        <span className="status-label">
          {displayStatus ? 'En ligne' : 'Hors ligne'}
        </span>
      )}
    </div>
  );
};

export default StatusIndicator;