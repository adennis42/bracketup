'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Player, Team } from '@/types/tournament';
import { generateId, randomPairPlayers, getTeamDisplayName } from '@/lib/tournament-logic';
import { Shuffle, Plus, X, Users, ArrowRight, ArrowLeft, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step3Props {
  players: Player[];
  teams: Team[];
  onChange: (teams: Team[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step3Pairing({ players, teams, onChange, onNext, onBack }: Step3Props) {
  const [addTeamMode, setAddTeamMode] = useState(false);
  const [teamPlayer1, setTeamPlayer1] = useState('');
  const [teamPlayer2, setTeamPlayer2] = useState('');
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');

  const pairedPlayerIds = new Set(teams.flatMap((t) => t.playerIds));
  const unpairedPlayers = players.filter((p) => !pairedPlayerIds.has(p.id));

  const handleShuffle = () => {
    // Keep preset teams, re-randomize the rest
    const presetTeams = teams.filter((t) => t.isPreset);
    const newTeams = randomPairPlayers(players, presetTeams);
    onChange(newTeams);
  };

  const handleAddPresetTeam = () => {
    const p1 = players.find(
      (p) => p.name.toLowerCase() === teamPlayer1.trim().toLowerCase()
    );
    const p2 = players.find(
      (p) => p.name.toLowerCase() === teamPlayer2.trim().toLowerCase()
    );

    if (!p1) { setError(`Player "${teamPlayer1}" not found`); return; }
    if (!p2) { setError(`Player "${teamPlayer2}" not found`); return; }
    if (p1.id === p2.id) { setError('Select two different players'); return; }
    if (pairedPlayerIds.has(p1.id)) { setError(`${p1.name} is already on a team`); return; }
    if (pairedPlayerIds.has(p2.id)) { setError(`${p2.name} is already on a team`); return; }

    const newTeam: Team = {
      id: generateId(),
      name: teamName.trim() || undefined,
      playerIds: [p1.id, p2.id],
      isPreset: true,
    };

    onChange([...teams, newTeam]);
    setTeamPlayer1('');
    setTeamPlayer2('');
    setTeamName('');
    setError('');
    setAddTeamMode(false);
  };

  const removeTeam = (teamId: string) => {
    onChange(teams.filter((t) => t.id !== teamId));
  };

  const allPaired = unpairedPlayers.length === 0 || (unpairedPlayers.length === 1);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          <span className="text-white font-semibold">{teams.length}</span> teams formed
          {unpairedPlayers.length > 0 && (
            <span className="text-amber-400 ml-2">· {unpairedPlayers.length} unpaired</span>
          )}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAddTeamMode(!addTeamMode)}
          className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 h-8 text-xs gap-1"
        >
          <Plus className="w-3 h-3" /> Add Team
        </Button>
      </div>

      {/* Add preset team form */}
      {addTeamMode && (
        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-gray-300">Add Existing Team</p>
          <Input
            placeholder="Player 1 name"
            value={teamPlayer1}
            onChange={(e) => { setTeamPlayer1(e.target.value); setError(''); }}
            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-600 h-10"
            list="player-names"
          />
          <Input
            placeholder="Player 2 name"
            value={teamPlayer2}
            onChange={(e) => { setTeamPlayer2(e.target.value); setError(''); }}
            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-600 h-10"
            list="player-names"
          />
          <Input
            placeholder="Team name (optional)"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-600 h-10"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <datalist id="player-names">
            {players.map((p) => (
              <option key={p.id} value={p.name} />
            ))}
          </datalist>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setAddTeamMode(false); setError(''); }}
              className="flex-1 border border-gray-700 text-gray-400"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddPresetTeam}
              className="flex-1 bg-violet-600 hover:bg-violet-500 text-white"
            >
              <UserCheck className="w-4 h-4 mr-1" /> Add Team
            </Button>
          </div>
        </div>
      )}

      {/* Shuffle button */}
      {unpairedPlayers.length >= 2 && (
        <Button
          onClick={handleShuffle}
          variant="outline"
          className="w-full h-11 border-dashed border-gray-600 text-gray-300 hover:text-white hover:border-violet-500 hover:bg-violet-500/5 rounded-xl"
        >
          <Shuffle className="w-4 h-4 mr-2" />
          {teams.length === 0 ? 'Randomly Pair All Players' : 'Re-shuffle Unpaired Players'}
        </Button>
      )}

      {/* Teams list */}
      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-600">
          <Users className="w-10 h-10 mb-3" />
          <p className="text-sm">No teams yet — add one manually or shuffle</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {teams.map((team, i) => (
            <div
              key={team.id}
              className={cn(
                'flex items-center justify-between px-4 py-3 rounded-xl border transition-all',
                team.isPreset
                  ? 'bg-violet-500/10 border-violet-500/30'
                  : 'bg-gray-800 border-gray-700'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-sm w-5 text-right">{i + 1}</span>
                <div>
                  <p className="text-white font-medium text-sm">
                    {getTeamDisplayName(team, players)}
                  </p>
                  {team.playerIds.length === 1 && (
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs mt-0.5">
                      Solo
                    </Badge>
                  )}
                </div>
                {team.isPreset && (
                  <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">
                    Preset
                  </Badge>
                )}
              </div>
              <button
                onClick={() => removeTeam(team.id)}
                className="text-gray-600 hover:text-red-400 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Unpaired players */}
      {unpairedPlayers.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
            Unpaired Players
          </p>
          <div className="flex flex-wrap gap-2">
            {unpairedPlayers.map((p) => (
              <Badge key={p.id} variant="outline" className="border-gray-600 text-gray-400 text-xs">
                {p.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Nav */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex-1 h-12 text-gray-400 border border-gray-700 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button
          onClick={onNext}
          disabled={teams.length < 2}
          className="flex-1 h-12 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold disabled:opacity-40"
        >
          Next: Prizes <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
