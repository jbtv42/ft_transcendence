import { createPongGame } from "../game/pong.js";
import { connectGameServer, setOnServerState } from "../network/gameSocket.js";
async function saveMatchResult(mode, maxScore, built, state, context) {
    if (mode !== "mp")
        return;
    try {
        await fetch("/api/save_match.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                mode,
                maxScore,
                context,
                leftPlayer: {
                    username: built.leftPlayer.name,
                    score: state.lScore,
                },
                rightPlayer: {
                    username: built.rightPlayer.name,
                    score: state.rScore,
                },
            }),
        });
    }
    catch (err) {
        console.error("Failed to save match:", err);
    }
}
function createCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    canvas.style.border = "1px solid #fff";
    canvas.style.display = "block";
    canvas.style.margin = "1rem auto 0 auto";
    canvas.style.background = "#000";
    return canvas;
}
function buildGameConfig(config, mode, aiLevel, leftName, rightName) {
    const maxScore = config?.maxScore ?? 5;
    const leftPlayer = config?.leftPlayer ?? {
        id: 1,
        name: "Dave",
        rank: 0,
    };
    const rightPlayer = config?.rightPlayer ?? {
        id: 2,
        name: "Dave",
        rank: 0,
    };
    if (leftName && leftName.trim()) {
        leftPlayer.name = leftName.trim();
    }
    if (rightName && rightName.trim()) {
        rightPlayer.name = rightName.trim();
    }
    let aiSide;
    if (mode === "soloLeft")
        aiSide = "left";
    else if (mode === "soloRight")
        aiSide = "right";
    else
        aiSide = undefined;
    if (aiSide === "left") {
        leftPlayer.name = "HAL-9000";
    }
    else if (aiSide === "right") {
        rightPlayer.name = "HAL-9000";
    }
    const baseInfoText = `First to ${maxScore}`;
    return {
        leftPlayer,
        rightPlayer,
        aiSide,
        aiLevel,
        maxScore,
        baseInfoText,
    };
}
let gameWs = null;
export function renderGameView(root, config) {
    root.innerHTML = "";
    const title = document.createElement("h1");
    title.textContent = "Pong";
    const info = document.createElement("p");
    const controls = document.createElement("div");
    controls.style.display = "flex";
    controls.style.flexWrap = "wrap";
    controls.style.gap = "0.5rem";
    controls.style.justifyContent = "center";
    controls.style.alignItems = "center";
    controls.style.marginBottom = "0.5rem";
    const modeLabel = document.createElement("label");
    modeLabel.textContent = "Mode: ";
    const modeSelect = document.createElement("select");
    const optMp = new Option("Multiplayer", "mp");
    const optSoloLeft = new Option("AI on left", "soloLeft");
    const optSoloRight = new Option("AI on right", "soloRight");
    modeSelect.appendChild(optMp);
    modeSelect.appendChild(optSoloLeft);
    modeSelect.appendChild(optSoloRight);
    const initialMode = config?.mode ?? "mp";
    modeSelect.value = initialMode;
    modeLabel.appendChild(modeSelect);
    const aiLabel = document.createElement("label");
    aiLabel.textContent = "AI level: ";
    const aiSelect = document.createElement("select");
    for (let lvl = 1; lvl <= 4; lvl++) {
        aiSelect.appendChild(new Option(String(lvl), String(lvl)));
    }
    aiSelect.value = String(config?.aiLevel ?? 1);
    aiLabel.appendChild(aiSelect);
    const leftNameLabel = document.createElement("label");
    leftNameLabel.textContent = "Left player: ";
    const leftNameInput = document.createElement("input");
    leftNameInput.type = "text";
    leftNameInput.size = 10;
    leftNameLabel.appendChild(leftNameInput);
    const rightNameLabel = document.createElement("label");
    rightNameLabel.textContent = "Right player: ";
    const rightNameInput = document.createElement("input");
    rightNameInput.type = "text";
    rightNameInput.size = 10;
    rightNameLabel.appendChild(rightNameInput);
    controls.appendChild(modeLabel);
    controls.appendChild(aiLabel);
    controls.appendChild(leftNameLabel);
    controls.appendChild(rightNameLabel);
    const startButton = document.createElement("button");
    startButton.textContent = "Start game";
    const canvas = createCanvas();
    root.appendChild(title);
    root.appendChild(info);
    root.appendChild(controls);
    root.appendChild(startButton);
    root.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    setOnServerState((state) => {
        if (!ctx)
            return;
        const x = state.ballX * canvas.width;
        const y = state.ballY * canvas.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = "#0f0";
        ctx.fill();
    });
    let gameInstance = null;
    function updateControlsVisibility() {
        const isMp = modeSelect.value === "mp";
        leftNameLabel.style.display = isMp ? "inline-block" : "none";
        rightNameLabel.style.display = isMp ? "inline-block" : "none";
        aiLabel.style.display = isMp ? "none" : "inline-block";
    }
    updateControlsVisibility();
    modeSelect.addEventListener("change", updateControlsVisibility);
    const initialBuilt = buildGameConfig(config, initialMode, Number(aiSelect.value), null, null);
    info.textContent = initialBuilt.baseInfoText;
    startButton.addEventListener("click", () => {
        const mode = modeSelect.value;
        const aiLevel = Number(aiSelect.value);
        const isMp = mode === "mp";
        const leftName = isMp ? (leftNameInput.value || null) : null;
        const rightName = isMp ? (rightNameInput.value || null) : null;
        const built = buildGameConfig(config, mode, aiLevel, leftName, rightName);
        info.textContent = built.baseInfoText + " (server ball debug mode)";
        if (!gameWs || gameWs.readyState === WebSocket.CLOSED) {
            gameWs = connectGameServer();
        }
        // ⛔ TEMP: disable local client-side Pong loop so server ball is visible
        if (gameInstance) {
            gameInstance.destroy();
            gameInstance = null;
        }
        startButton.textContent = "Restart (server ball only)";
    });
}
export function renderTournamentGameView(root, config) {
    root.innerHTML = "";
    const maxScore = config.maxScore ?? 5;
    const title = document.createElement("h1");
    title.textContent = "Pong – Tournament match";
    const info = document.createElement("p");
    info.textContent = `First to ${maxScore} – ${config.leftPlayer.name} vs ${config.rightPlayer.name}`;
    const canvas = createCanvas();
    root.appendChild(title);
    root.appendChild(info);
    root.appendChild(canvas);
    let gameInstance = null;
    const built = {
        leftPlayer: { ...config.leftPlayer },
        rightPlayer: { ...config.rightPlayer },
        aiSide: undefined,
        aiLevel: 1,
        maxScore,
        baseInfoText: `First to ${maxScore}`,
    };
    if (!gameWs || gameWs.readyState === WebSocket.CLOSED) {
        gameWs = connectGameServer();
    }
    gameInstance = createPongGame(canvas, {
        leftPlayer: built.leftPlayer,
        rightPlayer: built.rightPlayer,
        maxScore: built.maxScore,
        aiSide: built.aiSide,
        aiLevel: built.aiLevel,
        onGameEnd: async (state) => {
            if (state.winner) {
                info.textContent = `Winner: ${state.winner.name} (${state.lScore} – ${state.rScore})`;
            }
            else {
                info.textContent = "Game over";
            }
            await saveMatchResult("mp", built.maxScore, built, state, "tournament");
            config.onGameEnd?.(state);
            if (gameInstance) {
                gameInstance.destroy();
                gameInstance = null;
            }
        },
    });
}
