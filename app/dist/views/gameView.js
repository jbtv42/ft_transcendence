export function renderGameView(root) {
    const title = document.createElement("h1");
    title.textContent = "Game";
    const p = document.createElement("p");
    p.textContent = "This will be the Pong game view.";
    root.appendChild(title);
    root.appendChild(p);
}
