// ticTacToe.js

// get function to help parse and execute user command
var helper = require('./helper');

var DELAY_AMOUNT = 500;

module.exports = function(app, express) {
	var ticTacToeRouter = express.Router();
	
	/*
	middleware to use for all requests
	Request authentication is done here
	*/
	ticTacToeRouter.use(function(req, res, next) {
		var token = req.body.token || req.param('token') || req.headers['x-access-token'];
		var team_id = req.body.team_id || req.param('team_id') || req.headers['x-access-team_id'];
		
		if (token && team_id) {
			if (token != process.env.TOKEN_FROM_SLACK) {
				return res.status(403).send({
					success: false,
					message: 'Failed to authenticate token.'
				});
			} else if (team_id != process.env.TEAM_ID) {
				return res.status(403).send({
					success: false,
					message: 'Failed to authenticate team_id.'
				});
			} else {
				next();
			} 
		} else {
			return res.status(403).send({
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
			/*
			find out whether list of people in team has been loaded.
			if not, load them.
			users will always be loaded after first request.
			*/
			usersLoaded = helper.getUserListSize() > 0;
			if (!usersLoaded){
				helper.setUserList();
			}
			
			/*
			add slight delay to response if list of people in the team has not been loaded
			this allows helper.setUserList() to complete execution before proceeding.
			This approach is rather 'hacky' and can be improved on with JavaScript promises.
			*/
			setTimeout(function() {
				commandResponse = helper.executeCommand(req.body);	
				res.json(commandResponse);	
			}, (usersLoaded ? 0 : DELAY_AMOUNT));
		})

	// export module for use in server.js
	return ticTacToeRouter;
}