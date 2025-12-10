// app/src/views/homeView.ts
import { renderGameView } from "./gameView.js";
// PERM PRINTING
async function fetchLeaderboard() {
    try {
        const res = await fetch("/api/leaderboard.php");
        const data = await res.json();
        if (data.status !== "ok")
            return [];
        return data.players ?? [];
    }
    catch (e) {
        console.error("Failed to load leaderboard:", e);
        return [];
    }
}
// HOME WEB PAGE
export function renderHomeView(root) {
    root.innerHTML = "";
    const title = document.createElement("h1");
    title.textContent = "ft_transcendence";
    const p = document.createElement("p");
    p.textContent = "Welcome! Use the links above to navigate.";
    const leaderboardTitle = document.createElement("h2");
    leaderboardTitle.textContent = "Top players";
    const leaderboardList = document.createElement("ol");
    leaderboardList.style.maxWidth = "400px";
    leaderboardList.style.margin = "0 auto 1rem auto";
    const loadingItem = document.createElement("li");
    loadingItem.textContent = "Loading leaderboard...";
    leaderboardList.appendChild(loadingItem);
    root.appendChild(title);
    root.appendChild(p);
    root.appendChild(leaderboardTitle);
    root.appendChild(leaderboardList);
    // Load leaderboard asynchronously
    (async () => {
        const players = await fetchLeaderboard();
        leaderboardList.innerHTML = "";
        if (players.length === 0) {
            const li = document.createElement("li");
            li.textContent = "No games played yet.";
            leaderboardList.appendChild(li);
            return;
        }
        players.forEach((player) => {
            const li = document.createElement("li");
            li.textContent = `${player.username} – Elo ${player.elo}`;
            leaderboardList.appendChild(li);
        });
    })();
    // ---- GAME MODE SELECTION ----
    const modeTitle = document.createElement("h2");
    modeTitle.textContent = "Play Pong";
    const buttons = document.createElement("div");
    buttons.style.display = "flex";
    buttons.style.flexDirection = "column";
    buttons.style.gap = "0.5rem";
    buttons.style.maxWidth = "300px";
    buttons.style.margin = "1rem auto";
    const aiBtn = document.createElement("button");
    aiBtn.textContent = "Play vs AI";
    aiBtn.onclick = () => {
        const config = {
            mode: "soloRight", // AI on the right paddle
            aiLevel: 2, // difficulty 1–4 (uses your ai.ts)
            maxScore: 10,
        };
        renderGameView(root, config);
    };
    const onlineBtn = document.createElement("button");
    onlineBtn.textContent = "Play Online (2 players)";
    onlineBtn.onclick = () => {
        const config = {
            mode: "mp", // anything that is not soloLeft/soloRight => online branch
        };
        renderGameView(root, config);
    };
    buttons.appendChild(aiBtn);
    buttons.appendChild(onlineBtn);
    root.appendChild(modeTitle);
    root.appendChild(buttons);
}
