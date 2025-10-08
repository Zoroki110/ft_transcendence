import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useUser } from '../contexts/UserContext';

const ChallengeNotificationManager = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    const socket: Socket = io(`${BACKEND_URL}/game`, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('🔔 Challenge notification socket connected');
      // Enregistrer l'utilisateur pour recevoir les notifications
      socket.emit('registerUser', { userId: user.id });
    });

    socket.on('challengeAccepted', (data: { gameId: string; gameUrl: string; opponentUsername: string; message: string }) => {
      console.log('🎮 Challenge accepted notification received:', data);

      // Afficher une notification à l'utilisateur (qui est déjà dans la room d'attente)
      alert(data.message);
      // Pas besoin de rediriger, l'utilisateur est déjà dans la room
      // Le jeu va automatiquement démarrer quand les deux joueurs sont connectés
    });

    socket.on('disconnect', () => {
      console.log('🔔 Challenge notification socket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [user, navigate]);

  return null; // Ce composant ne rend rien
};

export default ChallengeNotificationManager;
