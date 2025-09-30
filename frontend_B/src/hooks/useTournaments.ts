// frontend_B/src/hooks/useTournaments.ts - HOOK TOURNOIS CONNECT� AUX APIS

import { useState, useEffect } from 'react';
import { tournamentAPI } from '../services/api';
import { Tournament, TournamentQueryDto, CreateTournamentDto } from '../types';

export function useTournaments(initialQuery: TournamentQueryDto = {}) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [query, setQuery] = useState<TournamentQueryDto>(initialQuery);

  const loadTournaments = async (newQuery?: TournamentQueryDto) => {
    try {
      setLoading(true);
      setError(null);

      const queryToUse = newQuery || query;
      const response = await tournamentAPI.getTournaments(queryToUse);

      setTournaments(response.data.tournaments);
      setTotal(response.data.total);

      console.log('<� Tournois charg�s:', response.data.tournaments.length);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur de chargement des tournois';
      setError(message);
      console.error('L Erreur chargement tournois:', message);
    } finally {
      setLoading(false);
    }
  };

  const updateQuery = (newQuery: Partial<TournamentQueryDto>) => {
    const updatedQuery = { ...query, ...newQuery };
    setQuery(updatedQuery);
    loadTournaments(updatedQuery);
  };

  const filterByStatus = (status: string) => {
    updateQuery({ status: status as any });
  };

  const filterByType = (type: string) => {
    updateQuery({ type: type as any });
  };

  const togglePublicOnly = () => {
    updateQuery({ isPublic: !query.isPublic });
  };

  const createTournament = async (data: CreateTournamentDto): Promise<Tournament | null> => {
    try {
      setLoading(true);
      const response = await tournamentAPI.createTournament(data);
      const newTournament = response.data;

      // Ajouter � la liste locale
      setTournaments(prev => [newTournament, ...prev]);
      setTotal(prev => prev + 1);

      console.log(' Tournoi cr��:', newTournament.name);
      return newTournament;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur de cr�ation de tournoi';
      setError(message);
      console.error('L Erreur cr�ation tournoi:', message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinTournament = async (tournamentId: number): Promise<boolean> => {
    try {
      await tournamentAPI.joinTournament(tournamentId);

      // Recharger les données depuis le serveur pour avoir l'état exact
      await loadTournaments();

      console.log(' Inscription au tournoi r�ussie');
      return true;
    } catch (err: any) {
      console.error('❌ Erreur inscription tournoi:', err.response?.data?.message || err.message);
      return false;
    }
  };

  const leaveTournament = async (tournamentId: number): Promise<boolean> => {
    try {
      await tournamentAPI.leaveTournament(tournamentId);

      // Recharger les données depuis le serveur pour avoir l'état exact
      await loadTournaments();

      console.log(' Sortie du tournoi r�ussie');
      return true;
    } catch (err: any) {
      console.error('❌ Erreur sortie tournoi:', err.response?.data?.message || err.message);
      return false;
    }
  };

  // Charger les tournois au montage du composant
  useEffect(() => {
    loadTournaments();
  }, []); // Pas de d�pendance pour �viter les recharges infinies

  return {
    // Donn�es
    tournaments,
    total,
    loading,
    error,
    query,

    // Actions
    loadTournaments,
    updateQuery,
    filterByStatus,
    filterByType,
    togglePublicOnly,
    createTournament,
    joinTournament,
    leaveTournament,

    // Utilitaires
    refetch: () => loadTournaments(),
    clearError: () => setError(null),
  };
}