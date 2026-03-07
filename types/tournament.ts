export type EventType = 'disc-golf-putting' | 'disc-golf' | 'ping-pong' | 'basketball' | 'volleyball' | 'custom';
export type FormatType = 'singles' | 'doubles';
export type BracketPhase = 'setup' | 'pairing' | 'round-robin' | 'elimination' | 'complete';

export interface Player {
  id: string;
  name: string;
  teamId?: string;
}

export interface Team {
  id: string;
  name?: string;
  playerIds: string[];
  isPreset: boolean; // manually added as existing team
  seed?: number; // assigned after round robin
  wins?: number;
  losses?: number;
  pointsFor?: number;
  pointsAgainst?: number;
}

export interface RoundRobinMatch {
  id: string;
  round: number;
  team1Id: string;
  team2Id: string;
  team1Score?: number;
  team2Score?: number;
  winnerId?: string | null; // null = tie
  status: 'pending' | 'in-progress' | 'complete';
}

export interface EliminationMatch {
  id: string;
  round: number; // 1 = finals, 2 = semis, etc. (counting from end)
  position: number; // position in bracket
  team1Id?: string | null;
  team2Id?: string | null;
  team1Score?: number;
  team2Score?: number;
  winnerId?: string | null;
  isBye: boolean;
  status: 'pending' | 'in-progress' | 'complete';
  nextMatchId?: string; // where winner advances
}

export interface PrizeSplit {
  firstPercent: number;  // e.g. 60
  secondPercent: number; // e.g. 40
  // Future: third, fourth, etc.
}

export interface Tournament {
  id: string;
  hostId: string;
  hostName: string;
  name: string;
  event: EventType;
  customEvent?: string;
  format: FormatType;
  entryFeePerTeam: number;
  prizeSplit: PrizeSplit;
  phase: BracketPhase;
  players: Player[];
  teams: Team[];
  roundRobinMatches: RoundRobinMatch[];
  eliminationMatches: EliminationMatch[];
  shareCode: string;
  createdAt: string; // ISO date string
  totalRounds?: number; // round robin rounds
  currentRound?: number; // current round robin round
}

export interface TournamentSummary {
  id: string;
  name: string;
  event: EventType;
  customEvent?: string;
  phase: BracketPhase;
  teamCount: number;
  createdAt: string;
  shareCode: string;
}
