'use client';

import { useState } from 'react';
import { Tournament, EliminationMatch } from '@/types/tournament';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getTeamDisplayName, calculatePayouts } from '@/lib/tournament-logic';
import { Trophy, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EliminationViewProps {
  tournament: Tournament;
  onUpdate: (t: Partial<Tournament>) => void;
}

const ROUND_LABELS: Record<number, string> = {
  1: 'Finals',
  2: 'Semifinals',
  3: 'Quarterfinals',
  4: 'Round of 16',
};

export default function EliminationView({ tournament, onUpdate }: EliminationViewProps) {
  const [selectedMatch, setSelectedMatch] = useState<EliminationMatch | null>(null);
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');

  const maxRound = Math.max(...tournament.eliminationMatches.map((m) => m.round), 1);

  const teamName = (id?: string | null) => {
    if (!id) return 'TBD';
    const team = tournament.teams.find((t) => t.id === id);
    if (!team) return 'TBD';
    return getTeamDisplayName(team, tournament.players);
  };

  const openScoreDialog = (match: EliminationMatch) => {
    if (match.isBye || !match.team1Id || !match.team2Id) return;
    setSelectedMatch(match);
    setScore1(match.team1Score?.toString() ?? '');
    setScore2(match.team2Score?.toString() ?? '');
  };

  const submitScore = () => {
    if (!selectedMatch) return;
    const s1 = parseInt(score1);
    const s2 = parseInt(score2);
    if (isNaN(s1) || isNaN(s2) || s1 === s2) return; // No ties in elimination

    const winnerId = s1 > s2 ? selectedMatch.team1Id! : selectedMatch.team2Id!;

    let updatedMatches = tournament.eliminationMatches.map((m) =>
      m.id === selectedMatch.id
        ? { ...m, team1Score: s1, team2Score: s2, winnerId, status: 'complete' as const }
        : m
    );

    // Advance winner to next match (round r → round r-1)
    if (selectedMatch.nextMatchId) {
      const nextMatch = updatedMatches.find((m) => m.id === selectedMatch.nextMatchId);
      if (nextMatch) {
        // Even positions fill team2, odd fill team1
        const isLeftSlot = selectedMatch.position % 2 !== 0;
        updatedMatches = updatedMatches.map((m) =>
          m.id === selectedMatch.nextMatchId
            ? {
                ...m,
                team1Id: isLeftSlot ? winnerId : m.team1Id,
                team2Id: !isLeftSlot ? winnerId : m.team2Id,
              }
            : m
        );
      }
    }

    // Tournament complete when Finals (round === 1, the championship match) is done
    const finalsMatch = updatedMatches.find((m) => m.round === 1);
    if (finalsMatch?.id === selectedMatch.id) {
      onUpdate({
        eliminationMatches: updatedMatches,
        phase: 'complete',
      });
    } else {
      onUpdate({ eliminationMatches: updatedMatches });
    }

    setSelectedMatch(null);
  };

  // Find champion
  const finalsMatch = tournament.eliminationMatches.find((m) => m.round === 1);
  const champion = finalsMatch?.winnerId;
  const runnerUp = finalsMatch?.winnerId
    ? finalsMatch.winnerId === finalsMatch.team1Id
      ? finalsMatch.team2Id
      : finalsMatch.team1Id
    : undefined;

  // Prize payouts
  const payouts =
    champion && runnerUp && tournament.entryFeePerPlayer > 0
      ? calculatePayouts(
          tournament.teams,
          tournament.entryFeePerPlayer,
          tournament.prizeSplit.firstPercent,
          tournament.prizeSplit.secondPercent,
          champion,
          runnerUp
        )
      : [];

  const totalPot = tournament.entryFeePerPlayer * tournament.players.length;

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

  // Group matches by round (display highest round number first = earliest round)
  const rounds = Array.from(new Set(tournament.eliminationMatches.map((m) => m.round))).sort(
    (a, b) => b - a
  );

  return (
    <div className="space-y-6">
      {/* Champion banner */}
      {tournament.phase === 'complete' && champion && (
        <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/40 rounded-2xl p-5 text-center">
          <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
          <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wider mb-1">Champion</p>
          <p className="text-white text-xl font-bold">{teamName(champion)}</p>
          {runnerUp && (
            <p className="text-gray-400 text-sm mt-1">🥈 Runner-up: {teamName(runnerUp)}</p>
          )}
        </div>
      )}

      {/* Prize payouts */}
      {payouts.length > 0 && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <p className="text-sm font-semibold text-gray-300">Prize Payouts</p>
            <span className="text-gray-500 text-xs ml-auto">
              Total: {fmt(totalPot)}
            </span>
          </div>
          <div className="space-y-2">
            {payouts.map((p) => (
              <div key={p.place} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{p.place === 1 ? '🥇' : '🥈'}</span>
                  <span className="text-white text-sm font-medium">{teamName(p.teamId)}</span>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-bold text-sm">{fmt(p.teamAmount)}</p>
                  {p.playerIds.length > 1 && (
                    <p className="text-gray-500 text-xs">{fmt(p.perPlayerAmount)} / player</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bracket rounds */}
      {rounds.map((round) => {
        const roundMatches = tournament.eliminationMatches
          .filter((m) => m.round === round)
          .sort((a, b) => a.position - b.position);
        const label = ROUND_LABELS[round] ?? `Round of ${Math.pow(2, round)}`;

        return (
          <div key={round}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {label}
            </p>
            <div className="space-y-2">
              {roundMatches.map((match) => {
                const done = match.status === 'complete';
                const isBye = match.isBye;
                const canPlay = !!match.team1Id && !!match.team2Id && !isBye;

                return (
                  <button
                    key={match.id}
                    onClick={() => canPlay && openScoreDialog(match)}
                    className={cn(
                      'w-full p-4 rounded-xl border text-left transition-all',
                      isBye ? 'bg-gray-800/20 border-gray-800 opacity-50 cursor-default' :
                      done ? 'bg-gray-800/40 border-gray-700/50' :
                      canPlay ? 'bg-gray-800 border-gray-700 hover:border-violet-500/50' :
                      'bg-gray-800/40 border-gray-700/40 cursor-default'
                    )}
                  >
                    {isBye ? (
                      <p className="text-gray-600 text-sm text-center">BYE</p>
                    ) : (
                      <div className="flex items-center gap-3">
                        {/* Team 1 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {tournament.teams.find((t) => t.id === match.team1Id)?.seed && (
                              <span className="text-gray-600 text-xs">
                                #{tournament.teams.find((t) => t.id === match.team1Id)?.seed}
                              </span>
                            )}
                            <p className={cn(
                              'font-semibold text-sm truncate',
                              done && match.winnerId === match.team1Id ? 'text-emerald-400' :
                              match.team1Id ? 'text-white' : 'text-gray-600'
                            )}>
                              {teamName(match.team1Id)}
                            </p>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="flex items-center gap-2 shrink-0">
                          {done ? (
                            <div className="flex items-center gap-1.5">
                              <span className={cn('text-lg font-bold', match.winnerId === match.team1Id ? 'text-emerald-400' : 'text-gray-400')}>
                                {match.team1Score}
                              </span>
                              <span className="text-gray-600 text-sm">–</span>
                              <span className={cn('text-lg font-bold', match.winnerId === match.team2Id ? 'text-emerald-400' : 'text-gray-400')}>
                                {match.team2Score}
                              </span>
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-1" />
                            </div>
                          ) : canPlay ? (
                            <span className="text-gray-600 text-xs">vs</span>
                          ) : (
                            <Clock className="w-4 h-4 text-gray-700" />
                          )}
                        </div>

                        {/* Team 2 */}
                        <div className="flex-1 min-w-0 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <p className={cn(
                              'font-semibold text-sm truncate',
                              done && match.winnerId === match.team2Id ? 'text-emerald-400' :
                              match.team2Id ? 'text-white' : 'text-gray-600'
                            )}>
                              {teamName(match.team2Id)}
                            </p>
                            {tournament.teams.find((t) => t.id === match.team2Id)?.seed && (
                              <span className="text-gray-600 text-xs">
                                #{tournament.teams.find((t) => t.id === match.team2Id)?.seed}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Score dialog */}
      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-white">Enter Score</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-300 flex-1 truncate">{teamName(selectedMatch.team1Id)}</p>
                  <Input
                    type="number"
                    min={0}
                    value={score1}
                    onChange={(e) => setScore1(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white h-11 text-center text-lg font-bold w-20"
                    placeholder="0"
                  />
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-300 flex-1 truncate">{teamName(selectedMatch.team2Id)}</p>
                  <Input
                    type="number"
                    min={0}
                    value={score2}
                    onChange={(e) => setScore2(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white h-11 text-center text-lg font-bold w-20"
                    placeholder="0"
                  />
                </div>
              </div>
              {score1 !== '' && score2 !== '' && score1 === score2 && (
                <p className="text-amber-400 text-xs">No ties allowed in elimination — enter different scores</p>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedMatch(null)}
                  className="flex-1 border border-gray-700 text-gray-400"
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitScore}
                  disabled={score1 === '' || score2 === '' || score1 === score2}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40"
                >
                  Save Score
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
