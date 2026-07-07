const game = new LottoGame();
const player = new LottoPlayer();

const playButton = document.getElementById("play");
const buyButton = document.getElementById("buyAnother");
const playerTickets = document.getElementById("playerTickets");

const winningBallsSection = document.getElementById("winningBallsSection");
const drawNumber = document.getElementById("drawNumber");

const currentMoney = document.getElementById("currentMoney");
const totalSpent = document.getElementById("totalSpent");
const totalWon = document.getElementById("totalWon");
const ticketsBought = document.getElementById("ticketsBought");

const jackpotDisplay = document.getElementById("jackpot");
const drawDate = document.getElementById("drawDate");
const prizeBreakdown = document.getElementById("prizeBreakdown");


function updateSidebar(state){
    currentMoney.innerText = `$${state.playerMoney}`;
    totalSpent.innerText = `$${state.totalSpent}`;
    totalWon.innerText = `$${state.totalWon}`;
    ticketsBought.innerText = `${state.ticketsBought}`;
    jackpotDisplay.innerText = `$${state.jackpot}`;

    //Add these later when functions are made
    /*drawDate.innerText = `${state.drawDate}`;
    prizeBreakdown.innerText = `${state.prizeBreakdown}`;*/
}

function updateUI(){
    const state = game.getGameState(player);
    updateSidebar(state);
}


updateUI();