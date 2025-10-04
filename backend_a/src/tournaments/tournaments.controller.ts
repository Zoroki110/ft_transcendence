// src/tournaments/tournaments.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { JoinTournamentDto } from './dto/join-tournament.dto';
import { TournamentQueryDto } from './dto/tournament-query.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

@ApiTags('tournaments')
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  // ===== CRUD ENDPOINTS =====

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un nouveau tournoi' })
  @ApiResponse({ status: 201, description: 'Tournoi créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTournamentDto: CreateTournamentDto, @Req() req) {
    return this.tournamentsService.create(createTournamentDto, req.user.sub);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister tous les tournois avec filtres et pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des tournois récupérée avec succès',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrer par status',
  })
  @ApiQuery({ name: 'type', required: false, description: 'Filtrer par type' })
  @ApiQuery({
    name: 'isPublic',
    required: false,
    description: 'Tournois publics seulement',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Nombre de résultats par page (défaut: 10)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Numéro de page (défaut: 1)',
  })
  findAll(@Query() query: TournamentQueryDto, @Req() req) {
    const userId = req.user?.sub || null;
    return this.tournamentsService.findAll(query, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un tournoi par son ID' })
  @ApiParam({ name: 'id', description: 'ID du tournoi' })
  @ApiResponse({ status: 200, description: 'Tournoi trouvé' })
  @ApiResponse({ status: 404, description: 'Tournoi introuvable' })
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const userId = req.user?.sub || null;
    return this.tournamentsService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier un tournoi (créateur seulement)' })
  @ApiParam({ name: 'id', description: 'ID du tournoi' })
  @ApiResponse({ status: 200, description: 'Tournoi modifié avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Seul le créateur peut modifier' })
  @ApiResponse({ status: 404, description: 'Tournoi introuvable' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTournamentDto: UpdateTournamentDto,
    @Req() req,
  ) {
    return this.tournamentsService.update(
      id,
      updateTournamentDto,
      req.user.sub,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un tournoi (créateur seulement)' })
  @ApiParam({ name: 'id', description: 'ID du tournoi' })
  @ApiResponse({ status: 204, description: 'Tournoi supprimé avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Seul le créateur peut supprimer' })
  @ApiResponse({ status: 404, description: 'Tournoi introuvable' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    await this.tournamentsService.remove(id, req.user.sub);
  }

  // ===== GESTION DES PARTICIPANTS =====

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rejoindre un tournoi' })
  @ApiParam({ name: 'id', description: 'ID du tournoi' })
  @ApiResponse({ status: 200, description: 'Inscription au tournoi réussie' })
  @ApiResponse({
    status: 400,
    description: 'Inscription impossible (tournoi complet, fermé, etc.)',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Tournoi introuvable' })
  @ApiResponse({ status: 409, description: 'Déjà inscrit au tournoi' })
  joinTournament(
    @Param('id', ParseIntPipe) id: number,
    @Body() joinTournamentDto: JoinTournamentDto,
    @Req() req,
  ) {
    return this.tournamentsService.joinTournament(id, req.user.sub);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quitter un tournoi' })
  @ApiParam({ name: 'id', description: 'ID du tournoi' })
  @ApiResponse({ status: 200, description: 'Sortie du tournoi réussie' })
  @ApiResponse({
    status: 400,
    description: 'Impossible de quitter (tournoi commencé)',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Tournoi introuvable' })
  leaveTournament(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.tournamentsService.leaveTournament(id, req.user.sub);
  }

  @Get(':id/participants')
  @ApiOperation({ summary: "Liste des participants d'un tournoi" })
  @ApiParam({ name: 'id', description: 'ID du tournoi' })
  @ApiResponse({ status: 200, description: 'Liste des participants' })
  @ApiResponse({ status: 404, description: 'Tournoi introuvable' })
  async getParticipants(@Param('id', ParseIntPipe) id: number) {
    const tournament = await this.tournamentsService.findOne(id);
    return {
      tournamentId: id,
      tournamentName: tournament.name,
      participants: tournament.participants,
      count: tournament.currentParticipants,
      maxParticipants: tournament.maxParticipants,
    };
  }

  // ===== GESTION DES BRACKETS =====

  @Post(':id/generate-brackets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Générer les brackets et démarrer le tournoi (créateur seulement)',
  })
  @ApiParam({ name: 'id', description: 'ID du tournoi' })
  @ApiResponse({
    status: 200,
    description: 'Brackets générés, tournoi démarré',
  })
  @ApiResponse({
    status: 400,
    description:
      'Impossible de générer (pas assez de participants, déjà généré, etc.)',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Seul le créateur peut démarrer' })
  @ApiResponse({ status: 404, description: 'Tournoi introuvable' })
  generateBrackets(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.tournamentsService.generateBrackets(id, req.user.sub);
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Démarrer un tournoi avec brackets générés (créateur seulement)',
  })
  @ApiParam({ name: 'id', description: 'ID du tournoi' })
  @ApiResponse({
    status: 200,
    description: 'Tournoi démarré avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Impossible de démarrer (pas complet, brackets non générés, etc.)',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Seul le créateur peut démarrer' })
  @ApiResponse({ status: 404, description: 'Tournoi introuvable' })
  startTournament(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.tournamentsService.startTournament(id, req.user.sub);
  }

  @Post(':id/reset-brackets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Réinitialiser les brackets et remettre le tournoi à FULL (créateur seulement)',
  })
  @ApiParam({ name: 'id', description: 'ID du tournoi' })
  @ApiResponse({
    status: 200,
    description: 'Tournoi réinitialisé avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Seul le créateur peut réinitialiser' })
  @ApiResponse({ status: 404, description: 'Tournoi introuvable' })
  resetTournamentBrackets(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.tournamentsService.resetTournamentBrackets(id, req.user.sub);
  }

  @Post(':id/force-regenerate-brackets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Forcer la regénération des brackets (créateur seulement)',
  })
  @ApiParam({ name: 'id', description: 'ID du tournoi' })
  @ApiResponse({
    status: 200,
    description: 'Brackets forcés, tournoi réparé',
  })
  async forceRegenerateBrackets(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.tournamentsService.forceRegenerateBrackets(id, req.user.sub);
  }

  @Get(':id/brackets')
  @ApiOperation({ summary: "Visualiser l'arbre du tournoi" })
  @ApiParam({ name: 'id', description: 'ID du tournoi' })
  @ApiResponse({ status: 200, description: 'Arbre du tournoi' })
  @ApiResponse({ status: 400, description: 'Brackets pas encore générés' })
  @ApiResponse({ status: 404, description: 'Tournoi introuvable' })
  async getBrackets(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const userId = req.user?.sub || null;
    return this.tournamentsService.getBrackets(id, userId);
  }

  @Get(':id/matches')
  @ApiOperation({ summary: "Lister tous les matches d'un tournoi" })
  @ApiParam({ name: 'id', description: 'ID du tournoi' })
  @ApiResponse({ status: 200, description: 'Liste des matches avec détails' })
  @ApiResponse({ status: 404, description: 'Tournoi introuvable' })
  async getMatches(@Param('id', ParseIntPipe) id: number) {
    const matches = await this.tournamentsService.getMatchesWithPlayers(id);

    return {
      tournamentId: id,
      totalMatches: matches.length,
      matches: matches.map((match) => ({
        id: match.id,
        player1: match.player1?.username || 'TBD',
        player2: match.player2?.username || 'TBD',
        player1Score: match.player1Score || 0,
        player2Score: match.player2Score || 0,
        status: match.status,
        round: match.round,
        bracketPosition: match.bracketPosition,
        createdAt: match.createdAt,
        finishedAt: match.finishedAt,
      })),
    };
  }

  // ===== STATISTIQUES =====

  @Get(':id/stats')
  @ApiOperation({ summary: 'Statistiques du tournoi' })
  @ApiParam({ name: 'id', description: 'ID du tournoi' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques détaillées du tournoi',
  })
  @ApiResponse({ status: 404, description: 'Tournoi introuvable' })
  getStats(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const userId = req.user?.sub || null;
    return this.tournamentsService.getTournamentStats(id, userId);
  }

  @Get(':id/leaderboard')
  @ApiOperation({ summary: 'Classement du tournoi' })
  @ApiParam({ name: 'id', description: 'ID du tournoi' })
  @ApiResponse({
    status: 200,
    description: 'Leaderboard avec positions et stats',
  })
  @ApiResponse({ status: 404, description: 'Tournoi introuvable' })
  async getLeaderboard(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const userId = req.user?.sub || null;
    return this.tournamentsService.getLeaderboard(id, userId);
  }

  // ===== PROGRESSION DES MATCHES =====

  @Post(':id/advance-winner/:matchId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Faire avancer le gagnant d'un match" })
  @ApiParam({ name: 'id', description: 'ID du tournoi' })
  @ApiParam({ name: 'matchId', description: 'ID du match' })
  @ApiResponse({ status: 200, description: 'Gagnant avancé avec succès' })
  @ApiResponse({
    status: 400,
    description: 'Match déjà terminé ou données invalides',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({
    status: 403,
    description: 'Seul le créateur peut faire avancer',
  })
  @ApiResponse({ status: 404, description: 'Match introuvable' })
  async advanceWinner(
    @Param('id', ParseIntPipe) tournamentId: number,
    @Param('matchId', ParseIntPipe) matchId: number,
    @Body()
    body: { winnerId: number; player1Score: number; player2Score: number },
    @Req() req,
  ) {
    return this.tournamentsService.advanceWinner(
      tournamentId,
      matchId,
      body.winnerId,
      body.player1Score,
      body.player2Score,
      req.user.sub,
    );
  }

  // ===== ENDPOINTS UTILITAIRES =====

  @Get('user/my-tournaments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes tournois (créés et participés)' })
  @ApiResponse({ status: 200, description: 'Liste de mes tournois' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getMyTournaments(@Req() req, @Query() query: TournamentQueryDto) {
    const createdQuery = { ...query };
    const createdTournaments =
      await this.tournamentsService.findAll(createdQuery);

    return {
      created: createdTournaments.tournaments.filter(
        (t) => t.creatorId === req.user.sub,
      ),
      participated: createdTournaments.tournaments.filter((t) =>
        t.participants.some((p) => p.id === req.user.sub),
      ),
    };
  }
}
