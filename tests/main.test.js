const {generateLine, shuffleArrayAndSlice, generateBall} = require('../main');

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