//Basic prototype. Game functionality will be split between a player object and game object, just wanted to test things first.

function playGame(){
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
}

function generateLine(){
    const ballRange = 40;
    const powerBallRange = 10;
    let balls=[];
    for(let i = 0; i<6; i++){
        balls.push(generateBall(ballRange));
    }
    balls.push(generateBall(powerBallRange));

    return balls;
}

function generateBall(numRange){
    const ball = Math.floor(Math.random()*numRange)+1;
    return ball;
}
