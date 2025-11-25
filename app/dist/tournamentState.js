let nextPlayerId = 1;
let nextMatchId = 1;
let state = {
    players: [],
    matches: [],
    currentMatchIndex: -1,
    started: false,
};
export function getTournamentState() {
    return state;
}
export function resetTournament() {
    state = {
        players: [],
        matches: [],
        currentMatchIndex: -1,
        started: false,
    };
    nextPlayerId = 1;
    nextMatchId = 1;
}
export function addPlayer(alias) {
    const trimmed = alias.trim();
    if (!trimmed) {
        return { ok: false, error: "Alias cannot be empty." };
    }
    if (trimmed.length > 16) {
        return { ok: false, error: "Alias must be at most 16 characters." };
    }
    const lower = trimmed.toLowerCase();
    const exists = state.players.some((p) => p.alias.toLowerCase() === lower);
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
export function canStartTournament() {
    return state.players.length >= 2;
}
export function startTournament() {
    if (!canStartTournament()) {
        return { ok: false, error: "At least 2 players are required." };
    }
    const players = [...state.players];
    const matches = [];
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
export function getCurrentMatch() {
    if (!state.started)
        return null;
    if (state.currentMatchIndex < 0)
        return null;
    if (state.currentMatchIndex >= state.matches.length)
        return null;
    return state.matches[state.currentMatchIndex];
}
export function getUpcomingMatches() {
    if (!state.started)
        return [];
    if (state.currentMatchIndex < 0)
        return state.matches;
    return state.matches.slice(state.currentMatchIndex + 1);
}
export function setMatchWinner(winnerAlias) {
    const current = getCurrentMatch();
    if (!current)
        return;
    current.winnerAlias = winnerAlias;
    if (state.currentMatchIndex < state.matches.length - 1) {
        state.currentMatchIndex++;
    }
    else {
        state.currentMatchIndex = state.matches.length;
    }
}
