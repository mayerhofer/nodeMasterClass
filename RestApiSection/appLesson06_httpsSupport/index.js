/*
 * Primary file for the API
 * 
 */

// Dependencies
// API dp.
var http = require('http');
var https = require('https');
var fs = require('fs');

// Config dp.
var config = require('./config/config');

// Internal Modules dp.
var ParsedRequest = require('./ParsedRequest');
var ResponseManager = require('./ResponseManager');


// Unified process for all requests to this server
var unifiedServer = function(req, res) {
    var parsed = new ParsedRequest(req);
    var manager = new ResponseManager(parsed);
    
    manager.execute(res);
}

// The server instance that should respond to all HTTP requests
var httpServer = http.createServer(unifiedServer);

// Create instance of HTTPS server options
var httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};

// The server instance should respond to all HTTPS requests
var sslServer = https.createServer(httpsServerOptions, unifiedServer);

// Start the standard server
httpServer.listen(config.httpPort, function() {
    console.log("The HTTP server is listening on port " + config.httpPort + " in "+config.envName+" mode.");
});

// Start the SSL server
sslServer.listen(config.httpsPort, function() {
    console.log("The SSL server is listening on port " + config.httpsPort + " in "+config.envName+" mode.");
});
