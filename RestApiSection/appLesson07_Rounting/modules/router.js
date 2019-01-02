var fs = require('fs');

// Define the handlers
var handlers = {};

// Define sample handler
handlers.sample = function(data, callback) {
    console.log('sample')
    callback(406, 'application/json', {'name': 'sample handler called'});
};

// Define the not found handler
handlers.notFound = function(data, callback) {
    console.log('not found')
    callback(404, 'text/html', '<html><body><h1>404 - Not found</h1></body></html>');
};

handlers.hello = function(data, callback) {
    console.log('handling hello')
    callback(200, 'text/html', '<html><body><h1>Hello World, from Ricardo!</h1></body></html>');
};

handlers.favicon = function(data, callback) {
    console.log('handling favico')
    var img = fs.readFileSync('./assets/study.ico.png');
    callback(200, 'image/x-icon', img);
}

// Define the router
var router = {
    'sample': handlers.sample,
    'favicon.ico': handlers.favicon,
    'default': handlers.notFound,
    'hello': handlers.hello,
    'all': handlers
};

module.exports = router;
