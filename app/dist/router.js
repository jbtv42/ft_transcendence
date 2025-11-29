import { renderHomeView } from "./views/homeView.js";
import { renderTournamentView } from "./views/tournamentView.js";
import { renderGameView } from "./views/gameView.js";
function getRouteFromHash() {
    const hash = window.location.hash.slice(1);
    if (hash === "tournament")
        return "tournament";
    if (hash === "game")
        return "game";
    return "home";
}
function renderRoute() {
    const root = document.getElementById("app");
    if (!root) {
        console.error("No #app element found in DOM");
        return;
    }
    root.innerHTML = "";
    const nav = document.createElement("nav");
    nav.innerHTML = `
    <a href="#home">Home</a> |
    <a href="#tournament">Tournament</a> |
    <a href="#game">Game</a>
  `;
    nav.style.position = "absolute";
    nav.style.top = "1rem";
    nav.style.left = "1rem";
    const viewContainer = document.createElement("div");
    viewContainer.className = "card";
    root.appendChild(nav);
    root.appendChild(viewContainer);
    const route = getRouteFromHash();
    console.log("[router] route =", route);
    switch (route) {
        case "home":
            renderHomeView(viewContainer);
            break;
        case "tournament":
            renderTournamentView(viewContainer);
            break;
        case "game":
            renderGameView(viewContainer, {
                mode: "soloRight", // <- AI on right side
                aiLevel: 2,
            });
            break;
    }
}
export function initRouter() {
    if (!window.location.hash) {
        window.location.hash = "#home";
    }
    window.addEventListener("hashchange", renderRoute);
    renderRoute();
}
