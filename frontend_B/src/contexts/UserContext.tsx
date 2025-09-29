// frontend_B/src/contexts/UserContext.tsx - AVEC FONCTION LOGOUT

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
  logout: () => void; // 🆕 Fonction de déconnexion
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

  // État de connexion
  const [isLoggedIn, setIsLoggedIn] = useState(true);

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

  // 🆕 Fonction de déconnexion
  const logout = () => {
    console.log('🚪 Déconnexion de l\'utilisateur');
    setIsLoggedIn(false);
    setUser(null);
    
    // TODO: Appeler l'API de déconnexion
    // await fetch('/api/auth/logout', { method: 'POST' });
    
    // TODO: Supprimer le token du localStorage
    // localStorage.removeItem('authToken');
    
    // TODO: Rediriger vers la page de connexion si nécessaire
    // window.location.href = '/login';
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
      
      console.log('🎉 Victoire simulée ! Nouvelles stats:', {
        wins: updated.gamesWon,
        total: updated.totalGames,
        winRate: updated.winRate.toFixed(1) + '%',
        score: updated.totalScore
      });
      
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
      
      const updated = {
        ...prev,
        gamesLost: newGamesLost,
        totalGames: newTotalGames,
        winRate: newTotalGames > 0 ? (prev.gamesWon / newTotalGames) * 100 : 0,
        lastSeen: new Date().toISOString(),
      };
      
      console.log('😞 Défaite simulée ! Nouvelles stats:', {
        losses: updated.gamesLost,
        total: updated.totalGames,
        winRate: updated.winRate.toFixed(1) + '%'
      });
      
      return updated;
    });
  };

  // Simuler une victoire de tournoi
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
      
      console.log('🏆 Tournoi gagné ! Nouvelles stats:', {
        tournaments: updated.tournamentsWon,
        score: updated.totalScore
      });
      
      return updated;
    });
  };

  const contextValue: UserContextType = {
    user,
    isLoggedIn,
    updateProfile,
    simulateGameWin,
    simulateGameLoss,
    simulateTournamentWin,
    logout, // 🆕 Ajout de la fonction logout
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};