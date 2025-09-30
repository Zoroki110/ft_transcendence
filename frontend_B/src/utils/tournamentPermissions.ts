// frontend_B/src/utils/tournamentPermissions.ts

import { Tournament, User } from '../types';

export interface TournamentPermissions {
  // Permissions de base
  canView: boolean;
  canJoin: boolean;
  canLeave: boolean;
  
  // Permissions de créateur
  isCreator: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canStart: boolean;
  canManageParticipants: boolean;
  canViewPrivateInfo: boolean;
  
  // États
  isParticipant: boolean;
  isFull: boolean;
  canRegister: boolean;
  
  // Messages d'aide
  joinMessage: string;
  statusMessage: string;
}

export function getTournamentPermissions(
  tournament: Tournament | null, 
  user: User | null,
  isLoggedIn: boolean
): TournamentPermissions {
  
  if (!tournament) {
    return {
      canView: false,
      canJoin: false,
      canLeave: false,
      isCreator: false,
      canEdit: false,
      canDelete: false,
      canStart: false,
      canManageParticipants: false,
      canViewPrivateInfo: false,
      isParticipant: false,
      isFull: false,
      canRegister: false,
      joinMessage: '',
      statusMessage: ''
    };
  }

  const isCreator = !!(user && tournament.creator?.id === user.id);
  const isParticipant = !!(user && tournament.participants?.some(p => p.id === user.id));
  const isFull = tournament.currentParticipants >= tournament.maxParticipants;
  
  // États du tournoi
  const isOpen = tournament.status === 'draft' || tournament.status === 'open';
  const isInProgress = tournament.status === 'in_progress';
  const isCompleted = tournament.status === 'completed';
  const isCancelled = tournament.status === 'cancelled';

  // Permissions de base
  const canView = true; // Tout le monde peut voir les tournois publics
  
  // Le créateur peut toujours rejoindre son propre tournoi (sauf si complet)
  const canJoin = isLoggedIn && 
                 !isParticipant && 
                 isOpen && 
                 (isCreator || !isFull); // Créateur peut joindre même si presque complet
                 
  const canLeave = isLoggedIn && 
                  isParticipant && 
                  isOpen; // Créateur et participants peuvent quitter si ouvert

  // Permissions de créateur
  const canEdit = isCreator && (tournament.status === 'draft' || tournament.status === 'open');
  const canDelete = isCreator && tournament.status !== 'in_progress';
  const canStart = isCreator && 
                  isOpen && 
                  tournament.currentParticipants >= 2 && 
                  !tournament.matches?.length;
  const canManageParticipants = isCreator && isOpen;
  const canViewPrivateInfo = isCreator;

  // États combinés
  const canRegister = canJoin;

  // Messages d'aide
  let joinMessage = '';
  let statusMessage = '';

  if (!isLoggedIn) {
    joinMessage = 'Connectez-vous pour rejoindre ce tournoi';
  } else if (isParticipant) {
    joinMessage = 'Vous participez déjà à ce tournoi';
  } else if (isFull) {
    joinMessage = 'Ce tournoi est complet';
  } else if (!isOpen) {
    if (isInProgress) {
      joinMessage = 'Ce tournoi est en cours';
    } else if (isCompleted) {
      joinMessage = 'Ce tournoi est terminé';
    } else if (isCancelled) {
      joinMessage = 'Ce tournoi a été annulé';
    } else {
      joinMessage = 'Les inscriptions ne sont pas encore ouvertes';
    }
  } else {
    joinMessage = 'Vous pouvez rejoindre ce tournoi';
  }

  // Message de statut
  if (isCreator) {
    if (tournament.status === 'draft') {
      statusMessage = 'Votre tournoi est en brouillon - vous pouvez le modifier';
    } else if (tournament.status === 'open') {
      statusMessage = `Votre tournoi est ouvert - ${tournament.currentParticipants}/${tournament.maxParticipants} participants`;
    } else if (tournament.status === 'full') {
      statusMessage = 'Votre tournoi est complet - vous pouvez le démarrer';
    } else if (tournament.status === 'in_progress') {
      statusMessage = 'Votre tournoi est en cours';
    } else if (tournament.status === 'completed') {
      statusMessage = 'Votre tournoi est terminé';
    }
  } else {
    statusMessage = `Créé par ${tournament.creator?.username || 'Inconnu'}`;
  }

  return {
    canView,
    canJoin,
    canLeave,
    isCreator,
    canEdit,
    canDelete,
    canStart,
    canManageParticipants,
    canViewPrivateInfo,
    isParticipant,
    isFull,
    canRegister,
    joinMessage,
    statusMessage
  };
}