'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Tournament } from '@/types/tournament';
import { getTournamentByShareCode } from '@/lib/tournament-store';
import { calculateStandings, getTeamDisplayName } from '@/lib/tournament-logic';
import { Badge } from '@/components/ui/badge';
import { Users, Trophy, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const EVENT_ICONS: Record<string, string> = {
  'disc-golf-putting': '🥏',
  'disc-golf': '🥏',
  'ping-pong': '🏓',
  basketball: '🏀',
  volleyball: '🏐',
  custom: '🏆',
};

export default function ParticipantView() {
  const params = useParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<'matches' | 'standings' | 'teams'>('matches');

  useEffect(() => {
    const t = getTournamentByShareCode(params.code as string);
    if (!t) {
      setNotFound(true);
      return;
    }
    setTournament(t);
  }, [params.code]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
        <Trophy className="w-12 h-12 text-gray-600 mb-4" />
        <h1 className="text-xl font-bold mb-2">Tournament Not Found</h1>
        <p className="text-gray-500 text-sm text-center">
          Check the share code and try again
        </p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const standings = calculateStandings(tournament.teams, tournament.roundRobinMatches);
  const teamName = (id?: string | null) => {
    if (!id) return 'TBD';
    const team = tournament.teams.find((t) => t.id === id);
    if (!team) return 'TBD';
    return getTeamDisplayName(team, tournament.players);
  };

  // Find next pending match(es)
  const currentRound = tournament.currentRound ?? 1;
  const pendingMatches =
    tournament.phase === 'round-robin'
      ? tournament.roundRobinMatches.filter(
          (m) => m.round === currentRound && m.status !== 'complete'
        )
      : tournament.eliminationMatches.filter(
          (m) => m.status !== 'complete' && !m.isBye && m.team1Id && m.team2Id
        );

  const champion =
    tournament.phase === 'complete'
      ? tournament.eliminationMatches.find((m) => m.round === 1)?.winnerId
      : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{EVENT_ICONS[tournament.event] ?? '🏆'}</span>
            <div>
              <h1 className="text-lg font-bold text-white">{tournament.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-gray-500 text-xs flex items-center gap-1">
                  <Users className="w-3 h-3" /> {tournament.teams.length} teams
                </span>
                <span className="text-gray-700">·</span>
                <span className="text-gray-500 text-xs capitalize">{tournament.format}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-5 space-y-5">
          {/* Champion banner */}
          {tournament.phase === 'complete' && champion && (
            <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/40 rounded-2xl p-5 text-center">
              <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
              <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wider mb-1">🏆 Champion</p>
              <p className="text-white text-2xl font-bold">{teamName(champion)}</p>
            </div>
          )}

          {/* Phase badge */}
          {tournament.phase !== 'complete' && (
            <div className="flex items-center gap-2">
              <Badge className={cn(
                'border text-xs',
                tournament.phase === 'round-robin'
                  ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              )}>
                {tournament.phase === 'round-robin' ? `Round Robin – Round ${currentRound}/${tournament.totalRounds}` : 'Elimination Bracket'}
              </Badge>
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-gray-800/60 rounded-xl p-1 gap-1">
            {(['matches', 'standings', 'teams'] as const).map((tab) => (
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

          {/* Matches tab */}
          {activeTab === 'matches' && (
            <div className="space-y-2">
              {pendingMatches.length === 0 && tournament.phase !== 'complete' && (
                <div className="text-center py-8 text-gray-600">
                  <Clock className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Waiting for next matches...</p>
                </div>
              )}
              {(tournament.phase === 'round-robin'
                ? tournament.roundRobinMatches.filter((m) => m.round === currentRound)
                : tournament.eliminationMatches.filter((m) => !m.isBye)
              ).map((match) => {
                const done = match.status === 'complete';
                const rrMatch = 'team1Id' in match;
                const t1 = teamName(match.team1Id);
                const t2 = teamName(match.team2Id);

                return (
                  <div
                    key={match.id}
                    className={cn(
                      'p-4 rounded-xl border',
                      done ? 'bg-gray-800/40 border-gray-700/50' : 'bg-gray-800 border-gray-700'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={cn('font-semibold text-sm truncate', done && match.winnerId === match.team1Id ? 'text-emerald-400' : 'text-white')}>
                          {t1}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {done ? (
                          <div className="flex items-center gap-1.5">
                            <span className={cn('text-base font-bold', match.winnerId === match.team1Id ? 'text-emerald-400' : 'text-gray-400')}>
                              {match.team1Score}
                            </span>
                            <span className="text-gray-600">–</span>
                            <span className={cn('text-base font-bold', match.winnerId === match.team2Id ? 'text-emerald-400' : 'text-gray-400')}>
                              {match.team2Score}
                            </span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-1" />
                          </div>
                        ) : (
                          <span className="text-gray-600 text-xs">vs</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <p className={cn('font-semibold text-sm truncate', done && match.winnerId === match.team2Id ? 'text-emerald-400' : match.team2Id ? 'text-white' : 'text-gray-500')}>
                          {t2}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Standings tab */}
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
                    <span className={cn('text-sm font-bold w-5', i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : 'text-gray-500')}>
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
                    <div className="text-right">
                      <p className="text-white font-bold text-sm">{s.wins}W–{s.losses}L</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Teams tab */}
          {activeTab === 'teams' && (
            <div className="space-y-2">
              {tournament.teams.map((team, i) => (
                <div key={team.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800 border border-gray-700">
                  <span className="text-gray-500 text-sm w-5 text-right">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{getTeamDisplayName(team, tournament.players)}</p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {team.playerIds.map((pid) => tournament.players.find((p) => p.id === pid)?.name).filter(Boolean).join(' & ')}
                    </p>
                  </div>
                  {team.seed && (
                    <Badge variant="outline" className="border-gray-600 text-gray-400 text-xs">
                      Seed #{team.seed}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
