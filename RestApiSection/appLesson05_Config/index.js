/*
 * Primary file for the API
 * 
 */

// Dependencies
var http = require('http');
var ParsedRequest = require('./ParsedRequest');
var ResponseManager = require('./ResponseManager');
var config = require('./config/config');

// The server should respond to all requests
var server = http.createServer(function(req, res) {
    var parsed = new ParsedRequest(req);
    var manager = new ResponseManager(parsed);
    
    manager.execute(res);
});

// Start the server
server.listen(config.port, function() {
    console.log("The server is listening on port " + config.port + " in "+config.envName+" mode.");
});
