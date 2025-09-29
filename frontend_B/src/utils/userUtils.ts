// frontend_B/src/utils/userUtils.ts
import { User } from '../types';

/**
 * Normalise les données utilisateur reçues du backend
 * pour s'assurer que tous les champs requis sont présents
 */
export function normalizeUserData(userData: any): User {
  const gamesWon = userData.gamesWon || 0;
  const gamesLost = userData.gamesLost || 0;
  const totalGames = gamesWon + gamesLost;
  const winRate = totalGames > 0 ? (gamesWon / totalGames) * 100 : 0;

  return {
    id: userData.id,
    username: userData.username,
    email: userData.email,
    avatar: userData.avatar || undefined,
    displayName: userData.displayName || userData.username,
    gamesWon,
    gamesLost,
    tournamentsWon: userData.tournamentsWon || 0,
    totalScore: userData.totalScore || 0,
    isOnline: userData.isOnline ?? true,
    lastSeen: userData.lastSeen || undefined,
    createdAt: userData.createdAt || new Date().toISOString(),
    updatedAt: userData.updatedAt || new Date().toISOString(),
    // Champs calculés
    winRate,
    totalGames
  };
}

/**
 * Valide si les données utilisateur sont complètes
 */
export function isValidUserData(userData: any): boolean {
  return !!(
    userData &&
    userData.id &&
    userData.username &&
    userData.email
  );
}