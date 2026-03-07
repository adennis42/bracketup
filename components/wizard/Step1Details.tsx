'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EventType, FormatType } from '@/types/tournament';
import { Disc, Table2, Activity, Volleyball, ArrowRight, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const EVENTS: { type: EventType; label: string; icon: React.ReactNode }[] = [
  { type: 'disc-golf-putting', label: 'Disc Golf Putting', icon: <Disc className="w-5 h-5" /> },
  { type: 'disc-golf', label: 'Disc Golf', icon: <Disc className="w-5 h-5" /> },
  { type: 'ping-pong', label: 'Ping Pong', icon: <Table2 className="w-5 h-5" /> },
  { type: 'basketball', label: 'Basketball', icon: <Activity className="w-5 h-5" /> },
  { type: 'volleyball', label: 'Volleyball', icon: <Volleyball className="w-5 h-5" /> },
  { type: 'custom', label: 'Other', icon: <HelpCircle className="w-5 h-5" /> },
];

interface Step1Props {
  data: {
    name: string;
    event: EventType;
    customEvent: string;
    format: FormatType;
  };
  onChange: (data: Partial<Step1Props['data']>) => void;
  onNext: () => void;
}

export default function Step1Details({ data, onChange, onNext }: Step1Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!data.name.trim()) e.name = 'Tournament name is required';
    if (data.event === 'custom' && !data.customEvent.trim()) e.customEvent = 'Please name your event';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <div className="space-y-6">
      {/* Tournament Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-gray-200">
          Tournament Name
        </Label>
        <Input
          id="name"
          placeholder="e.g. Friday Night Putting League"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-12 text-base"
        />
        {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
      </div>

      {/* Event Type */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-200">Event Type</Label>
        <div className="grid grid-cols-2 gap-3">
          {EVENTS.map((ev) => (
            <button
              key={ev.type}
              onClick={() => onChange({ event: ev.type })}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all',
                data.event === ev.type
                  ? 'border-violet-500 bg-violet-500/10 text-white'
                  : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:text-white'
              )}
            >
              <span className={data.event === ev.type ? 'text-violet-400' : ''}>{ev.icon}</span>
              <span className="text-sm font-medium">{ev.label}</span>
            </button>
          ))}
        </div>
        {data.event === 'custom' && (
          <div className="space-y-1 mt-2">
            <Input
              placeholder="Name your event..."
              value={data.customEvent}
              onChange={(e) => onChange({ customEvent: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-12 text-base"
            />
            {errors.customEvent && <p className="text-red-400 text-xs">{errors.customEvent}</p>}
          </div>
        )}
      </div>

      {/* Format */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-200">Format</Label>
        <div className="grid grid-cols-2 gap-3">
          {(['singles', 'doubles'] as FormatType[]).map((f) => (
            <button
              key={f}
              onClick={() => onChange({ format: f })}
              className={cn(
                'p-4 rounded-xl border-2 text-center transition-all capitalize',
                data.format === f
                  ? 'border-violet-500 bg-violet-500/10 text-white font-semibold'
                  : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:text-white'
              )}
            >
              <div className="text-base font-semibold capitalize">{f}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {f === 'singles' ? 'Each player competes solo' : 'Teams of 2 players'}
              </div>
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={handleNext}
        className="w-full h-12 bg-violet-600 hover:bg-violet-500 text-white text-base font-semibold rounded-xl"
      >
        Next: Add Players <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
