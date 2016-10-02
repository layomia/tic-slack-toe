// ticTacToe.js

// get function to help parse and execute user command
var helper = require('./helper');

module.exports = function(app, express) {
	var ticTacToeRouter = express.Router();
	
	// middleware to use for all requests
	ticTacToeRouter.use(function(req, res, next) {
		// authenticate request here
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
			commandResponse = helper.executeCommand(req.body);	
			res.json(commandResponse);	
		})

	return ticTacToeRouter;
}