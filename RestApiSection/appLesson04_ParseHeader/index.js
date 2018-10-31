/*
 * Primary file for the API
 * 
 */

// Dependencies
var http = require('http');
var ParsedRequest = require('./ParsedRequest');
var ResponseManager = require('./ResponseManager');

// The server should respond to all requests
var server = http.createServer(function(req, res) {
    var parsed = new ParsedRequest(req);
    var manager = new ResponseManager(parsed);
    
    manager.execute(res);
});

// Start the server, and have it listen on port 3000
server.listen(3000, function() {
    console.log("The server is listening on port 3000 now.");
});
