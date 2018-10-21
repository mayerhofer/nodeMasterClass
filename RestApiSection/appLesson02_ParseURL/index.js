/*
 * Primary file for the API
 * 
 */

// Dependencies
var http = require('http');
var url = require('url');

// The server should respond to all request with a string
var server = http.createServer(function(req, res) {

    // Get the URL and parse it
    var returnQuery = true;
    var parsedUrl = url.parse(req.url, returnQuery);

    // Get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    /* Currently modern browsers keep making more than one request:
     *  * One normal request
     *  * Another for the favicon.ico regardless of if your page provides one
     *  That usually gives 404 errors
     *  Removing favicon requests to avoid 404 errors
     */
    if (trimmedPath === 'favicon.ico') {
        res.writeHead(200, {'Content-Type': 'image/x-icon'} );
        res.end();
        console.log('favicon requested');
        return;
    }

    // Send the response
    res.end('Hello World\n');

    // Log the request path
    console.log("Request received on path: " + trimmedPath);
});

// Start the server, and have it listen on port 3000
server.listen(3000, function() {
    console.log("The server is listening on port 3000 now.");
});
