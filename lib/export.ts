import { Tournament } from '@/types/tournament';
import { calculateStandings, getTeamDisplayName } from './tournament-logic';

/**
 * Generates a CSV string summarizing all tournaments for season reporting.
 */
export function exportSeasonCSV(tournaments: Tournament[]): string {
  const rows: string[] = [];

  // Header
  rows.push([
    'Tournament',
    'Date',
    'Event',
    'Format',
    'Players',
    'Teams',
    'Entry Fee / Player',
    'Total Pot',
    'Status',
    '1st Place',
    '1st Payout',
    '2nd Place',
    '2nd Payout',
  ].map(q).join(','));

  for (const t of tournaments) {
    const date = new Date(t.createdAt).toLocaleDateString('en-US');
    const totalPot = t.entryFeePerPlayer * t.players.length;
    const eventLabel = t.event === 'custom' ? (t.customEvent ?? 'Custom') : t.event;

    // Find champion from finals match
    const finalsMatch = t.eliminationMatches.find((m) => m.round === 1 && m.status === 'complete');
    const champTeam = finalsMatch?.winnerId
      ? t.teams.find((tm) => tm.id === finalsMatch.winnerId)
      : null;
    const runnerUpId = finalsMatch
      ? finalsMatch.winnerId === finalsMatch.team1Id
        ? finalsMatch.team2Id
        : finalsMatch.team1Id
      : null;
    const runnerUpTeam = runnerUpId ? t.teams.find((tm) => tm.id === runnerUpId) : null;

    const champName = champTeam ? getTeamDisplayName(champTeam, t.players) : '';
    const runnerName = runnerUpTeam ? getTeamDisplayName(runnerUpTeam, t.players) : '';

    const firstPayout = totalPot > 0 ? (totalPot * t.prizeSplit.firstPercent) / 100 : 0;
    const secondPayout = totalPot > 0 ? (totalPot * t.prizeSplit.secondPercent) / 100 : 0;

    rows.push([
      q(t.name),
      q(date),
      q(eventLabel),
      q(t.format),
      String(t.players.length),
      String(t.teams.length),
      String(t.entryFeePerPlayer),
      String(totalPot),
      q(t.phase),
      q(champName),
      firstPayout > 0 ? String(firstPayout) : '',
      q(runnerName),
      secondPayout > 0 ? String(secondPayout) : '',
    ].join(','));
  }

  return rows.join('\n');
}

/**
 * Generates a per-player season summary CSV.
 * Shows wins, losses, earnings across all tournaments.
 */
export function exportPlayerSeasonCSV(tournaments: Tournament[]): string {
  const rows: string[] = [];
  rows.push(['Player', 'Tournaments', 'Wins', 'Losses', 'Ties', 'Earnings'].map(q).join(','));

  // Aggregate stats per player name
  const playerStats = new Map<string, {
    tournaments: Set<string>;
    wins: number;
    losses: number;
    ties: number;
    earnings: number;
  }>();

  const ensure = (name: string) => {
    if (!playerStats.has(name)) {
      playerStats.set(name, { tournaments: new Set(), wins: 0, losses: 0, ties: 0, earnings: 0 });
    }
    return playerStats.get(name)!;
  };

  for (const t of tournaments) {
    const totalPot = t.entryFeePerPlayer * t.players.length;
    const standings = calculateStandings(t.teams, t.roundRobinMatches);

    // RR standings
    for (const s of standings) {
      const team = t.teams.find((tm) => tm.id === s.teamId);
      if (!team) continue;
      for (const pid of team.playerIds) {
        const player = t.players.find((p) => p.id === pid);
        if (!player) continue;
        const stat = ensure(player.name);
        stat.tournaments.add(t.id);
        stat.wins += s.wins;
        stat.losses += s.losses;
        stat.ties += s.ties;
      }
    }

    // Prize earnings from elimination
    const finalsMatch = t.eliminationMatches.find((m) => m.round === 1 && m.status === 'complete');
    if (finalsMatch && totalPot > 0) {
      const champTeam = finalsMatch.winnerId
        ? t.teams.find((tm) => tm.id === finalsMatch.winnerId)
        : null;
      const runnerUpId = finalsMatch.winnerId === finalsMatch.team1Id
        ? finalsMatch.team2Id : finalsMatch.team1Id;
      const runnerUpTeam = runnerUpId ? t.teams.find((tm) => tm.id === runnerUpId) : null;

      if (champTeam) {
        const share = (totalPot * t.prizeSplit.firstPercent) / 100 / champTeam.playerIds.length;
        for (const pid of champTeam.playerIds) {
          const p = t.players.find((pl) => pl.id === pid);
          if (p) ensure(p.name).earnings += share;
        }
      }
      if (runnerUpTeam) {
        const share = (totalPot * t.prizeSplit.secondPercent) / 100 / runnerUpTeam.playerIds.length;
        for (const pid of runnerUpTeam.playerIds) {
          const p = t.players.find((pl) => pl.id === pid);
          if (p) ensure(p.name).earnings += share;
        }
      }
    }
  }

  // Sort by earnings desc
  const sorted = Array.from(playerStats.entries()).sort((a, b) => b[1].earnings - a[1].earnings);

  for (const [name, s] of sorted) {
    rows.push([
      q(name),
      String(s.tournaments.size),
      String(s.wins),
      String(s.losses),
      String(s.ties),
      s.earnings.toFixed(2),
    ].join(','));
  }

  return rows.join('\n');
}

function q(s: string): string {
  return `"${s.replace(/"/g, '""')}"`;
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
