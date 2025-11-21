import { createPongGame } from "../game/pong.js";
export function renderGameView(root) {
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
    createPongGame(canvas);
}
