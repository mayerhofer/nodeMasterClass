/*
 * Primary file for the API
 * 
 */

// Dependencies
// API dp.
var http = require('http');
var https = require('https');
var fs = require('fs');

// @TODO GET RID OF THIS
var helpers = require('./lib/helpers');
helpers.sendSms(process.env.SMS_TEST_PHONE, 'Hello AGAIN! From my NodeJS learning exercise :)', function(err) {
    console.log('this was the error', err);
});

// Config dp.
var config = require('./config/config');

// Internal Modules dp.
var parseRequestToContext = require('./parseRequestToContext');
var ResponseHandler = require('./ResponseManager');

// Unified process for all requests to this server
var unifiedServer = function(req, res) {
    const context = parseRequestToContext(req); //BuildEventHandlerContext(req);
    var manager = new ResponseHandler(context, res);
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

process.on('SIGTERM', () => {
    httpServer.close(() => {
        console.log('HTTP server process terminated.');
    });
    sslServer.close(() => {
        console.log('HTTPS server process terminated.');
    });
});
process.on('TERM', () => {
    httpServer.close(() => {
        console.log('HTTP server process terminated.');
    });
    sslServer.close(() => {
        console.log('HTTPS server process terminated.');
    });
});

console.log(`PID: ${process.pid}`);
