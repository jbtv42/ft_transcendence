import { renderGameView } from "./gameView.js";
export function renderTournamentView(root) {
    root.innerHTML = "";
    const title = document.createElement("h1");
    title.textContent = "Pong Tournament";
    const info = document.createElement("p");
    info.textContent = "Enter 4 players to start a knockout tournament:";
    const form = document.createElement("form");
    form.style.display = "flex";
    form.style.flexDirection = "column";
    form.style.gap = "0.5rem";
    form.style.maxWidth = "300px";
    form.style.margin = "1rem auto";
    const inputs = [];
    for (let i = 0; i < 4; i++) {
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = `Player ${i + 1} name`;
        input.required = true;
        form.appendChild(input);
        inputs.push(input);
    }
    const startBtn = document.createElement("button");
    startBtn.type = "submit";
    startBtn.textContent = "Start tournament";
    form.appendChild(startBtn);
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const players = inputs.map((input, index) => ({
            id: index + 1,
            name: input.value.trim() || `Player ${index + 1}`,
            rank: 0,
        }));
        info.textContent =
            `Semi-final 1: ${players[0].name} vs ${players[1].name} | ` +
                `Semi-final 2: ${players[2].name} vs ${players[3].name} — starting in 2 seconds...`;
        startBtn.disabled = true;
        inputs.forEach((input) => (input.disabled = true));
        startBracket(root, players);
    });
    root.appendChild(title);
    root.appendChild(info);
    root.appendChild(form);
}
function startBracket(root, players) {
    if (players.length !== 4) {
        throw new Error("Tournament expects exactly 4 players.");
    }
    let roundIndex = 0;
    const semiWinners = [];
    let finalLoser = null;
    function startMatch(left, right, label) {
        renderGameView(root, {
            leftPlayer: left,
            rightPlayer: right,
            maxScore: 5,
            onGameEnd: (state) => {
                const w = state.winner;
                if (!w)
                    return;
                const winner = {
                    id: w.id,
                    name: w.name,
                    rank: w.rank,
                };
                const loser = winner.id === left.id ? right : left;
                if (roundIndex === 0 || roundIndex === 1) {
                    semiWinners.push(winner);
                }
                if (roundIndex === 2) {
                    finalLoser = loser;
                }
                roundIndex++;
                if (roundIndex === 1) {
                    setTimeout(() => {
                        startMatch(players[2], players[3], "Semi-final 2");
                    }, 5000);
                }
                else if (roundIndex === 2) {
                    setTimeout(() => {
                        startMatch(semiWinners[0], semiWinners[1], "Final");
                    }, 5000);
                }
                else if (roundIndex === 3) {
                    setTimeout(() => {
                        renderTournamentResult(root, winner, finalLoser, players);
                    }, 5000);
                }
            },
        });
        const subtitle = document.createElement("h2");
        subtitle.textContent = label;
        subtitle.style.textAlign = "center";
        const children = Array.from(root.children);
        const mainTitle = children.find((el) => el.tagName === "H1");
        if (mainTitle && mainTitle.nextSibling) {
            root.insertBefore(subtitle, mainTitle.nextSibling);
        }
        else if (mainTitle) {
            root.appendChild(subtitle);
        }
        else {
            root.insertBefore(subtitle, root.firstChild);
        }
    }
    setTimeout(() => {
        startMatch(players[0], players[1], "Semi-final 1");
    }, 5000);
}
function renderTournamentResult(root, champion, finalLoser, allPlayers) {
    root.innerHTML = "";
    const title = document.createElement("h1");
    title.textContent = "Tournament finished";
    const champ = document.createElement("p");
    champ.textContent = `Champion: ${champion.name}`;
    const positions = document.createElement("ul");
    const li1 = document.createElement("li");
    li1.textContent = `1st: ${champion.name}`;
    positions.appendChild(li1);
    if (finalLoser) {
        const li2 = document.createElement("li");
        li2.textContent = `2nd: ${finalLoser.name}`;
        positions.appendChild(li2);
    }
    // semi-final losers = everyone not champion/finalLoser
    const others = allPlayers.filter((p) => p.id !== champion.id &&
        (!finalLoser || p.id !== finalLoser.id));
    if (others.length > 0) {
        const li3 = document.createElement("li");
        li3.textContent = `Semi-finalists: ${others
            .map((p) => p.name)
            .join(", ")}`;
        positions.appendChild(li3);
    }
    const restartBtn = document.createElement("button");
    restartBtn.type = "button";
    restartBtn.textContent = "Start a new tournament";
    restartBtn.style.display = "block";
    restartBtn.style.margin = "1rem auto";
    restartBtn.addEventListener("click", () => {
        renderTournamentView(root);
    });
    title.style.textAlign = "center";
    champ.style.textAlign = "center";
    root.appendChild(title);
    root.appendChild(champ);
    root.appendChild(positions);
    root.appendChild(restartBtn);
}
