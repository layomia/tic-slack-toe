// ticTacToe.js

var Game = require("../models/game");

var slackToken = "nqa4K3GFPfj2ULmjRCpEKuXS";
var slackTeamIDs = [""];

module.exports = function(app, express) {
	
	var ticTacToeRouter = express.Router();
	
	// middleware to use for all requests
	ticTacToeRouter.use(function(req, res, next) {
		// authenticate request here
		var token = req.body.token || req.param('token') || req.headers['x-access-token'];
		
		if (token) {
			if (token != slackToken) {
				// return appropriate error
				return res.status(403).send({
					success: false,
					message: 'Failed to authenticate token.'
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
	
	//root response for tictactoe
	//accessed at https://layomia-ttt.herokuapp.com/
	ticTacToeRouter.get("/", function(req, res) {
		res.json({ message: "Welcome to TicTacToe!" });
	});
	
	ticTacToeRouter.route("/play")
	
		.post(function(req, res) {
			console.log(req.body);
			res.json({ 
				'response_type': "in_channel",
				'text': "Wassappppp!"
			});	
		})

	return ticTacToeRouter;
}