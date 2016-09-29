//  game.js

// Constructor
function Game(p1, p2) {
	this.active = true;
	this.rows = 3;
	this.columns = 3;
	this.board = [['1','2','3'], ['4','5','6'], ['7','8','9']];
	this.players = {0:p1, 1:p2};
	this.x = 'x';
	this.o = 'o';
	this.current = 0;
	this.numMoves = 0;
}

// class methods

// reinitialize board for new game
Game.prototype.reinitialize = function() {
	this.active = true;
	this.board = [['1','2','3'], ['4','5','6'], ['7','8','9']];
	this.numMoves = 0;
}

// make move
Game.prototype.makeMove = function(move) {
	// reinitialize board if user restarts game
	if (!this.active) {
		this.reinitialize();
	}
	
	var i = -1;
	var j = -1;
	var end = "";
	
	for (var k = 1; k <= move; k++) {
		if ((k - 1) % 3 == 0) {
			i++;
			j = -1;
		}
		j++;
	}
	
	// if move has already been made at this position
	if (this.board[i][j] == this.x || this.board[i][j] == this.o){
		return "";
	}
	
	// make move at given position
	this.board[i][j] = (this.current == 0) ? this.x : this.o;
	
	// increment number of moves made
	this.numMoves++;
	
	// check for win or draw
	// if endPrompt == "", game continues
	var endPrompt = this.checkGameEnd();
	
	// toggle current player
	this.current = (this.current + 1) % 2;
	
	// get board display. true argument indicates that it should omit
	// next player prompt
	var boardDisplay = this.displayBoard(endPrompt != "");
	
	return endPrompt + boardDisplay;
};

// display board
// when gameEnd is true, it displays the board without next player prompt,
// otherwise, it displays baord with next player prompt
Game.prototype.displayBoard = function(gameEnd) {
	var board = "";
	
	var nextMove = " is to make a move next. " + "\n";
	var nextGame = " is to start the next game. " + "\n";
	
	var prompt = "\n" + this.players[this.current] + (gameEnd ? nextGame : nextMove);
	
	for (var i = 0; i < this.rows; i++){
        for (var j = 0; j < this.columns; j++){
            board += " " + "---";
        }
        board += "\n";
        for (var j = 0; j < this.columns; j++){
            board += "| " + this.board[i][j];
            board += " ";
        }
        board += "|\n"
    }
    
    for (var j = 0; j < this.columns; j++){
        board += " " + "---";
    }
    
    board += "\n";
	
	return board + prompt;
};

// this function finds out whether a win or a draw has occured
// this function also changes winning configuration to upper case to highlight winning move
Game.prototype.checkGameEnd = function() {
	var foundWin = false;
	
	// possible winning combinations for 3 * 3 matrix
	var possibilities = [];
	// add row and column winning combinations
	for (var i = 0; i < 3; i++) {
		// add rows
		possibilities.push(this.board[i])
		// add columns
		var column = []
		for (var j = 0; j < 3; j++) {
			column.push(this.board[j][i]);
		}
		possibilities.push(column);
	}
	// add diagonals
	possibilities.push([this.board[0][0], this.board[1][1], this.board[2][2]]);
	possibilities.push([this.board[0][2], this.board[1][1], this.board[2][0]]);
	
	// check each 
	for (var p in possibilities) {
		var poss = new Set(possibilities[p]);
		// winning configuration detected
		if (poss.size == 1 && (possibilities[p][0] == this.x || possibilities[p][0] == this.o)) {
			// change winning configuration to upper case to highlight winning move
			for (var po in possibilities[p]) {
				possibilities[p][po] = possibilities[p][po].toUpperCase();
			}
			foundWin = true;
		}
	}
	
	// if win not detect and board isn't full
	if (!foundWin && this.numMoves != 9) {
		return "";
	}
	
	this.active = false;
	
	return foundWin ? this.players[this.current] + ", you win!\n\n" : "Draw game!\n\n";
}
	
// export the class
module.exports = Game;