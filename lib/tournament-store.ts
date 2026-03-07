/**
 * Local tournament store using localStorage.
 * This is the Phase 1 storage layer — will be swapped for Firestore in Phase 2.
 */

import { Tournament } from '@/types/tournament';

const STORAGE_KEY = 'tournaments';

export function saveTournament(tournament: Tournament): void {
  const all = getAllTournaments();
  const idx = all.findIndex((t) => t.id === tournament.id);
  if (idx >= 0) {
    all[idx] = tournament;
  } else {
    all.unshift(tournament);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getTournament(id: string): Tournament | null {
  const all = getAllTournaments();
  return all.find((t) => t.id === id) ?? null;
}

export function getTournamentByShareCode(code: string): Tournament | null {
  const all = getAllTournaments();
  return all.find((t) => t.shareCode === code.toUpperCase()) ?? null;
}

export function getAllTournaments(): Tournament[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function deleteTournament(id: string): void {
  const all = getAllTournaments().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
