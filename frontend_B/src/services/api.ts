// frontend_B/src/services/api.ts - VERSION COMPATIBLE BACKEND

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== AUTH ENDPOINTS ===== ✅ COMPATIBLE
export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),

  verify2FA: (code: string) =>
    apiClient.post('/auth/2fa/verify', { code }),

  enable2FA: () =>
    apiClient.post('/auth/2fa/enable'),

  disable2FA: () =>
    apiClient.post('/auth/2fa/disable'),

  logout: () =>
    apiClient.post('/auth/logout'),
};

// ===== USER ENDPOINTS ===== ⚠️ LIMITÉ
export const userAPI = {
  // ✅ Existe dans backend
  getProfile: () =>
    apiClient.get('/users/me'),

  // ✅ Existe dans backend
  updateProfile: (id: number, data: any) =>
    apiClient.put(`/users/${id}`, data),

  // ❌ N'EXISTE PAS - À NE PAS UTILISER
  // getStats: () => apiClient.get('/users/me/stats'),
  // getMatchHistory: () => apiClient.get('/users/me/matches'),
};

// ===== GAME ENDPOINTS ===== ✅ COMPATIBLE
export const gameAPI = {
  createGame: (data: any) =>
    apiClient.post('/games/matches', data),

  getGame: (id: number) =>
    apiClient.get(`/games/matches/${id}`),

  getAvailableGames: () =>
    apiClient.get('/games/matches'),
};

// ===== TOURNAMENT ENDPOINTS ===== ✅ COMPATIBLE
export const tournamentAPI = {
  getTournaments: (params?: any) =>
    apiClient.get('/tournaments', { params }),

  getTournament: (id: number) =>
    apiClient.get(`/tournaments/${id}`),

  createTournament: (data: any) =>
    apiClient.post('/tournaments', data),

  joinTournament: (id: number) =>
    apiClient.post(`/tournaments/${id}/join`, {}),

  leaveTournament: (id: number) =>
    apiClient.delete(`/tournaments/${id}/leave`),

  getBrackets: (id: number) =>
    apiClient.get(`/tournaments/${id}/brackets`),

  startTournament: (id: number) =>
    apiClient.post(`/tournaments/${id}/generate-brackets`, {}),
};

export default apiClient;