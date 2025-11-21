//GPT !
import { addPlayer, canStartTournament, getCurrentMatch, getTournamentState, getUpcomingMatches, resetTournament, startTournament, } from "../tournamentState.js";
export function renderTournamentView(root) {
    const title = document.createElement("h1");
    title.textContent = "Tournament";
    const subtitle = document.createElement("p");
    subtitle.textContent =
        "Add players by alias, then start the tournament to generate matches.";
    // --- Player input form ---------------------------------------------------
    const form = document.createElement("form");
    form.style.marginBottom = "1rem";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Player alias";
    input.maxLength = 16;
    const addButton = document.createElement("button");
    addButton.type = "submit";
    addButton.textContent = "Add player";
    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.textContent = "Reset tournament";
    resetButton.style.marginLeft = "0.5rem";
    const errorMsg = document.createElement("div");
    errorMsg.style.color = "#ff6b6b";
    errorMsg.style.marginTop = "0.5rem";
    errorMsg.style.minHeight = "1.2rem";
    form.appendChild(input);
    form.appendChild(addButton);
    form.appendChild(resetButton);
    form.appendChild(errorMsg);
    // --- Players list --------------------------------------------------------
    const playersSection = document.createElement("section");
    const playersTitle = document.createElement("h2");
    playersTitle.textContent = "Registered players";
    playersTitle.style.marginTop = "1rem";
    const playersList = document.createElement("ul");
    playersList.style.listStyle = "none";
    playersList.style.padding = "0";
    playersSection.appendChild(playersTitle);
    playersSection.appendChild(playersList);
    // --- Start tournament button ---------------------------------------------
    const startButton = document.createElement("button");
    startButton.type = "button";
    startButton.textContent = "Start tournament";
    startButton.style.marginTop = "1rem";
    startButton.style.display = "block";
    const startInfo = document.createElement("div");
    startInfo.style.marginTop = "0.5rem";
    startInfo.style.minHeight = "1.2rem";
    // --- Matches display -----------------------------------------------------
    const matchesSection = document.createElement("section");
    matchesSection.style.marginTop = "1.5rem";
    const currentMatchTitle = document.createElement("h2");
    currentMatchTitle.textContent = "Current match";
    const currentMatchDiv = document.createElement("div");
    currentMatchDiv.style.minHeight = "1.5rem";
    const upcomingTitle = document.createElement("h3");
    upcomingTitle.textContent = "Upcoming matches";
    const upcomingList = document.createElement("ul");
    upcomingList.style.listStyle = "none";
    upcomingList.style.padding = "0";
    matchesSection.appendChild(currentMatchTitle);
    matchesSection.appendChild(currentMatchDiv);
    matchesSection.appendChild(upcomingTitle);
    matchesSection.appendChild(upcomingList);
    // --- Attach everything to root ------------------------------------------
    root.appendChild(title);
    root.appendChild(subtitle);
    root.appendChild(form);
    root.appendChild(playersSection);
    root.appendChild(startButton);
    root.appendChild(startInfo);
    root.appendChild(matchesSection);
    // --- UI update helper ----------------------------------------------------
    function refreshUI() {
        const state = getTournamentState();
        // Players list
        playersList.innerHTML = "";
        state.players.forEach((p) => {
            const li = document.createElement("li");
            li.textContent = p.alias;
            playersList.appendChild(li);
        });
        // Start button enabled only if we have 2+ players and not already started
        startButton.disabled = !canStartTournament() || state.started;
        startButton.textContent = state.started
            ? "Tournament started"
            : "Start tournament";
        // Info text
        if (!state.players.length) {
            startInfo.textContent = "Add at least two players to start.";
        }
        else if (!state.started) {
            startInfo.textContent = `Players: ${state.players.length}. Ready to start when you want.`;
        }
        else {
            startInfo.textContent = `Players: ${state.players.length}. Tournament in progress.`;
        }
        // Matches
        currentMatchDiv.innerHTML = "";
        upcomingList.innerHTML = "";
        if (!state.started) {
            currentMatchDiv.textContent = "Tournament not started yet.";
            return;
        }
        const current = getCurrentMatch();
        const upcoming = getUpcomingMatches();
        if (!current) {
            currentMatchDiv.textContent = "Tournament finished.";
        }
        else {
            const a = current.playerA.alias;
            const b = current.playerB ? current.playerB.alias : "BYE";
            const text = document.createElement("div");
            text.textContent = `${a} vs ${b}`;
            currentMatchDiv.appendChild(text);
            if (current.playerB === null) {
                const byeInfo = document.createElement("small");
                byeInfo.textContent = " (automatic win for player A)";
                currentMatchDiv.appendChild(byeInfo);
            }
        }
        if (!upcoming.length) {
            const li = document.createElement("li");
            li.textContent = "No more upcoming matches.";
            upcomingList.appendChild(li);
        }
        else {
            upcoming.forEach((m) => {
                const li = document.createElement("li");
                const a = m.playerA.alias;
                const b = m.playerB ? m.playerB.alias : "BYE";
                li.textContent = `${a} vs ${b}`;
                upcomingList.appendChild(li);
            });
        }
    }
    // --- Event listeners -----------------------------------------------------
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const alias = input.value;
        const result = addPlayer(alias);
        if (!result.ok) {
            errorMsg.textContent = result.error ?? "Unknown error.";
        }
        else {
            errorMsg.textContent = "";
            input.value = "";
            refreshUI();
        }
    });
    resetButton.addEventListener("click", (event) => {
        event.preventDefault();
        resetTournament();
        errorMsg.textContent = "";
        refreshUI();
    });
    startButton.addEventListener("click", (event) => {
        event.preventDefault();
        const result = startTournament();
        if (!result.ok) {
            startInfo.textContent = result.error ?? "Could not start tournament.";
            return;
        }
        refreshUI();
    });
    // Initial render
    refreshUI();
}
