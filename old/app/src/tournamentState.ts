export type Player = {
  id: number;
  alias: string;
};

export type Match = {
  id: number;
  playerA: Player;
  playerB?: Player | null; // null / undefined == bye
  winnerAlias?: string;    // we’ll fill this later when game is played
};

export type TournamentState = {
  players: Player[];
  matches: Match[];
  currentMatchIndex: number; // -1 = not started yet
  started: boolean;
};

let nextPlayerId = 1;
let nextMatchId = 1;

let state: TournamentState = {
  players: [],
  matches: [],
  currentMatchIndex: -1,
  started: false,
};

export function getTournamentState(): TournamentState {
  return state;
}

export function resetTournament(): void {
  state = {
    players: [],
    matches: [],
    currentMatchIndex: -1,
    started: false,
  };
  nextPlayerId = 1;
  nextMatchId = 1;
}

export function addPlayer(alias: string): { ok: boolean; error?: string } {
  const trimmed = alias.trim();

  if (!trimmed) {
    return { ok: false, error: "Alias cannot be empty." };
  }
  if (trimmed.length > 16) {
    return { ok: false, error: "Alias must be at most 16 characters." };
  }

  const lower = trimmed.toLowerCase();
  const exists = state.players.some(
    (p) => p.alias.toLowerCase() === lower
  );
  if (exists) {
    return { ok: false, error: "This alias is already registered." };
  }

  state.players.push({
    id: nextPlayerId++,
    alias: trimmed,
  });

  if (state.started) {
    state.started = false;
    state.matches = [];
    state.currentMatchIndex = -1;
  }

  return { ok: true };
}

export function canStartTournament(): boolean {
  return state.players.length >= 2;
}

export function startTournament(): { ok: boolean; error?: string } {
  if (!canStartTournament()) {
    return { ok: false, error: "At least 2 players are required." };
  }

  const players = [...state.players];
  const matches: Match[] = [];

  for (let i = 0; i < players.length; i += 2) {
    const playerA = players[i];
    const playerB = players[i + 1] ?? null;

    matches.push({
      id: nextMatchId++,
      playerA,
      playerB,
    });
  }

  state.matches = matches;
  state.started = true;
  state.currentMatchIndex = matches.length > 0 ? 0 : -1;

  return { ok: true };
}

export function getCurrentMatch(): Match | null {
  if (!state.started) return null;
  if (state.currentMatchIndex < 0) return null;
  if (state.currentMatchIndex >= state.matches.length) return null;
  return state.matches[state.currentMatchIndex];
}

export function getUpcomingMatches(): Match[] {
  if (!state.started) return [];
  if (state.currentMatchIndex < 0) return state.matches;
  return state.matches.slice(state.currentMatchIndex + 1);
}

export function setMatchWinner(winnerAlias: string): void {
  const current = getCurrentMatch();
  if (!current) return;

  current.winnerAlias = winnerAlias;

  if (state.currentMatchIndex < state.matches.length - 1) {
    state.currentMatchIndex++;
  } else {
    state.currentMatchIndex = state.matches.length;
  }
}
