// frontend_B/src/utils/tabSync.ts
// Système de synchronisation entre onglets du même navigateur

export enum TabSyncEvents {
  TOURNAMENT_STARTED = 'TOURNAMENT_STARTED',
  TOURNAMENT_UPDATED = 'TOURNAMENT_UPDATED', 
  GAME_STARTED = 'GAME_STARTED',
  USER_LOGGED_IN = 'USER_LOGGED_IN',
  USER_LOGGED_OUT = 'USER_LOGGED_OUT',
  REFRESH_STATS = 'REFRESH_STATS',
  FORCE_REFRESH = 'FORCE_REFRESH'
}

export interface TabSyncMessage {
  type: TabSyncEvents;
  data?: any;
  timestamp: number;
  source?: string;
}

class TabSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<TabSyncEvents, ((data: any) => void)[]> = new Map();

  constructor() {
    this.initChannel();
  }

  private initChannel() {
    try {
      this.channel = new BroadcastChannel('transcendance-tabs');
      this.channel.addEventListener('message', this.handleMessage.bind(this));
      console.log('🔗 TabSync: Canal de communication initialisé');
    } catch (error) {
      console.warn('🔗 TabSync: BroadcastChannel non supporté:', error);
    }
  }

  private handleMessage(event: MessageEvent<TabSyncMessage>) {
    const { type, data, timestamp, source } = event.data;
    
    console.log(`🔗 TabSync: Message reçu [${type}]`, { data, source, timestamp });
    
    // Ignorer nos propres messages pour éviter les boucles
    if (source === this.getTabId()) {
      return;
    }

    // Exécuter les listeners pour ce type d'événement
    const eventListeners = this.listeners.get(type) || [];
    eventListeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('🔗 TabSync: Erreur dans listener:', error);
      }
    });
  }

  // Envoyer un message à tous les autres onglets
  broadcast(type: TabSyncEvents, data?: any) {
    if (!this.channel) {
      console.warn('🔗 TabSync: Canal non disponible');
      return;
    }

    const message: TabSyncMessage = {
      type,
      data,
      timestamp: Date.now(),
      source: this.getTabId()
    };

    try {
      this.channel.postMessage(message);
      console.log(`🔗 TabSync: Message envoyé [${type}]`, { data, source: message.source });
    } catch (error) {
      console.error('🔗 TabSync: Erreur envoi message:', error);
    }
  }

  // S'abonner à un type d'événement
  on(type: TabSyncEvents, callback: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(callback);

    console.log(`🔗 TabSync: Listener ajouté pour [${type}]`);

    // Retourner une fonction de désabonnement
    return () => {
      const eventListeners = this.listeners.get(type) || [];
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    };
  }

  // Nettoyer les ressources
  destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
    console.log('🔗 TabSync: Canal fermé');
  }

  // Générer un ID unique pour cet onglet
  private getTabId(): string {
    if (!window.tabId) {
      window.tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return window.tabId;
  }

  // Méthodes utilitaires spécifiques
  notifyTournamentStarted(tournamentId: number) {
    this.broadcast(TabSyncEvents.TOURNAMENT_STARTED, { tournamentId });
  }

  notifyGameStarted(gameId: string) {
    this.broadcast(TabSyncEvents.GAME_STARTED, { gameId });
  }

  notifyUserLoggedIn(username: string) {
    this.broadcast(TabSyncEvents.USER_LOGGED_IN, { username });
  }

  notifyForceRefresh(reason?: string) {
    this.broadcast(TabSyncEvents.FORCE_REFRESH, { reason });
  }

  notifyRefreshStats(userId?: number) {
    this.broadcast(TabSyncEvents.REFRESH_STATS, { userId });
  }
}

// Extension du type Window pour TypeScript
declare global {
  interface Window {
    tabId: string;
  }
}

// Instance singleton
export const tabSync = new TabSyncService();