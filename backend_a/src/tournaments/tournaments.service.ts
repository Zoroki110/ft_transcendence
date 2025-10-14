// src/tournaments/tournaments.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameGateway } from '../game/game.gateway';
import { GameService } from '../game/game.service';
import {
  Tournament,
  TournamentStatus,
  TournamentType,
} from '../entities/tournament.entity';
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
    private readonly gameGateway: GameGateway,
    private readonly gameService: GameService,
  ) {
    // Set up circular dependency with GameService
    this.gameService.setTournamentsService(this);
  }

  // ===== CRUD BASIQUE =====

  async create(
    createTournamentDto: CreateTournamentDto,
    creatorId: number,
  ): Promise<Tournament> {
    const creator = await this.userRepository.findOne({
      where: { id: creatorId },
    });
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
      participants: [creator], // Auto-enroll creator using TypeORM relations
    });

    const savedTournament = await this.tournamentRepository.save(tournament);

    // Mettre à jour le compteur et le statut avec le créateur inscrit
    await this.tournamentRepository.update(savedTournament.id, {
      currentParticipants: 1,
      status: TournamentStatus.OPEN,
    });

    console.log('✅ CREATOR AUTO-ENROLLED via TypeORM relations');

    // Recharger avec les participants
    const result = await this.tournamentRepository.findOne({
      where: { id: savedTournament.id },
      relations: ['creator', 'participants'],
    });
    
    if (!result) {
      throw new NotFoundException('Tournoi introuvable après création');
    }
    
    return result;
  }

  async findAll(
    query: TournamentQueryDto,
    userId?: number,
  ): Promise<{ tournaments: Tournament[]; total: number }> {
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
    } else {
      // Filtrage par défaut : ne montrer que les tournois publics ou ceux créés par l'utilisateur connecté
      if (userId) {
        queryBuilder.andWhere(
          '(tournament.isPublic = true OR tournament.creatorId = :userId)',
          { userId },
        );
      } else {
        // Utilisateur non connecté : uniquement les tournois publics
        queryBuilder.andWhere('tournament.isPublic = true');
      }
    }

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);
    queryBuilder.orderBy('tournament.createdAt', 'DESC');

    const [tournaments, total] = await queryBuilder.getManyAndCount();
    return { tournaments, total };
  }

  async findActive(
    query: TournamentQueryDto,
    userId?: number,
  ): Promise<{ tournaments: Tournament[]; total: number }> {
    // Tournois actifs = draft, open, full, in_progress
    const activeQuery = { 
      ...query, 
      status: undefined // On ne veut pas utiliser le status du query
    };
    
    const { type, isPublic, limit = 10, page = 1 } = activeQuery;

    const queryBuilder = this.tournamentRepository
      .createQueryBuilder('tournament')
      .leftJoinAndSelect('tournament.creator', 'creator')
      .leftJoinAndSelect('tournament.participants', 'participants')
      .leftJoinAndSelect('tournament.winner', 'winner')
      .andWhere('tournament.status IN (:...activeStatuses)', { 
        activeStatuses: [
          TournamentStatus.DRAFT, 
          TournamentStatus.OPEN, 
          TournamentStatus.FULL, 
          TournamentStatus.IN_PROGRESS
        ] 
      });

    if (type) {
      queryBuilder.andWhere('tournament.type = :type', { type });
    }
    if (isPublic !== undefined) {
      queryBuilder.andWhere('tournament.isPublic = :isPublic', { isPublic });
    } else {
      if (userId) {
        queryBuilder.andWhere(
          '(tournament.isPublic = true OR tournament.creatorId = :userId)',
          { userId },
        );
      } else {
        queryBuilder.andWhere('tournament.isPublic = true');
      }
    }

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);
    queryBuilder.orderBy('tournament.createdAt', 'DESC');

    const [tournaments, total] = await queryBuilder.getManyAndCount();
    return { tournaments, total };
  }

  async findCompleted(
    query: TournamentQueryDto,
    userId?: number,
  ): Promise<{ tournaments: Tournament[]; total: number }> {
    // Tournois terminés = completed, cancelled
    const completedQuery = { 
      ...query, 
      status: undefined 
    };
    
    const { type, isPublic, limit = 10, page = 1 } = completedQuery;

    const queryBuilder = this.tournamentRepository
      .createQueryBuilder('tournament')
      .leftJoinAndSelect('tournament.creator', 'creator')
      .leftJoinAndSelect('tournament.participants', 'participants')
      .leftJoinAndSelect('tournament.winner', 'winner')
      .andWhere('tournament.status IN (:...completedStatuses)', { 
        completedStatuses: [
          TournamentStatus.COMPLETED, 
          TournamentStatus.CANCELLED
        ] 
      });

    if (type) {
      queryBuilder.andWhere('tournament.type = :type', { type });
    }
    if (isPublic !== undefined) {
      queryBuilder.andWhere('tournament.isPublic = :isPublic', { isPublic });
    } else {
      if (userId) {
        queryBuilder.andWhere(
          '(tournament.isPublic = true OR tournament.creatorId = :userId)',
          { userId },
        );
      } else {
        queryBuilder.andWhere('tournament.isPublic = true');
      }
    }

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);
    queryBuilder.orderBy('tournament.endDate', 'DESC'); // Trier par date de fin pour les terminés

    const [tournaments, total] = await queryBuilder.getManyAndCount();
    return { tournaments, total };
  }

  async findOne(id: number, userId?: number): Promise<Tournament> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id },
      relations: ['creator', 'participants', 'matches', 'winner'],
    });

    if (!tournament) {
      throw new NotFoundException('Tournoi introuvable');
    }

    // Vérifier les permissions pour les tournois privés
    if (!tournament.isPublic) {
      // Si le tournoi est privé, seul le créateur ou les participants peuvent le voir
      if (!userId) {
        throw new NotFoundException('Tournoi introuvable');
      }

      const isCreator = tournament.creatorId === userId;
      const isParticipant = tournament.participants?.some(
        (p) => p.id === userId,
      );

      if (!isCreator && !isParticipant) {
        throw new NotFoundException('Tournoi introuvable');
      }
    }

    return tournament;
  }

  async update(
    id: number,
    updateTournamentDto: UpdateTournamentDto,
    userId: number,
  ): Promise<Tournament> {
    const tournament = await this.findOne(id, userId);

    if (tournament.creatorId !== userId) {
      throw new ForbiddenException('Seul le créateur peut modifier ce tournoi');
    }

    this.validateUpdate(tournament, updateTournamentDto);
    Object.assign(tournament, updateTournamentDto);

    return await this.tournamentRepository.save(tournament);
  }

  async remove(id: number, userId: number): Promise<void> {
    const tournament = await this.findOne(id, userId);

    if (tournament.creatorId !== userId) {
      throw new ForbiddenException(
        'Seul le créateur peut supprimer ce tournoi',
      );
    }

    // Le créateur peut supprimer son tournoi même s'il est en cours
    // Cela permet de nettoyer les tournois en état incohérent
    console.log(`🗑️ TOURNAMENTS: Suppression du tournoi ${id} (status: ${tournament.status}) par le créateur ${userId}`);

    // Supprimer d'abord tous les matches associés pour éviter les contraintes FK
    if (tournament.matches && tournament.matches.length > 0) {
      await this.matchRepository.remove(tournament.matches);
      console.log(`🗑️ TOURNAMENTS: ${tournament.matches.length} matches supprimés`);
    }

    await this.tournamentRepository.remove(tournament);
    console.log(`✅ TOURNAMENTS: Tournoi ${id} supprimé avec succès`);
  }

  // ===== GESTION DES PARTICIPANTS =====

  async joinTournament(
    tournamentId: number,
    userId: number,
  ): Promise<Tournament> {
    console.log('🔍 JOIN TOURNAMENT:', { tournamentId, userId });

    const tournament = await this.findOne(tournamentId);
    
    if (tournament.status !== TournamentStatus.DRAFT && tournament.status !== TournamentStatus.OPEN) {
      throw new BadRequestException('Impossible de rejoindre ce tournoi');
    }

    // Check if already a participant
    const isAlreadyParticipant = tournament.participants.some(p => p.id === userId);
    if (isAlreadyParticipant) {
      throw new ConflictException('Vous êtes déjà inscrit à ce tournoi');
    }

    // Check capacity
    if (tournament.participants.length >= tournament.maxParticipants) {
      throw new BadRequestException('Le tournoi est complet');
    }

    // Load user
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    // Add participant
    tournament.participants.push(user);
    tournament.currentParticipants = tournament.participants.length;

    // Update status based on participant count
    if (tournament.participants.length >= tournament.maxParticipants) {
      tournament.status = TournamentStatus.FULL;
    } else if (tournament.status === TournamentStatus.DRAFT) {
      tournament.status = TournamentStatus.OPEN;
    }

    await this.tournamentRepository.save(tournament);
    
    console.log('✅ JOIN SUCCESS:', {
      tournamentId,
      userId,
      participantCount: tournament.participants.length,
      status: tournament.status
    });

    return await this.findOne(tournamentId);
  }

  async leaveTournament(
    tournamentId: number,
    userId: number,
  ): Promise<Tournament> {
    console.log('🔍 LEAVE TOURNAMENT:', { tournamentId, userId });

    const tournament = await this.findOne(tournamentId);

    if (tournament.status === TournamentStatus.IN_PROGRESS) {
      throw new BadRequestException('Impossible de quitter un tournoi en cours');
    }

    if (tournament.status === TournamentStatus.COMPLETED) {
      throw new BadRequestException('Impossible de quitter un tournoi terminé');
    }

    // Check if user is a participant
    const isParticipant = tournament.participants.some(p => p.id === userId);
    if (!isParticipant) {
      throw new BadRequestException("Vous n'êtes pas inscrit à ce tournoi");
    }

    // Remove participant
    tournament.participants = tournament.participants.filter(p => p.id !== userId);
    tournament.currentParticipants = tournament.participants.length;

    // Update status based on participant count
    if (tournament.status === TournamentStatus.FULL && tournament.participants.length < tournament.maxParticipants) {
      tournament.status = TournamentStatus.OPEN;
    }

    if (tournament.participants.length === 0 && tournament.status === TournamentStatus.OPEN) {
      tournament.status = TournamentStatus.DRAFT;
    }

    await this.tournamentRepository.save(tournament);

    console.log('✅ LEAVE SUCCESS:', {
      tournamentId,
      userId,
      participantCount: tournament.participants.length,
      status: tournament.status
    });

    return await this.findOne(tournamentId);
  }

  // ===== GESTION DES BRACKETS =====

  private calculateTotalRounds(participantCount: number): number {
    // Pour un tournoi à élimination simple : log2(participants)
    return Math.ceil(Math.log2(participantCount));
  }

  private calculateMatchesPerRound(participantCount: number, round: number): number {
    // Round 1: participantCount / 2
    // Round 2: participantCount / 4  
    // Round 3: participantCount / 8, etc.
    // Mais on doit s'assurer que le nombre est entier et correct
    const matchesInRound = Math.floor(participantCount / Math.pow(2, round));
    return Math.max(1, matchesInRound); // Au minimum 1 match (la finale)
  }

  async generateBrackets(
    tournamentId: number,
    userId: number,
  ): Promise<Tournament> {
    console.log('🔥 SIMPLE BRACKETS GENERATION:', { tournamentId, userId });

    const tournament = await this.findOne(tournamentId, userId);

    if (tournament.creatorId !== userId) {
      throw new ForbiddenException('Seul le créateur peut générer les brackets');
    }

    if (tournament.status !== TournamentStatus.FULL) {
      throw new BadRequestException('Le tournoi doit être complet pour générer les brackets');
    }

    if (tournament.participants.length < 2) {
      throw new BadRequestException('Il faut au moins 2 participants');
    }

    // Clear existing matches
    await this.matchRepository.delete({ tournament: { id: tournamentId } });

    // Generate first round matches
    const participants = tournament.participants;
    const matches: Match[] = [];

    for (let i = 0; i < participants.length; i += 2) {
      if (i + 1 < participants.length) {
        const match = this.matchRepository.create({
          player1: participants[i],
          player2: participants[i + 1],
          tournament: tournament,
          round: 1,
          bracketPosition: Math.floor(i / 2),
          status: 'pending',
          player1Score: 0,
          player2Score: 0,
        });
        matches.push(await this.matchRepository.save(match));
      }
    }

    // Update tournament status
    await this.tournamentRepository.update(tournamentId, {
      bracketGenerated: true,
      status: TournamentStatus.IN_PROGRESS,
    });

    console.log('✅ BRACKETS SUCCESS:', {
      tournamentId,
      matchesCreated: matches.length,
      participants: participants.length
    });

    return await this.findOne(tournamentId, userId);
  }

  async startTournament(
    tournamentId: number,
    userId: number,
  ): Promise<Tournament> {
    console.log('🚀 START TOURNAMENT:', { tournamentId, userId });

    const tournament = await this.findOne(tournamentId, userId);

    if (tournament.creatorId !== userId) {
      throw new ForbiddenException('Seul le créateur peut démarrer le tournoi');
    }

    if (tournament.status !== TournamentStatus.FULL) {
      throw new BadRequestException('Le tournoi doit être complet');
    }

    if (tournament.participants.length < 2) {
      throw new BadRequestException('Il faut au moins 2 participants');
    }

    // If brackets not generated, generate them first
    if (!tournament.bracketGenerated) {
      return await this.generateBrackets(tournamentId, userId);
    }

    // Just update status if brackets already exist
    await this.tournamentRepository.update(tournamentId, {
      status: TournamentStatus.IN_PROGRESS,
      startDate: new Date()
    });

    console.log('✅ TOURNAMENT STARTED');
    return await this.findOne(tournamentId, userId);
  }

  async forceRegenerateBrackets(
    tournamentId: number,
    userId: number,
  ): Promise<Tournament> {
    console.log('🔧 FORCE REGENERATE BRACKETS:', { tournamentId, userId });
    
    const tournament = await this.findOne(tournamentId, userId);

    if (tournament.creatorId !== userId) {
      throw new ForbiddenException('Seul le créateur peut forcer la regénération des brackets');
    }

    if (tournament.participants.length < 2) {
      throw new BadRequestException('Pas assez de participants pour générer les brackets');
    }

    // Clear all matches
    await this.matchRepository.delete({ tournament: { id: tournamentId } });
    console.log('🗑️ Existing matches cleared');

    // Reset and regenerate
    await this.tournamentRepository.update(tournamentId, {
      bracketGenerated: false,
      status: TournamentStatus.FULL
    });

    // Generate new brackets
    return await this.generateBrackets(tournamentId, userId);
  }

  async resetTournamentBrackets(
    tournamentId: number,
    userId: number,
  ): Promise<Tournament> {
    console.log('🔄 RESET TOURNAMENT BRACKETS:', { tournamentId, userId });
    
    const tournament = await this.findOne(tournamentId, userId);

    if (tournament.creatorId !== userId) {
      throw new ForbiddenException('Seul le créateur peut réinitialiser le tournoi');
    }

    // Clear all matches
    await this.matchRepository.delete({ tournament: { id: tournamentId } });
    console.log('🗑️ All matches cleared');

    // Reset tournament to original state
    await this.tournamentRepository.update(tournamentId, {
      bracketGenerated: false,
      status: TournamentStatus.FULL,
      startDate: undefined,
      endDate: undefined,
      winnerId: undefined
    });

    console.log('✅ TOURNAMENT RESET TO FULL STATUS');
    return await this.findOne(tournamentId, userId);
  }

  async getBrackets(tournamentId: number, userId?: number) {
    const tournament = await this.findOne(tournamentId, userId);

    if (!tournament.bracketGenerated) {
      throw new BadRequestException('Les brackets ne sont pas encore générés');
    }

    const matches = await this.getMatchesWithPlayers(tournamentId);
    
    // CALCUL FORCÉ DE LA STRUCTURE COMPLÈTE
    const participantCount = tournament.participants?.length || 4;
    const expectedTotalRounds = this.calculateTotalRounds(participantCount);
    
    console.log(`🔍 BRACKETS DEBUG: Tournament ${tournamentId} with ${participantCount} participants should have ${expectedTotalRounds} rounds`);
    console.log(`🔍 BRACKETS DEBUG: Found ${matches.length} matches in database`);

    // Organiser les matches par round
    const bracketsByRound = matches.reduce(
      (acc, match) => {
        const round = match.round || 1;
        if (!acc[round]) {
          acc[round] = [];
        }
        acc[round].push({
          id: match.id,
          player1: match.player1?.username || 'TBD',
          player2: match.player2?.username || 'TBD',
          player1Id: match.player1?.id,
          player2Id: match.player2?.id,
          player1Score: match.player1Score || 0,
          player2Score: match.player2Score || 0,
          status: match.status,
          bracketPosition: match.bracketPosition,
          gameId: match.gameId,
        });
        return acc;
      },
      {} as Record<number, any[]>,
    );

    // Only show rounds that actually have matches in the database
    // Don't create fake "TBD vs TBD" matches

    const actualRounds = Object.keys(bracketsByRound).length;
    const finalTotalRounds = actualRounds > 0 ? actualRounds : expectedTotalRounds;
    
    console.log(`🏆 BRACKETS FINAL: Returning ${finalTotalRounds} rounds for tournament ${tournamentId}`);

    return {
      tournamentId,
      tournamentName: tournament.name,
      status: tournament.status,
      type: tournament.type,
      totalRounds: finalTotalRounds,
      brackets: bracketsByRound,
    };
  }

  async getMatchesWithPlayers(tournamentId: number): Promise<Match[]> {
    console.log('🔍 GETTING MATCHES: Searching for tournament_id:', tournamentId);
    
    // Use raw SQL to ensure we get matches with the correct tournament_id
    const matches = await this.matchRepository.query(`
      SELECT 
        m.*,
        p1.id as player1_id, p1.username as player1_username,
        p2.id as player2_id, p2.username as player2_username,
        t.id as tournament_id, t.name as tournament_name
      FROM match m
      LEFT JOIN "user" p1 ON m.player1_id = p1.id
      LEFT JOIN "user" p2 ON m.player2_id = p2.id
      LEFT JOIN tournament t ON m.tournament_id = t.id
      WHERE m.tournament_id = $1
      ORDER BY m.round ASC, m.bracket_position ASC
    `, [tournamentId]);

    console.log('🔍 GETTING MATCHES: Found', matches.length, 'matches');
    console.log('🔍 GETTING MATCHES: Raw matches:', matches.map((m: any) => ({
      id: m.id,
      tournament_id: m.tournament_id,
      round: m.round,
      bracket_position: m.bracket_position,
      player1: m.player1_username,
      player2: m.player2_username
    })));

    // Convert raw results to Match entities
    return matches.map((match: any) => ({
      id: match.id,
      player1: { id: match.player1_id, username: match.player1_username },
      player2: { id: match.player2_id, username: match.player2_username },
      player1Score: match.player1Score || 0,
      player2Score: match.player2Score || 0,
      status: match.status,
      round: match.round,
      bracketPosition: match.bracket_position,
      gameId: match.game_id,
      createdAt: match.createdat,
      finishedAt: match.finishedat,
      tournament: { id: match.tournament_id, name: match.tournament_name }
    })) as any;
  }

  // ===== PROGRESSION DES MATCHES =====

  // ===== DÉMARRAGE DES MATCHES =====

  async startTournamentMatch(
    tournamentId: number,
    matchId: number,
    userId: number,
  ): Promise<any> {
    console.log('🚀 START TOURNAMENT MATCH:', { tournamentId, matchId, userId });

    // Vérifier que le match existe et appartient au tournoi
    const match = await this.matchRepository.findOne({
      where: { id: matchId, tournament: { id: tournamentId } },
      relations: ['player1', 'player2', 'tournament'],
    });

    if (!match) {
      throw new NotFoundException('Match introuvable');
    }

    // Vérifier que l'utilisateur est l'un des participants
    if (match.player1.id !== userId && match.player2.id !== userId) {
      throw new ForbiddenException('Vous n\'êtes pas participant à ce match');
    }

    // Vérifier que le match n'est pas terminé
    if (match.status === 'finished') {
      throw new BadRequestException('Ce match est déjà terminé et ne peut plus être rejouée');
    }

    // Mettre le match en statut "active" seulement s'il ne l'est pas déjà
    if (match.status === 'pending') {
      await this.matchRepository.update(matchId, {
        status: 'active',
      });
      console.log(`🚀 Match ${matchId} activé par ${userId}`);
    } else {
      console.log(`🔄 Joueur ${userId} rejoint le match ${matchId} déjà actif`);
    }

    // Créer ou réutiliser la game room pour ce match de tournoi
    const gameId = `game_tournament_${tournamentId}_match_${matchId}`;
    
    // Vérifier si la room existe déjà
    if (!this.gameGateway.gameRooms?.has(gameId)) {
      console.log(`🔍 DEBUG ROOM CREATION: match.player1=${match.player1.username} (id=${match.player1.id}), match.player2=${match.player2.username} (id=${match.player2.id})`);
      this.gameGateway.createTournamentRoom(gameId, matchId, match.player1, match.player2);
      console.log(`🎮 Game room créée: ${gameId}`);
    } else {
      console.log(`🔄 Game room ${gameId} déjà existante, réutilisation`);
    }

    console.log(`✅ Match ${matchId} accessible pour ${match.player1.username} et ${match.player2.username}`);

    // Retourner les informations pour que le frontend puisse rediriger vers le jeu
    return {
      matchId: matchId,
      gameUrl: `/game/${gameId}`,
      player1: {
        id: match.player1.id,
        username: match.player1.username,
      },
      player2: {
        id: match.player2.id,
        username: match.player2.username,
      },
      tournament: {
        id: match.tournament.id,
        name: match.tournament.name,
      },
    };
  }

  async advanceWinner(
    tournamentId: number,
    matchId: number,
    winnerId: number,
    player1Score: number,
    player2Score: number,
    userId: number,
  ): Promise<any> {
    console.log(`🏆 ADVANCE WINNER: tournamentId=${tournamentId}, matchId=${matchId}, winnerId=${winnerId}, scores=${player1Score}-${player2Score}, userId=${userId}`);
    
    const tournament = await this.findOne(tournamentId, userId);

    // Vérifier si l'utilisateur peut faire avancer le tournoi
    // Autorisé: créateur du tournoi OU participant du match concerné
    const match = await this.matchRepository.findOne({
      where: { id: matchId, tournament: { id: tournamentId } },
      relations: ['player1', 'player2', 'tournament'],
    });

    if (!match) {
      throw new NotFoundException('Match introuvable');
    }

    const isCreator = tournament.creatorId === userId;
    const isParticipant = match.player1.id === userId || match.player2.id === userId;

    if (!isCreator && !isParticipant) {
      throw new ForbiddenException(
        'Seul le créateur du tournoi ou les participants du match peuvent faire avancer le tournoi',
      );
    }

    // Le match a déjà été récupéré ci-dessus pour la vérification des permissions

    if (match.status === 'finished') {
      throw new BadRequestException('Ce match est déjà terminé');
    }

    if (winnerId !== match.player1.id && winnerId !== match.player2.id) {
      throw new BadRequestException(
        'Le gagnant doit être un des joueurs du match',
      );
    }

    // Mettre à jour le match
    match.player1Score = player1Score;
    match.player2Score = player2Score;
    match.status = 'finished';
    match.finishedAt = new Date();

    await this.matchRepository.save(match);

    // Déterminer le gagnant
    const winner =
      winnerId === match.player1.id ? match.player1 : match.player2;

    // Créer le match suivant ou déclarer le champion
    const result = await this.createNextRoundMatch(tournament, match, winner);

    return {
      message: result.isChampion
        ? 'Tournoi terminé !'
        : 'Match terminé avec succès',
      match: {
        id: match.id,
        winner: winner.username,
        finalScore: `${player1Score} - ${player2Score}`,
        status: 'finished',
      },
      ...result,
    };
  }

  private async createNextRoundMatch(
    tournament: Tournament,
    completedMatch: Match,
    winner: User,
  ): Promise<any> {
    const currentRound = completedMatch.round;
    const nextRound = currentRound + 1;

    // Vérifier si tous les matches du round actuel sont terminés
    const currentRoundMatches = await this.matchRepository.find({
      where: { tournament: { id: tournament.id }, round: currentRound },
    });

    const completedCurrentRoundMatches = currentRoundMatches.filter(
      (m) => m.status === 'finished',
    );

    console.log(`🔍 ROUND ${currentRound} STATUS: ${completedCurrentRoundMatches.length}/${currentRoundMatches.length} matches completed`);
    
    // Si tous les matches du round actuel sont terminés
    if (completedCurrentRoundMatches.length === currentRoundMatches.length) {
      console.log(`✅ ALL ROUND ${currentRound} MATCHES COMPLETED - ADVANCING TO NEXT ROUND`);
      const winners = await Promise.all(
        completedCurrentRoundMatches.map(async (match) => {
          const fullMatch = await this.matchRepository.findOne({
            where: { id: match.id },
            relations: ['player1', 'player2'],
          });
          if (!fullMatch) {
            throw new Error(`Match with id ${match.id} not found`);
          }
          
          // Determine winner based on scores
          const winner = fullMatch.player1Score > fullMatch.player2Score
            ? fullMatch.player1
            : fullMatch.player2;
            
          console.log(`🏆 MATCH ${fullMatch.id} WINNER: ${winner.username} (${fullMatch.player1.username}: ${fullMatch.player1Score} vs ${fullMatch.player2.username}: ${fullMatch.player2Score})`);
          return winner;
        }),
      );

      // S'il ne reste qu'un gagnant, c'est le champion
      if (winners.length === 1) {
        tournament.winnerId = winners[0].id;
        tournament.winner = winners[0];
        tournament.status = TournamentStatus.COMPLETED;
        tournament.endDate = new Date();

        // Mettre à jour les stats du champion
        await this.userRepository.update(winners[0].id, {
          tournamentsWon: () => 'tournamentsWon + 1',
        });

        await this.tournamentRepository.save(tournament);

        // 🎉 DÉCLENCHER L'ANIMATION DE VICTOIRE
        this.gameGateway.server.to(`tournament_${tournament.id}`).emit('tournamentCompleted', {
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          champion: {
            id: winners[0].id,
            username: winners[0].username,
            avatar: winners[0].avatar,
          },
          completedAt: tournament.endDate,
          celebration: true, // Déclenche l'animation de spray
        });

        console.log(`🎉 TOURNAMENT COMPLETED: ${tournament.name} - Champion: ${winners[0].username}`);

        return {
          isChampion: true,
          champion: {
            id: winners[0].id,
            username: winners[0].username,
          },
        };
      }

      // Vérifier si des matches pour le round suivant existent déjà
      const existingNextRoundMatches = await this.matchRepository.find({
        where: { tournament: { id: tournament.id }, round: nextRound },
      });

      if (existingNextRoundMatches.length > 0) {
        console.log(`⚠️ ROUND ${nextRound} MATCHES ALREADY EXIST: ${existingNextRoundMatches.length} matches found - skipping creation`);
        return {
          isChampion: false,
          nextRoundAlreadyExists: true,
          nextRound: nextRound,
          existingMatches: existingNextRoundMatches.length,
        };
      }

      // Créer les nouveaux matches pour le round suivant avec les gagnants
      console.log(`🏆 WINNERS: ${winners.length} winners to place: ${winners.map(w => w.username).join(', ')}`);
      console.log(`🎯 NEXT-ROUND: Creating ${Math.floor(winners.length / 2)} new matches for round ${nextRound}`);

      let newMatchesCreated = 0;
      for (let i = 0; i < winners.length; i += 2) {
        if (i + 1 < winners.length) {
          console.log(`🔧 CREATING MATCH: ${winners[i].username} vs ${winners[i + 1].username} for Round ${nextRound}`);
          
          // Créer un nouveau match avec les deux gagnants
          const newMatch = this.matchRepository.create({
            player1: winners[i],
            player2: winners[i + 1],
            tournament: tournament,
            round: nextRound,
            bracketPosition: Math.floor(i / 2),
            status: 'pending',
            player1Score: 0,
            player2Score: 0,
          });

          const savedMatch = await this.matchRepository.save(newMatch);

          // Générer le gameId pour ce match
          const gameId = `game_tournament_${tournament.id}_match_${savedMatch.id}`;
          await this.matchRepository.update(savedMatch.id, {
            gameId: gameId
          });

          console.log(`✅ CREATED NEW MATCH ${savedMatch.id}: ${winners[i].username} vs ${winners[i + 1].username} (Round ${nextRound}) - gameId: ${gameId}`);
          
          newMatchesCreated++;
        }
      }

      if (newMatchesCreated > 0) {
        return {
          isChampion: false,
          nextRoundCreated: true,
          nextRound: nextRound,
          matchesCreated: newMatchesCreated,
        };
      }
    }

    return {
      isChampion: false,
      waitingForOtherMatches: true,
    };
  }

  // ===== STATISTIQUES ET LEADERBOARD =====

  async getTournamentStats(
    tournamentId: number,
    userId?: number,
  ): Promise<any> {
    const tournament = await this.findOne(tournamentId, userId);

    const completedMatches = await this.matchRepository.count({
      where: { tournament: { id: tournamentId }, status: 'finished' },
    });

    const totalMatches = await this.matchRepository.count({
      where: { tournament: { id: tournamentId } },
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
        percentComplete:
          totalMatches > 0
            ? Math.round((completedMatches / totalMatches) * 100)
            : 0,
      },
      currentRound: await this.getCurrentRound(tournamentId),
    };
  }

  async getLeaderboard(tournamentId: number, userId?: number) {
    const tournament = await this.findOne(tournamentId, userId);
    const matches = await this.getMatchesWithPlayers(tournamentId);

    const stats = new Map<
      number,
      {
        user: User;
        wins: number;
        losses: number;
        totalScore: number;
        eliminated: boolean;
        finalRound: number;
      }
    >();

    // Initialiser les stats
    tournament.participants.forEach((participant) => {
      stats.set(participant.id, {
        user: participant,
        wins: 0,
        losses: 0,
        totalScore: 0,
        eliminated: false,
        finalRound: 0,
      });
    });

    // Calculer les stats depuis les matches
    matches.forEach((match) => {
      if (match.status === 'finished' && match.player1 && match.player2) {
        const player1Stats = stats.get(match.player1.id);
        const player2Stats = stats.get(match.player2.id);

        if (player1Stats && player2Stats) {
          player1Stats.totalScore += match.player1Score || 0;
          player2Stats.totalScore += match.player2Score || 0;
          player1Stats.finalRound = Math.max(
            player1Stats.finalRound,
            match.round || 1,
          );
          player2Stats.finalRound = Math.max(
            player2Stats.finalRound,
            match.round || 1,
          );

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
          avatar: stat.user.avatar,
        },
        wins: stat.wins,
        losses: stat.losses,
        totalScore: stat.totalScore,
        finalRound: stat.finalRound,
        eliminated: stat.eliminated,
        isChampion: tournament.winnerId === stat.user.id,
      }));

    return {
      tournamentId,
      tournamentName: tournament.name,
      status: tournament.status,
      leaderboard,
    };
  }

  // ===== MÉTHODES UTILITAIRES =====

  async cleanDuplicateMatches(tournamentId: number, userId: number): Promise<any> {
    console.log(`🧹 CLEANING DUPLICATE MATCHES for tournament ${tournamentId} by user ${userId}`);
    
    const tournament = await this.findOne(tournamentId, userId);

    if (tournament.creatorId !== userId) {
      throw new ForbiddenException('Seul le créateur peut nettoyer les doublons');
    }

    // Trouver tous les matches du tournoi
    const allMatches = await this.matchRepository.find({
      where: { tournament: { id: tournamentId } },
      relations: ['player1', 'player2', 'tournament'],
      order: { round: 'ASC', bracketPosition: 'ASC', id: 'ASC' }
    });

    console.log(`🔍 FOUND ${allMatches.length} total matches`);

    const duplicatesRemoved: any[] = [];
    const seenMatches = new Map();

    for (const match of allMatches) {
      // Créer une clé unique basée sur round, bracketPosition et joueurs
      const key = `${match.round}-${match.bracketPosition}-${match.player1?.id}-${match.player2?.id}`;
      
      if (seenMatches.has(key)) {
        // C'est un doublon, supprimer le match avec l'ID plus élevé (le plus récent)
        const existingMatch = seenMatches.get(key);
        const matchToDelete = match.id > existingMatch.id ? match : existingMatch;
        const matchToKeep = match.id > existingMatch.id ? existingMatch : match;

        console.log(`🗑️ DUPLICATE FOUND: Removing match ${matchToDelete.id} (keeping ${matchToKeep.id})`);
        console.log(`   Match details: Round ${match.round}, Position ${match.bracketPosition}, ${match.player1?.username} vs ${match.player2?.username}`);
        
        await this.matchRepository.delete(matchToDelete.id);
        duplicatesRemoved.push({
          deletedMatchId: matchToDelete.id,
          keptMatchId: matchToKeep.id,
          round: match.round,
          bracketPosition: match.bracketPosition,
          players: `${match.player1?.username} vs ${match.player2?.username}`
        });

        // Mettre à jour la map avec le match conservé
        seenMatches.set(key, matchToKeep);
      } else {
        seenMatches.set(key, match);
      }
    }

    console.log(`✅ CLEANUP COMPLETED: Removed ${duplicatesRemoved.length} duplicate matches`);

    return {
      tournamentId,
      duplicatesRemoved: duplicatesRemoved.length,
      details: duplicatesRemoved,
      message: `${duplicatesRemoved.length} matches en double supprimés avec succès`
    };
  }

  async clearAllTournaments(userId: number): Promise<any> {
    console.log(`🧹 CLEARING ALL TOURNAMENTS requested by user ${userId}`);
    
    // Pour simplifier, on permet à tous les utilisateurs connectés de faire cela
    // En production, vous voudriez probablement vérifier les permissions admin
    
    try {
      // Compter les tournois avant suppression
      const tournamentsCount = await this.tournamentRepository.count();
      const matchesCount = await this.matchRepository.count();
      
      console.log(`🔍 FOUND: ${tournamentsCount} tournaments and ${matchesCount} matches to delete`);

      // Supprimer tous les matches en premier (contraintes FK)
      await this.matchRepository.query('DELETE FROM match');
      console.log(`🗑️ DELETED: All matches cleared`);

      // Supprimer les relations participants (table de jointure)
      await this.tournamentRepository.query('DELETE FROM tournament_participants');
      console.log(`🗑️ DELETED: All tournament participants relationships cleared`);

      // Supprimer tous les tournois
      await this.tournamentRepository.query('DELETE FROM tournament');
      console.log(`🗑️ DELETED: All tournaments cleared`);

      // Remettre les séquences à zéro pour avoir des IDs propres
      await this.tournamentRepository.query('ALTER SEQUENCE tournament_id_seq RESTART WITH 1');
      await this.matchRepository.query('ALTER SEQUENCE match_id_seq RESTART WITH 1');
      console.log(`🔄 RESET: ID sequences reset to 1`);

      console.log(`✅ CLEANUP COMPLETED: Database completely cleaned`);

      return {
        success: true,
        tournamentsDeleted: tournamentsCount,
        matchesDeleted: matchesCount,
        message: `Base de données nettoyée avec succès - ${tournamentsCount} tournois et ${matchesCount} matches supprimés`,
        resetInfo: 'Les séquences d\'ID ont été remises à 1'
      };

    } catch (error) {
      console.error(`❌ CLEANUP ERROR:`, error);
      throw new BadRequestException(`Erreur lors du nettoyage: ${error.message}`);
    }
  }

  async checkTournamentProgression(matchId: number): Promise<void> {
    console.log(`🔍 CHECKING TOURNAMENT PROGRESSION for match ${matchId}`);
    
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
      relations: ['tournament', 'player1', 'player2'],
    });

    if (!match || !match.tournament) {
      console.log(`❌ Match ${matchId} not found or not a tournament match`);
      return;
    }

    if (match.status !== 'finished') {
      console.log(`❌ Match ${matchId} is not finished yet`);
      return;
    }

    console.log(`✅ PROGRESSING TOURNAMENT ${match.tournament.id} after match ${matchId} completion`);
    
    // Determine winner based on scores
    const winner = match.player1Score > match.player2Score ? match.player1 : match.player2;
    
    console.log(`🏆 WINNER: ${winner.username} (${match.player1.username}: ${match.player1Score} vs ${match.player2.username}: ${match.player2Score})`);
    
    try {
      await this.createNextRoundMatch(match.tournament, match, winner);
      console.log(`✅ TOURNAMENT PROGRESSION COMPLETED for tournament ${match.tournament.id}`);
    } catch (error) {
      console.error(`❌ TOURNAMENT PROGRESSION FAILED:`, error);
    }
  }



  private async getCurrentRound(tournamentId: number): Promise<number> {
    const result = await this.matchRepository
      .createQueryBuilder('match')
      .select('MAX(match.round)', 'maxRound')
      .where('match.tournamentId = :tournamentId', { tournamentId })
      .getRawOne();

    return result?.maxRound || 0;
  }

  private validateDates(dto: CreateTournamentDto): void {
    // Validation assouplie pour permettre plus de flexibilité
    
    // Vérifier uniquement la cohérence entre les dates (pas par rapport au présent)
    if (
      dto.registrationEnd &&
      dto.registrationStart &&
      new Date(dto.registrationEnd) <= new Date(dto.registrationStart)
    ) {
      throw new BadRequestException(
        'La date de fin des inscriptions doit être après le début',
      );
    }

    if (
      dto.startDate &&
      dto.registrationEnd &&
      new Date(dto.startDate) <= new Date(dto.registrationEnd)
    ) {
      throw new BadRequestException(
        'La date de début du tournoi doit être après la fin des inscriptions',
      );
    }

    // Note: On permet maintenant des dates dans le passé pour faciliter les tests
    console.log('📅 TOURNAMENTS: Validation des dates réussie', {
      registrationStart: dto.registrationStart,
      registrationEnd: dto.registrationEnd,
      startDate: dto.startDate
    });
  }

  private validateUpdate(
    tournament: Tournament,
    dto: UpdateTournamentDto,
  ): void {
    // Le créateur peut maintenant changer le statut pour réparer les tournois cassés
    console.log('🔧 TOURNAMENTS: Update validation', {
      currentStatus: tournament.status,
      newStatus: dto.status,
      tournamentId: tournament.id
    });

    if (
      dto.maxParticipants &&
      dto.maxParticipants < tournament.currentParticipants
    ) {
      throw new BadRequestException(
        'Le nombre maximum de participants ne peut pas être inférieur au nombre actuel',
      );
    }
  }

}
