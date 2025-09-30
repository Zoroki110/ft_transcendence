// frontend_B/src/hooks/useTournamentActions.ts - HOOK POUR ACTIONS TOURNOIS ULTRA ROBUSTE

import { useState, useCallback } from 'react';
import { tournamentAPI } from '../services/api';
import { Tournament } from '../types';

interface TournamentActionState {
  isJoining: boolean;
  isLeaving: boolean;
  isStarting: boolean;
  isDeleting: boolean;
}

interface UseTournamentActionsReturn {
  state: TournamentActionState;
  joinTournament: (tournamentId: number) => Promise<Tournament | null>;
  leaveTournament: (tournamentId: number) => Promise<Tournament | null>;
  startTournament: (tournamentId: number) => Promise<Tournament | null>;
  deleteTournament: (tournamentId: number) => Promise<boolean>;
}

export function useTournamentActions(): UseTournamentActionsReturn {
  const [state, setState] = useState<TournamentActionState>({
    isJoining: false,
    isLeaving: false,
    isStarting: false,
    isDeleting: false
  });

  const joinTournament = useCallback(async (tournamentId: number): Promise<Tournament | null> => {
    console.log('🔍 HOOK: Starting joinTournament', { tournamentId });
    
    setState(prev => ({ 
      ...prev, 
      isJoining: true
    }));

    try {
      const response = await tournamentAPI.joinTournament(tournamentId);
      
      // Recharger les données complètes du tournoi
      const updatedTournamentResponse = await tournamentAPI.getTournament(tournamentId);
      const updatedTournament = updatedTournamentResponse.data;
      
      setState(prev => ({ 
        ...prev, 
        isJoining: false
      }));

      console.log('✅ HOOK: Tournament joined successfully', {
        tournamentId: updatedTournament.id,
        currentParticipants: updatedTournament.currentParticipants,
        participantsCount: updatedTournament.participants?.length || 0
      });

      return updatedTournament;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'inscription';
      
      setState(prev => ({ 
        ...prev, 
        isJoining: false
      }));

      console.error('❌ HOOK: Join tournament failed', {
        tournamentId,
        error: errorMessage,
        fullError: error.response?.data
      });

      return null;
    }
  }, []);

  const leaveTournament = useCallback(async (tournamentId: number): Promise<Tournament | null> => {
    console.log('🔍 HOOK: Starting leaveTournament', { tournamentId });
    
    setState(prev => ({ 
      ...prev, 
      isLeaving: true
    }));

    try {
      const response = await tournamentAPI.leaveTournament(tournamentId);
      
      // Recharger les données complètes du tournoi
      const updatedTournamentResponse = await tournamentAPI.getTournament(tournamentId);
      const updatedTournament = updatedTournamentResponse.data;
      
      setState(prev => ({ 
        ...prev, 
        isLeaving: false
      }));

      console.log('✅ HOOK: Tournament left successfully', {
        tournamentId: updatedTournament.id,
        currentParticipants: updatedTournament.currentParticipants,
        participantsCount: updatedTournament.participants?.length || 0
      });

      return updatedTournament;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la sortie du tournoi';
      
      setState(prev => ({ 
        ...prev, 
        isLeaving: false
      }));

      console.error('❌ HOOK: Leave tournament failed', {
        tournamentId,
        error: errorMessage,
        fullError: error.response?.data
      });

      return null;
    }
  }, []);

  const startTournament = useCallback(async (tournamentId: number): Promise<Tournament | null> => {
    console.log('🔍 HOOK: Starting tournament', { tournamentId });
    
    setState(prev => ({ 
      ...prev, 
      isStarting: true
    }));

    try {
      const response = await tournamentAPI.startTournament(tournamentId);
      
      // Recharger les données complètes du tournoi
      const updatedTournamentResponse = await tournamentAPI.getTournament(tournamentId);
      const updatedTournament = updatedTournamentResponse.data;
      
      setState(prev => ({ 
        ...prev, 
        isStarting: false
      }));

      console.log('✅ HOOK: Tournament started successfully', {
        tournamentId: updatedTournament.id,
        status: updatedTournament.status
      });

      return updatedTournament;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur au démarrage du tournoi';
      
      setState(prev => ({ 
        ...prev, 
        isStarting: false
      }));

      console.error('❌ HOOK: Start tournament failed', {
        tournamentId,
        error: errorMessage,
        fullError: error.response?.data
      });

      return null;
    }
  }, []);

  const deleteTournament = useCallback(async (tournamentId: number): Promise<boolean> => {
    console.log('🔍 HOOK: Starting deleteTournament', { tournamentId });
    
    setState(prev => ({ 
      ...prev, 
      isDeleting: true
    }));

    try {
      await tournamentAPI.deleteTournament(tournamentId);
      
      setState(prev => ({ 
        ...prev, 
        isDeleting: false
      }));

      console.log('✅ HOOK: Tournament deleted successfully', { tournamentId });

      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression du tournoi';
      
      setState(prev => ({ 
        ...prev, 
        isDeleting: false
      }));

      console.error('❌ HOOK: Delete tournament failed', {
        tournamentId,
        error: errorMessage,
        fullError: error.response?.data
      });

      return false;
    }
  }, []);

  return {
    state,
    joinTournament,
    leaveTournament,
    startTournament,
    deleteTournament
  };
}