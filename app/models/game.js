//  game.js

var x = 'X';
var o = 'O';

// Constructor
function Game(p1, p2) {
	this.rows = 3
	this.columns = 3
	this.board = [['1','2','3'], ['4','5','6'], ['7','8','9']];
	this.players = {0:p1, 1:p2};
	this.current = 1;
	this.winner = null;
}

// class methods

// (re-)initialize board for new game
Game.prototype.initialize = function(p1, p2) {
	
}

// make move
Game.prototype.makeMove = function(move) {
	// if 
};

// display board
Game.prototype.displayBoard = function() {
	var board = "";
	var prompt = "It is the turn of " + this.players[this.current] + "\n";
	
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


// export the class
module.exports = Game;