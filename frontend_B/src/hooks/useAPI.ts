// frontend_B/src/hooks/useAPI.ts - HOOKS PERSONNALISÉS POUR LES APIS

import { useState, useEffect } from 'react';
import { userAPI, tournamentAPI, gameAPI } from '../services/api';
import {
  User,
  Tournament,
  Match,
  TournamentQueryDto,
  UserStats,
  FriendRequest,
  DashboardData
} from '../types';

// Hook générique pour les appels API
export function useAPI<T>(
  apiCall: () => Promise<{ data: T }>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de chargement');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetch();
  };

  useEffect(() => {
    fetch();
  }, dependencies);

  return { data, loading, error, refetch };
}

// ===== HOOKS FRIENDS =====

export function useFriends() {
  const [friends, setFriends] = useState<User[]>([]);
  const [onlineFriends, setOnlineFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const [friendsRes, onlineRes, pendingRes] = await Promise.all([
        userAPI.getMyFriends(),
        userAPI.getOnlineFriends(),
        userAPI.getPendingFriendRequests()
      ]);

      setFriends(friendsRes.data);
      setOnlineFriends(onlineRes.data);
      setPendingRequests(pendingRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de chargement des amis');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (addresseeId: number): Promise<boolean> => {
    try {
      await userAPI.sendFriendRequest(addresseeId);
      await loadFriends(); // Recharger
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur envoi demande');
      return false;
    }
  };

  const respondToRequest = async (requestId: number, accept: boolean): Promise<boolean> => {
    try {
      await userAPI.respondToFriendRequest(requestId, accept);
      await loadFriends(); // Recharger
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur réponse demande');
      return false;
    }
  };

  const removeFriend = async (friendId: number): Promise<boolean> => {
    try {
      await userAPI.removeFriend(friendId);
      await loadFriends(); // Recharger
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur suppression ami');
      return false;
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  return {
    friends,
    onlineFriends,
    pendingRequests,
    loading,
    error,
    loadFriends,
    sendFriendRequest,
    respondToRequest,
    removeFriend
  };
}

// ===== HOOKS TOURNAMENTS =====

export function useTournaments(query?: TournamentQueryDto) {
  const { data, loading, error, refetch } = useAPI(
    () => tournamentAPI.getTournaments(query),
    [JSON.stringify(query)]
  );

  return {
    tournaments: data?.tournaments || [],
    total: data?.total || 0,
    loading,
    error,
    refetch
  };
}

export function useTournament(id: number) {
  return useAPI(() => tournamentAPI.getTournament(id), [id]);
}

export function useTournamentBrackets(id: number) {
  return useAPI(() => tournamentAPI.getBrackets(id), [id]);
}

export function useTournamentMatches(id: number) {
  return useAPI(() => tournamentAPI.getMatches(id), [id]);
}

export function useMyTournaments(query?: TournamentQueryDto) {
  return useAPI(() => tournamentAPI.getMyTournaments(query), [JSON.stringify(query)]);
}

// ===== HOOKS GAMES =====

export function useMatches(status?: string) {
  return useAPI(() => gameAPI.getMatches(status), [status]);
}

export function useMatch(id: number) {
  return useAPI(() => gameAPI.getMatch(id), [id]);
}

// ===== HOOKS STATS =====

export function useUserStats(userId?: number) {
  const apiCall = userId
    ? () => userAPI.getUserStats(userId)
    : () => userAPI.getMyStats();

  return useAPI(apiCall, [userId]);
}

export function useUserMatches(userId?: number, params?: any) {
  const apiCall = userId
    ? () => userAPI.getUserMatches(userId, params)
    : () => userAPI.getMyMatches(params);

  return useAPI(apiCall, [userId, JSON.stringify(params)]);
}

// ===== HOOK DASHBOARD =====

export function useDashboard() {
  return useAPI(() => userAPI.getDashboard(), []);
}

// ===== HOOK SEARCH =====

export function useUserSearch() {
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await userAPI.searchUsers(query);
      setSearchResults(response.data.users || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de recherche');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setSearchResults([]);
    setError(null);
  };

  return {
    searchResults,
    loading,
    error,
    search,
    clearResults
  };
}

// ===== HOOK ACTIONS TOURNAMENT =====

export function useTournamentActions() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const joinTournament = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await tournamentAPI.joinTournament(id);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur inscription tournoi');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const leaveTournament = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await tournamentAPI.leaveTournament(id);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur sortie tournoi');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const generateBrackets = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await tournamentAPI.generateBrackets(id);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur génération brackets');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createTournament = async (data: any): Promise<Tournament | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await tournamentAPI.createTournament(data);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur création tournoi');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    joinTournament,
    leaveTournament,
    generateBrackets,
    createTournament
  };
}

// ===== HOOK ACTIONS MATCH =====

export function useMatchActions() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createMatch = async (data: any): Promise<Match | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await gameAPI.createMatch(data);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur création match');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const finishMatch = async (id: number, data: any): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await gameAPI.finishMatch(id, data);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur fin de match');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createMatch,
    finishMatch
  };
}