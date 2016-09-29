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

var responses = {
	'invalidCommand': { 
		'text': "Invalid command",
		'attachments': [{'text':"Try `/ttt help`."}]
	}, 
	'invalidCreate': { 
		'text': "A game is currently in play",
		'attachments': [{'text':"`/ttt quit` to quit game."}]
	}, 
	'invalidCreateCoPlayer': { 
		'text': "Invalid `create` command",
		'attachments': [{'text':"`/ttt create @username`. Remember, you can't challenge yourself!"}]
	}, 
};

// this function assumes that the user_name for both players will not change while a game is being played
function createGame(user, args) {
	console.log(games);
	// if games is not empty i.e, return 
	if (Object.keys(games).length != 0) {
		//games['Steve'].makeMove()
		return responses['invalidCreate'];
	} else if (args.length != 1) {
		return responses['invalidCreateCoPlayer'];
	}
	
	var p1 = '@' + user;
	var p2 = args[0];
	
	if (!validUserName(p2) || p1 == p2) {
		return responses['invalidCreateCoPlayer'];
	}
	
	var game = new Game(p1, p2);
	
	games[p1] = game;
	games[p2] = game;
	
	var boardStatus = game.displayBoard();
	return {
		'response_type': "in_channel",
		'text': boardStatus,
		'attachments': [{'text':"To make move, `/ttt play (board position)`."}]
	};
}

function makeMove(user, args) {
	return {};
}

function viewBoardStatus(user, args) {
	return {};
}

function quitGame(user, args) {
	return {};
}

function help(user, args) {
	return {};
}

var commands = {
	'create': createGame,
	'move': makeMove,
	'view': viewBoardStatus, 
	'quit': quitGame,
	'help': help
}

function executeCommand(reqBody) {
	var user = reqBody.user_name;
	var commandArray = reqBody.text.split(" ");
	var command = commandArray[0];
	var args = commandArray.splice(1);
	
	var func = commands[command];

	if (func === undefined) {
		return responses['invalidCommand'];
	}
	
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