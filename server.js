//  server.js

// call packages
var express    = require("express");
var app        = express(); 
var bodyParser = require("body-parser");
var morgan     = require("morgan");

// app Configuration
// use body parser to grab information from POST requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// configure app to handle CORS requests
app.use(function(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
	next();
});

// log all requests to the console
app.use(morgan('dev'));

// Initialize app
var server = app.listen(process.env.PORT || 8080, function () {
	var port = server.address().port;
	console.log("App now running on port", port);
});

// TicTacToe Route
var tttRoutes  = require("./app/routes/ticTacToe/ticTacToe")(app, express);
app.use("/tictactoe", tttRoutes);

// basic route for home page
app.get("/", function(req, res) {
	res.send("Welcome to ttt")
});