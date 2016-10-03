var Game = require('../../models/game');

/*
this object maps channel_ids to Game() objects. One channel maps to one game.
for an extension where multiple games can be played in one channel,
perhaps a mapping from channels_id's to sets of Game() objects should be fine.
One channel would map to a Set of games.
*/
var games = {};

// This is a Set that will contain the list of usernames of the team
var userList = new Set();

// configuring slack web client to get list of usernames in team
var WebClient = require('@slack/client').WebClient;
var token = process.env.TOKEN_TO_SLACK || '';

// this contains all valid commands and their associated functions
var commands = {
	'create': createGame,
	'move': makeMove,
	'view': viewBoardStatus, 
	'end': endGame,
	'rules': showRules,
	'help': help
};


// responses invoked by invalid commands
var errorResponses = {
	// invalid create commands
	'invalidCreate':{'mainText':"Invalid `create` syntax.",'supportingText':"`/ttt create @username`. Remember, you can't challenge yourself!"},
	'invalidCreate-NonexistentUser':{'mainText':"You can't challenge someone that is not on the team.",'supportingText':"Also, you can't challenge @slackbot, @channel, and @everyone."},
	'invalidCreate-GameExists':{'mainText':"Invalid `create` command. A game is already in play",'supportingText':"`/ttt end` to end game."},
	
	// invalid move commands
	'invalidMove':{'mainText':"Invalid `move` syntax.",'supportingText':"`/ttt move [board position]`"},
	'invalidMove-NotPlaying':{'mainText':"You are not a part of the current game.",'supportingText':"`/ttt end` to end game."},
	'invalidMove-OutOfTurn':{'mainText':"It is not your turn.",'supportingText':"Ping your opponent to make his move."},
	'invalidMove-PositionTaken':{'mainText':"That position is taken.",'supportingText':"Try again. :)"},
	
	// invalid view commands
	'invalidView':{'mainText':"Invalid `view` syntax.",'supportingText':"`/ttt view`"},
	
	// invalid end commands
	'invalidEnd':{'mainText':"Invalid `end` syntax.",'supportingText':"`/ttt end`"},
	
	// invalid help commands
	'invalidHelp':{'mainText':"Invalid `help` syntax.",'supportingText':"`/ttt help`"},
	
	// general invalid commands
	'invalidCommand':{'mainText':"Invalid command",'supportingText':"Try `/ttt help`."},
	'invalidCommand-NoGameExists':{'mainText':"No game is being played in this channel.",'supportingText':"`/ttt create @username` to start game."},
};

// make executeCommand available for use by ticTacToe router
module.exports = {
	// return size of userList
	getUserListSize: function() {
		return userList.size;
	},
	// load list of usernames for team
	setUserList: function() {
		var web = new WebClient(token);
		web.users.list(function userListCb(err, info) {
			if (err) {
				console.log('Error:', err);
			} else {
				for (var user in info['members']) {
					var username = '@' + info['members'][user]['name'];
					userList.add(username);
				}
			}
		});
	},
	// attempt to execute command issued by user
	executeCommand: function(reqBody) {
		var user = reqBody.user_name;
		var channel = reqBody.channel_id;
		var commandArray = reqBody.text.split(" ");
		var command = commandArray[0];
		var args = commandArray.splice(1);

		var func = commands[command];

		if (func === undefined) {
			errorResponse = errorResponses['invalidCommand'];
			return invalidResponse(errorResponse['mainText'], errorResponse['supportingText']);
		}

		// run appropriate command
		return func(user, channel, args);
	}
};

/*
COMMAND FUNCTIONS
One of the following functions is called when a user enters one of the above commands
*/

/*
this function creates a new game in a channel
this function assumes that user_name for both players will not change while a game is being played
*/
function createGame(user, channel, args) {
	// build @ usernames for both players
	var p1 = '@' + user;
	var p2 = args[0];
	
	// object to hold error response, if any are found
	var errorResponse = null;
	
	// invalid arguments
	if (args.length != 1) {
		errorResponse = errorResponses['invalidCreate'];
	}
	/*
	reject invalid p2 username. we know for sure that p1 is valid.
	also reject p1 attempting to challenge himself.
	*/
	else if (!validUserName(p2) || p1 == p2) {
		errorResponse = errorResponses['invalidCreate'];
	}
	// reject nonexistent users
	else if (!userExists(p2)) {
		errorResponse = errorResponses['invalidCreate-NonexistentUser'];
	}
	// reject request if a game is already in play in the specified channel
	else if (games[channel] != undefined) {
		errorResponse = errorResponses['invalidCreate-GameExists'];
	}
	
	// return error response if one was found
	if (errorResponse != null) {
		return invalidResponse(errorResponse['mainText'], errorResponse['supportingText']);
	}
	
	// create new game
	var game = new Game(p1, p2);
	games[channel] = game;

	/*
	displayBoard returns the status of the board.
	it is passed this false value to specify that this display doesn't follow the end of a game
	*/
	var boardStatus = game.displayBoard(false);

	// return prompt that game has begun
	return {
		'response_type': "in_channel",
		'text': boardStatus,
		'attachments': [{'text':"To make move, `/ttt move [board position]`."}]
	};	
}

// this function is called when a user enters the 'make' command
function makeMove(user, channel, args) {
	// construct player @username
	var p = '@' + user;
	
	// object to hold error response, if any are found
	var errorResponse = null;
	
	// object to hold board's response to player move
	var moveResponse = null;
	
	// reject invalid move command syntax
	if (args.length != 1 || !validMove(args[0])) {
		errorResponse = errorResponses['invalidMove'];
	} 
	// reject move in channel with no game
	else if (games[channel] === undefined) {
		errorResponse = errorResponses['invalidCommand-NoGameExists'];
	} 
	// reject user trying to make move in game they are not a part of
	else if (games[channel].players[0] != p && games[channel].players[1] != p) {
		errorResponse = errorResponses['invalidMove-NotPlaying'];
	}
	// reject user trying to make move when it is not their turn
	else if (games[channel].players[games[channel].current] != p){
		errorResponse = errorResponses['invalidMove-OutOfTurn'];
	}
	// get boards response to player move
	else {
		moveResponse = games[channel].makeMove(parseInt(args[0]));
		// reject move on tile that has been played on
		if (moveResponse == "") {
			errorResponse = errorResponses['invalidMove-PositionTaken'];
		}
	}
	
	// return error response if one was found
	if (errorResponse != null) {
		return invalidResponse(errorResponse['mainText'], errorResponse['supportingText'])
	}
	
	// everything is good
	return {
		'response_type': "in_channel",
		'text': moveResponse,
	};
}

// this function allows channel user to view the board and see who is to play next
function viewBoardStatus(user, channel, args) {
	// object to hold error response, if any are found
	var errorResponse = null;
	
	// reject any arguments passed
	if (args.length > 0) {
		errorResponse = errorResponses['invalidView'];
	}
	// reject invalid request for non-existent games
	else if (games[channel] === undefined) {
		errorResponse = errorResponses['invalidCommand-NoGameExists'];
	}
	
	// return error response if one was found
	if (errorResponse != null) {
		return invalidResponse(errorResponse['mainText'], errorResponse['supportingText'])
	}
	
	// get specified game
	var game = games[channel];
	
	// get board status. false here tells the function to not behave like the game just ended
	var boardStatus = game.displayBoard(false);
	
	// everything is good
	return {
		'text': boardStatus,
		'attachments': [{'text':"To make move, `/ttt move (board position)`."}]
	};
}

/*
this function ends a game in play if one is indeed in play.
if no game is in play, it sends an error response to the user
*/
function endGame(user, channel, args) {
	// object to hold error response, if any are found
	var errorResponse = null;
	
	// reject any arguments passed
	if (args.length > 0) {
		errorResponse = errorResponses['invalidEnd']
	}
	// reject request for a non-existent game
	else if (games[channel] === undefined) {
		errorResponse = errorResponses['invalidCommand-NoGameExists'];
	}
	
	// return error response if one was found
	if (errorResponse != null) {
		return invalidResponse(errorResponse['mainText'], errorResponse['supportingText'])
	}
	
	// end game
	delete games[channel];
	
	// everything is good
	return {
		'response_type': "in_channel",
		'text': '@' + user + " has ended the game!",
		'attachments': [{'text':"To start new game, `/ttt create @username`."}]
	};
}

// This function presents the list of game rules to the user
function showRules(user, channel, args) {
	// object to hold error response, if any are found
	var errorResponse = null;
	
	// reject any arguments
	if (args.length > 0) {
		errorResponse = errorResponses['invalidShow'];
	}
	
	// return error response if one was found
	if (errorResponse != null) {
		return invalidResponse(errorResponse['mainText'], errorResponse['supportingText'])
	}
	
	var gameRules = "1. You can't challenge someone who is not on your team.\n2. You can't play multiple games in the same channel.\n3. No player can change their username (not during play, not ever :|).\n4. Any team member can end any game, even those they are not a part of.";
	
	// everything is good
	return {
		'text': "This game follows all the rules of Tic-Tac-Toe plus the following\n" + gameRules
	};
}

// This function presents the list of valid commands to the user
function help(user, channel, args) {
	// object to hold error response, if any are found
	var errorResponse = null;
	
	// reject any arguments
	if (args.length > 0) {
		errorResponse = errorResponses['invalidHelp'];
	}
	
	// return error response if one was found
	if (errorResponse != null) {
		return invalidResponse(errorResponse['mainText'], errorResponse['supportingText'])
	}
	
	var commandOptions = "Start game: `/ttt create [@username]`\nMake move: `/ttt move [board position]`\nView game status: `/ttt view`\nEnd game: `/ttt end`\nSee Rules: `/ttt rules`\nGet command help: `/ttt help`";
	
	// everything is good
	return {
		'text': commandOptions
	};
}

/*
ADDITIONAL FUNCTIONS
*/

/*
this function returns an ephemeral prompt to a user who has entered either an invalid command or a command that is not allowed
e.g. making a move when it is not your turn or trying to create
a game in a channel that already has a game playing.
*/
function invalidResponse(text, attachmentText) {
	return { 
		'text': text,
		'attachments': [{'text':attachmentText}]
	}
}

// this function checks whether a challenged user exists in the team
function userExists(user) {
	var invalidUsernames = new Set(['@slackbot', '@channel', '@everyone']);
	
	// reject any of the above usernames
	if (invalidUsernames.has(user)) {
		return false;
	}
	// if for some reason, userList doesn't contain list of users, let the username slide
	else if (userList.size == 0) {
		return true;
	}

	return userList.has(user);	
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