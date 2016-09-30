// ticTacToe.js

var Game = require("../models/game");

var slackToken = "nqa4K3GFPfj2ULmjRCpEKuXS";
var slackTeamIDs = ["T2G3MTK3K", "T0001"];

// this object maps channel_id's to Game() objects. One channel maps to one game.
// for an extension where multiple games can be played in one channel, perhaps a mapping
// from channels_id's to sets of Game() objects. One channel would map to a Set of games.
var games = {};

function validUserName(str) {
	if (!(str.length > 1 && str[0] == '@')){
		return false;
	}
	
	var userNameRegex = /^[a-z0-9][a-z0-9._-]*$/;
	
	return userNameRegex.test(str.substring(1))
}

function validMove(str) {
	var intStr = parseInt(str)
	return intStr != NaN && (intStr >= 1 && intStr <= 9);
}

// this function returns an ephemeral prompt to a user who has entered either an invalid command
// or a command that is not allowed e.g. making a move when it is not your turn or trying to create
// a game in a channel that already has a game playing.
function inValidResponse(text, attachmentText) {
	return { 
		'text': text,
		'attachments': [{'text':attachmentText}]
	}
}

// this function assumes that the user_name for both players will not change while a game is being played
function createGame(user, channel, args) {
	// if a game is already in play in the specified channel, return
	if (args.length != 1) {
		return inValidResponse("Invalid `create` command", "`/ttt create @username`. Remember, you can't challenge yourself!");
	} else if (games[channel] != undefined) {
		return inValidResponse("This channel already has a game in play.", "`/ttt end` to end game.");
	}
	
	var p1 = '@' + user;
	var p2 = args[0];
	
	if (!validUserName(p2) || p1 == p2) {
		return inValidResponse("Invalid `create` command", "`/ttt create @username`. Remember, you can't challenge yourself!");
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

function makeMove(user, channel, args) {
	// construct player @username
	var p = '@' + user;
	
	// reject invalid move command syntax
	if (args.length != 1 || !validMove(args[0])) {
		return inValidResponse("Invalid move syntax.", "`/ttt move (board position)` to make move.");
	} 
	// reject move in channel with no game
	else if (games[channel] === undefined) {
		return inValidResponse("No game is being played in this channel.", "`/ttt create @username` to start game.");
	} 
	// reject user trying to make move in game they are not a part of
	// TO-DO: restructure how players are held in game object
	else if (games[channel].players[0] != p && games[channel].players[1] != p) {
		return inValidResponse("You are not a part of the current game.", "`/ttt end` to end game.");
	}
	// reject user trying to make move when it is not their turn
	else if (games[channel].players[games[channel].current] != p){
		return inValidResponse("It is not your turn.", "Ping your opponent to make his move.");
	}
	
	// get boards response to player move
	var moveResponse = games[channel].makeMove(parseInt(args[0]));
	
	if (moveResponse == "") {
		return inValidResponse("That position is taken.", "Try again. :)");
	}
	
	return {
		'response_type': "in_channel",
		'text': moveResponse,
	};
}

function viewBoardStatus(user, channel, args) {
	// reject any arguments passed
	if (args.length > 0) {
		return inValidResponse("Invalid command syntax", "Try `/ttt view`");
	}
	// reject invalid request for non-existent games
	else if (games[channel] === undefined) {
		return inValidResponse("No game is being played in this channel.", "`/ttt create @username` to start game.");
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
		return inValidResponse("Invalid command syntax", "Try `/ttt end`");
	}
	// reject request for a non-existent game
	else if (games[channel] === undefined) {
		return inValidResponse("No game is being played in this channel.", "`/ttt create @username` to start game.");
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
		return inValidResponse("Invalid command syntax", "Try `/ttt help`");
	}
	return {
		'text': "Start game: `/ttt create @username`\nMake move: `/ttt move (board position)`\nView game status: `/ttt view`\nEnd game: `/ttt end`\nGet command help: `/ttt help`"
	};
}

var commands = {
	'create': createGame,
	'move': makeMove,
	'view': viewBoardStatus, 
	'end': endGame,
	'help': help
};

function executeCommand(reqBody) {
	var user = reqBody.user_name;
	var channel = reqBody.channel_id;
	var commandArray = reqBody.text.split(" ");
	var command = commandArray[0];
	var args = commandArray.splice(1);
	
	var func = commands[command];

	if (func === undefined) {
		return inValidResponse("Invalid command", "Enter `/ttt help` for commands.")
	}
	
	// run appropriate command
	return func(user, channel, args);
}

module.exports = function(app, express) {
	
	var ticTacToeRouter = express.Router();
	
	// middleware to use for all requests
	ticTacToeRouter.use(function(req, res, next) {
		// authenticate request here
		var token = req.body.token || req.param('token') || req.headers['x-access-token'];
		
		var team_id = req.body.team_id || req.param('team_id') || req.headers['team_id'];
		
		
		if (token && team_id) {
			if (token != slackToken) {
				// return appropriate error
				return res.status(403).send({
					success: false,
					message: 'Failed to authenticate token.'
				});
			} else if (!(slackTeamIDs.indexOf(team_id) > -1)) {
				// return appropriate error
				return res.status(403).send({
					success: false,
					message: 'Failed to authenticate team_id.'
				});
			} else {
				next();
			} 
		} else {
			return res.status(403).send({
				// return appropriate error
				success: false,
				message: 'No token provided.'
			});		
		}
	});
	
	// root response for tictactoe
	// accessed at https://layomia-ttt.herokuapp.com/
	ticTacToeRouter.get("/", function(req, res) {
		res.json({ message: "Welcome to TicTacToe!" });
	});
	
	ticTacToeRouter.route("/play")
	
		.post(function(req, res) {
			commandResponse = executeCommand(req.body);	
			res.json(commandResponse);	
		})

	return ticTacToeRouter;
}