'use client';

import { Tournament, EliminationMatch } from '@/types/tournament';
import { getTeamDisplayName } from '@/lib/tournament-logic';
import { CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BracketViewProps {
  tournament: Tournament;
  onMatchClick: (match: EliminationMatch) => void;
}

const ROUND_LABELS: Record<number, string> = {
  1: 'Final',
  2: 'Semis',
  3: 'Quarters',
  4: 'R16',
  5: 'R32',
};

export default function BracketView({ tournament, onMatchClick }: BracketViewProps) {
  const allMatches = tournament.eliminationMatches;
  if (!allMatches.length) return null;

  const maxRound = Math.max(...allMatches.map((m) => m.round));
  // Display order: earliest round (maxRound) → Finals (round 1)
  const rounds = Array.from({ length: maxRound }, (_, i) => maxRound - i);

  const teamName = (id?: string | null) => {
    if (!id) return 'TBD';
    const team = tournament.teams.find((t) => t.id === id);
    if (!team) return 'TBD';
    return getTeamDisplayName(team, tournament.players);
  };

  const getSeed = (teamId?: string | null) =>
    teamId ? tournament.teams.find((t) => t.id === teamId)?.seed : undefined;

  return (
    <div
      className="pb-4"
      style={{
        overflowX: 'auto',
        overflowY: 'visible',
        marginLeft: '-1rem',
        marginRight: '-1rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div
        className="flex gap-0"
        style={{
          minWidth: 'max-content',
          minHeight: `${Math.pow(2, maxRound - 1) * 80}px`,
        }}
      >
        {rounds.map((round, roundIndex) => {
          const roundMatches = allMatches
            .filter((m) => m.round === round)
            .sort((a, b) => a.position - b.position);

          const isLastRound = round === 1;
          const totalSlots = Math.pow(2, round - 1); // matches in this round
          const colHeight = Math.pow(2, maxRound - 1) * 80; // total column height in px
          const slotHeight = colHeight / totalSlots;

          return (
            <div key={round} className="flex flex-col relative" style={{ width: '160px' }}>
              {/* Round label */}
              <div className="text-center py-1 mb-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {ROUND_LABELS[round] ?? `R${round}`}
                </span>
              </div>

              {/* Matches */}
              <div className="flex flex-col flex-1 relative" style={{ height: `${colHeight}px` }}>
                {roundMatches.map((match, matchIndex) => {
                  const done = match.status === 'complete';
                  const isBye = match.isBye;
                  const canPlay = !!match.team1Id && !!match.team2Id && !isBye;
                  const topOffset = matchIndex * slotHeight + (slotHeight - 72) / 2;

                  // Connector lines
                  const showRightConnector = !isLastRound;
                  const isUpperMatch = matchIndex % 2 === 0;
                  const connectorHeight = slotHeight;

                  return (
                    <div
                      key={match.id}
                      className="absolute left-0 right-0"
                      style={{ top: `${topOffset}px`, height: '72px' }}
                    >
                      {/* Match card */}
                      <div
                        onClick={() => canPlay && onMatchClick(match)}
                        className={cn(
                          'mx-2 rounded-lg border overflow-hidden',
                          'transition-all duration-150',
                          isBye
                            ? 'opacity-30 cursor-default border-gray-800 bg-gray-900'
                            : done
                            ? 'border-gray-700/60 bg-gray-800/50 cursor-pointer hover:border-gray-600'
                            : canPlay
                            ? 'border-gray-700 bg-gray-800 cursor-pointer hover:border-violet-500/60 hover:bg-gray-800/80'
                            : 'border-gray-800/50 bg-gray-900/50 cursor-default'
                        )}
                      >
                        {/* Team 1 row */}
                        <BracketTeamRow
                          name={teamName(match.team1Id)}
                          seed={getSeed(match.team1Id)}
                          score={match.team1Score}
                          isWinner={done && match.winnerId === match.team1Id}
                          isLoser={done && match.winnerId !== null && match.winnerId !== match.team1Id}
                          showScore={done}
                          isTbd={!match.team1Id}
                        />
                        <div className="h-px bg-gray-700/50" />
                        {/* Team 2 row */}
                        <BracketTeamRow
                          name={teamName(match.team2Id)}
                          seed={getSeed(match.team2Id)}
                          score={match.team2Score}
                          isWinner={done && match.winnerId === match.team2Id}
                          isLoser={done && match.winnerId !== null && match.winnerId !== match.team2Id}
                          showScore={done}
                          isTbd={!match.team2Id}
                        />
                      </div>

                      {/* Right connector line */}
                      {showRightConnector && (
                        <div className="absolute right-0 top-0 bottom-0 flex items-center" style={{ width: '8px' }}>
                          {/* Horizontal stub */}
                          <div
                            className={cn(
                              'absolute right-0 h-px w-2',
                              done ? 'bg-gray-600' : 'bg-gray-700'
                            )}
                            style={{ top: '36px' }}
                          />
                          {/* Vertical line going to sibling */}
                          <div
                            className={cn(
                              'absolute right-0 w-px',
                              done ? 'bg-gray-600' : 'bg-gray-700'
                            )}
                            style={{
                              top: isUpperMatch ? '36px' : `${-slotHeight + 36}px`,
                              height: `${slotHeight / 2}px`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface BracketTeamRowProps {
  name: string;
  seed?: number;
  score?: number;
  isWinner: boolean;
  isLoser: boolean;
  showScore: boolean;
  isTbd: boolean;
}

function BracketTeamRow({ name, seed, score, isWinner, isLoser, showScore, isTbd }: BracketTeamRowProps) {
  return (
    <div className={cn(
      'flex items-center gap-1 px-2 py-1.5 min-h-[30px]',
      isWinner && 'bg-emerald-500/10',
    )}>
      {seed && (
        <span className="text-gray-600 text-[10px] w-3 shrink-0">{seed}</span>
      )}
      <span className={cn(
        'text-xs font-medium truncate flex-1',
        isTbd ? 'text-gray-600 italic' :
        isWinner ? 'text-emerald-400 font-semibold' :
        isLoser ? 'text-gray-500' :
        'text-white'
      )}>
        {name}
      </span>
      {showScore && score !== undefined && (
        <span className={cn(
          'text-xs font-bold tabular-nums shrink-0 ml-1',
          isWinner ? 'text-emerald-400' : 'text-gray-500'
        )}>
          {score}
        </span>
      )}
      {isWinner && (
        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
      )}
    </div>
  );
}
