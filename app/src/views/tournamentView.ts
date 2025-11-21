export function renderTournamentView(root: HTMLElement): void {
  const title = document.createElement("h1");
  title.textContent = "Tournament";

  const p = document.createElement("p");
  p.textContent = "Here we'll add players, generate matches, and show the bracket.";

  root.appendChild(title);
  root.appendChild(p);
}
