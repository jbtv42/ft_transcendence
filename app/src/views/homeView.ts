type LeaderboardPlayer = {
  id: number;
  username: string;
  elo: number;
  created_at: string;
};

async function fetchLeaderboard(): Promise<LeaderboardPlayer[]> {
  try {
    const res = await fetch("/api/leaderboard.php");
    const data = await res.json();
    if (data.status !== "ok") return [];
    return data.players ?? [];
  } catch (e) {
    console.error("Failed to load leaderboard:", e);
    return [];
  }
}

export function renderHomeView(root: HTMLElement): void {
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
}
