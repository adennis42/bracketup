'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllTournaments, deleteTournament } from '@/lib/tournament-store';
import { Tournament } from '@/types/tournament';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Trophy, Users, Clock, ChevronRight, Search, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const EVENT_ICONS: Record<string, string> = {
  'disc-golf-putting': '🥏',
  'disc-golf': '🥏',
  'ping-pong': '🏓',
  basketball: '🏀',
  volleyball: '🏐',
  custom: '🏆',
};

const PHASE_LABELS: Record<string, string> = {
  'round-robin': 'In Progress',
  elimination: 'Elimination',
  complete: 'Complete',
};

const PHASE_COLORS: Record<string, string> = {
  'round-robin': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  elimination: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  complete: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

export default function HomePage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [search, setSearch] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    setTournaments(getAllTournaments());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this tournament?')) {
      deleteTournament(id);
      setTournaments(getAllTournaments());
    }
  };

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    router.push(`/view/${code}`);
  };

  const filtered = tournaments.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Logo / Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">BracketUp</h1>
              <p className="text-gray-500 text-xs">Run better tournaments</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={() => router.push('/create')}
          className="w-full h-14 bg-violet-600 hover:bg-violet-500 text-white text-base font-semibold rounded-2xl shadow-lg shadow-violet-900/30 mb-6"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Tournament
        </Button>

        {/* Join by code */}
        <div className="mb-8 space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Join as Participant</p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter share code..."
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 h-11 uppercase tracking-widest text-center text-base font-bold"
              maxLength={6}
            />
            <Button
              onClick={handleJoin}
              disabled={!joinCode.trim()}
              className="h-11 px-5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl disabled:opacity-40"
            >
              View
            </Button>
          </div>
          {joinError && <p className="text-red-400 text-xs">{joinError}</p>}
        </div>

        {/* Tournament history */}
        {tournaments.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">My Tournaments</p>
              <span className="text-gray-600 text-xs">{tournaments.length}</span>
            </div>

            {tournaments.length > 3 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <Input
                  placeholder="Search tournaments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 h-9 pl-9 text-sm"
                />
              </div>
            )}

            <div className="space-y-2">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => router.push(`/tournament/${t.id}`)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-800 border border-gray-700 hover:border-gray-600 hover:bg-gray-800/80 text-left transition-all"
                >
                  <span className="text-2xl">{EVENT_ICONS[t.event] ?? '🏆'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-semibold text-sm truncate">{t.name}</p>
                      <Badge className={cn('text-xs border shrink-0', PHASE_COLORS[t.phase] ?? 'border-gray-700 text-gray-400')}>
                        {PHASE_LABELS[t.phase] ?? t.phase}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500 text-xs">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {t.teams.length} teams
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleDelete(t.id, e)}
                      className="p-1.5 text-gray-700 hover:text-red-400 transition-colors rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </div>
                </button>
              ))}
            </div>

            {filtered.length === 0 && search && (
              <p className="text-gray-600 text-sm text-center py-4">No tournaments matching &quot;{search}&quot;</p>
            )}
          </div>
        )}

        {/* Empty state */}
        {tournaments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-400 font-medium mb-1">No tournaments yet</p>
            <p className="text-gray-600 text-sm">Create your first one above</p>
          </div>
        )}
      </div>
    </div>
  );
}
