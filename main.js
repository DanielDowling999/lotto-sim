// RULE: this file is the engine and must never touch the DOM (no document/window).
// ui.js renders; simulateDraws() below runs the same engine headlessly.
const BALL_RANGE = 40;
const POWERBALL_RANGE = 10;
const BALLS_PER_LINE = 6;

function combinations(n, k){
    let result = 1;
    for (let i = 1; i <= k; i++){
        result = result * (n - k + i) / i;
    }
    return Math.round(result);
}

// 6 from 40 = 3,838,380 combinations. The jackpot also needs the Powerball (1 in 10),
// so first division odds are 1 in 38,383,800.
const LOTTO_ODDS = combinations(BALL_RANGE, BALLS_PER_LINE);
const JACKPOT_ODDS = LOTTO_ODDS * POWERBALL_RANGE;

// Chance one line hits exactly 5 numbers + the Powerball (used when a must-be-won jackpot rolls down)
const FIVE_PB_ODDS = (combinations(BALLS_PER_LINE, 5) * combinations(BALL_RANGE - BALLS_PER_LINE, 1) / LOTTO_ODDS) / POWERBALL_RANGE;

// Lines bought by the rest of NZ at the default jackpot. Calibrated from Lotto NZ draw 2636
// (Sat 7 Nov 2026, $10M jackpot): ~4.4 million Powerball lines, derived from the winner counts.
// With the log curve below, 2.7M at the default jackpot gives ~4.4M at $10M and ~7.4M at the $50M cap.
const BASE_LINES = 2_700_000;

// Real NZ prizes are pari-mutuel and change every draw. These are fixed amounts taken from
// draw 2636 (Lotto + Powerball divisions combined, rounded). The bonus ball is deliberately ignored.
// 6 + PB wins the Powerball jackpot PLUS the Lotto first division prize.
const PRIZE_TABLE = [
    {regularMatches: 6, powerballMatch: true, cash: 1000000, includesJackpot: true},
    {regularMatches: 6, powerballMatch: false, cash: 1000000},
    {regularMatches: 5, powerballMatch: true, cash: 1200},
    {regularMatches: 5, powerballMatch: false, cash: 550},
    {regularMatches: 4, powerballMatch: true, cash: 75},
    {regularMatches: 4, powerballMatch: false, cash: 30},
    {regularMatches: 3, powerballMatch: true, cash: 20, bonusTicket: true},
    {regularMatches: 3, powerballMatch: false, cash: 0, bonusTicket: true},
];

// mulberry32: tiny seeded generator so a game (and a simulation) can be replayed exactly.
function createRng(seed){
    let a = seed >>> 0;
    return function(){
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Knuth's algorithm. Fine for the small lambdas used for jackpots; the cap stops a stuck stub rng looping forever.
function poissonSample(lambda, rng = Math.random){
    const limit = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
        k += 1;
        p *= rng();
    } while (p > limit && k < 10000);
    return k - 1;
}


class LottoGame {
    constructor(options = {}) {
        this.seed = options.seed ?? Date.now();
        // options.rng lets tests inject a stub; otherwise everything comes from the seed
        this.rng = options.rng || createRng(this.seed);
        this.defaultJackpot = 4000000;
        this.maxJackpot = 50000000;
        this.jackpot = this.defaultJackpot;
        this.drawNumber = 0;
        this.winningNumbers=[];
        this.ticketPrice = 2;
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
        this.updateComputerTickets();
    }

    // Flat growth per rollover, deliberately NOT tied to ticket sales
    increaseJackpot(num = 1000000){
        this.jackpot = Math.min(this.jackpot + num, this.maxJackpot);
    }
    resetJackpot(){
        this.jackpot=this.defaultJackpot;
    }
    isMustBeWon(){
        return this.jackpot >= this.maxJackpot;
    }
    generateWinningLine(){
        this.winningNumbers=generateLine(this.rng);
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

    // Lines bought by everyone else in NZ. Bigger jackpots pull in more buyers (log curve).
    determineNumberOfLines(){
        const k = 1.584;
        return Math.floor(BASE_LINES * ( 1 + k * Math.log10(this.getJackpot()/this.defaultJackpot)));
    }

    determineComputerTickets(){
        return this.determineNumberOfLines();
    }

    updateComputerTickets(){
        this.ticketsSold = this.determineComputerTickets();
    }

    determineTotalTickets(playerTickets = 0){
        return this.ticketsSold + playerTickets;
    }

    // How many other people hit the jackpot this draw (usually 0). Poisson because each line is a tiny independent chance.
    countOtherJackpotWinners(){
        return poissonSample(this.ticketsSold / JACKPOT_ODDS, this.rng);
    }

    // Same idea for 5 + Powerball, which shares the jackpot when a must-be-won draw rolls down
    countOtherFivePbWinners(){
        return poissonSample(this.ticketsSold * FIVE_PB_ODDS, this.rng);
    }

    // Sell the player a ticket at the game's price using the game's rng
    sellTicket(player){
        return player.buyTicket(this.getPrice(), this.rng);
    }

    playGame(player, winningNumbers = this.generateWinningLine()){
        const mustBeWon = this.isMustBeWon();
        const jackpot = this.getJackpot();
        const tickets = player.tickets;
        let jackpotLines = 0;
        let fivePbLines = 0;

        tickets.forEach(ticket=>{
            ticket.regularMatches = checkTicketMatch(winningNumbers, ticket.numbers);
            ticket.powerballMatch = checkPowerballMatch(winningNumbers, ticket.numbers);
            ticket.matchingIndices = getMatchingNumberIndex(winningNumbers, ticket.numbers);
            const row = getMultiplier(ticket.regularMatches, ticket.powerballMatch);
            ticket.prize = row ? row.cash : 0;
            ticket.bonusTicket = Boolean(row && row.bonusTicket);
            if (row && row.includesJackpot) jackpotLines += 1;
            if (ticket.regularMatches === 5 && ticket.powerballMatch) fivePbLines += 1;
        });

        const otherJackpotWinners = this.countOtherJackpotWinners();
        const jackpotWon = jackpotLines > 0;
        // Must-be-won: if nobody takes first division, the jackpot drops to 5 + Powerball
        const rolledDown = mustBeWon && !jackpotWon && otherJackpotWinners === 0;
        let otherFivePbWinners = 0;

        if (jackpotWon){
            const share = Math.floor(jackpot / (jackpotLines + otherJackpotWinners));
            tickets.forEach(ticket=>{
                if (ticket.regularMatches === 6 && ticket.powerballMatch) ticket.prize += share;
            });
        }
        else if (rolledDown){
            otherFivePbWinners = this.countOtherFivePbWinners();
            if (fivePbLines > 0){
                const share = Math.floor(jackpot / (fivePbLines + otherFivePbWinners));
                tickets.forEach(ticket=>{
                    if (ticket.regularMatches === 5 && ticket.powerballMatch) ticket.prize = share;
                });
            }
        }

        let totalPrize = 0;
        let bonusTicketsWon = 0;
        tickets.forEach(ticket=>{
            totalPrize += ticket.prize;
            if (ticket.bonusTicket) bonusTicketsWon += 1;
        });

        player.updateMoney(totalPrize);
        player.bonusTickets += bonusTicketsWon;

        if (jackpotWon || otherJackpotWinners > 0 || rolledDown){
            this.resetJackpot();
        }
        else{
            this.increaseJackpot();
        }
        player.updateGameOver(this.getPrice());
        player.clearTickets();

        this.updateDrawNumber();
        this.advanceDraw();
        this.updateComputerTickets();
        return {
            winningNumbers,
            totalPrize,
            jackpotWon,
            otherJackpotWinners,
            mustBeWon,
            rolledDown,
            otherFivePbWinners,
            bonusTicketsWon,
            playedTickets: tickets,
            gameOver: player.getGameOver()
        };
    }

    getGameState(player){
        return {
            drawNumber: this.getDrawNumber(),
            jackpot: this.getJackpot(),
            mustBeWon: this.isMustBeWon(),
            winningNumbers: this.getWinningNumbers(),
            totalTickets: this.determineTotalTickets(player.tickets.length),

            playerMoney: player.getMoney(),
            totalSpent: player.getTotalSpent(),
            totalWon: player.getTotalWon(),
            ticketsBought: player.getTicketsBought(),
            bonusTickets: player.getBonusTickets(),
            playerTickets: player.getTickets(),
            ticketHistory: player.getTicketHistory(),
            gameOver: player.getGameOver(),
            date: this.getDrawDate()
        }
    }

}

class LottoPlayer {
    // keepHistory: false stops ticketHistory growing (used by headless simulations)
    constructor(options = {}){
        this.currentMoney = options.startingMoney ?? 100;
        this.keepHistory = options.keepHistory ?? true;
        this.totalSpent = 0;
        this.totalWon = 0;
        this.tickets = [];
        this.ticketHistory = [];
        this.ticketsBought = 0;
        this.bonusTickets = 0;
        this.gameOver = false;
    }
    getMoney(){
        return this.currentMoney;
    }
    getBonusTickets(){
        return this.bonusTickets;
    }
    canBuyTicket(price = 2){
        return this.bonusTickets > 0 || this.currentMoney >= price;
    }
    addTicket(ticket){
        this.tickets.push(ticket);
    }
    // A bonus ticket is used first: free, and not counted in totalSpent
    buyTicket(price = 2, rng = Math.random){
        this.ticketsBought+=1;
        const isBonus = this.bonusTickets > 0;
        const ticket = new LottoTicket(generateLine(rng), this.ticketsBought, isBonus);
        this.addTicket(ticket);
        if (isBonus){
            this.bonusTickets -= 1;
        }
        else{
            this.updateMoney(-price);
            this.totalSpent+=price;
        }
        return ticket;
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
        if (this.keepHistory){
            this.ticketHistory.push(this.tickets);
        }
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
    // Not game over while a free bonus ticket is still waiting to be used
    updateGameOver(price = 2){
        this.gameOver = !this.canBuyTicket(price);
    }
    getGameOver(){
        return this.gameOver;
    }


}

class LottoTicket {
    constructor(numbers, id, isBonus = false){
        this.numbers = numbers;
        this.id = id;
        this.isBonus = isBonus;
        this.prize = 0;
        this.bonusTicket = false;
        this.regularMatches =0;
        this.powerballMatch = 0;
        this.matchingIndices = [];
    }
}


function generateLine(rng = Math.random){
    const balls = shuffleArrayAndSlice(BALLS_PER_LINE, BALL_RANGE, rng);
    balls.push(generateBall(POWERBALL_RANGE, rng));

    return balls;
}

function generateBall(numRange, rng = Math.random){
    const ball = Math.floor(rng()*numRange)+1;
    return ball;
}

function shuffleArrayAndSlice(count, max, rng = Math.random){
    const numbers = Array.from({length: max}, (_, index) => index+1);
    // Partial Fisher-Yates: only the first `count` slots need shuffling, which keeps simulations fast
    for (let i = 0; i < count; i++){
        const j = i + Math.floor(rng() * (max - i));
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

// Returns the prize table row for these matches (undefined if no prize)
function getMultiplier(matchCount, powerballMatch){
    return PRIZE_TABLE.find(row => row.regularMatches === matchCount && row.powerballMatch=== Boolean(powerballMatch));
}

// Cash value of a ticket before any jackpot sharing; 6 + PB includes the whole jackpot
function calculatePrize(winningNumbers, ticket, gameJackpot = 0){
    const matchCount = checkTicketMatch(winningNumbers, ticket);
    const powerballMatch = checkPowerballMatch(winningNumbers, ticket);
    const row = getMultiplier(matchCount, powerballMatch);
    if (!row) return 0;
    return row.cash + (row.includesJackpot ? gameJackpot : 0);
}

function divisionLabel(regularMatches, powerballMatch){
    return `${regularMatches}${powerballMatch ? '+PB' : ''}`;
}

// Headless run: no DOM, no ticket history, so 100k+ draws is quick and light on memory.
// A bonus ticket is free, so `spent` is cash only; bonusTicketsUsed says how many were free.
function simulateDraws({ draws, linesPerDraw = 1, seed, startingMoney = Infinity }){
    const simGame = new LottoGame({ seed });
    const simPlayer = new LottoPlayer({ startingMoney, keepHistory: false });
    const prizeCounts = {};
    PRIZE_TABLE.forEach(row => { prizeCounts[divisionLabel(row.regularMatches, row.powerballMatch)] = 0; });
    const summary = {
        draws: 0,
        spent: 0,
        won: 0,
        net: 0,
        biggestPrize: 0,
        prizeCounts,
        jackpotWinsByPlayer: 0,
        jackpotsWonByOthers: 0,
        firstJackpotDraw: null,
        bonusTicketsUsed: 0,
        seed: simGame.seed
    };

    for (let d = 0; d < draws; d++){
        let bought = 0;
        while (bought < linesPerDraw && simPlayer.canBuyTicket(simGame.getPrice())){
            simGame.sellTicket(simPlayer);
            bought += 1;
        }
        if (bought === 0) break; // out of money

        const result = simGame.playGame(simPlayer);
        summary.draws += 1;
        if (result.jackpotWon){
            summary.jackpotWinsByPlayer += 1;
            if (summary.firstJackpotDraw === null) summary.firstJackpotDraw = summary.draws;
        }
        if (result.otherJackpotWinners > 0) summary.jackpotsWonByOthers += 1;
        for (const ticket of result.playedTickets){
            if (ticket.isBonus) summary.bonusTicketsUsed += 1;
            if (ticket.prize > summary.biggestPrize) summary.biggestPrize = ticket.prize;
            if (ticket.prize > 0 || ticket.bonusTicket){
                prizeCounts[divisionLabel(ticket.regularMatches, ticket.powerballMatch)] += 1;
            }
        }
    }

    summary.spent = simPlayer.getTotalSpent();
    summary.won = simPlayer.getTotalWon();
    summary.net = summary.won - summary.spent;
    return summary;
}

if (typeof module !== 'undefined'){
    module.exports = { LottoGame, LottoPlayer, LottoTicket, generateLine, shuffleArrayAndSlice, generateBall, checkTicketMatch, checkPowerballMatch, calculatePrize, getMultiplier, combinations, createRng, poissonSample, simulateDraws, divisionLabel, PRIZE_TABLE, BASE_LINES, FIVE_PB_ODDS, LOTTO_ODDS, JACKPOT_ODDS };
}
