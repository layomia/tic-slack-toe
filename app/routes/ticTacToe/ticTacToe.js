// ticTacToe.js

// get function to help parse and execute user command
var helper = require('./helper');

var slackToken = "nqa4K3GFPfj2ULmjRCpEKuXS";
var slackTeamIDs = ["T2G3MTK3K", "T0001"];

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
			commandResponse = helper.executeCommand(req.body);	
			res.json(commandResponse);	
		})

	return ticTacToeRouter;
}