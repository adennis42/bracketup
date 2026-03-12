'use client';

import { useState } from 'react';
import { Tournament, RoundRobinMatch } from '@/types/tournament';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  calculateStandings,
  getTeamDisplayName,
  getAllRoundsComplete,
  generateEliminationBracket,
} from '@/lib/tournament-logic';
import { ChevronRight, ChevronLeft, CheckCircle2, Clock, Trophy, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoundRobinViewProps {
  tournament: Tournament;
  onUpdate: (t: Partial<Tournament>) => void;
}

export default function RoundRobinView({ tournament, onUpdate }: RoundRobinViewProps) {
  const [selectedMatch, setSelectedMatch] = useState<RoundRobinMatch | null>(null);
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');
  const [activeTab, setActiveTab] = useState<'matches' | 'standings'>('matches');

  const currentRound = tournament.currentRound ?? 1;
  const totalRounds = tournament.totalRounds ?? 1;
  const roundMatches = tournament.roundRobinMatches.filter((m) => m.round === currentRound);
  const standings = calculateStandings(tournament.teams, tournament.roundRobinMatches);

  const completedCount = roundMatches.filter((m) => m.status === 'complete').length;
  const totalCount = roundMatches.length;

  const teamName = (id: string) =>
    getTeamDisplayName(
      tournament.teams.find((t) => t.id === id)!,
      tournament.players
    );

  const openScoreDialog = (match: RoundRobinMatch) => {
    setSelectedMatch(match);
    setScore1(match.team1Score?.toString() ?? '');
    setScore2(match.team2Score?.toString() ?? '');
  };

  const submitScore = () => {
    if (!selectedMatch) return;
    const s1 = parseInt(score1);
    const s2 = parseInt(score2);
    if (isNaN(s1) || isNaN(s2)) return;

    const winnerId = s1 > s2 ? selectedMatch.team1Id : s2 > s1 ? selectedMatch.team2Id : null;

    const updatedMatches = tournament.roundRobinMatches.map((m) =>
      m.id === selectedMatch.id
        ? { ...m, team1Score: s1, team2Score: s2, winnerId, status: 'complete' as const }
        : m
    );

    onUpdate({ roundRobinMatches: updatedMatches });
    setSelectedMatch(null);
  };

  const advanceRound = () => {
    if (currentRound < totalRounds) onUpdate({ currentRound: currentRound + 1 });
  };

  const goToPrevRound = () => {
    if (currentRound > 1) onUpdate({ currentRound: currentRound - 1 });
  };

  const roundComplete = roundMatches.length > 0 && roundMatches.every((m) => m.status === 'complete');
  const allComplete = getAllRoundsComplete(tournament.roundRobinMatches);

  const startElimination = () => {
    const seededTeams = standings
      .map((s, i) => ({ ...tournament.teams.find((t) => t.id === s.teamId)!, seed: i + 1 }))
      .filter(Boolean);
    const elimMatches = generateEliminationBracket(seededTeams);
    onUpdate({ phase: 'elimination', teams: seededTeams, eliminationMatches: elimMatches });
  };

  // Match number across entire tournament (for easy callout: "Match 3 is done")
  const getMatchNumber = (match: RoundRobinMatch) => {
    const allMatches = [...tournament.roundRobinMatches].sort((a, b) =>
      a.round !== b.round ? a.round - b.round : tournament.roundRobinMatches.indexOf(a) - tournament.roundRobinMatches.indexOf(b)
    );
    return allMatches.findIndex((m) => m.id === match.id) + 1;
  };

  return (
    <div className="space-y-4">
      {/* Tab toggles */}
      <div className="flex bg-gray-800/60 rounded-xl p-1 gap-1">
        {(['matches', 'standings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize',
              activeTab === tab ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'matches' && (
        <>
          {/* Round nav + progress */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevRound}
              disabled={currentRound === 1}
              className="text-gray-400 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <p className="text-white font-semibold">Round {currentRound} of {totalRounds}</p>
              <p className="text-gray-500 text-xs">{completedCount}/{totalCount} matches complete</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={advanceRound}
              disabled={currentRound === totalRounds || !roundComplete}
              className="text-gray-400 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div
              className="bg-violet-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>

          {/* All matches — simultaneous lanes */}
          <div className="space-y-2">
            <p className="text-xs text-gray-600 uppercase tracking-wider font-medium px-1">
              All lanes active — tap any match to enter score
            </p>
            {roundMatches.map((match, i) => {
              const done = match.status === 'complete';
              const matchNum = getMatchNumber(match);
              return (
                <button
                  key={match.id}
                  onClick={() => openScoreDialog(match)}
                  className={cn(
                    'w-full rounded-xl border text-left transition-all',
                    done
                      ? 'bg-gray-800/40 border-gray-700/50 opacity-80'
                      : 'bg-gray-800 border-gray-700 hover:border-violet-500/60 hover:bg-gray-800/80 active:scale-[0.99]'
                  )}
                >
                  {/* Match header */}
                  <div className={cn(
                    'flex items-center justify-between px-3 py-1.5 rounded-t-xl border-b',
                    done ? 'bg-gray-800/30 border-gray-700/30' : 'bg-gray-800/80 border-gray-700/50'
                  )}>
                    <div className="flex items-center gap-2">
                      <Swords className="w-3 h-3 text-gray-600" />
                      <span className="text-gray-500 text-xs font-medium">Match {matchNum}</span>
                      <span className="text-gray-700 text-xs">· Lane {i + 1}</span>
                    </div>
                    {done ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500 text-xs font-medium">Complete</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-amber-400 text-xs font-medium">Live</span>
                      </div>
                    )}
                  </div>

                  {/* Matchup */}
                  <div className="flex items-center gap-2 px-3 py-3">
                    {/* Team 1 */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-semibold text-sm truncate',
                        done && match.winnerId === match.team1Id ? 'text-emerald-400' : 'text-white'
                      )}>
                        {teamName(match.team1Id)}
                      </p>
                      {tournament.format === 'doubles' && (
                        <p className="text-gray-600 text-xs truncate">
                          {tournament.teams.find(t => t.id === match.team1Id)?.playerIds
                            .map(pid => tournament.players.find(p => p.id === pid)?.name)
                            .join(' & ')}
                        </p>
                      )}
                    </div>

                    {/* Score or VS */}
                    <div className="shrink-0 text-center min-w-[60px]">
                      {done ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={cn('text-xl font-bold tabular-nums', match.winnerId === match.team1Id ? 'text-emerald-400' : 'text-gray-400')}>
                            {match.team1Score}
                          </span>
                          <span className="text-gray-600 text-sm">–</span>
                          <span className={cn('text-xl font-bold tabular-nums', match.winnerId === match.team2Id ? 'text-emerald-400' : 'text-gray-400')}>
                            {match.team2Score}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs font-bold uppercase tracking-wider">vs</span>
                      )}
                    </div>

                    {/* Team 2 */}
                    <div className="flex-1 min-w-0 text-right">
                      <p className={cn(
                        'font-semibold text-sm truncate',
                        done && match.winnerId === match.team2Id ? 'text-emerald-400' : 'text-white'
                      )}>
                        {teamName(match.team2Id)}
                      </p>
                      {tournament.format === 'doubles' && (
                        <p className="text-gray-600 text-xs truncate">
                          {tournament.teams.find(t => t.id === match.team2Id)?.playerIds
                            .map(pid => tournament.players.find(p => p.id === pid)?.name)
                            .join(' & ')}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* CTA */}
          {allComplete ? (
            <Button
              onClick={startElimination}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold mt-2"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Start Elimination Bracket
            </Button>
          ) : roundComplete && currentRound < totalRounds ? (
            <Button
              onClick={advanceRound}
              className="w-full h-12 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold mt-2"
            >
              Next Round →
            </Button>
          ) : null}
        </>
      )}

      {activeTab === 'standings' && (
        <div className="space-y-2">
          {standings.map((s, i) => {
            const team = tournament.teams.find((t) => t.id === s.teamId)!;
            const gamesPlayed = s.wins + s.losses + s.ties;
            return (
              <div
                key={s.teamId}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl border',
                  i === 0 ? 'bg-yellow-500/10 border-yellow-500/30' :
                  i === 1 ? 'bg-gray-400/10 border-gray-500/30' :
                  'bg-gray-800 border-gray-700'
                )}
              >
                <span className={cn('text-sm font-bold w-5 text-center',
                  i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : 'text-gray-500'
                )}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {getTeamDisplayName(team, tournament.players)}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {gamesPlayed} played · {s.pointDiff >= 0 ? '+' : ''}{s.pointDiff} diff
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white font-bold text-sm">{s.wins}W</p>
                  <p className="text-gray-500 text-xs">{s.losses}L{s.ties > 0 ? ` ${s.ties}T` : ''}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Score entry dialog */}
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
                    autoFocus
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
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" onClick={() => setSelectedMatch(null)} className="flex-1 border border-gray-700 text-gray-400">
                  Cancel
                </Button>
                <Button
                  onClick={submitScore}
                  disabled={score1 === '' || score2 === ''}
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
