import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config';

class SocketService {
  private gameSocket: Socket | null = null;

  // Connexion au namespace /game pour les lobbys
  connectToGame(): Socket {
    if (!this.gameSocket) {
      const token = localStorage.getItem('access_token');
      this.gameSocket = io(`${API_CONFIG.BASE_URL}/game`, {
        auth: {
          token
        }
      });

      this.gameSocket.on('connect', () => {
        console.log('🔌 Connected to game WebSocket');
      });

      this.gameSocket.on('disconnect', () => {
        console.log('🔌 Disconnected from game WebSocket');
      });

      this.gameSocket.on('error', (error) => {
        console.error('🔌 WebSocket error:', error);
      });
    }

    return this.gameSocket;
  }

  // Rejoindre un lobby WebSocket
  joinLobby(lobbyId: string, userId: number, username: string) {
    const socket = this.connectToGame();
    console.log(`🏓 Joining WebSocket lobby: ${lobbyId}`);
    
    socket.emit('joinLobby', {
      lobbyId,
      userId,
      username
    });
  }

  // Quitter un lobby WebSocket
  leaveLobby(lobbyId: string, userId: number, username: string) {
    if (this.gameSocket) {
      console.log(`🏓 Leaving WebSocket lobby: ${lobbyId}`);
      
      this.gameSocket.emit('leaveLobby', {
        lobbyId,
        userId,
        username
      });
    }
  }

  // Écouter les événements de lobby
  onLobbyComplete(callback: (data: { lobbyId: string; gameUrl: string; message: string }) => void) {
    const socket = this.connectToGame();
    socket.on('lobbyComplete', callback);
  }

  onLobbyPlayerConnected(callback: (data: { userId: number; username: string; message: string }) => void) {
    const socket = this.connectToGame();
    socket.on('lobbyPlayerConnected', callback);
  }

  onLobbyPlayerDisconnected(callback: (data: { userId: number; username: string; message: string }) => void) {
    const socket = this.connectToGame();
    socket.on('lobbyPlayerDisconnected', callback);
  }

  // Nettoyer les event listeners
  offLobbyEvents() {
    if (this.gameSocket) {
      this.gameSocket.off('lobbyComplete');
      this.gameSocket.off('lobbyPlayerConnected'); 
      this.gameSocket.off('lobbyPlayerDisconnected');
    }
  }

  // === TOURNAMENT EVENTS ===

  // Rejoindre un tournoi WebSocket
  joinTournament(tournamentId: number, userId: number, username: string) {
    const socket = this.connectToGame();
    console.log(`🏆 Joining WebSocket tournament: ${tournamentId}`);
    
    socket.emit('joinTournament', {
      tournamentId,
      userId,
      username
    });
  }

  // Quitter un tournoi WebSocket
  leaveTournament(tournamentId: number, userId: number, username: string) {
    if (this.gameSocket) {
      console.log(`🏆 Leaving WebSocket tournament: ${tournamentId}`);
      
      this.gameSocket.emit('leaveTournament', {
        tournamentId,
        userId,
        username
      });
    }
  }

  // Écouter les événements de tournoi
  onTournamentStarted(callback: (data: { 
    tournamentId: number; 
    message: string; 
    matches: any[] 
  }) => void) {
    const socket = this.connectToGame();
    socket.on('tournamentStarted', callback);
  }

  onTournamentMatchAssigned(callback: (data: { 
    tournamentId: number; 
    matchId: number;
    opponentId: number;
    opponentUsername: string;
    gameUrl: string;
    round: number;
    message: string;
  }) => void) {
    const socket = this.connectToGame();
    socket.on('tournamentMatchAssigned', callback);
  }

  onTournamentMatchEnded(callback: (data: {
    winner: string;
    finalScore: any;
    tournamentId: number;
    matchId: number;
    redirectUrl: string;
    message: string;
  }) => void) {
    const socket = this.connectToGame();
    socket.on('tournamentMatchEnded', callback);
  }

  onTournamentMatchResult(callback: (data: {
    matchId: number;
    winner: string;
    finalScore: any;
    player1: string;
    player2: string;
  }) => void) {
    const socket = this.connectToGame();
    socket.on('tournamentMatchResult', callback);
  }

  // Nettoyer les event listeners de tournoi
  offTournamentEvents() {
    if (this.gameSocket) {
      this.gameSocket.off('tournamentStarted');
      this.gameSocket.off('tournamentMatchAssigned');
      this.gameSocket.off('tournamentMatchEnded');
      this.gameSocket.off('tournamentMatchResult');
    }
  }

  // === CHALLENGE EVENTS ===

  // Enregistrer l'utilisateur pour recevoir les notifications
  registerUser(userId: number) {
    const socket = this.connectToGame();
    socket.emit('registerUser', { userId });
  }

  // Écouter quand un défi est accepté
  onChallengeAccepted(callback: (data: {
    gameId: string;
    gameUrl: string;
    opponentUsername: string;
    message: string;
  }) => void) {
    const socket = this.connectToGame();
    socket.on('challengeAccepted', callback);
  }

  // Nettoyer les event listeners de challenge
  offChallengeEvents() {
    if (this.gameSocket) {
      this.gameSocket.off('challengeAccepted');
    }
  }

  // Écouter quand un tournoi se termine
  onTournamentCompleted(callback: (data: {
    tournamentId: number;
    tournamentName: string;
    champion: {
      id: number;
      username: string;
      avatar?: string;
    };
    celebration: boolean;
  }) => void) {
    const socket = this.connectToGame();
    socket.on('tournamentCompleted', callback);
  }

  // Rejoindre la room d'un tournoi pour recevoir les notifications
  joinTournamentRoom(tournamentId: number) {
    const socket = this.connectToGame();
    socket.emit('joinTournament', { tournamentId });
  }

  // Quitter la room d'un tournoi
  leaveTournamentRoom(tournamentId: number) {
    if (this.gameSocket) {
      this.gameSocket.emit('leaveTournament', { tournamentId });
    }
  }

  // Nettoyer les event listeners de tournoi
  offTournamentEvents() {
    if (this.gameSocket) {
      this.gameSocket.off('tournamentCompleted');
    }
  }

  // Déconnexion
  disconnect() {
    if (this.gameSocket) {
      this.gameSocket.disconnect();
      this.gameSocket = null;
    }
  }
}

export const socketService = new SocketService();
export default socketService;