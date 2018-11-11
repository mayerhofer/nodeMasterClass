/*
 * Primary file for the API
 * 
 */

// Dependencies
var http = require('http');
var url = require('url');

// Unified process for all requests to this server
var unifiedServer = function(req, res) {
    var parsedUrl = url.parse(req.url, true);

    // Get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the HTTP method
    var method = req.method.toLowerCase();

    // Only send message if path is hello and method equals to get
    if (trimmedPath.toLowerCase() == 'hello' && method == 'get') {
        // Send JSON with hello world message
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
            'greeting': 'Hello World, fellow devs from Pirple!'
        }));
    } else {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end('404 - Not Found');
    }
}

// The server instance that should respond to all HTTP requests
var httpServer = http.createServer(unifiedServer);

// Start the standard server
httpServer.listen(3000, function() {
    console.log("The HTTP server is listening on port 3000.");
});
