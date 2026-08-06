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
    console.log('jackpot: ', state.jackpot);

    drawDate.innerText = `${state.date}`;
    //Note: Date needs to change so that the draw dates are on saturdays and wednesdays.

    //Add these later when functions are made
    /*drawDate.innerText = `${state.drawDate}`;
    prizeBreakdown.innerText = `${state.prizeBreakdown}`;*/
}

function updateDrawInfo(draw){
    drawNumber.innerText = `${draw}`;

}
/*
function updateTickets(tickets){
    playerTickets.innerHTML = '';
    tickets.forEach((ticket, index) => {
        renderTicket(ticket, index);
    });
}*/

function updateTickets(tickets){
    playerTickets.innerHTML = '';
    tickets.forEach((ticket, index) => {
        addTicketToUI(ticket, index);
    })
}
function addTicketToUI(ticket, index){
    const ticketElement = renderTicket(ticket, index);
    playerTickets.append(ticketElement);
}

function renderTicket(ticket, index){
    const ticketElement = document.createElement("div");
    ticketElement.classList.add("ticket");

    const ticketContainer = document.createElement("div");
    ticketContainer.classList.add("ticketContainer");

    const ticketNumber = document.createElement("h4");
    ticketNumber.innerText = `Ticket ${index + 1}`;

    const ticketBallsElement = document.createElement("div");
    ticketBallsElement.classList.add("ticketBalls");
    
    for(let i = 0; i < ticket.length-1; i++){
        const ballElement = document.createElement("div");
        ballElement.classList.add("ball");
        ballElement.innerText = ticket[i];
        ticketBallsElement.appendChild(ballElement);
    }
    const powerBallSection = document.createElement("div");
    powerBallSection.classList.add("ballSection", "powerball");

    const powerBall = document.createElement("div");
    powerBall.classList.add("ball", "powerball");
    powerBall.innerText = ticket[ticket.length-1];

    powerBallSection.appendChild(powerBall);
    ticketBallsElement.appendChild(powerBallSection);

    const ticketEnd = document.createElement("div");
    ticketEnd.classList.add("ticketEnd");

    const matchedNum = document.createElement("div");
    matchedNum.classList.add("matchedNum");
    matchedNum.innerText = `? matched`;

    const ticketCost = document.createElement("div");
    ticketCost.classList.add("ticketCost");
    ticketCost.innerText = `$2`;
    
    ticketEnd.appendChild(matchedNum);
    ticketEnd.appendChild(ticketCost);

    ticketContainer.appendChild(ticketNumber);
    ticketContainer.appendChild(ticketBallsElement);
    
    ticketElement.appendChild(ticketContainer);
    ticketElement.appendChild(ticketEnd);

    return ticketElement;

}

buyButton.addEventListener("click", () => {
    hideWinningNumbers();
    if (player.getMoney() < game.getPrice()) return;
    player.buyTicket(game.getPrice());
    const tickets = player.getTickets();
    addTicketToUI(tickets[tickets.length - 1], tickets.length -1);
    updateUI();
    updateTickets(player.getTickets());
})

function hideWinningNumbers(){
    const balls = winningBallsSection.querySelectorAll(".ball");
    balls.forEach(ball=>{
        ball.innerText = "?";
    })
}

function displayWinningNumbers(winningNumbers){
    const balls = winningBallsSection.querySelectorAll(".ball");
    balls.forEach((ball, index)=>{
        ball.innerText = winningNumbers[index];
    })
}

playButton.addEventListener("click", () => {
    if(player.getTickets().length ===0){
        updateTickets([]);
    }
    const result = game.playGame(player, game.getWinningNumbers());
    console.log('winning numbers: ', result.winningNumbers);
    console.log('results: ', result.results);
    displayWinningNumbers(result.winningNumbers);
    
    const tickets = playerTickets.querySelectorAll(".ticket");
    result.results.forEach((ticketResult, index) => {
        highlightMatchingNumbers(tickets[index], ticketResult.matchingNumbers, ticketResult.powerballMatch);
    })

    updateUI();
    game.generateWinningLine();
})

//Next: Add the functionality for balls being 'matched' (highlighting them somehow), and then cleared/stored once a player buys another new ticket.

function highlightMatchingNumbers(ticket, matchingNumbers, powerBallMatch){
    console.log('powerBallMatch', powerBallMatch);
    console.log('powerball element', ticket.querySelector(".powerball"));
    ticket.querySelector('.matchedNum').innerText = `${matchingNumbers.length} matched`;
    const balls = ticket.querySelectorAll(".ball:not(.powerball)");
    matchingNumbers.forEach(index => {
        balls[index].classList.add("matched");
    })
    if(powerBallMatch){
        ticket.querySelector(".ballSection.powerball .ball").classList.add("matched");
    }
}

function updateUI(){
    const state = game.getGameState(player);
    updateSidebar(state);

    updateDrawInfo(state.drawNumber);
    
}

game.generateWinningLine();
updateUI();
