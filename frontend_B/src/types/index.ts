// frontend_B/src/types/index.ts - TYPES COMPLETS BAS�S SUR BACKEND

// ===== AUTH TYPES =====
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  access_token: string;
}

export interface TwoFAVerifyRequest {
  code: string;
}

// ===== USER TYPES =====
export interface User {
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
  updatedAt?: string;

  // Calculé côté client (toujours défini)
  winRate: number;
  totalGames: number;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  displayName?: string;
  avatar?: string;
}

export interface UserStats {
  gamesWon: number;
  gamesLost: number;
  tournamentsWon: number;
  totalScore: number;
  winRate: number;
  totalGames: number;
  averageScore: number;
}

// ===== FRIENDS TYPES =====
export interface FriendRequest {
  id: number;
  requester: User;
  addressee: User;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface SendFriendRequestDto {
  addresseeId: number;
}

export interface FriendRequestResponseDto {
  accept: boolean;
}

// ===== TOURNAMENT TYPES =====
export interface Tournament {
  id: number;
  name: string;
  description?: string;
  type: 'single_elimination' | 'double_elimination' | 'round_robin';
  status: 'waiting' | 'in_progress' | 'finished' | 'cancelled';
  isPublic: boolean;
  maxParticipants: number;
  currentParticipants: number;
  creatorId: number;
  creator?: User;
  participants: User[];
  matches?: Match[];

  // Dates
  registrationDeadline?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTournamentDto {
  name: string;
  description?: string;
  type: 'single_elimination' | 'double_elimination' | 'round_robin';
  isPublic?: boolean;
  maxParticipants: number;
  registrationDeadline?: string;
  startDate?: string;
}

export interface UpdateTournamentDto {
  name?: string;
  description?: string;
  isPublic?: boolean;
  maxParticipants?: number;
  registrationDeadline?: string;
  startDate?: string;
}

export interface JoinTournamentDto {
  // Peut �tre vide pour l'instant
}

export interface TournamentQueryDto {
  status?: 'waiting' | 'in_progress' | 'finished' | 'cancelled';
  type?: 'single_elimination' | 'double_elimination' | 'round_robin';
  isPublic?: boolean;
  limit?: number;
  page?: number;
}

export interface TournamentStats {
  totalParticipants: number;
  completedMatches: number;
  totalMatches: number;
  averageMatchDuration?: number;
  winnerStats?: UserStats;
}

export interface TournamentLeaderboard {
  position: number;
  user: User;
  wins: number;
  losses: number;
  points: number;
  isEliminated: boolean;
}

// ===== MATCH/GAME TYPES =====
export interface Match {
  id: number;
  player1?: User;
  player2?: User;
  player1Score: number;
  player2Score: number;
  winner?: User;
  status: 'waiting' | 'in_progress' | 'finished' | 'cancelled';

  // Tournoi info
  tournamentId?: number;
  tournament?: Tournament;
  round?: number;
  bracketPosition?: number;

  // Dates
  scheduledAt?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
}

export interface CreateMatchDto {
  player1Id?: number;
  player2Id?: number;
  tournamentId?: number;
  round?: number;
  bracketPosition?: number;
}

export interface FinishMatchDto {
  winnerId: number;
  player1Score: number;
  player2Score: number;
}

export interface AdvanceWinnerDto {
  winnerId: number;
  player1Score: number;
  player2Score: number;
}

// ===== QUERY TYPES =====
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface MatchHistoryQueryDto extends PaginationQuery {
  status?: 'waiting' | 'in_progress' | 'finished' | 'cancelled';
  tournamentId?: number;
  opponentId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface OnlineStatusDto {
  isOnline: boolean;
}

export interface UpdateDisplayNameDto {
  displayName: string;
}

// ===== API RESPONSE TYPES =====
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TournamentListResponse {
  tournaments: Tournament[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardData {
  user: User;
  stats: UserStats;
  friendsCount: number;
  onlineFriendsCount: number;
  pendingRequestsCount: number;
  recentMatches: Match[];
}

// ===== BRACKET TYPES =====
export interface BracketNode {
  id: string;
  matchId?: number;
  player1?: User;
  player2?: User;
  winner?: User;
  round: number;
  position: number;
  children?: BracketNode[];
}

export interface Bracket {
  tournamentId: number;
  tree: BracketNode;
  totalRounds: number;
  currentRound: number;
}

// ===== ERROR TYPES =====
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  details?: any;
}

// ===== FORM TYPES =====
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface TournamentFormData {
  name: string;
  description: string;
  type: 'single_elimination' | 'double_elimination' | 'round_robin';
  isPublic: boolean;
  maxParticipants: number;
  registrationDeadline: string;
  startDate: string;
}

export interface ProfileFormData {
  username: string;
  email: string;
  displayName: string;
}

// ===== UTILITY TYPES =====
export type TournamentStatus = 'waiting' | 'in_progress' | 'finished' | 'cancelled';
export type TournamentType = 'single_elimination' | 'double_elimination' | 'round_robin';
export type MatchStatus = 'waiting' | 'in_progress' | 'finished' | 'cancelled';
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

// ===== SEARCH TYPES =====
export interface SearchUsersResponse {
  users: User[];
  total: number;
}

export interface SearchQuery {
  q: string;
  limit?: number;
}

// ===== HEALTH CHECK =====
export interface HealthCheck {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  database?: 'connected' | 'disconnected';
}