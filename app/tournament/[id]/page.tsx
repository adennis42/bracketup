'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tournament } from '@/types/tournament';
import { getTournament, saveTournament } from '@/lib/tournament-store';
import RoundRobinView from '@/components/tournament/RoundRobinView';
import EliminationView from '@/components/tournament/EliminationView';
import ShareSheet from '@/components/tournament/ShareSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Share2, ChevronLeft, Users, Trophy, Disc } from 'lucide-react';

const EVENT_ICONS: Record<string, string> = {
  'disc-golf-putting': '🥏',
  'disc-golf': '🥏',
  'ping-pong': '🏓',
  basketball: '🏀',
  volleyball: '🏐',
  custom: '🏆',
};

const PHASE_LABELS: Record<string, string> = {
  'round-robin': 'Round Robin',
  elimination: 'Elimination',
  complete: 'Complete',
};

const PHASE_COLORS: Record<string, string> = {
  'round-robin': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  elimination: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  complete: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

export default function TournamentPage() {
  const params = useParams();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    const t = getTournament(params.id as string);
    if (!t) {
      router.push('/');
      return;
    }
    setTournament(t);
  }, [params.id, router]);

  const handleUpdate = (updates: Partial<Tournament>) => {
    if (!tournament) return;
    const updated = { ...tournament, ...updates };
    saveTournament(updated);
    setTournament(updated);
  };

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalPot = tournament.entryFeePerTeam * tournament.teams.length;
  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="text-gray-500 hover:text-white transition-colors p-1 -ml-1"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 mx-3 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">{EVENT_ICONS[tournament.event] ?? '🏆'}</span>
                <h1 className="text-base font-bold text-white truncate">{tournament.name}</h1>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShareOpen(true)}
              className="text-gray-400 hover:text-white p-2 gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-xs">Share</span>
            </Button>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-2 ml-1">
            <Badge className={`text-xs border ${PHASE_COLORS[tournament.phase] ?? 'border-gray-700 text-gray-400'}`}>
              {PHASE_LABELS[tournament.phase] ?? tournament.phase}
            </Badge>
            <span className="text-gray-600 text-xs flex items-center gap-1">
              <Users className="w-3 h-3" /> {tournament.teams.length} teams
            </span>
            {totalPot > 0 && (
              <span className="text-gray-600 text-xs flex items-center gap-1">
                💰 {fmt(totalPot)} pot
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-5">
          {/* Phase indicator */}
          <div className="flex items-center gap-3 mb-5">
            {['round-robin', 'elimination', 'complete'].map((phase, i) => {
              const phases = ['round-robin', 'elimination', 'complete'];
              const currentIdx = phases.indexOf(tournament.phase);
              const phaseIdx = phases.indexOf(phase);
              return (
                <div key={phase} className="flex items-center gap-3 flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                      phaseIdx < currentIdx ? 'bg-emerald-500 border-emerald-500 text-white' :
                      phaseIdx === currentIdx ? 'bg-violet-600 border-violet-600 text-white' :
                      'bg-transparent border-gray-700 text-gray-600'
                    }`}>
                      {phaseIdx < currentIdx ? '✓' : i + 1}
                    </div>
                    <span className={`text-[10px] mt-1 ${phaseIdx <= currentIdx ? 'text-gray-300' : 'text-gray-600'}`}>
                      {phase === 'round-robin' ? 'Round Robin' : phase === 'elimination' ? 'Bracket' : 'Done'}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className={`h-0.5 flex-1 mb-4 ${phaseIdx < currentIdx ? 'bg-emerald-500' : 'bg-gray-700'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Main content */}
          {tournament.phase === 'round-robin' && (
            <RoundRobinView tournament={tournament} onUpdate={handleUpdate} />
          )}
          {(tournament.phase === 'elimination' || tournament.phase === 'complete') && (
            <EliminationView tournament={tournament} onUpdate={handleUpdate} />
          )}
        </div>
      </div>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        shareCode={tournament.shareCode}
        tournamentName={tournament.name}
      />
    </div>
  );
}
