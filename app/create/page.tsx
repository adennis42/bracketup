'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StepIndicator from '@/components/StepIndicator';
import Step1Details from '@/components/wizard/Step1Details';
import Step2Players from '@/components/wizard/Step2Players';
import Step3Pairing from '@/components/wizard/Step3Pairing';
import Step4Prizes from '@/components/wizard/Step4Prizes';
import { EventType, FormatType, Player, Team, Tournament } from '@/types/tournament';
import {
  generateId,
  generateShareCode,
  generateRoundRobinSchedule,
  randomPairPlayers,
} from '@/lib/tournament-logic';
import { saveTournament } from '@/lib/tournament-store';

const STEPS = [
  { label: 'Details' },
  { label: 'Players' },
  { label: 'Teams' },
  { label: 'Prizes' },
];

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 1 state
  const [details, setDetails] = useState({
    name: '',
    event: 'disc-golf-putting' as EventType,
    customEvent: '',
    format: 'doubles' as FormatType,
  });

  // Step 2 state
  const [players, setPlayers] = useState<Player[]>([]);

  // Step 3 state
  const [teams, setTeams] = useState<Team[]>([]);

  // Step 4 state
  const [prizes, setPrizes] = useState({
    entryFeePerPlayer: 10,
    firstPercent: 60,
    secondPercent: 40,
  });

  const handleCreateTournament = () => {
    // If doubles and no teams generated yet, auto-pair
    let finalTeams = teams;
    if (details.format === 'doubles' && teams.length === 0) {
      finalTeams = randomPairPlayers(players);
    }
    // If singles, each player is their own "team"
    if (details.format === 'singles') {
      finalTeams = players.map((p) => ({
        id: generateId(),
        playerIds: [p.id],
        isPreset: false,
      }));
    }

    const rrMatches = generateRoundRobinSchedule(finalTeams);
    const totalRounds = Math.max(...rrMatches.map((m) => m.round), 0);

    const tournament: Tournament = {
      id: generateId(),
      hostId: 'local', // will be replaced with auth uid in phase 2
      hostName: 'Host',
      name: details.name,
      event: details.event,
      customEvent: details.customEvent || undefined,
      format: details.format,
      entryFeePerPlayer: prizes.entryFeePerPlayer,
      prizeSplit: {
        firstPercent: prizes.firstPercent,
        secondPercent: prizes.secondPercent,
      },
      phase: 'round-robin',
      players,
      teams: finalTeams,
      roundRobinMatches: rrMatches,
      eliminationMatches: [],
      shareCode: generateShareCode(),
      createdAt: new Date().toISOString(),
      totalRounds,
      currentRound: 1,
    };

    saveTournament(tournament);
    router.push(`/tournament/${tournament.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">New Tournament</h1>
          <p className="text-gray-500 text-sm">Set up your event in 4 quick steps</p>
        </div>

        {/* Step indicator */}
        <div className="mb-8">
          <StepIndicator steps={STEPS} currentStep={step} />
        </div>

        {/* Step content */}
        <div>
          {step === 0 && (
            <Step1Details
              data={details}
              onChange={(d) => setDetails((prev) => ({ ...prev, ...d }))}
              onNext={() => setStep(1)}
            />
          )}
          {step === 1 && (
            <Step2Players
              players={players}
              format={details.format}
              onChange={setPlayers}
              onNext={() => {
                setTeams([]); // reset teams if players changed
                setStep(2);
              }}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <>
              {details.format === 'singles' ? (
                // Skip pairing step for singles — just go straight to prizes
                <div className="space-y-4">
                  <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                    <p className="text-gray-300 text-sm">
                      Singles format — each player competes individually.
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {players.length} players entered
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 h-12 border border-gray-700 text-gray-400 rounded-xl text-sm hover:bg-gray-800"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="flex-1 h-12 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold text-sm"
                    >
                      Next: Prizes →
                    </button>
                  </div>
                </div>
              ) : (
                <Step3Pairing
                  players={players}
                  teams={teams}
                  onChange={setTeams}
                  onNext={() => setStep(3)}
                  onBack={() => setStep(1)}
                />
              )}
            </>
          )}
          {step === 3 && (
            <Step4Prizes
              data={prizes}
              playerCount={players.length}
              onChange={(d) => setPrizes((prev) => ({ ...prev, ...d }))}
              onSubmit={handleCreateTournament}
              onBack={() => setStep(2)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
