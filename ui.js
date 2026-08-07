const game = new LottoGame();
const player = new LottoPlayer();
 
// ── Buttons ──
const playButton = document.getElementById("play");
const buyButton = document.getElementById("buyAnother");
 
// ── Ticket section ──
const playerTickets = document.getElementById("playerTickets");
 
// ── Winning numbers ──
const winningBallsSection = document.getElementById("winningBallsSection");
const drawNumber = document.getElementById("drawNumber");
 
// ── Sidebar: player info ──
const currentMoney = document.getElementById("currentMoney");
const totalSpent = document.getElementById("totalSpent");
const totalWon = document.getElementById("totalWon");
const ticketsBought = document.getElementById("ticketsBought");
 
// ── Sidebar: draw info ──
const jackpotDisplay = document.getElementById("jackpot");
const drawDate = document.getElementById("drawDate");
const prizeBreakdown = document.getElementById("prizeBreakdown");
 
function updateSidebar(state) {
    currentMoney.innerText = `$${state.playerMoney}`;
    totalSpent.innerText   = `$${state.totalSpent}`;
    totalWon.innerText     = `$${state.totalWon}`;
    ticketsBought.innerText = `${state.ticketsBought}`;
    jackpotDisplay.innerText = `$${state.jackpot}`;
    drawDate.innerText = `${state.date}`;
}
 
function updateDrawInfo(draw) {
    drawNumber.innerText = `${draw}`;
}

function hideWinningNumbers() {
    winningBallsSection.querySelectorAll(".ball").forEach(ball => {
        ball.innerText = "?";
    });
}
 
function displayWinningNumbers(winningNumbers) {
    winningBallsSection.querySelectorAll(".ball").forEach((ball, index) => {
        ball.innerText = winningNumbers[index];
    });
}


function renderTicket(ticket) {
    const ticketElement = document.createElement("div");
    ticketElement.classList.add("ticket");
 
    // Left side: ticket number + balls
    const ticketContainer = document.createElement("div");
    ticketContainer.classList.add("ticketContainer");
 
    const ticketNumber = document.createElement("h4");
    ticketNumber.innerText = `Ticket ${ticket.id}`;
 
    const ticketBallsElement = document.createElement("div");
    ticketBallsElement.classList.add("ticketBalls");
 
    // Regular balls (indices 0–5)
    for (let i = 0; i < ticket.numbers.length - 1; i++) {
        const ballElement = document.createElement("div");
        ballElement.classList.add("ball");
        ballElement.innerText = ticket.numbers[i];
        ticketBallsElement.appendChild(ballElement);
    }
 
    // Powerball
    const powerBallSection = document.createElement("div");
    powerBallSection.classList.add("ballSection", "powerball");
 
    const powerBall = document.createElement("div");
    powerBall.classList.add("ball", "powerball");
    powerBall.innerText = ticket.numbers[ticket.numbers.length - 1];
 
    powerBallSection.appendChild(powerBall);
    ticketBallsElement.appendChild(powerBallSection);
 
    ticketContainer.appendChild(ticketNumber);
    ticketContainer.appendChild(ticketBallsElement);
 
    // Right side: match count + prize
    const ticketEnd = document.createElement("div");
    ticketEnd.classList.add("ticketEnd");
 
    const matchedNum = document.createElement("div");
    matchedNum.classList.add("matchedNum");
    matchedNum.innerText = `? matched`;
 
    const ticketCost = document.createElement("div");
    ticketCost.classList.add("ticketCost");
    ticketCost.innerText = `$${game.getPrice()}`;
 
    ticketEnd.appendChild(matchedNum);
    ticketEnd.appendChild(ticketCost);
 
    ticketElement.appendChild(ticketContainer);
    ticketElement.appendChild(ticketEnd);
 
    return ticketElement;
}

function addTicketToUI(ticket) {
    playerTickets.append(renderTicket(ticket));
}
 
function updateTickets(tickets) {
    playerTickets.innerHTML = '';
    tickets.forEach(ticket => addTicketToUI(ticket));
}
function highlightMatchingNumbers(ticketElement, ticket) {
    // Update match count
    ticketElement.querySelector('.matchedNum').innerText = `${ticket.matchingIndices.length} matched`;
 
    // Update prize
    ticketElement.querySelector('.ticketCost').innerText = 
        ticket.prize > 0 ? `Won $${ticket.prize}` : `$${game.getPrice()}`;
 
    // Highlight regular balls
    const balls = ticketElement.querySelectorAll(".ball:not(.powerball)");
    ticket.matchingIndices.forEach(index => {
        balls[index].classList.add("matched");
    });
 
    // Highlight powerball
    if (ticket.powerballMatch) {
        ticketElement.querySelector(".ballSection.powerball .ball").classList.add("matched");
    }
}

// ── Master update ─────────────────────────────────────────────────────────────

function updateUI() {
    const state = game.getGameState(player);
    updateSidebar(state);
    updateDrawInfo(state.drawNumber);
}

// ── Event listeners ───────────────────────────────────────────────────────────

buyButton.addEventListener("click", () => {
    if (player.getMoney() < game.getPrice()) return;
    hideWinningNumbers();
    player.buyTicket(game.getPrice());
    const tickets = player.getTickets();
    addTicketToUI(tickets[tickets.length - 1]);
    updateUI();
    updateTickets(player.getTickets());

});

playButton.addEventListener("click", () => {
 
    const result = game.playGame(player, game.getWinningNumbers());
    displayWinningNumbers(result.winningNumbers);
 
    // Highlight each ticket using updated ticket objects
    const ticketElements = playerTickets.querySelectorAll(".ticket");
    player.getTicketHistory()[player.getTicketHistory().length - 1].forEach((ticket, index) => {
        highlightMatchingNumbers(ticketElements[index], ticket);
    });
 
    updateUI();
    game.generateWinningLine();
});

// ── Init ──────────────────────────────────────────────────────────────────────
 
game.generateWinningLine();
updateUI();