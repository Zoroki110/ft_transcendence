// frontend_B/src/services/api.ts - VERSION COMPLÈTE AVEC TOUS LES ENDPOINTS BACKEND

import axios, { AxiosInstance } from 'axios';
import { API_CONFIG, debugLog } from '../config';

const API_BASE_URL = API_CONFIG.BASE_URL;

debugLog('Configuration API:', {
  BASE_URL: API_BASE_URL,
  TIMEOUT: API_CONFIG.TIMEOUT
});

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    debugLog('Requête API:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      hasToken: !!token
    });
    return config;
  },
  (error) => {
    debugLog('Erreur intercepteur request:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
apiClient.interceptors.response.use(
  (response) => {
    debugLog('Réponse API réussie:', {
      status: response.status,
      url: response.config.url,
      dataKeys: Object.keys(response.data || {})
    });
    return response;
  },
  (error) => {
    debugLog('Erreur API:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message
    });

    if (error.response?.status === 401) {
      console.warn('🔓 Token expiré, redirection vers login');
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== AUTH API =====
export const authAPI = {
  // Connexion avec email/password
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),

  // Inscription
  register: (username: string, email: string, password: string) =>
    apiClient.post('/auth/register', { username, email, password }),

  // OAuth 42
  loginWith42: () =>
    apiClient.get('/auth/42'),

  // 2FA
  verify2FA: (code: string) =>
    apiClient.post('/auth/twofa/verify', { code }),

  enable2FA: () =>
    apiClient.post('/auth/twofa/enable'),

  disable2FA: () =>
    apiClient.post('/auth/twofa/disable'),
};

// ===== USERS API =====
export const userAPI = {
  // Profil utilisateur
  getMyProfile: () =>
    apiClient.get('/users/me'),

  getUserProfile: (id: number) =>
    apiClient.get(`/users/${id}`),

  getAllUsers: () =>
    apiClient.get('/users'),

  updateProfile: (id: number, data: any) =>
    apiClient.put(`/users/${id}`, data),

  deleteAccount: (id: number) =>
    apiClient.delete(`/users/${id}`),

  // Amis
  sendFriendRequest: (addresseeId: number) =>
    apiClient.post('/users/friends/request', { addresseeId }),

  respondToFriendRequest: (requestId: number, accept: boolean) =>
    apiClient.patch(`/users/friends/requests/${requestId}`, { accept }),

  getMyFriends: () =>
    apiClient.get('/users/me/friends'),

  getUserFriends: (id: number) =>
    apiClient.get(`/users/${id}/friends`),

  getPendingFriendRequests: () =>
    apiClient.get('/users/me/friends/requests'),

  getOnlineFriends: () =>
    apiClient.get('/users/me/friends/online'),

  removeFriend: (friendId: number) =>
    apiClient.delete(`/users/friends/${friendId}`),

  // Avatar
  uploadAvatar: (file: FormData) =>
    apiClient.post('/users/me/avatar', file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  removeAvatar: () =>
    apiClient.delete('/users/me/avatar'),

  // Display name
  updateDisplayName: (displayName: string) =>
    apiClient.patch('/users/me/display-name', { displayName }),

  // Statistiques
  getMyStats: () =>
    apiClient.get('/users/me/stats'),

  getUserStats: (id: number) =>
    apiClient.get(`/users/${id}/stats`),

  // Historique des matches
  getMyMatches: (params?: any) =>
    apiClient.get('/users/me/matches', { params }),

  getUserMatches: (id: number, params?: any) =>
    apiClient.get(`/users/${id}/matches`, { params }),

  // Statut en ligne
  updateOnlineStatus: (isOnline: boolean) =>
    apiClient.patch('/users/me/status', { isOnline }),

  setOnline: () =>
    apiClient.post('/users/me/status/online'),

  setOffline: () =>
    apiClient.post('/users/me/status/offline'),

  // Recherche
  searchUsers: (query: string) =>
    apiClient.get('/users/search', { params: { q: query } }),

  // Dashboard
  getDashboard: () =>
    apiClient.get('/users/me/dashboard'),
};

// ===== TOURNAMENTS API =====
export const tournamentAPI = {
  // CRUD Tournois
  getTournaments: (params?: any) =>
    apiClient.get('/tournaments', { params }),

  getTournament: (id: number) =>
    apiClient.get(`/tournaments/${id}`),

  createTournament: (data: any) =>
    apiClient.post('/tournaments', data),

  updateTournament: (id: number, data: any) =>
    apiClient.patch(`/tournaments/${id}`, data),

  deleteTournament: (id: number) =>
    apiClient.delete(`/tournaments/${id}`),

  // Gestion des participants
  joinTournament: async (id: number, data?: any) => {
    console.log('🔍 DEBUG API joinTournament:', { id, data });
    try {
      const response = await apiClient.post(`/tournaments/${id}/join`, data || {});
      console.log('✅ DEBUG API response:', response.data);
      return response;
    } catch (error: any) {
      console.error('❌ DEBUG API error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  leaveTournament: (id: number) =>
    apiClient.delete(`/tournaments/${id}/leave`),

  getParticipants: (id: number) =>
    apiClient.get(`/tournaments/${id}/participants`),

  // Démarrer un tournoi (génère les brackets)
  startTournament: (id: number) =>
    apiClient.post(`/tournaments/${id}/generate-brackets`),

  // Brackets et matches
  generateBrackets: (id: number) =>
    apiClient.post(`/tournaments/${id}/generate-brackets`),

  getBrackets: (id: number) =>
    apiClient.get(`/tournaments/${id}/brackets`),

  getMatches: (id: number) =>
    apiClient.get(`/tournaments/${id}/matches`),

  advanceWinner: (tournamentId: number, matchId: number, data: any) =>
    apiClient.post(`/tournaments/${tournamentId}/advance-winner/${matchId}`, data),

  // Statistiques
  getTournamentStats: (id: number) =>
    apiClient.get(`/tournaments/${id}/stats`),

  getLeaderboard: (id: number) =>
    apiClient.get(`/tournaments/${id}/leaderboard`),

  // Mes tournois
  getMyTournaments: (params?: any) =>
    apiClient.get('/tournaments/user/my-tournaments', { params }),
};

// ===== GAMES API =====
export const gameAPI = {
  // Gestion des matches
  createMatch: (data: any) =>
    apiClient.post('/games/matches', data),

  getMatches: (status?: string) =>
    apiClient.get('/games/matches', { params: status ? { status } : {} }),

  getMatch: (id: number) =>
    apiClient.get(`/games/matches/${id}`),

  finishMatch: (id: number, data: any) =>
    apiClient.patch(`/games/matches/${id}/finish`, data),
};

// ===== HEALTH API =====
export const healthAPI = {
  check: () =>
    apiClient.get('/health'),
};

export default apiClient;