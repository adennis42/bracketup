'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step4Props {
  data: {
    entryFeePerPlayer: number;
    firstPercent: number;
    secondPercent: number;
  };
  playerCount: number;
  onChange: (data: Partial<Step4Props['data']>) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const PRESET_SPLITS = [
  { label: '60 / 40', first: 60, second: 40 },
  { label: '70 / 30', first: 70, second: 30 },
  { label: '75 / 25', first: 75, second: 25 },
  { label: '50 / 50', first: 50, second: 50 },
];

export default function Step4Prizes({ data, playerCount, onChange, onSubmit, onBack }: Step4Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalPot = data.entryFeePerPlayer * playerCount;
  const firstTeamPayout = (totalPot * data.firstPercent) / 100;
  const secondTeamPayout = (totalPot * data.secondPercent) / 100;
  const splitTotal = data.firstPercent + data.secondPercent;

  const validate = () => {
    const e: Record<string, string> = {};
    if (data.entryFeePerPlayer < 0) e.fee = 'Entry fee cannot be negative';
    if (splitTotal !== 100) e.split = 'Percentages must add up to 100%';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onSubmit();
  };

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      {/* Entry fee */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-200">Entry Fee per Player</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            type="number"
            min={0}
            step={1}
            placeholder="0.00"
            value={data.entryFeePerPlayer || ''}
            onChange={(e) => onChange({ entryFeePerPlayer: parseFloat(e.target.value) || 0 })}
            className="bg-gray-800 border-gray-700 text-white pl-9 h-12 text-base"
          />
        </div>
        {errors.fee && <p className="text-red-400 text-xs">{errors.fee}</p>}
        {totalPot > 0 && (
          <p className="text-sm text-gray-400">
            Total pot: <span className="text-white font-semibold">{fmt(totalPot)}</span>
            <span className="text-gray-600 ml-1">({playerCount} players × {fmt(data.entryFeePerPlayer)})</span>
          </p>
        )}
      </div>

      {/* Prize split */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-200">Prize Split</Label>

        {/* Presets */}
        <div className="grid grid-cols-4 gap-2">
          {PRESET_SPLITS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => onChange({ firstPercent: preset.first, secondPercent: preset.second })}
              className={cn(
                'py-2 px-1 rounded-lg text-xs font-semibold border-2 transition-all',
                data.firstPercent === preset.first && data.secondPercent === preset.second
                  ? 'border-violet-500 bg-violet-500/10 text-white'
                  : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:text-white'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">1st Place %</Label>
            <div className="relative">
              <Input
                type="number"
                min={0}
                max={100}
                value={data.firstPercent}
                onChange={(e) => onChange({ firstPercent: parseInt(e.target.value) || 0 })}
                className="bg-gray-800 border-gray-700 text-white h-10 pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">2nd Place %</Label>
            <div className="relative">
              <Input
                type="number"
                min={0}
                max={100}
                value={data.secondPercent}
                onChange={(e) => onChange({ secondPercent: parseInt(e.target.value) || 0 })}
                className="bg-gray-800 border-gray-700 text-white h-10 pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
            </div>
          </div>
        </div>

        {splitTotal !== 100 && (
          <p className="text-amber-400 text-xs">
            Currently {splitTotal}% — must equal 100%
          </p>
        )}
        {errors.split && <p className="text-red-400 text-xs">{errors.split}</p>}
      </div>

      {/* Payout preview */}
      {totalPot > 0 && splitTotal === 100 && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Payout Preview</p>
          <div className="space-y-2">
            {[
              { place: '🥇 1st Place', pct: data.firstPercent, team: firstTeamPayout },
              { place: '🥈 2nd Place', pct: data.secondPercent, team: secondTeamPayout },
            ].map(({ place, pct, team }) => (
              <div key={place} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{place} ({pct}%)</span>
                <div className="text-right">
                  <div className="text-white font-semibold text-sm">{fmt(team)} total</div>
                  <div className="text-gray-500 text-xs">{fmt(team / 2)} / player</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zero fee note */}
      {data.entryFeePerPlayer === 0 && (
        <p className="text-gray-500 text-xs text-center">
          No entry fee — prize tracking will be skipped
        </p>
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
          onClick={handleSubmit}
          className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold"
        >
          <Trophy className="w-4 h-4 mr-2" /> Start Tournament
        </Button>
      </div>
    </div>
  );
}
