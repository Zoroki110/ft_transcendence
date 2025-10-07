import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

@Injectable()
export class EventsService extends EventEmitter {
  constructor() {
    super();
  }

  emitTournamentStarted(tournamentId: number, matches: any[]) {
    this.emit('tournament:started', { tournamentId, matches });
  }

  onTournamentStarted(callback: (data: { tournamentId: number; matches: any[] }) => void) {
    this.on('tournament:started', callback);
  }
}