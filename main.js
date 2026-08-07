const PRIZE_TABLE = [
    {regularMatches: 6, powerballMatch: true, prizeMult: 1},
    {regularMatches: 6, powerballMatch: false, prizeMult:0.2},
    {regularMatches: 5, powerballMatch: true, prizeMult: 0.01},
    {regularMatches: 5, powerballMatch: false, prizeMult: 0.0005},
    {regularMatches: 4, powerballMatch: true, fixedPrize: 100},
    {regularMatches: 4, powerballMatch: false, fixedPrize: 40},
    {regularMatches: 3, powerballMatch: true, fixedPrize: 20},
    {regularMatches: 3, powerballMatch: false, fixedPrize: 10},
];


class LottoGame {
    constructor() {
        this.defaultJackpot = 4000000;
        this.maxJackpot = 50000000;
        this.jackpot = this.defaultJackpot;
        this.drawNumber = 0;
        this.winningNumbers=[];
        this.ticketPrice = 2;
        this.basePlayers = 25000;
        this.ticketsSold = this.determineComputerTickets();
        this.currentDate = new Date();
        this.setInitialDate();
        this.lastDraw;

    }

    advanceDate(days=7){
        this.currentDate.setDate(this.currentDate.getDate() + days);
    }
    advanceDraw(){
        if (this.lastDraw === 3){
            this.advanceDate(3);
            this.lastDraw = 6;
            
        }
        else{
            this.advanceDate(4);
            this.lastDraw = 3;
        }
    }
    setInitialDate(){
        //Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
        const daysUntilDraw = [3, 2, 1, 0, 2, 1, 0];
        this.currentDate.setDate(this.currentDate.getDate() + daysUntilDraw[this.currentDate.getDay()]);
        this.lastDraw = this.currentDate.getDay();

    }
    getDrawDate(){
        return this.currentDate.toLocaleDateString('en-NZ', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});
    }
    getJackpot(){
        return this.jackpot;
    }
    setJackpot(num){
        this.jackpot = num;
    }

    increaseJackpot(num = 1000000){
        this.jackpot = Math.min(this.jackpot + num, this.maxJackpot);
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
        return Math.floor(this.basePlayers * ( 1 + k * Math.log10(this.getJackpot()/this.defaultJackpot)));        
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
        
        player.tickets.forEach(ticket=>{
            ticket.regularMatches = checkTicketMatch(winningNumbers, ticket.numbers);
            ticket.powerballMatch = checkPowerballMatch(winningNumbers, ticket.numbers);
            ticket.prize = calculatePrize(winningNumbers, ticket.numbers, this.getJackpot());
            ticket.matchingIndices = getMatchingNumberIndex(winningNumbers, ticket.numbers);
            totalPrize += ticket.prize;
        })

        const jackpotWon = player.tickets.some(ticket => ticket.regularMatches === 6 && ticket.powerballMatch === 1);
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
        this.advanceDraw();
        this.updateComputerTickets();
        return {
            winningNumbers,
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
            gameOver: player.getGameOver(),
            date: this.getDrawDate()
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
        this.ticketsBought+=1;
        const ticket = new LottoTicket(generateLine(), this.ticketsBought);
        this.addTicket(ticket);
        this.updateMoney(-price);
        this.totalSpent+=price;
  
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
    getTotalWon(){
        return this.totalWon;
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

class LottoTicket {
    constructor(numbers, id){
        this.numbers = numbers;
        this.id = id;
        this.prize = 0;
        this.regularMatches =0;
        this.powerballMatch = 0;
        this.matchingIndices = [];
    }
}


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
        if (winningNumbers.slice(0,6).includes(ticket[i])){
            matchCount+=1;
        }
    }
    return matchCount;
}

function getMatchingNumberIndex(winningNumbers, ticket){
    const matchingNumbers = [];
    for(let i=0; i<6; i++){
        if(winningNumbers.slice(0,6).includes(ticket[i])){
            matchingNumbers.push(i);
        }
    }
    return matchingNumbers;
}

function checkPowerballMatch(winningNumbers, ticket){
    if (winningNumbers[6] === ticket[6]){
        return 1;
    }
    return 0;
}

function getMultiplier(matchCount, powerballMatch){
    return PRIZE_TABLE.find(row => row.regularMatches === matchCount && row.powerballMatch=== Boolean(powerballMatch));
}

function getJackpot(){
    return jackpot;
}

function calculatePrize(winningNumbers, ticket, gameJackpot){
    const matchCount = checkTicketMatch(winningNumbers, ticket);
    const powerballMatch = checkPowerballMatch(winningNumbers, ticket);
    const result = getMultiplier(matchCount, powerballMatch);
    if (result){
        if (result.fixedPrize) return result.fixedPrize;
        return Math.floor(gameJackpot*result.prizeMult);
    }
    return 0;
    
}

if (typeof module !== 'undefined'){
    module.exports = { LottoGame, LottoPlayer, LottoTicket, generateLine, shuffleArrayAndSlice, generateBall, checkTicketMatch, checkPowerballMatch, calculatePrize, getMultiplier, getJackpot  };
}
