export function renderHomeView(root) {
    const title = document.createElement("h1");
    title.textContent = "ft_transcendence";
    const p = document.createElement("p");
    p.textContent = "Welcome! Use the links above to navigate.";
    root.appendChild(title);
    root.appendChild(p);
}
