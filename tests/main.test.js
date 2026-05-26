const {LottoGame, LottoPlayer, generateLine, shuffleArrayAndSlice, generateBall, checkTicketMatch, checkPowerballMatch, calculatePrize, getMultiplier, getJackpot} = require('../main');

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
    const expectedPrize = Math.floor(getJackpot()*getMultiplier(3, 0).prizeMult);
    expect(calculatePrize(winningNumbers, ticket)).toEqual(expectedPrize);
})

test('Powerball increases minimum prize', () => {
    const ticket = [1, 2, 3, 4, 5, 6, 7];
    const winningNumbers = [1, 2, 3, 10, 11, 12, 7];
    const expectedPrize = Math.floor(getJackpot()*getMultiplier(3, 1).prizeMult);
    expect(calculatePrize(winningNumbers, ticket)).toEqual(expectedPrize);
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
    const expectedPrize = Math.floor(getJackpot() * getMultiplier(6, 0).prizeMult);
    expect(calculatePrize(winningNumbers, ticket)).toEqual(expectedPrize);
})

test('Jackpot win returns jackpot amount', () => {
    const ticket = [1, 2, 3, 4, 5, 6, 7];
    const winningNumber =[1, 2, 3, 4, 5, 6, 7];
    const expectedPrize = getJackpot();
    expect(calculatePrize(winningNumber, ticket)).toEqual(expectedPrize);
})

//Testing LottoGame class
let game;
let player;
beforeEach(() => {
    game = new LottoGame();
    player = new LottoPlayer();
});

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