// frontend_B/src/contexts/UserContext.tsx - CONNECTÉ AUX APIS BACKEND

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { userAPI, authAPI } from '../services/api';
import { User, UpdateUserDto, UserStats, DashboardData } from '../types';
import { normalizeUserData, isValidUserData } from '../utils/userUtils';

interface UserContextType {
  user: User | null;
  stats: UserStats | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;

  // Actions authentification
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;

  // Actions profil
  updateProfile: (data: UpdateUserDto) => Promise<boolean>;
  loadProfile: () => Promise<void>;
  loadStats: () => Promise<void>;
  loadDashboard: () => Promise<void>;

  // Actions statut
  setOnlineStatus: (isOnline: boolean) => Promise<void>;

  // Actions avatar
  uploadAvatar: (file: File) => Promise<boolean>;
  removeAvatar: () => Promise<boolean>;
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
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('access_token') !== null;
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState<boolean>(false);

  // Le chargement du profil se fera lors de la première utilisation du contexte
  // via les composants qui appellent loadProfile explicitement

  // Connexion
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.login(email, password);
      const { user: userData, access_token } = response.data;

      if (!isValidUserData(userData)) {
        throw new Error('Données utilisateur invalides reçues du serveur');
      }

      const completeUser = normalizeUserData(userData);

      localStorage.setItem('access_token', access_token);
      setUser(completeUser);
      setIsLoggedIn(true);

      // Charger les stats après connexion
      await loadStats();

      console.log('✅ Connexion réussie:', userData.username);
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur de connexion';
      setError(message);
      console.error('❌ Erreur de connexion:', message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Inscription
  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Début inscription:', { username, email });

      const response = await authAPI.register(username, email, password);
      console.log('📥 Réponse inscription:', response);

      if (!response || !response.data) {
        throw new Error('Réponse invalide du serveur');
      }

      const { user: userData, access_token } = response.data;

      if (!userData || !access_token || !isValidUserData(userData)) {
        console.error('❌ Données manquantes:', { userData, access_token });
        throw new Error('Données utilisateur ou token manquant');
      }

      const completeUser = normalizeUserData(userData);

      localStorage.setItem('access_token', access_token);
      setUser(completeUser);
      setIsLoggedIn(true);

      console.log('✅ Inscription réussie:', userData);
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erreur d\'inscription';
      setError(message);
      console.error('❌ Erreur d\'inscription complète:', {
        error: err,
        message,
        response: err.response,
        data: err.response?.data
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Déconnexion
  const logout = async (): Promise<void> => {
    try {
      // Pas besoin d'appeler l'API pour logout simple
      localStorage.removeItem('access_token');
      setUser(null);
      setStats(null);
      setIsLoggedIn(false);
      setError(null);
      setProfileLoaded(false);

      console.log('🚪 Déconnexion réussie');
    } catch (err) {
      console.error('❌ Erreur lors de la déconnexion:', err);
    }
  };

  // Charger le profil
  const loadProfile = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await userAPI.getMyProfile();
      const userData = response.data;

      if (!isValidUserData(userData)) {
        throw new Error('Données utilisateur invalides reçues du serveur');
      }

      const completeUser = normalizeUserData(userData);

      setUser(completeUser);
      setProfileLoaded(true);
      console.log('👤 Profil chargé:', completeUser.username);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur de chargement du profil';
      setError(message);
      console.error('❌ Erreur chargement profil:', message);

      // Si erreur 401, déconnecter
      if (err.response?.status === 401) {
        await logout();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger le profil automatiquement au démarrage si connecté (une seule fois)
  useEffect(() => {
    if (isLoggedIn && !user && !profileLoaded && !loading) {
      setProfileLoaded(true);
      loadProfile();
    }
  }, [isLoggedIn, user, profileLoaded, loading, loadProfile]);

  // Charger les statistiques
  const loadStats = async (): Promise<void> => {
    try {
      const response = await userAPI.getMyStats();
      setStats(response.data);
      console.log('📊 Stats chargées:', response.data);
    } catch (err: any) {
      console.error('❌ Erreur chargement stats:', err.response?.data?.message);
    }
  };

  // Charger le dashboard complet
  const loadDashboard = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await userAPI.getDashboard();
      const dashboardData: DashboardData = response.data;

      setUser(dashboardData.user);
      setStats(dashboardData.stats);

      console.log('🎯 Dashboard chargé:', dashboardData);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur de chargement du dashboard';
      setError(message);
      console.error('❌ Erreur chargement dashboard:', message);
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour le profil
  const updateProfile = async (data: UpdateUserDto): Promise<boolean> => {
    if (!user) return false;

    try {
      setLoading(true);
      const response = await userAPI.updateProfile(user.id, data);
      setUser(response.data);

      console.log('✅ Profil mis à jour:', response.data);
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur de mise à jour';
      setError(message);
      console.error('❌ Erreur mise à jour profil:', message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour le statut en ligne
  const setOnlineStatus = async (isOnline: boolean): Promise<void> => {
    try {
      await userAPI.updateOnlineStatus(isOnline);
      if (user) {
        setUser({ ...user, isOnline });
      }
      console.log(`🟢 Statut ${isOnline ? 'en ligne' : 'hors ligne'} mis à jour`);
    } catch (err) {
      console.error('❌ Erreur mise à jour statut:', err);
    }
  };

  // Upload avatar
  const uploadAvatar = async (file: File): Promise<boolean> => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await userAPI.uploadAvatar(formData);
      if (user) {
        setUser({ ...user, avatar: response.data.avatar });
      }

      console.log('✅ Avatar uploadé:', response.data);
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur d\'upload';
      setError(message);
      console.error('❌ Erreur upload avatar:', message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer avatar
  const removeAvatar = async (): Promise<boolean> => {
    try {
      await userAPI.removeAvatar();
      if (user) {
        setUser({ ...user, avatar: undefined });
      }

      console.log('✅ Avatar supprimé');
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur de suppression';
      setError(message);
      console.error('❌ Erreur suppression avatar:', message);
      return false;
    }
  };

  const contextValue: UserContextType = {
    user,
    stats,
    isLoggedIn,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    loadProfile,
    loadStats,
    loadDashboard,
    setOnlineStatus,
    uploadAvatar,
    removeAvatar,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};