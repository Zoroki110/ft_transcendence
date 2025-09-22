// frontend_B/src/contexts/UserContext.tsx - GESTION DU PROFIL UTILISATEUR

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Interface basée sur ton backend User entity
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  displayName?: string;
  
  // Statistiques de jeu
  gamesWon: number;
  gamesLost: number;
  tournamentsWon: number;
  totalScore: number;
  
  // Status et infos
  isOnline: boolean;
  lastSeen?: string;
  createdAt: string;
  
  // Calculé
  winRate: number;
  totalGames: number;
}

export interface UpdateProfileData {
  username?: string;
  email?: string;
  displayName?: string;
  avatar?: string;
}

interface UserContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  updateProfile: (data: UpdateProfileData) => void;
  simulateGameWin: () => void;
  simulateGameLoss: () => void;
  simulateTournamentWin: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  // Utilisateur initial (Jacob selon tes spécifications)
  const [user, setUser] = useState<UserProfile>({
    id: 1,
    username: 'Jacob',
    email: 'jacob@ecole42.fr',
    avatar: '👨‍💻',
    displayName: 'Jacob Maizel',
    
    // Stats initiales vides (pas de données en dur !)
    gamesWon: 0,
    gamesLost: 0,
    tournamentsWon: 0,
    totalScore: 0,
    
    // Status
    isOnline: true,
    lastSeen: new Date().toISOString(),
    createdAt: '2024-12-15T10:00:00Z', // Membre depuis 15/12/2024
    
    // Calculés
    winRate: 0,
    totalGames: 0,
  });

  // Mettre à jour le profil
  const updateProfile = (data: UpdateProfileData) => {
    if (!user) return;
    
    setUser(prev => {
      if (!prev) return prev;
      
      const updated = { ...prev, ...data };
      console.log('👤 Profil mis à jour:', updated);
      return updated;
    });
  };

  // Simuler une victoire (pour tester les stats)
  const simulateGameWin = () => {
    if (!user) return;
    
    setUser(prev => {
      if (!prev) return prev;
      
      const newGamesWon = prev.gamesWon + 1;
      const newTotalGames = newGamesWon + prev.gamesLost;
      const newScore = prev.totalScore + 100; // +100 points par victoire
      
      const updated = {
        ...prev,
        gamesWon: newGamesWon,
        totalScore: newScore,
        totalGames: newTotalGames,
        winRate: newTotalGames > 0 ? (newGamesWon / newTotalGames) * 100 : 0,
        lastSeen: new Date().toISOString(),
      };
      
      console.log('🎉 Victoire simulée !', updated);
      return updated;
    });
  };

  // Simuler une défaite
  const simulateGameLoss = () => {
    if (!user) return;
    
    setUser(prev => {
      if (!prev) return prev;
      
      const newGamesLost = prev.gamesLost + 1;
      const newTotalGames = prev.gamesWon + newGamesLost;
      const newScore = Math.max(0, prev.totalScore - 20); // -20 points par défaite
      
      const updated = {
        ...prev,
        gamesLost: newGamesLost,
        totalScore: newScore,
        totalGames: newTotalGames,
        winRate: newTotalGames > 0 ? (prev.gamesWon / newTotalGames) * 100 : 0,
        lastSeen: new Date().toISOString(),
      };
      
      console.log('😢 Défaite simulée !', updated);
      return updated;
    });
  };

  // Simuler victoire de tournoi
  const simulateTournamentWin = () => {
    if (!user) return;
    
    setUser(prev => {
      if (!prev) return prev;
      
      const updated = {
        ...prev,
        tournamentsWon: prev.tournamentsWon + 1,
        totalScore: prev.totalScore + 500, // +500 points pour un tournoi
        lastSeen: new Date().toISOString(),
      };
      
      console.log('🏆 Tournoi gagné !', updated);
      return updated;
    });
  };

  const value = {
    user,
    isLoggedIn: !!user,
    updateProfile,
    simulateGameWin,
    simulateGameLoss,
    simulateTournamentWin,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};