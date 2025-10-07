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
  ) {}

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
    console.log('🔍 NEW JOIN LOGIC START:', { tournamentId, userId });

    // Simple transaction sans complexité
    return await this.tournamentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // Charger le tournoi avec les participants
        const tournament = await transactionalEntityManager.findOne(
          Tournament,
          {
            where: { id: tournamentId },
            relations: ['creator', 'participants'],
          },
        );

        if (!tournament) {
          throw new NotFoundException('Tournoi introuvable');
        }

        // Vérifications de base
        if (tournament.status !== TournamentStatus.DRAFT && tournament.status !== TournamentStatus.OPEN) {
          throw new BadRequestException('Impossible de rejoindre ce tournoi');
        }

        // Vérifier si pas déjà inscrit
        const isAlreadyParticipant = tournament.participants.some(p => p.id === userId);
        if (isAlreadyParticipant) {
          throw new ConflictException('Vous êtes déjà inscrit à ce tournoi');
        }

        // Vérifier la capacité
        if (tournament.participants.length >= tournament.maxParticipants) {
          throw new BadRequestException('Le tournoi est complet');
        }

        // Charger l'utilisateur
        const user = await transactionalEntityManager.findOne(User, {
          where: { id: userId },
        });
        if (!user) {
          throw new NotFoundException('Utilisateur introuvable');
        }

        // Ajouter à la table de liaison directement via SQL pour éviter les problèmes
        await transactionalEntityManager.query(
          `INSERT INTO tournament_participants (tournaments_id, user_id) VALUES ($1, $2)`,
          [tournamentId, userId]
        );

        // Compter les participants réels
        const participantCount = await transactionalEntityManager.query(
          `SELECT COUNT(*) as count FROM tournament_participants WHERE tournaments_id = $1`,
          [tournamentId]
        );
        const actualCount = parseInt(participantCount[0].count);

        // Mettre à jour le statut simple
        let newStatus: TournamentStatus = tournament.status;
        if (actualCount >= tournament.maxParticipants) {
          newStatus = TournamentStatus.FULL;
        } else if (tournament.status === TournamentStatus.DRAFT) {
          newStatus = TournamentStatus.OPEN;
        }

        // Mise à jour directe via SQL
        await transactionalEntityManager.query(
          `UPDATE tournament SET current_participants = $1, status = $2 WHERE id = $3`,
          [actualCount, newStatus, tournamentId]
        );

        console.log('✅ NEW JOIN LOGIC SUCCESS:', {
          tournamentId,
          userId,
          newParticipantCount: actualCount,
          newStatus
        });

        // Recharger pour retourner
        const result = await transactionalEntityManager.findOne(Tournament, {
          where: { id: tournamentId },
          relations: ['creator', 'participants', 'matches', 'winner'],
        });
        
        if (!result) {
          throw new NotFoundException('Tournoi introuvable après mise à jour');
        }
        
        return result;
      },
    );
  }

  async leaveTournament(
    tournamentId: number,
    userId: number,
  ): Promise<Tournament> {
    console.log('🔍 LEAVE TOURNAMENT START:', { tournamentId, userId });

    // Utiliser une transaction pour garantir l'atomicité
    return await this.tournamentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // Charger le tournoi avec toutes les relations (pas de verrou pessimiste pour éviter l'erreur FOR UPDATE)
        const tournament = await transactionalEntityManager.findOne(
          Tournament,
          {
            where: { id: tournamentId },
            relations: ['creator', 'participants', 'matches', 'winner'],
          },
        );

        if (!tournament) {
          throw new NotFoundException('Tournoi introuvable');
        }

        console.log('🔍 TOURNAMENT STATE BEFORE LEAVE:', {
          id: tournament.id,
          status: tournament.status,
          currentParticipants: tournament.currentParticipants,
          participantsArrayLength: tournament.participants.length,
          participantIds: tournament.participants.map((p) => p.id),
          userTryingToLeave: userId,
        });

        // Vérifications strictes
        if (tournament.status === TournamentStatus.IN_PROGRESS) {
          throw new BadRequestException(
            'Impossible de quitter un tournoi en cours',
          );
        }

        if (tournament.status === TournamentStatus.COMPLETED) {
          throw new BadRequestException(
            'Impossible de quitter un tournoi terminé',
          );
        }

        // Vérifier si l'utilisateur est bien participant
        const isParticipant = tournament.participants.some(
          (p) => p.id === userId,
        );
        if (!isParticipant) {
          throw new BadRequestException("Vous n'êtes pas inscrit à ce tournoi");
        }

        // Retirer le participant
        tournament.participants = tournament.participants.filter(
          (p) => p.id !== userId,
        );

        // Mettre à jour le compteur et le statut automatiquement
        const newParticipantCount = tournament.participants.length;
        tournament.currentParticipants = newParticipantCount;

        // Ajuster le statut selon le nombre de participants
        if (
          tournament.status === TournamentStatus.FULL &&
          newParticipantCount < tournament.maxParticipants
        ) {
          tournament.status = TournamentStatus.OPEN;
        }

        // Si plus aucun participant (sauf le créateur qui peut être participant), revenir en draft
        if (
          newParticipantCount === 0 &&
          tournament.status === TournamentStatus.OPEN
        ) {
          tournament.status = TournamentStatus.DRAFT;
        }

        // Force la synchronisation avant sauvegarde
        tournament.currentParticipants = tournament.participants.length;

        const savedTournament = await transactionalEntityManager.save(
          Tournament,
          tournament,
        );

        // Force une mise à jour SQL directe pour être 100% sûr
        await transactionalEntityManager.query(
          'UPDATE tournament SET current_participants = $1 WHERE id = $2',
          [tournament.participants.length, tournamentId],
        );

        // Vérification post-sauvegarde
        const reloadedTournament = await transactionalEntityManager.findOne(
          Tournament,
          {
            where: { id: tournamentId },
            relations: ['creator', 'participants', 'matches', 'winner'],
          },
        );

        console.log('✅ TOURNAMENT LEFT:', {
          tournamentId: savedTournament.id,
          savedParticipantCount: savedTournament.currentParticipants,
          reloadedParticipantCount: reloadedTournament?.currentParticipants,
          actualParticipantsLength: reloadedTournament?.participants.length,
          newStatus: savedTournament.status,
          participantIds: savedTournament.participants.map((p) => p.id),
        });

        return reloadedTournament || savedTournament;
      },
    );
  }

  // ===== GESTION DES BRACKETS =====

  async generateBrackets(
    tournamentId: number,
    userId: number,
  ): Promise<Tournament> {
    console.log('🔥 NEW SIMPLE BRACKETS GENERATION:', { tournamentId, userId });

    const tournament = await this.findOne(tournamentId, userId);

    // Vérifications simples
    if (tournament.creatorId !== userId) {
      throw new ForbiddenException('Seul le créateur peut générer les brackets');
    }

    if (tournament.status !== TournamentStatus.FULL) {
      throw new BadRequestException('Le tournoi doit être complet pour générer les brackets');
    }

    if (tournament.participants.length < 2) {
      throw new BadRequestException('Il faut au moins 2 participants');
    }

    // Supprimer tous les anciens matches
    await this.matchRepository.query(
      'DELETE FROM match WHERE tournament_id = $1',
      [tournamentId]
    );

    // Générer les matches du premier round directement en SQL
    const participants = tournament.participants;
    const matchesCreated: any[] = [];

    for (let i = 0; i < participants.length; i += 2) {
      if (i + 1 < participants.length) {
        const result = await this.matchRepository.query(`
          INSERT INTO match (player1_id, player2_id, round, bracket_position, status, player1score, player2score, tournament_id, createdat)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          RETURNING id
        `, [
          participants[i].id,
          participants[i + 1].id,
          1,
          Math.floor(i / 2),
          'pending',
          0,
          0,
          tournamentId
        ]);
        matchesCreated.push(result[0]);
      }
    }

    // Mettre à jour le tournoi
    await this.tournamentRepository.query(
      'UPDATE tournament SET bracket_generated = true, status = $1 WHERE id = $2',
      [TournamentStatus.IN_PROGRESS, tournamentId]
    );

    console.log('✅ NEW BRACKETS SUCCESS:', {
      tournamentId,
      matchesCreated: matchesCreated.length,
      participants: participants.length
    });

    // Recharger le tournoi
    return await this.findOne(tournamentId, userId);
  }

  async startTournament(
    tournamentId: number,
    userId: number,
  ): Promise<Tournament> {
    console.log('🚀 SUPER SIMPLE START:', { tournamentId, userId });

    const tournament = await this.findOne(tournamentId, userId);

    // Vérifications de base
    if (tournament.creatorId !== userId) {
      throw new ForbiddenException('Seul le créateur peut démarrer le tournoi');
    }

    if (tournament.status !== TournamentStatus.FULL) {
      throw new BadRequestException('Le tournoi doit être complet');
    }

    if (tournament.participants.length < 2) {
      throw new BadRequestException('Il faut au moins 2 participants');
    }

    console.log('👥 PARTICIPANTS:', tournament.participants.map(p => ({ id: p.id, username: p.username })));

    // ÉTAPE 1: Supprimer les anciens matches
    await this.matchRepository.query(
      'DELETE FROM match WHERE tournament_id = $1',
      [tournamentId]
    );
    console.log('🗑️ Anciens matches supprimés');

    // ÉTAPE 2: Mélanger les participants aléatoirement
    const shuffled = [...tournament.participants].sort(() => Math.random() - 0.5);
    console.log('🎲 ORDRE ALÉATOIRE:', shuffled.map(p => p.username));

    // ÉTAPE 3: Créer les matches du premier round avec TypeORM
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        const player1 = shuffled[i];
        const player2 = shuffled[i + 1];
        
        const match = this.matchRepository.create({
          player1: player1,
          player2: player2,
          round: 1,
          bracketPosition: Math.floor(i / 2),
          status: 'pending',
          player1Score: 0,
          player2Score: 0,
          tournament: tournament
        });

        await this.matchRepository.save(match);
        console.log(`🆚 MATCH CRÉÉ: ${player1.username} vs ${player2.username}`);
      }
    }

    // ÉTAPE 4: Démarrer le tournoi avec TypeORM
    await this.tournamentRepository.update(tournamentId, {
      status: TournamentStatus.IN_PROGRESS,
      bracketGenerated: true,
      startDate: new Date()
    });

    console.log('✅ TOURNOI DÉMARRÉ avec brackets générés automatiquement');

    return await this.findOne(tournamentId, userId);
  }

  async forceRegenerateBrackets(
    tournamentId: number,
    userId: number,
  ): Promise<Tournament> {
    console.log('🔧 FORCE REGENERATE: Starting force regeneration for tournament', tournamentId);
    
    // Use transaction to ensure all operations are atomic
    return await this.tournamentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const tournament = await transactionalEntityManager.findOne(Tournament, {
          where: { id: tournamentId },
          relations: ['creator', 'participants', 'matches', 'winner'],
        });

        if (!tournament) {
          throw new NotFoundException('Tournoi introuvable');
        }

        if (tournament.creatorId !== userId) {
          throw new ForbiddenException(
            'Seul le créateur peut forcer la regénération des brackets',
          );
        }

    // Supprimer tous les matches existants avec une requête SQL directe
    await this.matchRepository.query(
      'DELETE FROM match WHERE tournament_id = $1',
      [tournamentId]
    );
    console.log('🗑️ FORCE REGENERATE: Existing matches removed via SQL');

    // Réinitialiser le flag bracket
    tournament.bracketGenerated = false;

    // Forcer la génération même si le statut est IN_PROGRESS
    const matches: any[] = [];
    if (tournament.participants && tournament.participants.length >= 2) {
      console.log('🚀 FORCE REGENERATE: Generating new matches');

      if (tournament.type === TournamentType.SINGLE_ELIMINATION) {
        // Générer les matches avec SQL direct
        for (let i = 0; i < tournament.participants.length; i += 2) {
          if (i + 1 < tournament.participants.length) {
            const result = await this.matchRepository.query(`
              INSERT INTO match (player1_id, player2_id, round, bracket_position, status, player1score, player2score, tournament_id)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              RETURNING id
            `, [
              tournament.participants[i].id,
              tournament.participants[i + 1].id,
              1,
              Math.floor(i / 2),
              'pending',
              0,
              0,
              tournamentId
            ]);
            matches.push(result[0]);
          }
        }
        console.log('✅ FORCE REGENERATE: Generated', matches.length, 'matches via SQL');
      }

      tournament.bracketGenerated = true;
      tournament.status = TournamentStatus.FULL; // Remettre à FULL pour permettre le start propre
    } else {
      throw new BadRequestException('Pas assez de participants pour générer les brackets');
    }

    const result = await transactionalEntityManager.save(Tournament, tournament);
    console.log('🎉 FORCE REGENERATE: Tournament updated successfully');

    if (matches.length > 0) {
      console.log(`🎯 TOURNAMENT: Tournament ${tournament.id} regenerated with ${matches.length} matches`);
    }

    return result;
      },
    );
  }

  async resetTournamentBrackets(
    tournamentId: number,
    userId: number,
  ): Promise<Tournament> {
    console.log('🔄 RESET BRACKETS: Starting reset for tournament', tournamentId);
    
    const tournament = await this.findOne(tournamentId, userId);

    if (tournament.creatorId !== userId) {
      throw new ForbiddenException(
        'Seul le créateur peut réinitialiser le tournoi',
      );
    }

    console.log('🔄 RESET BRACKETS: Current state', {
      status: tournament.status,
      participants: tournament.participants?.length,
      bracketGenerated: tournament.bracketGenerated
    });

    // Supprimer tous les matches via SQL direct
    await this.matchRepository.query(
      'DELETE FROM match WHERE tournament_id = $1',
      [tournamentId]
    );
    console.log('🗑️ RESET BRACKETS: Deleted matches via SQL');

    // Réinitialiser complètement l'état du tournoi
    tournament.bracketGenerated = false;
    tournament.status = TournamentStatus.FULL;
    tournament.startDate = undefined as any;
    tournament.endDate = undefined as any;
    tournament.winnerId = undefined as any;

    const savedTournament = await this.tournamentRepository.save(tournament);
    console.log('✅ RESET BRACKETS: Tournament reset to FULL status');

    return savedTournament;
  }

  async getBrackets(tournamentId: number, userId?: number) {
    const tournament = await this.findOne(tournamentId, userId);

    if (!tournament.bracketGenerated) {
      throw new BadRequestException('Les brackets ne sont pas encore générés');
    }

    const matches = await this.getMatchesWithPlayers(tournamentId);

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

    return {
      tournamentId,
      tournamentName: tournament.name,
      status: tournament.status,
      type: tournament.type,
      totalRounds: Object.keys(bracketsByRound).length,
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
      player1Score: match.player1score || 0,
      player2Score: match.player2score || 0,
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

    // Vérifier que le match n'est pas déjà commencé
    if (match.status !== 'pending') {
      throw new BadRequestException(`Match déjà ${match.status}`);
    }

    // Mettre le match en statut "active"
    await this.matchRepository.update(matchId, {
      status: 'active',
    });

    // Créer une game room pour ce match de tournoi
    const gameId = `tournament_${matchId}`;
    this.gameGateway.createTournamentRoom(gameId, matchId, match.player1, match.player2);

    console.log(`✅ Match ${matchId} démarré entre ${match.player1.username} et ${match.player2.username}`);
    console.log(`🎮 Game room créée: ${gameId}`);

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
    const tournament = await this.findOne(tournamentId, userId);

    if (tournament.creatorId !== userId) {
      throw new ForbiddenException(
        'Seul le créateur peut faire avancer les gagnants',
      );
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
          return fullMatch.player1Score > fullMatch.player2Score
            ? fullMatch.player1
            : fullMatch.player2;
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

  private async autoGenerateBrackets(tournament: Tournament, transactionalEntityManager: any): Promise<void> {
    console.log('🎯 AUTO-BRACKETS: Starting auto generation for tournament', tournament.id);
    
    if (tournament.participants.length < 2) {
      throw new Error('Pas assez de participants pour générer les brackets');
    }

    if (tournament.type === TournamentType.SINGLE_ELIMINATION) {
      const matches = await this.generateSingleEliminationMatchesInTransaction(
        tournament.participants,
        tournament.id,
        transactionalEntityManager
      );
      
      if (matches.length === 0) {
        throw new Error('Aucun match généré');
      }
      
      console.log('🎯 AUTO-BRACKETS: Generated', matches.length, 'matches for tournament', tournament.id);
    } else {
      throw new Error('Type de tournoi non supporté pour la génération automatique');
    }
  }

  private async generateSingleEliminationMatchesInTransaction(
    participants: User[],
    tournamentId: number,
    transactionalEntityManager: any
  ): Promise<Match[]> {
    console.log('🎯 AUTO-BRACKETS: Generating matches within transaction');
    
    const matches: Match[] = [];

    for (let i = 0; i < participants.length; i += 2) {
      if (i + 1 < participants.length) {
        // Utiliser le transactionalEntityManager pour la requête SQL
        const result = await transactionalEntityManager.query(`
          INSERT INTO match (player1_id, player2_id, round, bracket_position, status, player1score, player2score, tournament_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `, [
          participants[i].id,
          participants[i + 1].id,
          1,
          Math.floor(i / 2),
          'pending',
          0,
          0,
          tournamentId
        ]);

        console.log(`🎯 AUTO-BRACKETS: Created match ${matches.length + 1}:`, {
          id: result[0].id,
          player1: participants[i].username,
          player2: participants[i + 1].username,
          tournament_id: tournamentId
        });

        // Créer un objet Match pour le retour
        const match = this.matchRepository.create({});
        match.id = result[0].id;
        match.player1 = participants[i];
        match.player2 = participants[i + 1];
        match.round = 1;
        match.bracketPosition = Math.floor(i / 2);
        match.status = 'pending';
        match.player1Score = 0;
        match.player2Score = 0;

        matches.push(match);
      }
    }

    console.log('🎯 AUTO-BRACKETS: Total matches created:', matches.length);
    return matches;
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

  private async generateSingleEliminationMatches(
    participants: User[],
    tournamentId: number,
    transactionalEntityManager: any,
  ): Promise<Match[]> {
    console.log('=== MATCH GENERATION DEBUG ===');
    console.log('Participants received:', participants.length);
    console.log(
      'Participant details:',
      participants.map((p) => ({ id: p.id, username: p.username })),
    );

    // Load the full tournament entity for proper relation using the same transaction manager
    const tournament = await (transactionalEntityManager ? 
      transactionalEntityManager.findOne(Tournament, { where: { id: tournamentId } }) :
      this.tournamentRepository.findOne({ where: { id: tournamentId } }));

    if (!tournament) {
      throw new Error(`Tournament with ID ${tournamentId} not found`);
    }

    const matches: Match[] = [];

    // Create matches directly with SQL using the transactional entity manager
    for (let i = 0; i < participants.length; i += 2) {
      if (i + 1 < participants.length) {
        // Générer un game_id compatible avec le système existant 
        const gameId = `tournament_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log(`🔧 CREATING MATCH: Creating match with player1=${participants[i].id}, player2=${participants[i + 1].id}, tournament_id=${tournamentId} (type: ${typeof tournamentId}), game_id=${gameId}`);
        
        // Use direct SQL with explicit column names and values to avoid any TypeORM issues
        const manager = transactionalEntityManager || this.matchRepository.manager;
        const result = await manager.query(`
          INSERT INTO match (player1_id, player2_id, tournament_id, round, bracket_position, status, "player1Score", "player2Score", game_id) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
          RETURNING *
        `, [
          participants[i].id,      // $1
          participants[i + 1].id,  // $2  
          tournamentId,            // $3
          1,                       // $4
          Math.floor(i / 2),       // $5
          'pending',               // $6
          0,                       // $7
          0,                       // $8
          gameId                   // $9
        ]);
        
        console.log(`🔧 INSERTED MATCH:`, result[0]);

        // Immediately verify the match was created correctly
        const verification = await manager.query(`SELECT * FROM match WHERE id = $1`, [result[0].id]);
        console.log(`🔧 VERIFICATION:`, verification[0]);
        
        // Create a Match object for the return array
        const match = {
          id: result[0].id,
          player1: participants[i],
          player2: participants[i + 1],
          round: 1,
          bracketPosition: Math.floor(i / 2),
          status: 'pending',
          player1Score: 0,
          player2Score: 0,
          gameId: result[0].game_id,
        } as Match;

        matches.push(match);

        console.log(`Created match ${matches.length}:`, {
          id: result[0].id,
          player1: participants[i].username,
          player2: participants[i + 1].username,
          tournament_id: result[0].tournament_id
        });
      }
    }

    console.log('Total matches created:', matches.length);
    return matches;
  }
}
