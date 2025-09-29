// frontend_B/src/contexts/TournamentContext.tsx - GESTION DES TOURNOIS

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types simples basés sur ton backend
export interface Tournament {
  id: number;
  name: string;
  description?: string;
  status: 'draft' | 'open' | 'full' | 'in_progress' | 'completed' | 'cancelled';
  type: 'single_elimination' | 'double_elimination' | 'round_robin';
  maxParticipants: number;
  currentParticipants: number;
  creator: string; // Nom du créateur (simplifié)
  createdAt: string;
}

export interface CreateTournamentData {
  name: string;
  description?: string;
  type: 'single_elimination' | 'double_elimination' | 'round_robin';
  maxParticipants: number;
}

interface TournamentContextType {
  tournaments: Tournament[];
  createTournament: (data: CreateTournamentData) => Tournament;
  deleteTournament: (id: number) => void;
  joinTournament: (id: number) => void;
  leaveTournament: (id: number) => void;
}

const TournamentContext = createContext<TournamentContextType | null>(null);

export const useTournaments = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournaments must be used within TournamentProvider');
  }
  return context;
};

interface TournamentProviderProps {
  children: ReactNode;
}

export const TournamentProvider: React.FC<TournamentProviderProps> = ({ children }) => {
  // State initial VIDE (plus de données fictives !)
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [nextId, setNextId] = useState(1);

  // Créer un nouveau tournoi
  const createTournament = (data: CreateTournamentData): Tournament => {
    const newTournament: Tournament = {
      id: nextId,
      name: data.name,
      description: data.description,
      status: 'draft',
      type: data.type,
      maxParticipants: data.maxParticipants,
      currentParticipants: 0,
      creator: 'Jacob', // Pour l'instant c'est toujours Jacob
      createdAt: new Date().toISOString(),
    };

    setTournaments(prev => [...prev, newTournament]);
    setNextId(prev => prev + 1);
    
    console.log('🏆 Tournoi créé:', newTournament);
    return newTournament;
  };

  // Supprimer un tournoi
  const deleteTournament = (id: number) => {
    setTournaments(prev => prev.filter(t => t.id !== id));
    console.log('🗑️ Tournoi supprimé:', id);
  };

  // Rejoindre un tournoi (simulation)
  const joinTournament = (id: number) => {
    setTournaments(prev => 
      prev.map(t => {
        if (t.id === id && t.currentParticipants < t.maxParticipants) {
          const updated = {
            ...t,
            currentParticipants: t.currentParticipants + 1
          };
          // Mettre à jour le status si plein
          if (updated.currentParticipants === updated.maxParticipants) {
            updated.status = 'full';
          } else if (updated.status === 'draft') {
            updated.status = 'open';
          }
          console.log('✅ Rejoint le tournoi:', updated.name);
          return updated;
        }
        return t;
      })
    );
  };

  // Quitter un tournoi (simulation)
  const leaveTournament = (id: number) => {
    setTournaments(prev => 
      prev.map(t => {
        if (t.id === id && t.currentParticipants > 0) {
          const updated = {
            ...t,
            currentParticipants: t.currentParticipants - 1
          };
          // Mettre à jour le status
          if (updated.currentParticipants === 0) {
            updated.status = 'draft';
          } else if (updated.status === 'full') {
            updated.status = 'open';
          }
          console.log('❌ Quitté le tournoi:', updated.name);
          return updated;
        }
        return t;
      })
    );
  };

  const value = {
    tournaments,
    createTournament,
    deleteTournament,
    joinTournament,
    leaveTournament,
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};