// Define the handlers
var handlers = {};

// Define sample handler
handlers.sample = function(data, callback) {
    callback(406, {'name': 'sample handler called'});
};

// Define the not found handler
handlers.notFound = function(data, callback) {
    callback(404);
};

// Define the router
var router = {
    'sample': handlers.sample,
    'favicon.ico': handlers.favicon,
    'default': handlers.notFound
};
