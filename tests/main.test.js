const {LottoGame, LottoPlayer, generateLine, shuffleArrayAndSlice, generateBall, checkTicketMatch, checkPowerballMatch, calculatePrize, getMultiplier, getJackpot} = require('../main');

//Testing LottoGame class
let game;
let player;
beforeEach(() => {
    game = new LottoGame();
    player = new LottoPlayer();
});

afterEach(() => {
    jest.restoreAllMocks();
})

//Ball Generation Tests
test('generate line returns 7 numbers', () => {
    const line = generateLine();
    expect(line).toHaveLength(7);
});

test('regular balls are between 1 and 40 (inclusive)', () => {
    const line = generateLine();
    line.slice(0, 6).forEach(ball => {
        expect(ball).toBeGreaterThanOrEqual(1);
        expect(ball).toBeLessThanOrEqual(40);
    });
});

test('power ball is between 1 and 10 (inclusive)', () => {
    const line = generateLine();
    expect(line[6]).toBeGreaterThanOrEqual(1);
    expect(line[6]).toBeLessThanOrEqual(10);
})

test('regular balls are unique', () => {
    const line = generateLine();
    const regular=line.slice(0,6);
    expect(new Set(regular).size).toBe(6);
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

test('three regular matches returns minimum prize', () => {
    const ticket = [1, 2, 3, 4, 5, 6, 7];
    const winningNumbers = [1, 2, 3, 10, 11, 12, 9];
    const expectedPrize = Math.floor(game.getJackpot()*getMultiplier(3, 0).prizeMult);
    expect(calculatePrize(winningNumbers, ticket, game.getJackpot())).toEqual(expectedPrize);
})

test('Powerball increases minimum prize', () => {
    const ticket = [1, 2, 3, 4, 5, 6, 7];
    const winningNumbers = [1, 2, 3, 10, 11, 12, 7];
    const expectedPrize = Math.floor(game.getJackpot()*getMultiplier(3, 1).prizeMult);
    expect(calculatePrize(winningNumbers, ticket, game.getJackpot())).toEqual(expectedPrize);
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

test('Six matches no powerball returns correct prize', () => {
    const ticket = [1, 2, 3, 4, 5, 6, 7];
    const winningNumbers = [1, 2, 3, 4, 5, 6, 9];
    const expectedPrize = Math.floor(game.getJackpot() * getMultiplier(6, 0).prizeMult);
    expect(calculatePrize(winningNumbers, ticket, game.getJackpot())).toEqual(expectedPrize);
})

test('Jackpot win returns jackpot amount', () => {
    const ticket = [1, 2, 3, 4, 5, 6, 7];
    const winningNumber =[1, 2, 3, 4, 5, 6, 7];
    const expectedPrize = game.getJackpot();
    expect(calculatePrize(winningNumber, ticket, game.getJackpot())).toEqual(expectedPrize);
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

test('playGame returns a winning line of numbers', () => {
    game.playGame(player);
    expect(game.winningNumbers).toHaveLength(7);
})

test('jackpot resets on win', () => {
    const initialJackpot = game.getJackpot();
    game.increaseJackpot(10000000);
    player.tickets.push([1, 2, 3, 4, 5, 6, 7]);
    game.playGame(player, [1, 2, 3, 4, 5, 6, 7]);
    expect(game.getJackpot()).toEqual(initialJackpot);

})

test('jackpot increases on non-jackpot result', () => {
    jest.spyOn(Math, 'random').mockReturnValue(1);
    const initialJackpot = game.getJackpot();
    player.tickets.push([1,2,3,4,5,6,7]);
    game.playGame(player,[8,9,10,11,12,13,10]);
    expect(game.getJackpot()).toEqual(initialJackpot + 1000000);

})

test('player money increases on win', () => {
    const initialMoney = player.getMoney();
    player.tickets.push([1,2,3,4,5,6,7]);
    game.playGame(player, [1,2,3,4,5,6,7]);
    expect(player.getMoney()).toBeGreaterThan(initialMoney);
})

test('Player money decreases when buying a ticket', () => {
    const initialMoney = player.getMoney();
    const ticketPrice = game.getPrice();
    player.buyTicket(ticketPrice);
    expect(player.getMoney()).toEqual(initialMoney - ticketPrice);
})

test('Player money increases when winning a prize', () => {
    const initialMoney = player.getMoney();
    player.tickets.push([1,2,3,4,5,6,7]);
    game.playGame(player, [1,2,3,4,5,6,7]);
    expect(player.getMoney()).toBeGreaterThan(initialMoney);
})

test('Player total spent and total won are tracked correctly', () => {
    const ticketPrice = game.getPrice();
    player.buyTicket(ticketPrice);
    expect(player.totalSpent).toEqual(ticketPrice);
    player.tickets.push([1,2,3,4,5,6,7]);
    game.playGame(player, [1,2,3,4,5,6,7]);
    expect(player.totalWon).toBeGreaterThan(0);
})
test('jackpot is won if any ticket wins, not just the last', () => {
    const winningNumbers = [1, 2, 3, 4, 5, 6, 7];
    player.tickets = [
        [1, 2, 3, 4, 5, 6, 7], // jackpot winner
        [8, 9, 10, 11, 12, 13, 9] // no match — this was overwriting jackpotWon
    ];
    game.playGame(player, winningNumbers);
    expect(game.getJackpot()).toEqual(game.defaultJackpot); // should have reset
});

test('playGame returns correct game over status', () => {
    player.currentMoney = 0; 
    player.tickets = [[1,2,3,4,5,6,9]];
    const result = game.playGame(player, [8, 9, 10, 11, 12, 13, 9]); // No win
    expect(player.getGameOver()).toBe(true); // Player should be out of money
});

test('tickets are cleared after each game', () => {
    player.tickets = [[1,2,3,4,5,6, 9]];
    game.playGame(player, [8, 9, 10, 11, 12, 13, 9]);
    expect(player.tickets).toHaveLength(0);
})

test('cleared tickets are stored in ticket history', () => {
    player.tickets = [[1,2,3,4,5,6,9]];
    game.playGame(player, [8, 9, 10, 11, 12, 13, 9]);
    let ticketHistory = player.getTicketHistory();
    expect(ticketHistory).toHaveLength(1);
    expect(ticketHistory[0]).toEqual([[1,2,3,4,5,6,9]]);
})

test('cleared tickets are stored over multiple rounds', () => {
    player.tickets = [[1,2,3,4,5,6,9]];
    game.playGame(player, [8,9,10,11,12,13, 9]);
    player.tickets = [[2,6,21,22,23,24,1]];
    game.playGame(player, [1,2,3,4,5,6,7]);
    let ticketHistory = player.getTicketHistory();
    expect(ticketHistory).toHaveLength(2);
    expect(ticketHistory[0]).toEqual([[1,2,3,4,5,6,9]]);
    expect(ticketHistory[1]).toEqual([[2,6,21,22,23,24,1]]);
})

test('determineNumberOfPlayers returns an amount of players', () => {
    const numPlayers = game.determineNumberOfPlayers();
    expect(numPlayers).toBeGreaterThan(0);
})

test('Number of players increases when jackpot is high', () => {
    const initialPlayers = game.determineNumberOfPlayers();
    game.setJackpot(16000000);
    const newPlayers = game.determineNumberOfPlayers();
    expect(newPlayers).toBeGreaterThan(initialPlayers);
})

test('Total tickets sold is a multiple of the number of players at start', () => {
    const numPlayers = game.determineNumberOfPlayers();
    const ticketsSold = game.determineTotalTickets();
    expect(ticketsSold/8).toEqual(numPlayers);
})

test('Total tickets sold increase when player buys a ticket', () => {
    const initialTickets = game.determineTotalTickets();
    player.buyTicket(game.getPrice());
    const newTickets = game.determineTotalTickets(player.tickets.length);
    expect(newTickets).toBeGreaterThan(initialTickets);
})

test('Someone else is able to win the Jackpot', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    player.tickets  = [[1, 2, 3, 4, 5, 6, 7]];
    game.playGame(player, [8, 9, 10, 11, 12, 13, 9]);

    expect(game.getJackpot()).toEqual(game.defaultJackpot);


})
test('When no one wins, jackpot increases', () => {
    jest.spyOn(Math, 'random').mockReturnValue(1);
    player.tickets = [[1,2,3,4,5,6,7]];
    game.playGame(player, [8,9,10,11,12,13,9]);
    expect(game.getJackpot()).toEqual(game.defaultJackpot + 1000000);
})