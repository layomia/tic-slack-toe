var Game = require("../../models/game");

// this object maps channel_id's to Game() objects. One channel maps to one game.
// for an extension where multiple games can be played in one channel, perhaps a mapping
// from channels_id's to sets of Game() objects. One channel would map to a Set of games.
var games = {};

// this contains all valid commands and their associated functions
var commands = {
	'create': createGame,
	'move': makeMove,
	'view': viewBoardStatus, 
	'end': endGame,
	'help': help
};

// make executeCommand available for use by ticTacToe router
module.exports = {
	executeCommand: function(reqBody) {
		var user = reqBody.user_name;
		var channel = reqBody.channel_id;
		var commandArray = reqBody.text.split(" ");
		var command = commandArray[0];
		var args = commandArray.splice(1);

		var func = commands[command];

		if (func === undefined) {
			return invalidResponse("Invalid command", "Enter `/ttt help` for commands.")
		}

		// run appropriate command
		return func(user, channel, args);
	}
};

// Command Functions
// One of the following functions is called when a user enters one of the above commands

// this function creates a new game in a channel
// this function assumes that the user_name for both players will not change while a game is being played
function createGame(user, channel, args) {
	// if a game is already in play in the specified channel, return
	if (args.length != 1) {
		return invalidResponse("Invalid `create` command", "`/ttt create @username`. Remember, you can't challenge yourself!");
	} else if (games[channel] != undefined) {
		return invalidResponse("This channel already has a game in play.", "`/ttt end` to end game.");
	}
	
	var p1 = '@' + user;
	var p2 = args[0];
	
	if (!validUserName(p2) || p1 == p2) {
		return invalidResponse("Invalid `create` command", "`/ttt create @username`. Remember, you can't challenge yourself!");
	}
	
	var game = new Game(p1, p2);
	
	games[channel] = game;
	
	// this function call returns the status of the board. It is passed this false value
	// to specify that this display doesn't follow the end of a game
	// i.e. the function should let the users know who is next to play
	var boardStatus = game.displayBoard(false);
	
	return {
		'response_type': "in_channel",
		'text': boardStatus,
		'attachments': [{'text':"To make move, `/ttt move (board position)`."}]
	};
}

// this function is called when a user enters the 'make' command
function makeMove(user, channel, args) {
	// construct player @username
	var p = '@' + user;
	
	// reject invalid move command syntax
	if (args.length != 1 || !validMove(args[0])) {
		return invalidResponse("Invalid move syntax.", "`/ttt move (board position)` to make move.");
	} 
	// reject move in channel with no game
	else if (games[channel] === undefined) {
		return invalidResponse("No game is being played in this channel.", "`/ttt create @username` to start game.");
	} 
	// reject user trying to make move in game they are not a part of
	// TO-DO: restructure how players are held in game object
	else if (games[channel].players[0] != p && games[channel].players[1] != p) {
		return invalidResponse("You are not a part of the current game.", "`/ttt end` to end game.");
	}
	// reject user trying to make move when it is not their turn
	else if (games[channel].players[games[channel].current] != p){
		return invalidResponse("It is not your turn.", "Ping your opponent to make his move.");
	}
	
	// get boards response to player move
	var moveResponse = games[channel].makeMove(parseInt(args[0]));
	
	if (moveResponse == "") {
		return invalidResponse("That position is taken.", "Try again. :)");
	}
	
	return {
		'response_type': "in_channel",
		'text': moveResponse,
	};
}

function viewBoardStatus(user, channel, args) {
	// reject any arguments passed
	if (args.length > 0) {
		return invalidResponse("Invalid command syntax", "Try `/ttt view`");
	}
	// reject invalid request for non-existent games
	else if (games[channel] === undefined) {
		return invalidResponse("No game is being played in this channel.", "`/ttt create @username` to start game.");
	}
	
	// get specified game
	var game = games[channel];
	
	// get board status. false here tells the function to not behave like the game just ended
	var boardStatus = game.displayBoard(false);
	
	return {
		'text': boardStatus,
		'attachments': [{'text':"To make move, `/ttt move (board position)`."}]
	};
}


function endGame(user, channel, args) {
	// reject any arguments passed
	if (args.length > 0) {
		return invalidResponse("Invalid command syntax", "Try `/ttt end`");
	}
	// reject request for a non-existent game
	else if (games[channel] === undefined) {
		return invalidResponse("No game is being played in this channel.", "`/ttt create @username` to start game.");
	}
	
	// end game
	delete games[channel];
	
	return {
		'response_type': "in_channel",
		'text': '@' + user + " has ended the game!",
		'attachments': [{'text':"To start new game, `/ttt create @username`."}]
	};
}

function help(user, channel, args) {
	if (args.length > 0) {
		return invalidResponse("Invalid command syntax", "Try `/ttt help`");
	}
	return {
		'text': "Start game: `/ttt create @username`\nMake move: `/ttt move (board position)`\nView game status: `/ttt view`\nEnd game: `/ttt end`\nGet command help: `/ttt help`"
	};
}

// Additional Helper Functions

// this function returns an ephemeral prompt to a user who has entered either an invalid command
// or a command that is not allowed e.g. making a move when it is not your turn or trying to create
// a game in a channel that already has a game playing.
function invalidResponse(text, attachmentText) {
	return { 
		'text': text,
		'attachments': [{'text':attachmentText}]
	}
}

// this function checks if a string is a valid Slack username
function validUserName(str) {
	if (!(str.length > 1 && str[0] == '@')){
		return false;
	}
	var userNameRegex = /^[a-z0-9][a-z0-9._-]*$/;
	return userNameRegex.test(str.substring(1))
}

// this function checks if a string is a valid representation of an integer between 1 and 9
function validMove(str) {
	var intStr = parseInt(str)
	return intStr != NaN && (intStr >= 1 && intStr <= 9);
}