const N = powers.length;
const arenaSize = 640;
const center = arenaSize / 2;
const radius = 192;

// --- 2. Paradox Tournament Rule ---
function beats(v) {
  return [
    (v + 1) % N,
    (v + 2) % N,
    (v + 4) % N
  ];
}

// --- 3. Influence Tracking ---
let playerInfluence = 0;
let cpuInfluence = 0;
const WIN_THRESHOLD = 50;

// --- 4. Place Buttons in a Heptagon ---

function placeButtons() {
    for (let i = 0; i < N; i++) {
    const angle = (2 * Math.PI * i) / N - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);

    const btn = document.createElement("button");
    btn.textContent = powers[i].name;
    btn.className = "power-button";
    btn.style.backgroundColor = powers[i].color;
    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;
    btn.onclick = () => playRound(i);

    buttonsDiv.appendChild(btn);
  }
}

function drawArrows() {
  for (let i = 0; i < N; i++) {
    const angleA = (2 * Math.PI * i) / N - Math.PI / 2;
    const xA = center + radius * Math.cos(angleA);
    const yA = center + radius * Math.sin(angleA);

    beats(i).forEach(j => {
  const angleB = (2 * Math.PI * j) / N - Math.PI / 2;
  const xB = center + radius * Math.cos(angleB);
  const yB = center + radius * Math.sin(angleB);

  // Direction vector from A → B
  const dx = xB - xA;
  const dy = yB - yA;
  const dist = Math.sqrt(dx*dx + dy*dy);

  // Normalize
  const ux = dx / dist;
  const uy = dy / dist;

  // Shorten arrow so it stops before the button
  const offset = 65; // tweak this value to taste
  const xB2 = xB - ux * offset;
  const yB2 = yB - uy * offset;

  const arrow = document.createElementNS("http://www.w3.org/2000/svg", "line");
  arrow.dataset.from = i;
  arrow.dataset.to = j;
  arrow.setAttribute("x1", xA);
  arrow.setAttribute("y1", yA);
  arrow.setAttribute("x2", xB2);
  arrow.setAttribute("y2", yB2);

  linesGroup.appendChild(arrow);
});
  }
}

// --- 5. Play Round ---
function playRound(playerChoice) {
  const cpuChoice = Math.floor(Math.random() * N);
  const winner = determineWinner(playerChoice, cpuChoice);

  const playerRoll = Math.floor(Math.random() * 6) + 1;
  const cpuRoll = Math.floor(Math.random() * 6) + 1;

  let playerGain = playerRoll;
  let cpuGain = cpuRoll;

  // Clear previous highlights
  document.querySelectorAll("#buttons button").forEach(btn => {
    btn.classList.remove("player-selected", "cpu-selected");
  });
  document.querySelectorAll("#lines line").forEach(line => {
    line.classList.remove("highlight-arrow");
    line.setAttribute("marker-end", "url(#arrowhead)");
  });

  // Highlight player button
  const playerBtn = document.querySelector(`#buttons button:nth-child(${playerChoice + 1})`);
  playerBtn.classList.add("player-selected");

  // Highlight CPU button
  const cpuBtn = document.querySelector(`#buttons button:nth-child(${cpuChoice + 1})`);
  cpuBtn.classList.add("cpu-selected");

  // Try player → CPU
  let arrow = document.querySelector(`#lines line[data-from="${playerChoice}"][data-to="${cpuChoice}"]`);
  // If that arrow doesn't exist, try CPU → player
  if (!arrow) {
    arrow = document.querySelector(`#lines line[data-from="${cpuChoice}"][data-to="${playerChoice}"]`);
  }
  // Highlight whichever arrow exists
  if (arrow) {
    arrow.classList.add("highlight-arrow");
    arrow.setAttribute("marker-end", "url(#arrowhead-highlight)");
  }

  if (winner === "player") {
    playerGain += 2;
    cpuGain = Math.max(0, cpuGain - 1);
  } else if (winner === "cpu") {
    cpuGain += 2;
    playerGain = Math.max(0, playerGain - 1);
  }

  playerInfluence += playerGain;
  cpuInfluence += cpuGain;

  const playerName = powers[playerChoice].name;
  const cpuName = powers[cpuChoice].name;

  let msg = `
    You deployed <strong>${playerName}</strong> (roll: ${playerRoll}).<br>
    Opponent deployed <strong>${cpuName}</strong> (roll: ${cpuRoll}).<br><br>
  `;

  if (winner === "tie") msg += "<strong>Stalemate.</strong><br>";
  else if (winner === "player") msg += "<strong>You win the exchange.</strong><br>";
  else msg += "<strong>The opposing force prevails.</strong><br>";

  msg += `<br>You gain <strong>${playerGain}</strong> influence.<br>`;
  msg += `Opponent gains <strong>${cpuGain}</strong> influence.<br>`;

  resultDiv.innerHTML = msg;

  influenceDiv.innerHTML = `
    Influence — You: <strong>${playerInfluence}</strong>  
    &nbsp;&nbsp; Opponent: <strong>${cpuInfluence}</strong>
  `;

  checkWinCondition();
}

// --- 6. Determine Winner ---
function determineWinner(player, cpu) {
  const playerBeats = beats(player);
  if (player === cpu) return "tie";
  if (playerBeats.includes(cpu)) return "player";
  return "cpu";
}

// --- 7. Win Condition and Ending the Duel ---
function checkWinCondition() {
  if (playerInfluence < WIN_THRESHOLD && cpuInfluence < WIN_THRESHOLD) {
    return; // game continues
  }

  // Disable buttons so no more rounds can be played
  disableDuelButtons();


    // Remove highlights when duel ends
    document.querySelectorAll("#buttons button").forEach(btn => {
      btn.classList.remove("player-selected", "cpu-selected");
    });

    document.querySelectorAll("#lines line").forEach(line => {
      line.classList.remove("highlight-arrow");
      line.setAttribute("marker-end", "url(#arrowhead)");
    });

    let msg = "";
    const reward = awardDuelCredits();
    
  if (playerInfluence > cpuInfluence) {
    // Player wins
    msg = `
      <span style="color:#2FA08C"><strong>You claim the star system!</strong></span><br><br>
      You earned <span style="color:#FFD95A"><strong>${reward} credits</strong></span>.<br><br>
      <em>Return to the world map or restart the duel.</em>
    `;
  }
  else if (cpuInfluence > playerInfluence) {
    // CPU wins
    msg = `
      <strong>The <span style="color:#8B1E1E">opposing force</span> seizes control.</strong><br><br>
      You earned <span style="color:#FFD95A"><strong>${reward} credits</strong></span>.<br><br>
      <em>Return to the world map or restart the duel.</em>
    `;
  }
  else {
    // Tie
    msg = `
      <strong>Both forces reach a stalemate at the brink of victory.</strong><br><br>
      You earned <span style="color:#FFD95A"><strong>${reward} credits</strong></span>.<br><br>
      <em>Return to the world map or restart the duel.</em>
    `;
  }

  resultDiv.innerHTML = msg;
}

function disableDuelButtons() {
  const btns = document.querySelectorAll("#buttons button");
  btns.forEach(btn => {
    btn.disabled = true;
    btn.style.filter = "saturate(0.15)";   // reduce saturation
    btn.style.cursor = "default";         // optional: remove pointer cursor
  });
}

function awardDuelCredits() {
  const margin = playerInfluence - cpuInfluence;
  const bonus = Math.ceil(Math.sqrt(Math.max(0, margin)));
  const reward = 2 + bonus;

  playerCredits += reward;
  updateCurrencyDisplay();

  return reward;
}

// --- 8. Restart Game ---
function restartGame() {
  playerInfluence = 0;
  cpuInfluence = 0;
  resultDiv.innerHTML = "";
  influenceDiv.innerHTML = "";
  buttonsDiv.innerHTML = "";
  linesGroup.innerHTML = "";

  document.querySelectorAll("#buttons button").forEach(btn => {
    btn.classList.remove("player-selected", "cpu-selected");
  });

  document.querySelectorAll("#lines line").forEach(line => {
    line.classList.remove("highlight-arrow");
    line.setAttribute("marker-end", "url(#arrowhead)");
  });

  placeButtons();
  drawArrows();
}