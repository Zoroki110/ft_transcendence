import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { storageService } from '../utils/storage';
import Notification from '../components/Notification';

interface NotificationData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface NotificationContextType {
  showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  notifications: NotificationData[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Connecter au WebSocket pour les notifications en temps réel
  useEffect(() => {
    const token = storageService.getToken();
    if (!token) return;

    const newSocket = io(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('📡 Notifications WebSocket connected');
    });

    newSocket.on('friendRequest', (data: { requesterName: string }) => {
      showNotification(`${data.requesterName} vous a envoyé une demande d'ami`, 'info');
      // Recharger le compteur de la navigation
      window.dispatchEvent(new CustomEvent('friendRequestReceived'));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, notifications }}>
      {children}
      <div className="notifications-container">
        {notifications.map((notif, index) => (
          <div key={notif.id} style={{ marginBottom: index > 0 ? '10px' : '0' }}>
            <Notification
              message={notif.message}
              type={notif.type}
              onClose={() => removeNotification(notif.id)}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
