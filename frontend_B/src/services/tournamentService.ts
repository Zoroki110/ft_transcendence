import axios from 'axios';
import { Tournament, Match } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Simulateur de données pour développement
const mockTournaments: Tournament[] = [
  {
    id: 1,
    name: "Cyber Championship 2024",
    description: "Le tournoi ultime pour prouver votre valeur dans l'arène cyber !",
    type: "SINGLE_ELIMINATION",
    status: "OPEN",
    maxParticipants: 16,
    currentParticipants: 8,
    creatorId: 1,
    createdAt: "2024-09-01",
    updatedAt: "2024-09-05",
    participants: [],
    bracketGenerated: false,
    isRegistrationOpen: true,
    canStart: false,
    isFull: false
  },
  {
    id: 2,
    name: "Neon Warriors Arena",
    description: "Combats épiques dans un univers néon futuriste !",
    type: "DOUBLE_ELIMINATION",
    status: "IN_PROGRESS",
    maxParticipants: 8,
    currentParticipants: 8,
    creatorId: 2,
    createdAt: "2024-08-15",
    updatedAt: "2024-08-20",
    participants: [],
    bracketGenerated: true,
    isRegistrationOpen: false,
    canStart: false,
    isFull: true
  }
];

export const tournamentService = {
  // Récupérer tous les tournois
  async getAllTournaments(): Promise<{ tournaments: Tournament[] }> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simuler latence
    return { tournaments: mockTournaments };
  },

  // Récupérer un tournoi par ID
  async getTournament(id: number): Promise<Tournament> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const tournament = mockTournaments.find(t => t.id === id);
    if (!tournament) throw new Error('Tournoi introuvable');
    return tournament;
  },

  // Créer un nouveau tournoi
  async createTournament(data: Partial<Tournament>): Promise<Tournament> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const newTournament: Tournament = {
      id: Date.now(),
      name: data.name || '',
      description: data.description || '',
      type: data.type || 'SINGLE_ELIMINATION',
      status: 'DRAFT',
      maxParticipants: data.maxParticipants || 8,
      currentParticipants: 0,
      creatorId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      participants: [],
      bracketGenerated: false,
      isRegistrationOpen: false,
      canStart: false,
      isFull: false
    };
    mockTournaments.push(newTournament);
    return newTournament;
  }
};
