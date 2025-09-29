// frontend_B/src/config.ts - Configuration centralisée

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  TIMEOUT: 10000,
  DEBUG: import.meta.env.DEV || false
};

export const APP_CONFIG = {
  NAME: 'Transcendence',
  VERSION: '1.0.0',
  DEBUG: import.meta.env.DEV || false
};

// Fonction utilitaire pour les logs de debug
export const debugLog = (message: string, ...args: any[]) => {
  if (APP_CONFIG.DEBUG) {
    console.log(`🔧 [DEBUG] ${message}`, ...args);
  }
};

// Fonction pour valider la configuration au démarrage
export const validateConfig = () => {
  debugLog('Configuration:', {
    API_BASE_URL: API_CONFIG.BASE_URL,
    TIMEOUT: API_CONFIG.TIMEOUT,
    DEBUG: API_CONFIG.DEBUG
  });

  if (!API_CONFIG.BASE_URL) {
    console.error('❌ ERREUR: API_BASE_URL n\'est pas défini');
  }
};

// Appeler la validation au chargement
validateConfig();