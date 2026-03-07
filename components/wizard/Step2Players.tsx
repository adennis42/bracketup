'use client';

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Player } from '@/types/tournament';
import { generateId } from '@/lib/tournament-logic';
import { Plus, X, UserPlus, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step2Props {
  players: Player[];
  format: 'singles' | 'doubles';
  onChange: (players: Player[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2Players({ players, format, onChange, onNext, onBack }: Step2Props) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addPlayer = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already added`);
      return;
    }
    onChange([...players, { id: generateId(), name: trimmed }]);
    setInputValue('');
    setError('');
    inputRef.current?.focus();
  };

  const removePlayer = (id: string) => {
    onChange(players.filter((p) => p.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addPlayer(inputValue);
    }
  };

  const handleNext = () => {
    const min = format === 'doubles' ? 4 : 2;
    if (players.length < min) {
      setError(`Need at least ${min} players for ${format}`);
      return;
    }
    setError('');
    onNext();
  };

  const teamsCount = format === 'doubles' ? Math.ceil(players.length / 2) : players.length;
  const hasSolo = format === 'doubles' && players.length % 2 !== 0;

  return (
    <div className="space-y-5">
      {/* Header info */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          <span className="text-white font-semibold">{players.length}</span> players
          {format === 'doubles' && (
            <span className="ml-2 text-gray-500">
              → <span className="text-white font-semibold">{teamsCount}</span> teams
              {hasSolo && <span className="text-amber-400 ml-1">(+1 solo)</span>}
            </span>
          )}
        </div>
        <Badge
          variant="outline"
          className="border-gray-700 text-gray-400 capitalize"
        >
          {format}
        </Badge>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            ref={inputRef}
            placeholder="Player name..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-12 text-base"
          />
        </div>
        <Button
          onClick={() => addPlayer(inputValue)}
          className="h-12 px-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {error && <p className="text-red-400 text-xs -mt-2">{error}</p>}

      {/* Player list */}
      {players.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-600">
          <UserPlus className="w-10 h-10 mb-3" />
          <p className="text-sm">Add players above to get started</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {players.map((player, i) => (
            <div
              key={player.id}
              className={cn(
                'flex items-center justify-between px-4 py-3 rounded-xl bg-gray-800 border border-gray-700',
                'animate-in slide-in-from-top-2 duration-200'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-sm w-5 text-right">{i + 1}</span>
                <span className="text-white font-medium">{player.name}</span>
                {hasSolo && i === players.length - 1 && (
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                    Solo
                  </Badge>
                )}
              </div>
              <button
                onClick={() => removePlayer(player.id)}
                className="text-gray-600 hover:text-red-400 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tip */}
      {players.length > 0 && hasSolo && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm text-amber-300">
          Odd number of players — the last player will be a solo team. They&apos;ll get extra byes in the bracket.
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
          onClick={handleNext}
          disabled={players.length < (format === 'doubles' ? 4 : 2)}
          className="flex-2 flex-1 h-12 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold disabled:opacity-40"
        >
          Next: Teams <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
