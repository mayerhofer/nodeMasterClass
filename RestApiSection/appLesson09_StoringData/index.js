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
var ResponseHandler = require('./ResponseManager');

// Lib dp.
var _data = require('./lib/data');

// TESTING
// @TODO delte this
// _data.create('test', 'newFile', {'foo': 'bar'}, function(err) {
//     console.log('this was the error: ', err);
// });
// _data.read('test', 'newFile', function(err, data) {
//     console.log('this was the error: ', err, ' and this was the data: ', data);
// });
// _data.update('test', 'newFile', {'foo' : 'fizz'}, function(err) {
//     console.log('this was the error: ', err);
// });
// _data.delete('test', 'newFile', function(err) {
//     console.log('this was the error: ', err);
// });

// Unified process for all requests to this server
var unifiedServer = function(req, res) {
    var parsed = new ParsedRequest(req);
    var manager = new ResponseHandler(parsed, res);
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
