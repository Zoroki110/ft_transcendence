import axios from 'axios';
import { Tournament, Match } from '../types/tournament';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const tournamentService = {
  async getAllTournaments() {
    const response = await axios.get(`${API_BASE}/tournaments`);
    return response.data;
  },

  async getTournament(id: number): Promise<Tournament> {
    const response = await axios.get(`${API_BASE}/tournaments/${id}`);
    return response.data;
  },

  async createTournament(data: any): Promise<Tournament> {
    const token = localStorage.getItem('authToken');
    const response = await axios.post(`${API_BASE}/tournaments`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async joinTournament(id: number) {
    const token = localStorage.getItem('authToken');
    const response = await axios.post(`${API_BASE}/tournaments/${id}/join`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async leaveTournament(id: number) {
    const token = localStorage.getItem('authToken');
    const response = await axios.delete(`${API_BASE}/tournaments/${id}/leave`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async generateBrackets(id: number) {
    const token = localStorage.getItem('authToken');
    const response = await axios.post(`${API_BASE}/tournaments/${id}/generate-brackets`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async getBrackets(id: number) {
    const response = await axios.get(`${API_BASE}/tournaments/${id}/brackets`);
    return response.data;
  },

  async getParticipants(id: number) {
    const response = await axios.get(`${API_BASE}/tournaments/${id}/participants`);
    return response.data;
  },

  async getStats(id: number) {
    const response = await axios.get(`${API_BASE}/tournaments/${id}/stats`);
    return response.data;
  },

  async getMyTournaments() {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${API_BASE}/tournaments/user/my-tournaments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};
