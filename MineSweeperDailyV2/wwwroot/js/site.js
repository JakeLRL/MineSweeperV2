document.addEventListener("DOMContentLoaded", function () {

    class MineSweeper {
        constructor() {
            this.row = 8;
            this.column = 8;
            this.bombs = 10;
            this.countOfClear = 54;
            this.startTime = 0;
            this.board = document.getElementById("board");
            this.boardBombs = [];
            this.boardFlags = [];
            this.flagCount = 0;
            this.firstTurn = true;
            this.time = 0;
            this.timer;
            this.score;
            this.squares = document.getElementsByClassName("square");
            this.squaresClicked = document.getElementsByClassName("square-clicked");
            this.resetBtn = document.getElementById("reset");
            this.instructionBtn = document.getElementById("instructions");
            this.instructions = document.getElementById("instructions-box")
            this.modeBtn = document.getElementById("mode");
            this.isFlaggingMode = false;
            this.returnBtn = document.getElementById("return-to-game");
            this.mainContainer = document.getElementsByClassName("window-container");
            this.levels = document.getElementsByClassName("level");
            this.overlay = document.getElementsByClassName("overlay");
        }

        // ----------------------- GENERAL GAME LOGIC -----------------------

        // difficulty level selection
        difficulty(level) {
            switch (level) {
                case "Hard":
                    if (document.documentElement.clientWidth > document.documentElement.clientHeight)
                        this.row = 16, this.column = 30;
                    else
                        this.column = 16, this.row = 30;
                    this.bombs = 99, this.countOfClear = 381;
                    break;
                case "Intermediate":
                    this.row = 16, this.column = 16, this.bombs = 40, this.countOfClear = 216;
                    break;
                default:
                    this.row = 8, this.column = 8, this.bombs = 10, this.countOfClear = 54;
                    break;
            } 
        }

        // gets the surroundings
        getSurroundings(row, col) {
            let inCells = [
                [row - 1, col - 1],
                [row - 1, col],
                [row - 1, col + 1],
                [row, col - 1],
                [row, col + 1],
                [row + 1, col - 1],
                [row + 1, col],
                [row + 1, col + 1],
            ];
            let outCells = [];
            inCells.forEach(cell => {
                if (cell[0] >= 0 && cell[0] < this.row && cell[1] >= 0 && cell[1] < this.column) {
                    outCells.push(cell);
                }
            });
            return outCells;
        }

        // number of bombs surrounding a square and flags
        numberOfBombs(row, col, board) {
            let count = 0;
            let cells = this.getSurroundings(row, col);
            cells.forEach(cell => {
                count += board[cell[0]][cell[1]];
            });

            return count;
        }

        //color of number
        numColor(num) {
            switch (num) {
                case 1:
                    return "lightblue";
                case 2:
                    return "green";
                case 3:
                    return "red";
                case 4:
                    return "blue";
                case 5:
                    return "maroon";
                case 6:
                    return "#006768";
                case 7:
                    return "purple";
                case 8:
                    return "black";
                default:
                    break;
            }
        }

        // bombcount
        bombCount() {
            let counter = document.getElementById("num-bombs");
            let num = this.bombs - this.flagCount;
            counter.innerText = ("000" + num).slice(-3);
        }

        // clears surround area if the square has no bombs surounding it
        clearSurrounding(row, col, board, boardBombs, bool) {
            let square = board.childNodes[row].childNodes[col];
            if (this.checkStopSearch(row, col, boardBombs, bool, square))
                return;
            if (this.clickSquare(row, col, boardBombs, bool, square))
                return;
            let cells = this.getSurroundings(row, col);
            cells.forEach(cell => {
                this.clearSurrounding(cell[0], cell[1], board, boardBombs, false);
            });
        }

        checkStopSearch(row, col, boardBombs, bool, square) {
            var stopSearching = false;
            if (row < 0 || row >= this.row || col < 0 || col >= this.column) {
                stopSearching = true;
                return stopSearching;
            }
            if (square.classList.contains("square-clicked") && !bool) {
                stopSearching = true;
                return stopSearching;
            }
            if (square.classList.contains("flag") && !bool) {
                stopSearching = true;
                return stopSearching;
            }
            if (boardBombs[row][col] == 1) {
                this.loser(square);
                stopSearching = true;
            }
            return stopSearching;
        }

        //reset function
        reset() {
            while (this.board.firstChild) {
                board.removeChild(board.firstChild);
            }
            this.boardBombs = [];
            this.firstTurn = true;
            this.flagCount = 0;
            this.boardFlags = [];
            this.time = 0;
            clearInterval(this.timer);
            document.getElementById("timer").innerHTML = ("000" + this.time).slice(-3);
            this.createBottomLayer();
            this.bombCount();
            this.createGrid();
            this.resetBtn.removeChild(this.resetBtn.firstChild)
            let smile = new Image();
            smile.src = "./img/4-reset-1.png";
            smile.style.maxWidth = "100%";
            this.resetBtn.appendChild(smile);
        }

        //reset button
        resetButton() {
            this.resetBtn.addEventListener("click", e => {
                this.reset();
            });
        }

        // square clicked if its a number, stop searching
        clickSquare(row, col, boardBombs, bool, square) {
            var stopSearching = false;
            square.setAttribute("class", "square-clicked");
            square.style.borderWidth = "1px";
            let bombs = this.numberOfBombs(row, col, boardBombs);
            if (bombs > 0 && !bool) {
                square.innerText = "" + bombs;
                square.style.color = this.numColor(bombs);
                stopSearching = true;
            }
            return stopSearching;
        }

        // set bomb numbers
        setBombNumber(bombs, square) {
            square.innerText = "" + bombs;
            square.appendChild(p);
            square.style.color = this.numColor(bombs);
        }

        // create a square
        createSquare() {
            for (let i = 0; i < this.row; i++) {
                const row1 = document.createElement("div");
                row1.setAttribute("class", "row");
                row1.setAttribute("id", `${i}`)
                for (let j = 0; j < this.column; j++) {
                    const square = document.createElement("div");
                    square.setAttribute("class", "square");
                    square.setAttribute("tabindex", "-1");
                    square.setAttribute("id", `${j}`);
                    row1.appendChild(square);
                }
                this.board.appendChild(row1);
            }
            this.setSizeOfSquares(this.column);
        }

        //set size of squares depending on viewport
        setSizeOfSquares(rowBombCount) {
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            let widthAvailable = vw - 40;
            let squareWidthAndHeight = Math.min(widthAvailable / rowBombCount, 30);
            for (let i = 0; i < this.squares.length; i++) {
                this.squares[i].style.width = squareWidthAndHeight + "px";
                this.squares[i].style.height = squareWidthAndHeight + "px";
                this.squares[i].style.borderWidth = Math.floor(squareWidthAndHeight / 10) + "px";
                this.squares[i].style.fontSize = Math.floor(squareWidthAndHeight * 2 / 5) + "px";
            }
        }

        //percentage of cleared
        percentageCleared() {
            let countOfClicked = document.getElementsByClassName("square-clicked").length;
            return ((countOfClicked / this.countOfClear) * 100).toFixed(2);
        }

        //random bomb locations
        randomBombLocations(lengths) {
            return Math.floor(Math.random() * lengths);
        }

        // setting windows to invisible
        hide() {
            for (let i = 1; i < this.mainContainer.length; i++) {
                this.mainContainer[i].style.display = "none";
            }
        }

        // ----------------------- TOUCH AND CLICK EVENTS -----------------------

        // level selector
        selectLevel() {
            for (let i = 0; i < this.levels.length; i++) {
                this.levels[i].addEventListener("click", e => {
                    this.difficulty(e.target.innerText);
                    this.reset();
                });
            }
        }

        // double click square to clear
        addDoubleClick(square) {
            square.addEventListener("dblclick", e => {
                if (e.target.classList.contains("square-clicked")) {
                    if (e.target.innerText == this.numberOfBombs(parseInt(e.target.parentNode.id), parseInt(e.target.id), this.boardFlags)) {
                        this.clearSurrounding(parseInt(e.target.parentNode.id), parseInt(e.target.id), this.board, this.boardBombs, true);
                        this.winner(this.squaresClicked);
                    }
                }
            });
        }

        // changing smiley on mousedown/ touchstart event
        addMouseDownUpEventListener(square) {
            square.addEventListener("mousedown", e => {
                if (e.target) {
                    this.resetBtn.removeChild(this.resetBtn.firstChild)
                    let smile = new Image();
                    smile.src = "./img/4-reset-2.png";
                    smile.style.maxWidth = "100%";
                    this.resetBtn.appendChild(smile);
                }
            });
            square.addEventListener("mouseup", e => {
                if (e.target) {
                    this.resetBtn.removeChild(this.resetBtn.firstChild)
                    let smile = new Image();
                    smile.src = "./img/4-reset-1.png";
                    smile.style.maxWidth = "100%";
                    this.resetBtn.appendChild(smile);
                }
            });
        }

        // instructions button
        instructionsClicks() {
            this.instructionBtn.addEventListener("click", e => {
                this.instructions.style.display = "flex";
                this.overlay[0].style.display = "flex";
            });
            this.returnBtn.addEventListener("click", e => {
                this.overlay[0].style.display = "none";
                this.instructions.style.display = "none";
            });
        }

        // change mode
        modeClick() {
            this.modeBtn.addEventListener("click", e => {
                this.isFlaggingMode = !this.isFlaggingMode;
            });
        }

        // flag and unflag squares
        addRightClickEventListener(square) {
            square.addEventListener("contextmenu", e => {
                e.preventDefault();
                if (this.isFlaggingMode) {
                    this.clearCLickLogic(e)
                } else {
                    this.flagClickLogic(e)
                }
            });
        }

        addLeftCLickEventListener(square) {
            square.addEventListener("click", e => {
                if (this.isFlaggingMode) {
                    this.flagClickLogic(e)
                } else {
                    this.clearCLickLogic(e)
                }
            });
        }

        clearCLickLogic(e) {
            // stops clicking on flagged squares
            if (e.target.parentNode.classList.contains("flag"))
                return;
            if (e.target.classList.contains("square-clicked"))
                return;
            //First turn logic
            if (this.firstTurn) {
                this.timer = setInterval(e => {
                    this.time++;
                    document.getElementById("timer").innerHTML = ("000" + this.time).slice(-3);
                }, 1000);
                this.startTime = Date.now();
                this.firstTurn = false;
            }
            // lose condition, and carry on condition, need to add board reset sort of function
            if (this.boardBombs[e.target.parentNode.id][e.target.id] == 1) {
                this.loser(e.target);
            } else {
                this.clearSurrounding(parseInt(e.target.parentNode.id), parseInt(e.target.id), this.board, this.boardBombs, false);
                this.winner(this.squaresClicked);
            }
        }

        flagClickLogic(e) {
            if (e.target.parentNode.classList.contains("flag")) {
                this.boardFlags[e.target.parentNode.parentNode.id][e.target.parentNode.id] = 0;
                this.flagCount--;
                e.target.parentNode.setAttribute("class", "square");
                e.target.parentNode.removeChild(e.target.parentNode.firstChild);
                e.target.setAttribute("class", "square");
                document.activeElement.blur();
                this.bombCount();
            } else if (e.target.classList.contains("square")) {
                this.boardFlags[e.target.parentNode.id][e.target.id] = 1;
                this.flagCount++;
                e.target.setAttribute("class", "flag");
                let flag = new Image();
                flag.src = "./img/flag.png";
                flag.style.maxWidth = "100%";
                e.target.appendChild(flag);
                this.bombCount();
            }
        }

        // ----------------------- Start of grid creating logic -----------------------
        //create bombboard to me replaced
        createBottomLayer() {
            let count = this.bombs;
            for (let i = 0; i < this.row; i++) {
                this.boardBombs.push([]);
                this.boardFlags.push([]);
                for (let j = 0; j < this.column; j++) {
                    this.boardBombs[i].push(0);
                    this.boardFlags[i].push(0);
                }
            }
            while (count > 0) {
                let rowBomb = this.randomBombLocations(this.row);
                let columnBomb = this.randomBombLocations(this.column);

                if (this.boardBombs[rowBomb][columnBomb] === 0) {
                    this.boardBombs[rowBomb][columnBomb] = 1;
                    count--;
                }
            }
        }

        // main function for interacting with the board
        createGrid() {
            this.hide();
            this.createSquare();
            for (let i = 0; i < this.squares.length; i++) {
                this.addLeftCLickEventListener(this.squares[i]);
                this.addRightClickEventListener(this.squares[i]);
                this.addDoubleClick(this.squares[i]);
                this.addMouseDownUpEventListener(this.squares[i]);
            }
            // instructions button
            this.instructionsClicks();
            // mode button
            this.modeClick();
        }

        // ----------------------- WIN AND LOSE LOGIC -----------------------
        // win condition Change Overlay here
        winner(board) {
            if (board.length == this.countOfClear) {
                let winning = document.getElementById("winning");
                let timeText = document.getElementById("time-text");
                let newGame = document.getElementById("new-game");
                winning.style.display = "block";
                this.overlay[1].style.display = "flex";

                let totalTime = (Date.now() - this.startTime) / 1000;

                timeText.innerText = `Your time was: ${totalTime.toFixed(2)} seconds`;
                this.resetBtn.removeChild(this.resetBtn.firstChild)
                let smile = new Image();
                //let audio = new Audio("./audio/winner.mp3");
                //audio.play();
                smile.src = "./img/4-reset-3.png";
                smile.style.maxWidth = "100%";
                this.resetBtn.appendChild(smile);
                clearInterval(this.timer);
                this.score = this.time;
                newGame.addEventListener("click", e => {
                    winning.style.display = "none";
                    this.overlay[1].style.display = "none";
                    this.reset;
                });
            }
        }
        // lose condition
        loser(cell) {
            let losing = document.getElementById("losing");
            let percentCleared = document.getElementById("percent-cleared");
            percentCleared.innerText = `Percentage Cleared: ${this.percentageCleared()}%`;
            let newGame = document.getElementById("new-game-lose");
            clearInterval(this.timer);
            cell.setAttribute("class", "bomb");
            let mine = new Image();
            //let audio = new Audio("./audio/bomb.mp3");
            //audio.play();
            mine.src = "./img/bomb.png";
            mine.style.maxWidth = "100%";
            this.resetBtn.removeChild(this.resetBtn.firstChild)
            let smile = new Image();
            smile.src = "./img/4-reset-4.png";
            smile.style.maxWidth = "100%";
            this.resetBtn.appendChild(smile);
            cell.appendChild(mine);
            losing.style.display = "flex";
            this.overlay[2].style.display = "flex";
            newGame.addEventListener("click", e => {
                losing.style.display = "none";
                this.overlay[2].style.display = "none";
                this.reset;
            });
        }

    } // end of Minesweeper class

    //initialise game
    let mines = new MineSweeper();
    easy = document.getElementById("easy");
    medium = document.getElementById("medium");
    hard = document.getElementById("hard");
    buttons = [easy, medium, hard]

    mines.selectLevel();
    mines.createBottomLayer();
    mines.createGrid();
    //mines.resetButton();
}); // end of dom