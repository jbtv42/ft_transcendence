// src/views/tournamentView.ts
import { renderGameView } from "./gameView.js";
import type { Player } from "../game/header.js";

type PlayerInput = Omit<Player, "place">;

export function renderTournamentView(root: HTMLElement): void {
  root.innerHTML = "";

  const title = document.createElement("h1");
  title.textContent = "Tournament (simple 1 match for now)";

  const info = document.createElement("p");
  info.textContent = "Enter players, then start the match.";

  const form = document.createElement("form");
  form.style.display = "flex";
  form.style.flexDirection = "column";
  form.style.gap = "0.5rem";
  form.style.maxWidth = "300px";
  form.style.margin = "1rem auto";

  const inputLeft = document.createElement("input");
  inputLeft.type = "text";
  inputLeft.placeholder = "Left player name";

  const inputRight = document.createElement("input");
  inputRight.type = "text";
  inputRight.placeholder = "Right player name";

  const startBtn = document.createElement("button");
  startBtn.type = "submit";
  startBtn.textContent = "Start match";

  form.appendChild(inputLeft);
  form.appendChild(inputRight);
  form.appendChild(startBtn);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const left: PlayerInput = {
      id: 1,
      name: inputLeft.value.trim() || "Player 1",
      rank: 0,
    };

    const right: PlayerInput = {
      id: 2,
      name: inputRight.value.trim() || "Player 2",
      rank: 0,
    };

    // 👇 IMPORTANT: we DON'T change the hash to #game
    // We just reuse the same `root` and render a game inside the tournament route
    renderGameView(root, {
      leftPlayer: left,
      rightPlayer: right,
      maxScore: 5,
      onGameEnd: (state) => {
        // After game ends, show a simple result + "Back to tournament setup" button
        renderTournamentResult(root, state.winner?.name ?? "Unknown");
      },
    });
  });

  root.appendChild(title);
  root.appendChild(info);
  root.appendChild(form);
}

function renderTournamentResult(root: HTMLElement, championName: string): void {
  root.innerHTML = "";

  const title = document.createElement("h1");
  title.textContent = "Tournament result";

  const p = document.createElement("p");
  p.textContent = `Winner: ${championName}`;

  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.textContent = "Back to tournament setup";
  backBtn.addEventListener("click", () => {
    renderTournamentView(root);
  });

  title.style.textAlign = "center";
  p.style.textAlign = "center";
  backBtn.style.display = "block";
  backBtn.style.margin = "1rem auto";

  root.appendChild(title);
  root.appendChild(p);
  root.appendChild(backBtn);
}
