//Basic prototype. Game functionality will be split between a player object and game object, just wanted to test things first.
const PRIZE_TABLE = [
    {regularMatches: 6, powerballMatch: true, prizeMult: 1},
    {regularMatches: 6, powerballMatch: false, prizeMult:0.2},
    {regularMatches: 5, powerballMatch: true, prizeMult: 0.01},
    {regularMatches: 5, powerballMatch: false, prizeMult: 0.0005},
    {regularMatches: 4, powerballMatch: true, prizeMult: 0.0001},
    {regularMatches: 4, powerballMatch: false, prizeMult: 0.00003},
    {regularMatches: 3, powerballMatch: true, prizeMult:0.000016},
    {regularMatches: 3, powerballMatch: false, prizeMult: 0.000008},
];

let jackpot = 4000000;
let maxJackpot = 50000000;
class LottoGame {
    constructor() {
        this.defaultJackpot = 4000000;
        this.jackpot = this.defaultJackpot;
        this.drawNumber = 0;
        this.winningNumbers=[];
        this.ticketPrice = 2;
        this.basePlayers = 500000;
        this.ticketsSold = this.determineComputerTickets();
    }
    getJackpot(){
        return this.jackpot;
    }
    setJackpot(num){
        this.jackpot = num;
    }

    increaseJackpot(num = 1000000){
        this.jackpot = Math.min(this.jackpot + num, maxJackpot);
    }
    resetJackpot(){
        this.jackpot=this.defaultJackpot;
    }
    generateWinningLine(){
        this.winningNumbers=generateLine();
        return this.winningNumbers;
    }
    getPrice(){
        return this.ticketPrice;
    }

    getDrawNumber(){
        return this.drawNumber;
    }
    updateDrawNumber(){
        this.drawNumber +=1;
    }

    getWinningNumbers(){
        return this.winningNumbers;
    }
    determineNumberOfPlayers(){
        const k = 1.584;
        return Math.floor(this.basePlayers * ( 1 + k * Math.log10(this.jackpot/this.defaultJackpot)));        
    }

    determineComputerTickets(){
        return this.determineNumberOfPlayers() * 8;
    }

    updateComputerTickets(){
        this.ticketsSold = this.determineComputerTickets();
    }

    determineTotalTickets(playerTickets = 0){
        return this.ticketsSold + playerTickets;
    }

    someoneWinsJackpot(){
        const oddsPerTicket = 1/3838380;
        const probSomeoneWins = 1 - Math.pow(1-oddsPerTicket, this.ticketsSold);
        return Math.random() < probSomeoneWins;
    }


    playGame(player, winningNumbers = this.generateWinningLine()){
        let totalPrize = 0;
        
        const results = player.tickets.map(ticket=>{
            const regularMatches = checkTicketMatch(winningNumbers, ticket);
            const powerballMatch = checkPowerballMatch(winningNumbers, ticket);
            const prize = calculatePrize(winningNumbers, ticket);
            totalPrize += prize;
            return {ticket, regularMatches, powerballMatch, prize};
        });
        const jackpotWon  = results.some(r => r.regularMatches === 6 && r.powerballMatch === 1);
        player.updateMoney(totalPrize);
        
        const someoneElseWins = this.someoneWinsJackpot();
        if (jackpotWon || someoneElseWins){
            this.resetJackpot();
        }
        else{
            this.increaseJackpot();

        }
        player.updateGameOver();
        player.clearTickets();

        this.updateDrawNumber();
        this.updateComputerTickets();
        return {
            winningNumbers,
            results,
            totalPrize,
            jackpotWon,
            gameOver: player.getGameOver()
        };
    }

    getGameState(player){
        return {
            drawNumber: this.getDrawNumber(),
            jackpot: this.getJackpot(),
            winningNumbers: this.getWinningNumbers(),
            totalTickets: this.determineTotalTickets(player.tickets.length),

            playerMoney: player.getMoney(),
            totalSpent: player.getTotalSpent(),
            totalWon: player.getTotalWon(), 
            ticketsBought: player.getTicketsBought(),
            playerTickets: player.getTickets(),
            ticketHistory: player.getTicketHistory(),
            gameOver: player.getGameOver()
        }
    }
    
}

class LottoPlayer {
    constructor(){
        this.currentMoney = 100;
        this.totalSpent = 0;
        this.totalWon = 0;
        this.tickets = [];
        this.ticketHistory = [];
        this.ticketsBought = 0;
        this.gameOver = false;
    }
    getMoney(){
        return this.currentMoney;
    }
    addTicket(ticket){
        this.tickets.push(ticket);
    }
    buyTicket(price = 2){
        const ticket = generateLine();
        this.addTicket(ticket);
        this.updateMoney(-price);
        this.totalSpent+=price;
        this.ticketsBought+=1;
    }
    updateMoney(amount){
        this.currentMoney+=amount;
        if(amount > 0){
            this.totalWon+=amount;
        }
    }
    getTickets(){
        return this.tickets;
    }
    getTicketHistory(){
        return this.ticketHistory;
    }
    clearTickets(){
        this.ticketHistory.push(this.tickets);
        this.tickets = [];
    }
    getTicketsBought(){
        return this.ticketsBought;
    }
    getTotalSpent(){
        return this.totalSpent;

    }
    updateGameOver(){
        if(this.currentMoney < 2){
            this.gameOver = true;
        }
        else{
            this.gameOver = false;
        }
    }
    getGameOver(){
        return this.gameOver;
    }


}

/*function playGame(){
    const playerdiv=document.getElementById('player');
    const lottodiv = document.getElementById('lotto');
    const windiv = document.getElementById('win');

    //Don't think these include powerball, will need to redo.
    const odds={
        win1: 2.60526576e-7,
        win2: 0.00000156315,
        win3: 0.00005158361,
        win4: 0.00012896569,
        win5: 0.00206185567,
        win6: 0.00275482093,
        win7: 0.02857142857
    };

    let winningLine = generateLine();
    console.log("Winning line is: " + winningLine);
    lottodiv.innerHTML=winningLine;

    
    let yourLine = generateLine();
    console.log("Your line is: " + yourLine);
    playerdiv.innerHTML=yourLine;

    const arraysMatch = (a, b) =>
        a.length === b.length && [...a].sort().every((val, i) => val === [...b].sort()[i]);

    win = arraysMatch(yourLine, winningLine);
    windiv.innerHTML=win;
}*/

function generateLine(){
    const ballRange = 40;
    const powerBallRange = 10;
    const ballNo  = 6;
    let balls=[];

    balls = shuffleArrayAndSlice(ballNo, ballRange);
    balls.push(shuffleArrayAndSlice(1, powerBallRange)[0]);

    return balls;
}

function generateBall(numRange){
    const ball = Math.floor(Math.random()*numRange)+1;
    return ball;
}

function shuffleArrayAndSlice(count, max){
    const rangeSize = max;

    const numbers = Array.from({length: rangeSize}, (_, index) => index+1);
    for (let i = rangeSize - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i+1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    return numbers.slice(0, count);


}

function checkTicketMatch(winningNumbers, ticket){
    let matchCount = 0;
    for(let i =0; i< 6; i++){
        if (winningNumbers.includes(ticket[i])){
            matchCount+=1;
        }
    }
    return matchCount;
}

function checkPowerballMatch(winningNumbers, ticket){
    if (winningNumbers[6] === ticket[6]){
        return 1;
    }
    return 0;
}

function getMultiplier(matchCount, powerballMatch){
    return result = PRIZE_TABLE.find(row => row.regularMatches === matchCount && row.powerballMatch=== Boolean(powerballMatch));
}

function getJackpot(){
    return jackpot;
}

function calculatePrize(winningNumbers, ticket){
    const matchCount = checkTicketMatch(winningNumbers, ticket);
    const powerballMatch = checkPowerballMatch(winningNumbers, ticket);
    const result = getMultiplier(matchCount, powerballMatch);
    if (result){
        return Math.floor(getJackpot()*result.prizeMult);
    }
    return 0;
    
}

module.exports = { LottoGame, LottoPlayer, generateLine, shuffleArrayAndSlice, generateBall, checkTicketMatch, checkPowerballMatch, calculatePrize, getMultiplier, getJackpot  };
