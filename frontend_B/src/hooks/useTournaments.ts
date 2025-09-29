// frontend_B/src/hooks/useTournaments.ts - HOOK TOURNOIS CONNECTÉ AUX APIS

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

      console.log('<Æ Tournois chargés:', response.data.tournaments.length);
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

      // Ajouter à la liste locale
      setTournaments(prev => [newTournament, ...prev]);
      setTotal(prev => prev + 1);

      console.log(' Tournoi créé:', newTournament.name);
      return newTournament;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur de création de tournoi';
      setError(message);
      console.error('L Erreur création tournoi:', message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinTournament = async (tournamentId: number): Promise<boolean> => {
    try {
      await tournamentAPI.joinTournament(tournamentId);

      // Mettre à jour la liste locale
      setTournaments(prev =>
        prev.map(t =>
          t.id === tournamentId
            ? { ...t, currentParticipants: t.currentParticipants + 1 }
            : t
        )
      );

      console.log(' Inscription au tournoi réussie');
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur d\'inscription au tournoi';
      setError(message);
      console.error('L Erreur inscription tournoi:', message);
      return false;
    }
  };

  const leaveTournament = async (tournamentId: number): Promise<boolean> => {
    try {
      await tournamentAPI.leaveTournament(tournamentId);

      // Mettre à jour la liste locale
      setTournaments(prev =>
        prev.map(t =>
          t.id === tournamentId
            ? { ...t, currentParticipants: Math.max(0, t.currentParticipants - 1) }
            : t
        )
      );

      console.log(' Sortie du tournoi réussie');
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur de sortie du tournoi';
      setError(message);
      console.error('L Erreur sortie tournoi:', message);
      return false;
    }
  };

  // Charger les tournois au montage du composant
  useEffect(() => {
    loadTournaments();
  }, []); // Pas de dépendance pour éviter les recharges infinies

  return {
    // Données
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