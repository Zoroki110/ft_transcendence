// src/tournaments/tournaments.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament, TournamentStatus, TournamentType } from '../entities/tournament.entity';
import { User } from '../entities/user.entity';
import { Match } from '../entities/match.entity';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { TournamentQueryDto } from './dto/tournament-query.dto';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
  ) {}

  // ===== CRUD BASIQUE =====

  async create(createTournamentDto: CreateTournamentDto, creatorId: number): Promise<Tournament> {
    const creator = await this.userRepository.findOne({ where: { id: creatorId } });
    if (!creator) {
      throw new NotFoundException('Créateur introuvable');
    }

    this.validateDates(createTournamentDto);

    const tournament = this.tournamentRepository.create({
      ...createTournamentDto,
      creator,
      creatorId,
      status: TournamentStatus.DRAFT,
      currentParticipants: 0,
    });

    return await this.tournamentRepository.save(tournament);
  }

  async findAll(query: TournamentQueryDto): Promise<{ tournaments: Tournament[]; total: number }> {
    const { status, type, isPublic, limit = 10, page = 1 } = query;
    
    const queryBuilder = this.tournamentRepository
      .createQueryBuilder('tournament')
      .leftJoinAndSelect('tournament.creator', 'creator')
      .leftJoinAndSelect('tournament.participants', 'participants')
      .leftJoinAndSelect('tournament.winner', 'winner');

    if (status) {
      queryBuilder.andWhere('tournament.status = :status', { status });
    }
    if (type) {
      queryBuilder.andWhere('tournament.type = :type', { type });
    }
    if (isPublic !== undefined) {
      queryBuilder.andWhere('tournament.isPublic = :isPublic', { isPublic });
    }

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);
    queryBuilder.orderBy('tournament.createdAt', 'DESC');

    const [tournaments, total] = await queryBuilder.getManyAndCount();
    return { tournaments, total };
  }

  async findOne(id: number): Promise<Tournament> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id },
      relations: ['creator', 'participants', 'matches', 'winner'],
    });

    if (!tournament) {
      throw new NotFoundException('Tournoi introuvable');
    }

    return tournament;
  }

  async update(id: number, updateTournamentDto: UpdateTournamentDto, userId: number): Promise<Tournament> {
    const tournament = await this.findOne(id);

    if (tournament.creatorId !== userId) {
      throw new ForbiddenException('Seul le créateur peut modifier ce tournoi');
    }

    this.validateUpdate(tournament, updateTournamentDto);
    Object.assign(tournament, updateTournamentDto);

    return await this.tournamentRepository.save(tournament);
  }

  async remove(id: number, userId: number): Promise<void> {
    const tournament = await this.findOne(id);

    if (tournament.creatorId !== userId) {
      throw new ForbiddenException('Seul le créateur peut supprimer ce tournoi');
    }

    if (tournament.status === TournamentStatus.IN_PROGRESS) {
      throw new BadRequestException('Impossible de supprimer un tournoi en cours');
    }

    await this.tournamentRepository.remove(tournament);
  }

  // ===== GESTION DES PARTICIPANTS =====

  async joinTournament(tournamentId: number, userId: number): Promise<Tournament> {
    const tournament = await this.findOne(tournamentId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    if (!tournament.isRegistrationOpen) {
      throw new BadRequestException('Les inscriptions ne sont pas ouvertes pour ce tournoi');
    }

    if (tournament.isFull) {
      throw new BadRequestException('Le tournoi est complet');
    }

    const isAlreadyParticipant = tournament.participants.some(p => p.id === userId);
    if (isAlreadyParticipant) {
      throw new ConflictException('Vous êtes déjà inscrit à ce tournoi');
    }

    tournament.participants.push(user);
    tournament.currentParticipants = tournament.participants.length;

    if (tournament.isFull) {
      tournament.status = TournamentStatus.FULL;
    } else if (tournament.status === TournamentStatus.DRAFT) {
      tournament.status = TournamentStatus.OPEN;
    }

    return await this.tournamentRepository.save(tournament);
  }

  async leaveTournament(tournamentId: number, userId: number): Promise<Tournament> {
    const tournament = await this.findOne(tournamentId);

    if (tournament.status === TournamentStatus.IN_PROGRESS) {
      throw new BadRequestException('Impossible de quitter un tournoi en cours');
    }

    tournament.participants = tournament.participants.filter(p => p.id !== userId);
    tournament.currentParticipants = tournament.participants.length;

    if (tournament.status === TournamentStatus.FULL) {
      tournament.status = TournamentStatus.OPEN;
    }

    return await this.tournamentRepository.save(tournament);
  }

  // ===== GESTION DES BRACKETS =====

  async generateBrackets(tournamentId: number, userId: number): Promise<Tournament> {
    const tournament = await this.findOne(tournamentId);
    
    // ADD THIS DEBUG BLOCK
    console.log('=== GENERATE BRACKETS DEBUG ===');
    console.log('Tournament ID:', tournament.id);
    console.log('Tournament status:', tournament.status);
    console.log('Current participants:', tournament.currentParticipants);
    console.log('Bracket generated:', tournament.bracketGenerated);
    console.log('Can start result:', tournament.canStart);
    
    if (tournament.creatorId !== userId) {
      throw new ForbiddenException('Seul le créateur peut générer les brackets');
    }
  
    if (!tournament.canStart) {
      console.log('CANSTART FAILED - Status:', tournament.status, 'Participants:', tournament.currentParticipants, 'BracketGenerated:', tournament.bracketGenerated);
      throw new BadRequestException('Le tournoi ne peut pas encore commencer');
    }
  
    if (tournament.bracketGenerated && tournament.matches.length > 0) {
      throw new BadRequestException('Les brackets ont déjà été générés');
    }
  
    console.log('Participants before generating matches:', tournament.participants.length);
  
    let matches: Match[] = [];
    if (tournament.type === TournamentType.SINGLE_ELIMINATION) {
      matches = this.generateSingleEliminationMatches(tournament.participants, tournament.id);
    } else {
      throw new BadRequestException('Type de tournoi non supporté pour le moment');
    }
  
    console.log('Generated matches:', matches.length);
  
    // Sauvegarder les matches avec validation
    try {
      if (matches.length > 0) {
        const savedMatches = await this.matchRepository.save(matches);
        console.log('Successfully saved matches:', savedMatches.length);
        console.log('Saved match IDs:', savedMatches.map(m => m.id));
    
        // FORCE UPDATE tournament_id with raw SQL (individual updates)
        for (const match of savedMatches) {
          await this.matchRepository.query(
            'UPDATE match SET tournament_id = $1 WHERE id = $2',
            [tournamentId, match.id]
          );
        }
        console.log('Force updated tournament_id for matches:', savedMatches.map(m => m.id));
      } else {
        console.error('No matches generated!');
      }
    } catch (error) {
      console.error('Error saving matches:', error);
      throw new BadRequestException('Failed to create matches');
    }
  
    tournament.bracketGenerated = true;
    tournament.status = TournamentStatus.IN_PROGRESS;
  
    return await this.tournamentRepository.save(tournament);
  }

  async getBrackets(tournamentId: number) {
    const tournament = await this.findOne(tournamentId);
    
    if (!tournament.bracketGenerated) {
      throw new BadRequestException('Les brackets ne sont pas encore générés');
    }

    const matches = await this.getMatchesWithPlayers(tournamentId);
    
    // Organiser les matches par round
    const bracketsByRound = matches.reduce((acc, match) => {
      const round = match.round || 1;
      if (!acc[round]) {
        acc[round] = [];
      }
      acc[round].push({
        id: match.id,
        player1: match.player1?.username || 'TBD',
        player2: match.player2?.username || 'TBD',
        player1Score: match.player1Score || 0,
        player2Score: match.player2Score || 0,
        status: match.status,
        bracketPosition: match.bracketPosition,
      });
      return acc;
    }, {} as Record<number, any[]>);

    return {
      tournamentId,
      tournamentName: tournament.name,
      status: tournament.status,
      type: tournament.type,
      totalRounds: Object.keys(bracketsByRound).length,
      brackets: bracketsByRound
    };
  }

  async getMatchesWithPlayers(tournamentId: number): Promise<Match[]> {
    return await this.matchRepository.find({
      where: { tournament: { id: tournamentId } },  // Changed this line
      relations: ['player1', 'player2', 'tournament'],
    });
  }

  // ===== PROGRESSION DES MATCHES =====

  async advanceWinner(
    tournamentId: number, 
    matchId: number, 
    winnerId: number, 
    player1Score: number, 
    player2Score: number, 
    userId: number
  ): Promise<any> {
    const tournament = await this.findOne(tournamentId);
    
    if (tournament.creatorId !== userId) {
      throw new ForbiddenException('Seul le créateur peut faire avancer les gagnants');
    }

    const match = await this.matchRepository.findOne({
      where: { id: matchId, tournament: { id: tournamentId } },
      relations: ['player1', 'player2'],
    });

    if (!match) {
      throw new NotFoundException('Match introuvable');
    }

    if (match.status === 'finished') {
      throw new BadRequestException('Ce match est déjà terminé');
    }

    if (winnerId !== match.player1.id && winnerId !== match.player2.id) {
      throw new BadRequestException('Le gagnant doit être un des joueurs du match');
    }

    // Mettre à jour le match
    match.player1Score = player1Score;
    match.player2Score = player2Score;
    match.status = 'finished';
    match.finishedAt = new Date();

    await this.matchRepository.save(match);

    // Déterminer le gagnant
    const winner = winnerId === match.player1.id ? match.player1 : match.player2;

    // Créer le match suivant ou déclarer le champion
    const result = await this.createNextRoundMatch(tournament, match, winner);

    return {
      message: result.isChampion ? 'Tournoi terminé !' : 'Match terminé avec succès',
      match: {
        id: match.id,
        winner: winner.username,
        finalScore: `${player1Score} - ${player2Score}`,
        status: 'finished',
      },
      ...result,
    };
  }

  private async createNextRoundMatch(tournament: Tournament, completedMatch: Match, winner: User): Promise<any> {
    const currentRound = completedMatch.round;
    const nextRound = currentRound + 1;
    
    // Vérifier si tous les matches du round actuel sont terminés
    const currentRoundMatches = await this.matchRepository.find({
      where: { tournament: { id: tournament.id }, round: currentRound },
    });
    
    const completedCurrentRoundMatches = currentRoundMatches.filter(m => m.status === 'finished');
    
    // Si tous les matches du round actuel sont terminés
    if (completedCurrentRoundMatches.length === currentRoundMatches.length) {
      const winners = await Promise.all(
        completedCurrentRoundMatches.map(async (match) => {
          const fullMatch = await this.matchRepository.findOne({
            where: { id: match.id },
            relations: ['player1', 'player2'],
          });
          if (!fullMatch) {
            throw new Error(`Match with id ${match.id} not found`);
          }
          return fullMatch.player1Score > fullMatch.player2Score ? fullMatch.player1 : fullMatch.player2;
        })
      );
      
      // S'il ne reste qu'un gagnant, c'est le champion
      if (winners.length === 1) {
        tournament.winnerId = winners[0].id;
        tournament.winner = winners[0];
        tournament.status = TournamentStatus.COMPLETED;
        tournament.endDate = new Date();
        
        // Mettre à jour les stats du champion
        await this.userRepository.update(winners[0].id, {
          tournamentsWon: () => 'tournamentsWon + 1'
        });
        
        await this.tournamentRepository.save(tournament);
        
        return {
          isChampion: true,
          champion: {
            id: winners[0].id,
            username: winners[0].username,
          },
        };
      }
      
      // Créer les matches du round suivant
      const nextRoundMatches: Partial<Match>[] = [];
      for (let i = 0; i < winners.length; i += 2) {
        if (i + 1 < winners.length) {
          nextRoundMatches.push({
            player1: winners[i],
            player2: winners[i + 1],
            tournament: { id: tournament.id } as Tournament,
            round: nextRound,
            bracketPosition: Math.floor(i / 2),
            status: 'pending',
          });
        }
      }
      
      if (nextRoundMatches.length > 0) {
        await this.matchRepository.save(nextRoundMatches);
        return {
          isChampion: false,
          nextRoundCreated: true,
          nextRound: nextRound,
          matchesCreated: nextRoundMatches.length,
        };
      }
    }
    
    return {
      isChampion: false,
      waitingForOtherMatches: true,
    };
  }

  // ===== STATISTIQUES ET LEADERBOARD =====

  async getTournamentStats(tournamentId: number): Promise<any> {
    const tournament = await this.findOne(tournamentId);
    
    const completedMatches = await this.matchRepository.count({
      where: { tournament: { id: tournamentId }, status: 'finished' }
    });

    const totalMatches = await this.matchRepository.count({
      where: { tournament: { id: tournamentId } }
    });

    return {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
        participants: tournament.currentParticipants,
        maxParticipants: tournament.maxParticipants,
        bracketGenerated: tournament.bracketGenerated,
      },
      progress: {
        completedMatches,
        totalMatches,
        percentComplete: totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0,
      },
      currentRound: await this.getCurrentRound(tournamentId),
    };
  }

  async getLeaderboard(tournamentId: number) {
    const tournament = await this.findOne(tournamentId);
    const matches = await this.getMatchesWithPlayers(tournamentId);
    
    const stats = new Map<number, {
      user: User;
      wins: number;
      losses: number;
      totalScore: number;
      eliminated: boolean;
      finalRound: number;
    }>();

    // Initialiser les stats
    tournament.participants.forEach(participant => {
      stats.set(participant.id, {
        user: participant,
        wins: 0,
        losses: 0,
        totalScore: 0,
        eliminated: false,
        finalRound: 0
      });
    });

    // Calculer les stats depuis les matches
    matches.forEach(match => {
      if (match.status === 'finished' && match.player1 && match.player2) {
        const player1Stats = stats.get(match.player1.id);
        const player2Stats = stats.get(match.player2.id);
        
        if (player1Stats && player2Stats) {
          player1Stats.totalScore += match.player1Score || 0;
          player2Stats.totalScore += match.player2Score || 0;
          player1Stats.finalRound = Math.max(player1Stats.finalRound, match.round || 1);
          player2Stats.finalRound = Math.max(player2Stats.finalRound, match.round || 1);
          
          if (match.player1Score > match.player2Score) {
            player1Stats.wins++;
            player2Stats.losses++;
            player2Stats.eliminated = true;
          } else {
            player2Stats.wins++;
            player1Stats.losses++;
            player1Stats.eliminated = true;
          }
        }
      }
    });

    // Convertir en array et trier
    const leaderboard = Array.from(stats.values())
      .sort((a, b) => {
        if (a.finalRound !== b.finalRound) {
          return b.finalRound - a.finalRound;
        }
        if (a.wins !== b.wins) {
          return b.wins - a.wins;
        }
        return b.totalScore - a.totalScore;
      })
      .map((stat, index) => ({
        position: index + 1,
        user: {
          id: stat.user.id,
          username: stat.user.username,
          avatar: stat.user.avatar
        },
        wins: stat.wins,
        losses: stat.losses,
        totalScore: stat.totalScore,
        finalRound: stat.finalRound,
        eliminated: stat.eliminated,
        isChampion: tournament.winnerId === stat.user.id
      }));

    return {
      tournamentId,
      tournamentName: tournament.name,
      status: tournament.status,
      leaderboard
    };
  }

  // ===== MÉTHODES UTILITAIRES =====

  private async getCurrentRound(tournamentId: number): Promise<number> {
    const result = await this.matchRepository
      .createQueryBuilder('match')
      .select('MAX(match.round)', 'maxRound')
      .where('match.tournamentId = :tournamentId', { tournamentId })
      .getRawOne();
    
    return result?.maxRound || 0;
  }

  private validateDates(dto: CreateTournamentDto): void {
    const now = new Date();
    
    if (dto.registrationStart && new Date(dto.registrationStart) < now) {
      throw new BadRequestException('La date de début des inscriptions ne peut pas être dans le passé');
    }

    if (dto.registrationEnd && dto.registrationStart && 
        new Date(dto.registrationEnd) <= new Date(dto.registrationStart)) {
      throw new BadRequestException('La date de fin des inscriptions doit être après le début');
    }

    if (dto.startDate && dto.registrationEnd && 
        new Date(dto.startDate) <= new Date(dto.registrationEnd)) {
      throw new BadRequestException('La date de début du tournoi doit être après la fin des inscriptions');
    }
  }

  private validateUpdate(tournament: Tournament, dto: UpdateTournamentDto): void {
    if (dto.status && tournament.status === TournamentStatus.IN_PROGRESS && 
        dto.status !== TournamentStatus.IN_PROGRESS && dto.status !== TournamentStatus.COMPLETED) {
      throw new BadRequestException('Un tournoi en cours ne peut être que complété');
    }

    if (dto.maxParticipants && dto.maxParticipants < tournament.currentParticipants) {
      throw new BadRequestException('Le nombre maximum de participants ne peut pas être inférieur au nombre actuel');
    }
  }

  private generateSingleEliminationMatches(participants: User[], tournamentId: number): Match[] {
    console.log('=== MATCH GENERATION DEBUG ===');
    console.log('Participants received:', participants.length);
    console.log('Participant details:', participants.map(p => ({ id: p.id, username: p.username })));
    
    const matches: Match[] = [];
    
    for (let i = 0; i < participants.length; i += 2) {
      if (i + 1 < participants.length) {
        // Use the repository to create the match properly
        const match = this.matchRepository.create({
          player1: { id: participants[i].id } as User,
          player2: { id: participants[i + 1].id } as User,
          round: 1,
          bracketPosition: Math.floor(i / 2),
          status: 'pending',
          player1Score: 0,
          player2Score: 0,
        });

        match.tournament = { id: tournamentId } as Tournament;  
        
        matches.push(match);
        console.log(`Created match ${matches.length}:`, {
          player1: participants[i].username,
          player2: participants[i + 1].username
        });
      }
    }
    
    console.log('Total matches to save:', matches.length);
    return matches;
  }
}