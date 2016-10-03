var request       = require("request"),
	assert        = require('assert'),
	ticTacToe     = require("../server.js"),
	baseUrl       = "http://localhost:8080/"

// Root Server Tests
describe("Welcome Server", function() {
  describe("GET /", function() {
	  it("returns status code 200", function(done) {
		  request.get(baseUrl, function(error, response, body) {
        	assert.equal(200, response.statusCode);
			done();
		  });
	  });
	  
	  it("returns Welcome to ttt", function(done) {
		 request.get(baseUrl, function(error, response, body) {
			 assert.equal("Welcome to ttt", body);
			 ticTacToe.closeServer();
			 done();
		 }) 
	  });
  });
});