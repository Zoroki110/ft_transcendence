// frontend_B/src/types/tournament.ts
export interface Tournament {
  id: number;
  name: string;
  description?: string;
  type: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'ROUND_ROBIN';
  status: 'DRAFT' | 'OPEN' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  maxParticipants: number;
  currentParticipants: number;
  registrationStart?: string;
  registrationEnd?: string;
  startDate?: string;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
  participants: User[];
  bracketGenerated: boolean;
  isRegistrationOpen: boolean;
  canStart: boolean;
  isFull: boolean;
}

export interface Match {
  id: number;
  player1: string;
  player2: string;
  player1Score: number;
  player2Score: number;
  status: 'pending' | 'in_progress' | 'finished';
  round: number;
  bracketPosition: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
}