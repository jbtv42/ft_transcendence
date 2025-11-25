import { createPongGame } from "../game/pong.js";
import type { Player, GameState } from "../game/header.js";

type PlayerInput = Omit<Player, "place">;

type AiLevel = 1 | 2 | 3 | 4;

export type GameViewConfig = {
  leftPlayer?: PlayerInput;
  rightPlayer?: PlayerInput;
  maxScore?: number;
  onGameEnd?: (state: GameState) => void;
  mode?: "mp" | "soloLeft" | "soloRight";
  aiLevel?: AiLevel;
};


export function renderGameView(
  root: HTMLElement,
  config?: GameViewConfig
): void {
  root.innerHTML = "";

  const title = document.createElement("h1");
  title.textContent = "Pong";

  const info = document.createElement("p");

  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  canvas.style.border = "1px solid #fff";
  canvas.style.display = "block";
  canvas.style.margin = "1rem auto 0 auto";
  canvas.style.background = "#000";

  root.appendChild(title);
  root.appendChild(info);
  root.appendChild(canvas);

  const leftPlayer: PlayerInput =
    config?.leftPlayer ?? {
      id: 1,
      name: "Sam",
      rank: 0,
    };

  const rightPlayer: PlayerInput =
    config?.rightPlayer ?? {
      id: 2,
      name: "Bob",
      rank: 0,
    };

  const maxScore = config?.maxScore ?? 5;

  info.textContent = `${leftPlayer.name} vs ${rightPlayer.name} – first to ${maxScore}`;

  createPongGame(canvas, {
    leftPlayer,
    rightPlayer,
    maxScore,
    onGameEnd: (state) => {
      if (state.winner) {
        info.textContent = `Winner: ${state.winner.name} (${state.lScore} – ${state.rScore})`;
      } else {
        info.textContent = `Game over`;
      }
      config?.onGameEnd?.(state);
    },
  });
}

