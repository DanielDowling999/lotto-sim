const {LottoGame, LottoPlayer, LottoTicket, generateLine, shuffleArrayAndSlice, generateBall, checkTicketMatch, checkPowerballMatch, calculatePrize, getMultiplier, combinations, createRng, poissonSample, simulateDraws, PRIZE_TABLE, BASE_LINES, FIVE_PB_ODDS, LOTTO_ODDS, JACKPOT_ODDS} = require('../main');

// Stub rng: returns the listed values in order, then `fallback` forever.
// With the default 0.5, Poisson draws give 0 winners (nobody else wins).
function stubRng(values = [], fallback = 0.5){
    let i = 0;
    return () => (i < values.length ? values[i++] : fallback);
}
// At the default jackpot lambda is ~0.07, so these two values give exactly 1 other winner
const ONE_OTHER_WINNER = [0.99, 0.5];

//Testing LottoGame class
let game;
let player;
let ticket;
beforeEach(() => {
    game = new LottoGame({ rng: stubRng() });
    player = new LottoPlayer();
    ticket = new LottoTicket([1,2,3,4,5,6,7], 1);
});

//Ball Generation Tests
test('generate line returns 7 numbers', () => {
    const line = generateLine(createRng(1));
    expect(line).toHaveLength(7);
});

test('regular balls are between 1 and 40 (inclusive)', () => {
    const line = generateLine(createRng(2));
    line.slice(0, 6).forEach(ball => {
        expect(ball).toBeGreaterThanOrEqual(1);
        expect(ball).toBeLessThanOrEqual(40);
    });
});

test('power ball is between 1 and 10 (inclusive)', () => {
    const line = generateLine(createRng(3));
    expect(line[6]).toBeGreaterThanOrEqual(1);
    expect(line[6]).toBeLessThanOrEqual(10);
})

test('regular balls are unique', () => {
    const line = generateLine(createRng(4));
    const regular=line.slice(0,6);
    expect(new Set(regular).size).toBe(6);
})

test('helpers work standalone without an rng (default Math.random)', () => {
    expect(generateLine()).toHaveLength(7);
    expect(shuffleArrayAndSlice(3, 10)).toHaveLength(3);
    expect(generateBall(10)).toBeGreaterThanOrEqual(1);
})

//Ticket match
test('No matching numbers returns with 0 matched', () => {
    const line = [1, 2, 3, 4, 5, 6, 7];
    const winningNumbers = [8, 9, 10, 11, 12, 13, 9];
    expect(checkTicketMatch(winningNumbers, line)).toEqual(0);
})

test('1 matching number returns 1 matched', () => {
    const line = [1, 2, 3, 4, 5, 6, 7];
    const winningNumbers = [1, 8, 9, 10, 11, 13, 9];
    expect(checkTicketMatch(winningNumbers, line)).toEqual(1);
})

test('4 matching numbers returns 4 matched', () => {
    const ticket = [1, 2, 8, 9, 10, 11, 7];
    const winningNumbers = [1, 2, 8, 10, 12, 13, 3];
    expect(checkTicketMatch(winningNumbers, ticket)).toEqual(4);
})

test('No powerball match returns 0', () => {
    const ticket = [1, 2, 3, 4, 5, 6, 7];
    const winningNumbers = [11, 21, 31, 40, 15, 7, 6];
    expect(checkPowerballMatch(winningNumbers, ticket)).toEqual(0);
})

test('Powerball match returns 1', () => {
    const ticket = [1, 2, 3, 4, 5, 6, 7];
    const winningNumbers= [11, 21, 31, 40, 15, 7, 7];
    expect(checkPowerballMatch(winningNumbers, ticket)).toEqual(1);
})

test('Powerball only matches with powerball', () => {
    const ticket = [1, 2, 3, 4, 5, 6, 7];
    const winningNumbers = [21, 31, 40, 15, 6, 7, 9];
    expect(checkPowerballMatch(winningNumbers, ticket)).toEqual(0);
})


test('Jackpot win with all numbers and powerball matching', () => {
    const ticket = [1, 2, 3, 4, 5, 6, 7];
    const winningNumbers = [1, 2, 3, 4, 5, 6, 7];
    expect(checkTicketMatch(winningNumbers, ticket)).toEqual(6);
    expect(checkPowerballMatch(winningNumbers, ticket)).toEqual(1);
})

test('No matches returns $0', () => {
    const ticket = [1, 2, 3, 4, 5, 6, 7];
    const winningNumbers = [8, 9, 10, 11, 12, 13, 9];
    expect(calculatePrize(winningNumbers, ticket)).toEqual(0);
})

test('One match returns $0', () => {
    const ticket = [1, 2, 3, 4, 5, 6, 7];
    const winningNumbers = [1, 8, 9, 10, 11, 12, 9];
    expect(calculatePrize(winningNumbers, ticket)).toEqual(0);
})

test('three regular matches returns a bonus ticket and no cash', () => {
    const ticket = [1, 2, 3, 4, 5, 6, 7];
    const winningNumbers = [1, 2, 3, 10, 11, 12, 9];
    expect(calculatePrize(winningNumbers, ticket, game.getJackpot())).toEqual(0);
    expect(getMultiplier(3, 0).bonusTicket).toBe(true);
})

test('Powerball adds $20 to the three match prize (plus bonus ticket)', () => {
    const ticket = [1, 2, 3, 4, 5, 6, 7];
    const winningNumbers = [1, 2, 3, 10, 11, 12, 7];
    expect(calculatePrize(winningNumbers, ticket, game.getJackpot())).toEqual(20);
    expect(getMultiplier(3, 1).bonusTicket).toBe(true);
})

test('Two matches returns $0', () => {
    const ticket = [1, 2, 3, 4, 5, 6, 7];
    const winningNumbers = [1, 2, 8, 9, 10, 11, 9];
    expect(calculatePrize(winningNumbers, ticket)).toEqual(0);
})

test('Powerball only returns $0', () => {
    const ticket = [1, 2, 3, 4, 5, 6, 7];
    const winningNumbers = [8, 9, 10, 11, 12, 13, 7];
    expect(calculatePrize(winningNumbers, ticket)).toEqual(0);
})

test('Six matches no powerball returns $1,000,000', () => {
    const ticket = [1, 2, 3, 4, 5, 6, 7];
    const winningNumbers = [1, 2, 3, 4, 5, 6, 9];
    expect(calculatePrize(winningNumbers, ticket, game.getJackpot())).toEqual(1000000);
})

test('Jackpot win returns jackpot plus $1,000,000', () => {
    const ticket = [1, 2, 3, 4, 5, 6, 7];
    const winningNumber =[1, 2, 3, 4, 5, 6, 7];
    expect(calculatePrize(winningNumber, ticket, game.getJackpot())).toEqual(game.getJackpot() + 1000000);
})

// Prize table
test('prize table has the real draw 2636 amounts', () => {
    const cash = (m, pb) => getMultiplier(m, pb).cash;
    expect(cash(6, 1)).toEqual(1000000);
    expect(getMultiplier(6, 1).includesJackpot).toBe(true);
    expect(cash(6, 0)).toEqual(1000000);
    expect(cash(5, 1)).toEqual(1200);
    expect(cash(5, 0)).toEqual(550);
    expect(cash(4, 1)).toEqual(75);
    expect(cash(4, 0)).toEqual(30);
    expect(cash(3, 1)).toEqual(20);
    expect(cash(3, 0)).toEqual(0);
    expect(PRIZE_TABLE).toHaveLength(8);
    PRIZE_TABLE.forEach(row => expect(row.prizeMult).toBeUndefined());
})

test('Jackpot increases', () => {
    const initialJackpot = game.getJackpot();
    game.increaseJackpot(1000000);
    expect(game.getJackpot()).toEqual(initialJackpot + 1000000);
})

test('Jackpot resets', () => {
    const initialJackpot=game.getJackpot();
    game.increaseJackpot(1000000);
    game.resetJackpot();
    expect(game.getJackpot()).toEqual(initialJackpot);
})

test('Jackpot never exceeds the cap', () => {
    game.increaseJackpot(999000000);
    expect(game.getJackpot()).toEqual(game.maxJackpot);
})

test('playGame returns a winning line of numbers', () => {
    game.playGame(player);
    expect(game.winningNumbers).toHaveLength(7);
})

test('jackpot resets on win', () => {
    const initialJackpot = game.getJackpot();
    game.increaseJackpot(10000000);
    player.tickets.push(new LottoTicket([1,2,3,4,5,6,7], 1));
    game.playGame(player, [1, 2, 3, 4, 5, 6, 7]);

    expect(game.getJackpot()).toEqual(initialJackpot);

})

test('jackpot increases on non-jackpot result', () => {
    const initialJackpot = game.getJackpot();
    player.tickets.push(new LottoTicket([1,2,3,4,5,6,7], 1));
    game.playGame(player,[8,9,10,11,12,13,10]);
    expect(game.getJackpot()).toEqual(initialJackpot + 1000000);

})

test('player money increases on win', () => {
    const initialMoney = player.getMoney();
    player.tickets.push(new LottoTicket([1,2,3,4,5,6,7], 1));
    game.playGame(player, [1,2,3,4,5,6,7]);
    expect(player.getMoney()).toBeGreaterThan(initialMoney);
})

test('Player money decreases when buying a ticket', () => {
    const initialMoney = player.getMoney();
    const ticketPrice = game.getPrice();
    game.sellTicket(player);
    expect(player.getMoney()).toEqual(initialMoney - ticketPrice);
})

test('Player money increases when winning a prize', () => {
    const initialMoney = player.getMoney();
    player.tickets.push(new LottoTicket([1,2,3,4,5,6,7], 1));
    game.playGame(player, [1,2,3,4,5,6,7]);
    expect(player.getMoney()).toBeGreaterThan(initialMoney);
})

test('Player total spent and total won are tracked correctly', () => {
    const ticketPrice = game.getPrice();
    game.sellTicket(player);
    expect(player.totalSpent).toEqual(ticketPrice);
    player.tickets.push(new LottoTicket([1,2,3,4,5,6,7], 1));
    game.playGame(player, [1,2,3,4,5,6,7]);
    expect(player.totalWon).toBeGreaterThan(0);
})
test('jackpot is won if any ticket wins, not just the last', () => {
    const winningNumbers = [1, 2, 3, 4, 5, 6, 7];
    player.tickets = [
        new LottoTicket([1,2,3,4,5,6,7], 1),
        new LottoTicket([8,9,10,11,12,13,9], 2)
    ];
    game.playGame(player, winningNumbers);
    expect(game.getJackpot()).toEqual(game.defaultJackpot); // should have reset
});

test('playGame returns correct game over status', () => {
    player.currentMoney = 0;
    player.tickets = [new LottoTicket([1,2,3,4,5,6,7], 1)];
    const result = game.playGame(player, [8, 9, 10, 11, 12, 13, 9]); // No win
    expect(player.getGameOver()).toBe(true); // Player should be out of money
    expect(result.gameOver).toBe(true);
});

test('tickets are cleared after each game', () => {
    player.tickets = [new LottoTicket([1,2,3,4,5,6, 9], 1)];
    game.playGame(player, [8, 9, 10, 11, 12, 13, 9]);
    expect(player.tickets).toHaveLength(0);
})

test('cleared tickets are stored in ticket history', () => {
    player.tickets = [new LottoTicket([1,2,3,4,5,6,9], 1)];
    game.playGame(player, [8, 9, 10, 11, 12, 13, 9]);
    let ticketHistory = player.getTicketHistory();
    expect(ticketHistory).toHaveLength(1);
    expect(ticketHistory[0][0].numbers).toEqual([1,2,3,4,5,6,9]);
})

test('cleared tickets are stored over multiple rounds', () => {
    player.tickets = [new LottoTicket([1,2,3,4,5,6,9], 1)];
    game.playGame(player, [8,9,10,11,12,13, 9]);
    player.tickets = [new LottoTicket([2,6,21,22,23,24,1], 2)];
    game.playGame(player, [1,2,3,4,5,6,7]);
    let ticketHistory = player.getTicketHistory();
    expect(ticketHistory).toHaveLength(2);
    expect(ticketHistory[0][0].numbers).toEqual([1,2,3,4,5,6,9]);
    expect(ticketHistory[1][0].numbers).toEqual([2,6,21,22,23,24,1]);
})

test('ticket history can be switched off', () => {
    const quietPlayer = new LottoPlayer({ keepHistory: false });
    quietPlayer.tickets = [new LottoTicket([1,2,3,4,5,6,9], 1)];
    game.playGame(quietPlayer, [8, 9, 10, 11, 12, 13, 9]);
    expect(quietPlayer.getTicketHistory()).toHaveLength(0);
    expect(quietPlayer.tickets).toHaveLength(0);
})

// Computer players (the rest of NZ)
test('BASE_LINES calibrates to ~4.4M lines at $10M and ~7.4M at the cap', () => {
    expect(BASE_LINES).toEqual(2700000);
    expect(game.determineNumberOfLines()).toEqual(BASE_LINES); // default jackpot
    game.setJackpot(10000000);
    expect(game.ticketsSold).toBeGreaterThan(4300000);
    expect(game.ticketsSold).toBeLessThan(4500000);
    game.setJackpot(50000000);
    expect(game.ticketsSold).toBeGreaterThan(7300000);
    expect(game.ticketsSold).toBeLessThan(7500000);
})

test('Number of lines increases when jackpot is high', () => {
    const initialLines = game.determineNumberOfLines();
    game.setJackpot(16000000);
    expect(game.determineNumberOfLines()).toBeGreaterThan(initialLines);
})

test('Total tickets sold increase when player buys a ticket', () => {
    const initialTickets = game.determineTotalTickets();
    game.sellTicket(player);
    const newTickets = game.determineTotalTickets(player.tickets.length);
    expect(newTickets).toBeGreaterThan(initialTickets);
})

test('poissonSample averages lambda', () => {
    const rng = createRng(99);
    let total = 0;
    const n = 20000;
    for (let i = 0; i < n; i++) total += poissonSample(4, rng);
    expect(total / n).toBeGreaterThan(3.9);
    expect(total / n).toBeLessThan(4.1);
})

test('poissonSample does not hang on a stuck rng', () => {
    expect(() => poissonSample(0.07, () => 1)).not.toThrow();
})

test('Someone else is able to win the Jackpot', () => {
    game = new LottoGame({ rng: stubRng(ONE_OTHER_WINNER) });
    player.tickets  = [new LottoTicket([1,2,3,4,5,6,7], 1)];
    const result = game.playGame(player, [8, 9, 10, 11, 12, 13, 9]);

    expect(result.otherJackpotWinners).toEqual(1);
    expect(game.getJackpot()).toEqual(game.defaultJackpot);
})

test('When no one wins, jackpot increases', () => {
    player.tickets = [new LottoTicket([1, 2, 3, 4, 5, 6, 7], 1)];
    const result = game.playGame(player, [8,9,10,11,12,13,9]);
    expect(result.otherJackpotWinners).toEqual(0);
    expect(game.getJackpot()).toEqual(game.defaultJackpot + 1000000);
})

test('Jackpot is shared with other winners', () => {
    game = new LottoGame({ rng: stubRng(ONE_OTHER_WINNER) });
    game.setJackpot(10000000);
    player.tickets = [new LottoTicket([1,2,3,4,5,6,7], 1)];
    const result = game.playGame(player, [1,2,3,4,5,6,7]);
    expect(result.jackpotWon).toBe(true);
    expect(result.otherJackpotWinners).toEqual(1);
    expect(result.totalPrize).toEqual(5000000 + 1000000);
})

test('Jackpot is shared between several player lines and other winners', () => {
    game = new LottoGame({ rng: stubRng(ONE_OTHER_WINNER) });
    player.tickets = [new LottoTicket([1,2,3,4,5,6,7], 1), new LottoTicket([1,2,3,4,5,6,7], 2)];
    const result = game.playGame(player, [1,2,3,4,5,6,7]);
    const share = Math.floor(4000000 / 3);
    expect(result.totalPrize).toEqual(2 * (share + 1000000));
})

test('Player keeps the full jackpot when no one else wins', () => {
    player.tickets = [new LottoTicket([1,2,3,4,5,6,7], 1)];
    const result = game.playGame(player, [1,2,3,4,5,6,7]);
    expect(result.otherJackpotWinners).toEqual(0);
    expect(result.totalPrize).toEqual(4000000 + 1000000);
})

// Must-be-won
test('isMustBeWon is true only at the jackpot cap', () => {
    expect(game.isMustBeWon()).toBe(false);
    expect(game.getGameState(player).mustBeWon).toBe(false);
    game.setJackpot(game.maxJackpot);
    expect(game.isMustBeWon()).toBe(true);
    expect(game.getGameState(player).mustBeWon).toBe(true);
})

test('must-be-won with no first division winner rolls down to 5 + PB winners', () => {
    game.setJackpot(game.maxJackpot);
    game.countOtherFivePbWinners = () => 4;
    player.tickets = [new LottoTicket([1,2,3,4,5,9,7], 1)];
    const result = game.playGame(player, [1,2,3,4,5,6,7]);
    expect(result.mustBeWon).toBe(true);
    expect(result.rolledDown).toBe(true);
    expect(result.otherFivePbWinners).toEqual(4);
    expect(player.getTotalWon()).toEqual(10000000); // 50M / (1 + 4), not the usual $1,200
    expect(game.getJackpot()).toEqual(game.defaultJackpot);
})

test('rolldown shares between several 5 + PB lines of the player', () => {
    game.setJackpot(game.maxJackpot);
    game.countOtherFivePbWinners = () => 3;
    player.tickets = [new LottoTicket([1,2,3,4,5,9,7], 1), new LottoTicket([1,2,3,4,5,10,7], 2)];
    const result = game.playGame(player, [1,2,3,4,5,6,7]);
    expect(result.totalPrize).toEqual(2 * Math.floor(50000000 / 5));
})

test('rolldown pays nothing extra without a 5 + PB line', () => {
    game.setJackpot(game.maxJackpot);
    player.tickets = [new LottoTicket([1,2,3,4,5,9,8], 1)]; // 5 matches, wrong Powerball
    const result = game.playGame(player, [1,2,3,4,5,6,7]);
    expect(result.rolledDown).toBe(true);
    expect(result.totalPrize).toEqual(550);
    expect(game.getJackpot()).toEqual(game.defaultJackpot);
})

test('no rolldown when someone else wins the jackpot at the cap', () => {
    game = new LottoGame({ rng: stubRng(ONE_OTHER_WINNER) });
    game.setJackpot(game.maxJackpot);
    game.countOtherFivePbWinners = () => { throw new Error('should not roll down'); };
    player.tickets = [new LottoTicket([1,2,3,4,5,9,7], 1)];
    const result = game.playGame(player, [1,2,3,4,5,6,7]);
    expect(result.rolledDown).toBe(false);
    expect(result.totalPrize).toEqual(1200); // normal 5 + PB prize
    expect(game.getJackpot()).toEqual(game.defaultJackpot);
})

test('no rolldown below the cap', () => {
    game.setJackpot(49000000);
    player.tickets = [new LottoTicket([1,2,3,4,5,9,7], 1)];
    const result = game.playGame(player, [1,2,3,4,5,6,7]);
    expect(result.rolledDown).toBe(false);
    expect(result.totalPrize).toEqual(1200);
    expect(game.getJackpot()).toEqual(game.maxJackpot); // grew, clamped at the cap
})

test('5 + PB odds are 204 in 38,383,800', () => {
    expect(FIVE_PB_ODDS * JACKPOT_ODDS).toBeCloseTo(204, 5);
})

// Bonus tickets
test('3 matches earns a bonus ticket, no cash', () => {
    player.tickets = [new LottoTicket([1,2,3,14,15,16,9], 1)];
    const result = game.playGame(player, [1,2,3,10,11,12,7]);
    expect(player.tickets).toHaveLength(0);
    const played = player.getTicketHistory()[0][0];
    expect(played.prize).toEqual(0);
    expect(played.bonusTicket).toBe(true);
    expect(player.getTotalWon()).toEqual(0);
    expect(player.bonusTickets).toEqual(1);
    expect(result.bonusTicketsWon).toEqual(1);
})

test('3 + PB earns $20 and a bonus ticket', () => {
    player.tickets = [new LottoTicket([1,2,3,14,15,16,7], 1)];
    game.playGame(player, [1,2,3,10,11,12,7]);
    const played = player.getTicketHistory()[0][0];
    expect(played.prize).toEqual(20);
    expect(played.bonusTicket).toBe(true);
    expect(player.bonusTickets).toEqual(1);
})

test('losing tickets are not bonus tickets', () => {
    player.tickets = [new LottoTicket([1,2,14,15,16,17,9], 1)];
    game.playGame(player, [1,2,3,10,11,12,7]);
    expect(player.getTicketHistory()[0][0].bonusTicket).toBe(false);
    expect(player.bonusTickets).toEqual(0);
})

test('bonus ticket is used first: free, not in totalSpent, still counted as bought', () => {
    player.bonusTickets = 1;
    const money = player.getMoney();
    const bonus = game.sellTicket(player);
    expect(bonus.isBonus).toBe(true);
    expect(player.getMoney()).toEqual(money);
    expect(player.getTotalSpent()).toEqual(0);
    expect(player.getTicketsBought()).toEqual(1);
    expect(player.bonusTickets).toEqual(0);
    const paid = game.sellTicket(player);
    expect(paid.isBonus).toBe(false);
    expect(player.getMoney()).toEqual(money - 2);
    expect(player.getTotalSpent()).toEqual(2);
    expect(player.getTicketsBought()).toEqual(2);
})

test('a bonus ticket can be bought with no money, and is not game over', () => {
    player.currentMoney = 0;
    player.bonusTickets = 1;
    expect(player.canBuyTicket(2)).toBe(true);
    player.updateGameOver(2);
    expect(player.getGameOver()).toBe(false);
    player.bonusTickets = 0;
    expect(player.canBuyTicket(2)).toBe(false);
    player.updateGameOver(2);
    expect(player.getGameOver()).toBe(true);
})

test('winning a bonus ticket with no money avoids game over', () => {
    player.currentMoney = 0;
    player.tickets = [new LottoTicket([1,2,3,14,15,16,9], 1)];
    const result = game.playGame(player, [1,2,3,10,11,12,7]);
    expect(result.gameOver).toBe(false);
})

test('Lotto odds are 1 in 3,838,380 (6 from 40)', () => {
    expect(combinations(40, 6)).toEqual(3838380);
    expect(LOTTO_ODDS).toEqual(3838380);
})

test('Jackpot odds include the Powerball (1 in 38,383,800)', () => {
    expect(JACKPOT_ODDS).toEqual(38383800);
})

test('Game over uses the ticket price', () => {
    player.currentMoney = 4;
    player.updateGameOver(5);
    expect(player.getGameOver()).toBe(true);
    player.updateGameOver(2);
    expect(player.getGameOver()).toBe(false);
})

// Seeded rng
test('createRng gives floats in [0,1) and repeats for the same seed', () => {
    const a = createRng(5);
    const b = createRng(5);
    for (let i = 0; i < 100; i++){
        const x = a();
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(1);
        expect(b()).toEqual(x);
    }
})

test('same seed gives identical winning lines over several draws', () => {
    const a = new LottoGame({ seed: 123 });
    const b = new LottoGame({ seed: 123 });
    const pa = new LottoPlayer();
    const pb = new LottoPlayer();
    for (let i = 0; i < 10; i++){
        expect(a.playGame(pa).winningNumbers).toEqual(b.playGame(pb).winningNumbers);
    }
    expect(a.seed).toEqual(123);
})

test('different seeds give different winning lines', () => {
    const a = new LottoGame({ seed: 1 });
    const b = new LottoGame({ seed: 2 });
    const linesA = [];
    const linesB = [];
    for (let i = 0; i < 5; i++){
        linesA.push(a.generateWinningLine());
        linesB.push(b.generateWinningLine());
    }
    expect(linesA).not.toEqual(linesB);
})

test('a game without a seed picks one and stores it', () => {
    expect(typeof new LottoGame().seed).toBe('number');
})

test('seeded games sell identical tickets', () => {
    const a = new LottoGame({ seed: 8 });
    const b = new LottoGame({ seed: 8 });
    const p1 = new LottoPlayer();
    const p2 = new LottoPlayer();
    expect(a.sellTicket(p1).numbers).toEqual(b.sellTicket(p2).numbers);
})

// Headless simulation
test('simulateDraws returns sane numbers', () => {
    const draws = 2000;
    const lines = 3;
    const s = simulateDraws({ draws, linesPerDraw: lines, seed: 42 });
    expect(s.draws).toEqual(draws);
    expect(s.seed).toEqual(42);
    // bonus tickets make some lines free, so spent is cash only
    expect(s.spent + s.bonusTicketsUsed * 2).toEqual(draws * lines * 2);
    expect(s.net).toEqual(s.won - s.spent);
    expect(s.biggestPrize).toBeGreaterThanOrEqual(0);
    expect(Object.keys(s.prizeCounts).sort()).toEqual(['3', '3+PB', '4', '4+PB', '5', '5+PB', '6', '6+PB']);
    expect(s.prizeCounts['3']).toBeGreaterThan(0);
    expect(s.jackpotWinsByPlayer).toBeLessThanOrEqual(1);
})

test('simulateDraws is deterministic for a seed', () => {
    const a = simulateDraws({ draws: 3000, linesPerDraw: 2, seed: 7 });
    const b = simulateDraws({ draws: 3000, linesPerDraw: 2, seed: 7 });
    const c = simulateDraws({ draws: 3000, linesPerDraw: 2, seed: 8 });
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
})

test('simulateDraws stops when the money runs out', () => {
    const s = simulateDraws({ draws: 1000, seed: 3, startingMoney: 2 });
    expect(s.draws).toBeLessThan(1000);
    expect(s.draws).toBeGreaterThanOrEqual(1);
})

test('simulateDraws runs 105,000 draws quickly', () => {
    const start = Date.now();
    const s = simulateDraws({ draws: 105000, seed: 1 });
    const elapsed = Date.now() - start;
    expect(s.draws).toEqual(105000);
    expect(s.spent + s.bonusTicketsUsed * 2).toEqual(105000 * 2);
    expect(elapsed).toBeLessThan(2000);
})
