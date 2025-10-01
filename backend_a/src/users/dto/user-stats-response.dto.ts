export class UserStatsResponseDto {
  id: number;
  username: string;
  gamesWon: number;
  gamesLost: number;
  totalGames: number;
  winRate: number; // en pourcentage (0-100)
  totalScore: number;
  tournamentsWon: number;

  // Computed properties
  get rank(): string {
    if (this.winRate >= 80) return 'Master';
    if (this.winRate >= 60) return 'Expert';
    if (this.winRate >= 40) return 'Advanced';
    if (this.winRate >= 20) return 'Intermediate';
    return 'Beginner';
  }
}
