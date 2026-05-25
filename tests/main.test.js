const {generateLine, shuffleArrayAndSlice, generateBall, checkTicketMatch, checkPowerballMatch} = require('../main');

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