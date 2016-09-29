// ticTacToe.js

var Game = require("../models/game");

var slackToken = "nqa4K3GFPfj2ULmjRCpEKuXS";
var slackTeamIDs = ["T2G3MTK3K", "T0001"];

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

function inValidResponse(text, attachmentText) {
	return { 
		'text': text,
		'attachments': [{'text':attachmentText}]
	}
}

// this function assumes that the user_name for both players will not change while a game is being played
function createGame(user, args) {
	// if games is not empty i.e there are games currently being played, return 
	if (Object.keys(games).length != 0) {
		return inValidResponse("A game is currently in play", "`/ttt end` to end game.");
	} else if (args.length != 1) {
		return inValidResponse("Invalid `create` command", "`/ttt create @username`. Remember, you can't challenge yourself!");
	}
	
	var p1 = '@' + user;
	var p2 = args[0];
	
	if (!validUserName(p2) || p1 == p2) {
		return inValidResponse("Invalid `create` command", "`/ttt create @username`. Remember, you can't challenge yourself!");
	}
	
	var game = new Game(p1, p2);
	
	games[p1] = game;
	games[p2] = game;
	
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

function makeMove(user, args) {
	var p = '@' + user;
	
	if (Object.keys(games).length == 0) {
		return inValidResponse("No game is being played.", "`/ttt create @username` to start game.");
	} else if (games[p] === undefined) {
		return inValidResponse("You are not a part of the current game.", "`/ttt end` to end game.");
	} else if (games[p].players[games[p].current] != p){
		return inValidResponse("It is not your turn.", "Ping your opponent to make his move.");
	} else if (args.length != 1 || !validMove(args[0])) {
		return inValidResponse("Invalid move.", "`/ttt move (board position)` to make move.");
	}
	
	var moveResponse = games[p].makeMove(parseInt(args[0]));
	
	if (moveResponse == "") {
		return inValidResponse("That position is taken.", "Try again. :)");
	}
	
	return {
		'response_type': "in_channel",
		'text': moveResponse,
	};
}

function viewBoardStatus(user, args) {
	// reject invalid request for non-existent games
	if (Object.keys(games).length == 0) {
		return inValidResponse("No game is being played.", "`/ttt create @username` to start game.");
	} 
	// reject any arguments passed
	else if (args.length > 0) {
		return inValidResponse("Invalid command syntax", "Try `/ttt view`");
	}
	
	// get any game in games.
	// For an extension where multiple games can be played in the same channel,
	// the person who sends the request will have to specify the people playing the game he is requesting
	// a status for. This assumes that a person can only play one game. If a person can play multiple games,
	// perhaps exploring game IDs that are public would be a way to go.
	var game = games[Object.keys(games)[0]];
	
	console.log(game);
	
	// get board status. false here tells the function to not behave like the game just ended
	var boardStatus = game.displayBoard(false);
	
	return {
		'text': boardStatus,
		'attachments': [{'text':"To make move, `/ttt move (board position)`."}]
	};
}

function endGame(user, args) {
	// reject invalid request for non-existent games
	if (Object.keys(games).length == 0) {
		return inValidResponse("No game is being played.", "`/ttt create @username` to start game.");
	} 
	// reject any arguments passed
	else if (args.length > 0) {
		return inValidResponse("Invalid command syntax", "Try `/ttt end`");
	}
	
	// remove existing game objects
	games = {};
	
	return {
		'response_type': "in_channel",
		'text': '@' + user + " has ended the game!",
		'attachments': [{'text':"To start new game, `/ttt create @username`."}]
	};
}

function help(user, args) {
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
}

function executeCommand(reqBody) {
	var user = reqBody.user_name;
	var commandArray = reqBody.text.split(" ");
	var command = commandArray[0];
	var args = commandArray.splice(1);
	
	var func = commands[command];

	if (func === undefined) {
		return inValidResponse("Invalid command", "Enter `/ttt help` for commands.")
	}
	
	// run appropriate command
	return func(user, args);
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