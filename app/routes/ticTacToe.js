// ticTacToe.js

var Game = require("../models/game");

module.exports = function(app, express) {
	
	var apiRouter = express.Router();
	
	// middleware to use for all requests
	apiRouter.use(function(req, res, next) {
		// authenticate users here
		var token = req.body.token || req.param('token') || req.headers['x-access-token'];
		
		if (token) {
			if (token != "nqa4K3GFPfj2ULmjRCpEKuXS") {
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
				message: 'Failed to authenticate token.'
			});		
		}
	});
	
	//root response for api
	//accessed at -url-/
	apiRouter.get("/", function(req, res) {
		res.json({ message: "Welcome to TicTacToe!" });
	});
	
	apiRouter.route("/play")
	
		.post(function(req, res) {
			res.json({ message: "Wassappppp!" });	
		})

	return apiRouter;
}