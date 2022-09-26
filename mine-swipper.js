'use strict'

const MINE = '💣'
const FLAG = '🚩'
const HEART = '❤️'
const HINT = '💡'
const NORMAL_SMILEY = '\n\t\t<img src="img/normal-smiley.png">\n'
const Lose_SMILEY = '\n\t\t<img src="img/lose-smiley.png">\n'
const WIN_SMILEY = '\n\t\t<img src="img/win-smiley.png">\n'


var gLevel = {
   SIZE: 4, 
   MINES: 2,
   currScore: {secs: 0, ms: 0},
   bestScore: {secs: Infinity, ms: Infinity}
}

var gBoard
var gtimerInterval
var gMinesCounter
var gIsHint = false

var gGame = {
    isOn: false, 
    shownCount: 0, 
    markedCount: 0, 
    livesLeft: 1, 
    hintsLeft: 3
}

function chooseLevel(size, mines, button) {
    gLevel = {
        SIZE: size, 
        MINES: mines
    }
    
    var elBtns = document.querySelectorAll('.level-btns button')
    for (var i = 0; i < elBtns.length; i++) {
        
        if(elBtns[i].classList.contains('light')) {
            elBtns[i].style.backgroundColor = 'rgb(110, 137, 243)'
        } else {
            elBtns[i].style.backgroundColor = 'black'
        }
    }
    button.style.backgroundColor = '#FFB03A'

    initGame()
}


function initGame(){

    gBoard = buildBoard()
   
    renderBoard()
    
    gGame.isOn = false
    clearInterval(gtimerInterval)
    gtimerInterval = 0 
    gGame.shownCount = 0
    gGame.markedCount = 0
    gGame.livesLeft = 1
    if (gLevel.SIZE > 4) gGame.livesLeft = 3
    gMinesCounter = gLevel.MINES
    gGame.hintsLeft = 3

    
    document.querySelector('.timer span').innerText = ''
    document.querySelector('.smiley').innerHTML = NORMAL_SMILEY
    document.querySelector('.lives-left').innerHTML = `Lives:<br><span>${displayHearts()}</span>`  
    document.querySelector('.mines-counter').innerHTML = `Mines:<br><span>${gMinesCounter}</span>` 
    document.querySelector('.hints').innerHTML = `${displayHints()}`  
    
}


function displayHearts() {
    var hearts = ''

    for (var i = 0; i < gGame.livesLeft; i++) {
        hearts += HEART 
    }

    return hearts
}

function buildBoard() {
    var board = []

    for (var i = 0; i < gLevel.SIZE; i++) {
        board[i] = []

        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = {
                location: {i, j}, 
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false,
            }
            board[i][j] = cell
        }
    }
    return board
}

function renderBoard() {
    var strHTML = ''

    for (var i = 0; i < gBoard.length; i++) {
        strHTML += '\n<tr>\n'

        for (var j = 0; j < gBoard[0].length; j++) {
            var cell = gBoard[i][j]

            var className = `mines-around-${cell.minesAroundCount} `
            
            if (cell.isShown) className += 'shown '
            if (cell.isMine) className += 'mine '
            if (cell.isMarked) className += 'marked'

            var cellElement = ''
            if (!cell.isShown && cell.isMarked) cellElement += FLAG
            else if (!cell.isShown) cellElement += ''
            else if (cell.isMine && !cell.isMarked) cellElement += MINE
            else (cell.minesAroundCount > 0 ? cellElement += cell.minesAroundCount : cellElement += '')
            

            strHTML += `\t<td class="cell ${className}" onmouseup="cellClicked(this, ${i}, ${j}, event)">${cellElement}</td>\n`
        }
        strHTML += '</tr>'
    }

    var elBoard = document.querySelector('.game-board')
    elBoard.innerHTML = strHTML
}

function setMinesNegsCount(board) {
    
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {

           board[i][j].minesAroundCount = countMinesAroundCell(board, {i, j})                
        }
    }
}


function countMinesAroundCell(board, location) {

    var counter = 0

    for (var i = location.i - 1; i <= location.i + 1; i++) {
        if (i < 0 || i >= board.length) continue

        for (var j = location.j - 1; j <= location.j + 1; j++) {
            if (j < 0 || j >= board[0].length) continue
            if (i === location.i && j === location.j) continue

            if (board[i][j].isMine === true) counter++
        }
    }

    return counter
}

function cellClicked(elCell, i, j, event) {
    var cell = gBoard[i][j]

    if (!gGame.isOn && gGame.shownCount === 0) {
        gGame.isOn = true
        locateMines(gBoard)

        setMinesNegsCount(gBoard)

        renderBoard()
    
        showTimer()
    } 

    if (!gGame.isOn) return
    
    if (event.button === 0) {  
        if (!cell.isShown && !cell.isMarked && !gIsHint) {
            cell.isShown = true
            gGame.shownCount++
            if (!gIsHint) cell.isShownBefore = true
        }

        if (!cell.minesAroundCount && !cell.isMine) expandShown(gBoard, cell, {i: i, j: j})

        if (gIsHint) hintShow(gBoard, cell, {i: i, j: j})

        if (cell.isMine && !cell.isMarked && !gIsHint) {
            
            cell.isShown = true
            gGame.livesLeft--
            document.querySelector('.lives-left').innerText = `Lives:\n ${displayHearts()}`  

            gMinesCounter--
            document.querySelector('.mines-counter span').innerText = `${gMinesCounter}`
            
            if (gGame.livesLeft === 0) { 
                gameOver()
            } 
        }
        
        checkWin()
    }
    
    if (event.button === 2) cellMarked(cell)
    
    renderBoard()
}


function checkWin() {
    if (gGame.shownCount + gGame.markedCount === gLevel.SIZE * gLevel.SIZE) victory()
    else return
}

function victory() {
    document.querySelector('.smiley').innerHTML = WIN_SMILEY
    
    if (gLevel.currScore.secs < gLevel.bestScore.secs
        // || gLevel.currScore.secs === gLevel.bestScore.secs && gLevel.currScore.ms < gLevel.bestScore.ms) { 
    ){gLevel.bestScore = gLevel.currScore
        document.querySelector('.best-score span').innerHTML = 
        `${gLevel.bestScore.secs}:${gLevel.bestScore.ms}`
        }

    resetGameVars()
}

function gameOver() {
    document.querySelector('.smiley').innerHTML = Lose_SMILEY
    document.querySelector('.mines-counter span').innerText = `0`
    revealeMines()
    resetGameVars()
}

function resetGameVars() {
    gGame.isOn = false
    clearInterval(gtimerInterval)
    gtimerInterval = 0 
    
}

function revealeMines() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].isMine === true) {
                gBoard[i][j].isMarked = false
                gBoard[i][j].isShown = true
            }
        }
    }
    renderBoard()
}


function cellMarked(cell) {

    if (cell.isShown) return

    if(!cell.isMarked) {
        cell.isMarked = true
        gGame.markedCount++
        renderBoard()
        
        gMinesCounter--
        document.querySelector('.mines-counter span').innerText = `${gMinesCounter}`
    } else { 
        cell.isMarked = false
        gGame.markedCount--
        renderBoard()

        gMinesCounter++
        document.querySelector('.mines-counter span').innerText = `${gMinesCounter}`
}

    checkWin()
}

function expandShown(board, cell, location) {

    for (var i = location.i - 1; i <= location.i + 1; i++) {
        if (i < 0 || i >= board.length) continue

        for (var j = location.j - 1; j <= location.j + 1; j++) {
            if (j < 0 || j >= board[0].length) continue
            
            if (!board[i][j].isShown && !gIsHint) {  
            board[i][j].isShown = true
            gGame.shownCount++
            if (!gIsHint) board[i][j].isShownBefore = true
            }
        }
    }

    renderBoard()
}

function locateMines(board){
    for (var i = 0; i < gLevel.MINES; i++) {
        locateMine(board)
    }

    renderBoard()
}

function locateMine(board) {
    var location = getEmptyCell(board)

    board[location.i][location.j].isMine = true
}

function getEmptyCell(board) {
    var locations = []

    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            if (!board[i][j].isMine) locations.push({i, j})
        }
    }
    return locations[getRandomIntInclusive(0, locations.length - 1)]
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); 
  }
  

function showTimer() {
    var timer = document.querySelector('.timer span')
    var timeStart = Date.now()
    
    gtimerInterval = setInterval(() => {
      var currTime = Date.now()
  
      var secs = parseInt((currTime - timeStart) / 1000)
      var ms = (currTime - timeStart) - secs * 1000
      ms = '000' + ms
      // 00034 // 0001
      ms = ms.substring(ms.length - 3, ms.length)
      
      timer.innerHTML = `\n ${secs}:${ms}`
      
      gLevel.currScore = {secs: secs, ms: +ms}
    }, 100)
  }

  function toggleMode() {
    var levelBtns = document.querySelectorAll('.level-btns button')
   
    if (document.querySelector('body').classList.contains('dark')) {
        document.querySelector('body').classList.remove('dark')
        document.querySelector('body').classList.add('light')
        document.querySelector('.display-mode').innerText = '🌙'
        for (var i = 0 ; i < levelBtns.length; i++) {
            levelBtns[i].style.backgroundColor = 'rgb(110, 137, 243)'
            levelBtns[i].classList.remove('dark')
            levelBtns[i].classList.add('light')
        }
    } else {
        document.querySelector('body').classList.remove('light')
        document.querySelector('body').classList.add('dark')
        document.querySelector('.display-mode').innerText = '🔆'
        for (var i = 0 ; i < levelBtns.length; i++) {
            levelBtns[i].style.backgroundColor = 'black'
            levelBtns[i].classList.remove('light')
            levelBtns[i].classList.add('dark')
        }
    }
  }

  function getHint() {
    gIsHint = true
  }

  function displayHints() {
    var hints = ''

    for (var i = 0; i < gGame.hintsLeft; i++) {
        hints += HINT 
    }

    return hints
}

function hintShow(board, cell, location) {
    
    for (var i = location.i - 1; i <= location.i + 1; i++) {
        if (i < 0 || i >= board.length) continue

        for (var j = location.j - 1; j <= location.j + 1; j++) {
            if (j < 0 || j >= board[0].length) continue
            
            if (!board[i][j].isShown) {  
            board[i][j].isShown = true
            }
        }
    }
    renderBoard()

    setTimeout(() => {
        gIsHint = false
        gGame.hintsLeft--
        document.querySelector('.hints').innerText = `${displayHints()}`
        hideHintShow(board, cell, location)
    }, 1000);
}

function hideHintShow(board, cell, location) {
    
    for (var i = location.i - 1; i <= location.i + 1; i++) {
        if (i < 0 || i >= board.length) continue

        for (var j = location.j - 1; j <= location.j + 1; j++) {
            if (j < 0 || j >= board[0].length) continue
            
            if (board[i][j].isShown && !board[i][j].isShownBefore) {  
            board[i][j].isShown = false
            }
        }
    }
    renderBoard()

}