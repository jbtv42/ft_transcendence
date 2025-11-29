import { createPongGame } from "../game/pong.js";
export function renderGameView(root, config) {
    root.innerHTML = "";
    const title = document.createElement("h1");
    title.textContent = "Pong";
    const info = document.createElement("p");
    // ---- Controls: mode + AI level ----
    const controls = document.createElement("div");
    controls.style.marginBottom = "1rem";
    const modeLabelEl = document.createElement("label");
    modeLabelEl.textContent = "Mode: ";
    modeLabelEl.style.marginRight = "0.5rem";
    const modeSelect = document.createElement("select");
    modeSelect.innerHTML = `
    <option value="mp">2 players (MP)</option>
    <option value="soloRight">Solo (AI on right)</option>
    <option value="soloLeft">Solo (AI on left)</option>
  `;
    const aiLevelLabelEl = document.createElement("label");
    aiLevelLabelEl.textContent = "AI level: ";
    aiLevelLabelEl.style.marginLeft = "1rem";
    aiLevelLabelEl.style.marginRight = "0.5rem";
    const aiLevelSelect = document.createElement("select");
    aiLevelSelect.innerHTML = `
    <option value="1">1 (easy)</option>
    <option value="2">2</option>
    <option value="3">3</option>
    <option value="4">4 (hard)</option>
  `;
    controls.appendChild(modeLabelEl);
    controls.appendChild(modeSelect);
    controls.appendChild(aiLevelLabelEl);
    controls.appendChild(aiLevelSelect);
    const startButton = document.createElement("button");
    startButton.textContent = "Start game";
    startButton.style.display = "block";
    startButton.style.marginBottom = "0.5rem";
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    canvas.style.border = "1px solid #fff";
    canvas.style.display = "block";
    canvas.style.margin = "1rem auto 0 auto";
    canvas.style.background = "#000";
    root.appendChild(title);
    root.appendChild(info);
    root.appendChild(controls);
    root.appendChild(startButton);
    root.appendChild(canvas);
    // ---- Players / score defaults ----
    const leftPlayer = config?.leftPlayer ?? {
        id: 1,
        name: "Sam",
        rank: 0,
    };
    const rightPlayer = config?.rightPlayer ?? {
        id: 2,
        name: "Bob",
        rank: 0,
    };
    const maxScore = config?.maxScore ?? 5;
    // current mode + aiLevel (can be changed by user)
    let currentMode = config?.mode ?? "mp";
    let currentAiLevel = config?.aiLevel ?? 1;
    // Initialize selects from config (if provided)
    modeSelect.value = currentMode;
    aiLevelSelect.value = String(currentAiLevel);
    // Helper: compute aiSide from mode
    function computeAiSide(mode) {
        if (mode === "soloLeft")
            return "left";
        if (mode === "soloRight")
            return "right";
        return undefined;
    }
    // Helper: label texts
    function modeText(mode) {
        if (mode === "soloLeft")
            return " (AI on left)";
        if (mode === "soloRight")
            return " (AI on right)";
        return " (2 players)";
    }
    function updateAiLevelEnabled() {
        // disable AI level when in MP mode (no AI)
        const isMp = currentMode === "mp";
        aiLevelSelect.disabled = isMp;
        aiLevelLabelEl.style.opacity = isMp ? "0.5" : "1";
        aiLevelSelect.style.opacity = isMp ? "0.5" : "1";
    }
    function updateInfoText() {
        const aiSide = computeAiSide(currentMode);
        const aiLabel = aiSide !== undefined ? ` – AI lvl ${currentAiLevel}` : "";
        info.textContent =
            `${leftPlayer.name} vs ${rightPlayer.name}` +
                ` – first to ${maxScore}` +
                modeText(currentMode) +
                aiLabel;
    }
    updateAiLevelEnabled();
    updateInfoText();
    // ---- React to changes in selects ----
    modeSelect.addEventListener("change", () => {
        const value = modeSelect.value;
        currentMode = value;
        updateAiLevelEnabled();
        updateInfoText();
    });
    aiLevelSelect.addEventListener("change", () => {
        currentAiLevel = Number(aiLevelSelect.value);
        updateInfoText();
    });
    // ---- Start / Restart game ----
    let gameInstance = null;
    startButton.addEventListener("click", () => {
        // Stop current game if running
        if (gameInstance) {
            gameInstance.destroy();
            gameInstance = null;
        }
        updateInfoText();
        const aiSide = computeAiSide(currentMode);
        const aiLevel = currentAiLevel;
        gameInstance = createPongGame(canvas, {
            leftPlayer,
            rightPlayer,
            maxScore,
            aiSide,
            aiLevel,
            onGameEnd: (state) => {
                if (state.winner) {
                    info.textContent = `Winner: ${state.winner.name} (${state.lScore} – ${state.rScore})`;
                }
                else {
                    info.textContent = `Game over`;
                }
                config?.onGameEnd?.(state);
            },
        });
        startButton.textContent = "Restart game";
    });
}
