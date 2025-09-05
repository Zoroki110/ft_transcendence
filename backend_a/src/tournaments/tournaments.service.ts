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
    // Vérifier que le créateur existe
    const creator = await this.userRepository.findOne({ where: { id: creatorId } });
    if (!creator) {
      throw new NotFoundException('Créateur introuvable');
    }

    // Valider les dates
    this.validateDates(createTournamentDto);

    // Créer le tournoi
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

    // Filtres
    if (status) {
      queryBuilder.andWhere('tournament.status = :status', { status });
    }
    if (type) {
      queryBuilder.andWhere('tournament.type = :type', { type });
    }
    if (isPublic !== undefined) {
      queryBuilder.andWhere('tournament.isPublic = :isPublic', { isPublic });
    }

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Tri par date de création décroissante
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

    // Vérifier que l'utilisateur a le droit de modifier
    if (tournament.creatorId !== userId) {
      throw new ForbiddenException('Seul le créateur peut modifier ce tournoi');
    }

    // Valider les changements
    this.validateUpdate(tournament, updateTournamentDto);

    // Appliquer les modifications
    Object.assign(tournament, updateTournamentDto);

    return await this.tournamentRepository.save(tournament);
  }

  async remove(id: number, userId: number): Promise<void> {
    const tournament = await this.findOne(id);

    // Vérifier que l'utilisateur a le droit de supprimer
    if (tournament.creatorId !== userId) {
      throw new ForbiddenException('Seul le créateur peut supprimer ce tournoi');
    }

    // Ne pas permettre la suppression si le tournoi a commencé
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

    // Vérifications
    if (!tournament.isRegistrationOpen) {
      throw new BadRequestException('Les inscriptions ne sont pas ouvertes pour ce tournoi');
    }

    if (tournament.isFull) {
      throw new BadRequestException('Le tournoi est complet');
    }

    // Vérifier si l'utilisateur est déjà inscrit
    const isAlreadyParticipant = tournament.participants.some(p => p.id === userId);
    if (isAlreadyParticipant) {
      throw new ConflictException('Vous êtes déjà inscrit à ce tournoi');
    }

    // Ajouter le participant
    tournament.participants.push(user);
    tournament.currentParticipants = tournament.participants.length;

    // Changer le statut si le tournoi est plein
    if (tournament.isFull) {
      tournament.status = TournamentStatus.FULL;
    } else if (tournament.status === TournamentStatus.DRAFT) {
      tournament.status = TournamentStatus.OPEN;
    }

    return await this.tournamentRepository.save(tournament);
  }

  async leaveTournament(tournamentId: number, userId: number): Promise<Tournament> {
    const tournament = await this.findOne(tournamentId);

    // Ne pas permettre de quitter si le tournoi a commencé
    if (tournament.status === TournamentStatus.IN_PROGRESS) {
      throw new BadRequestException('Impossible de quitter un tournoi en cours');
    }

    // Retirer le participant
    tournament.participants = tournament.participants.filter(p => p.id !== userId);
    tournament.currentParticipants = tournament.participants.length;

    // Ajuster le statut
    if (tournament.status === TournamentStatus.FULL) {
      tournament.status = TournamentStatus.OPEN;
    }

    return await this.tournamentRepository.save(tournament);
  }

  async getMatchesWithPlayers(tournamentId: number): Promise<Match[]> {
    return await this.matchRepository.find({
      where: { tournamentId },
      relations: ['player1', 'player2'],
    });
  }
  // ===== GESTION DES BRACKETS =====

  async generateBrackets(tournamentId: number, userId: number): Promise<Tournament> {
    const tournament = await this.findOne(tournamentId);

    // Vérifications
    if (tournament.creatorId !== userId) {
      throw new ForbiddenException('Seul le créateur peut générer les brackets');
    }

    if (!tournament.canStart) {
      throw new BadRequestException('Le tournoi ne peut pas encore commencer');
    }

    if (tournament.bracketGenerated) {
      throw new BadRequestException('Les brackets ont déjà été générés');
    }

    // Générer les matches selon le type de tournoi
    let matches: Partial<Match>[] = [];

    if (tournament.type === TournamentType.SINGLE_ELIMINATION) {
      matches = this.generateSingleEliminationMatches(tournament.participants, tournament.id);
    } else {
      throw new BadRequestException('Type de tournoi non supporté pour le moment');
    }

    // Sauvegarder les matches
    await this.matchRepository.save(matches);

    // Mettre à jour le tournoi
    tournament.bracketGenerated = true;
    tournament.status = TournamentStatus.IN_PROGRESS;

    return await this.tournamentRepository.save(tournament);
  }

  // ===== MÉTHODES UTILITAIRES =====

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

  private generateSingleEliminationMatches(participants: User[], tournamentId: number): Partial<Match>[] {
    const matches: Partial<Match>[] = [];
    const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);

    // Premier tour
    for (let i = 0; i < shuffledParticipants.length; i += 2) {
      if (i + 1 < shuffledParticipants.length) {
        matches.push({
          player1: shuffledParticipants[i],
          player2: shuffledParticipants[i + 1],
          tournamentId,
          round: 1,
          bracketPosition: Math.floor(i / 2),
          status: 'pending',
        });
      }
    }

    return matches;
  }

  // ===== MÉTHODES UTILITAIRES PUBLIQUES =====

  async getTournamentStats(tournamentId: number): Promise<any> {
    const tournament = await this.findOne(tournamentId);
    
    const completedMatches = await this.matchRepository.count({
      where: { tournamentId, status: 'finished' }
    });

    const totalMatches = await this.matchRepository.count({
      where: { tournamentId }
    });

    return {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
        participants: tournament.currentParticipants,
        maxParticipants: tournament.maxParticipants,
      },
      progress: {
        completedMatches,
        totalMatches,
        percentComplete: totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0,
      }
    };
  }
}