var fs = require('fs');

var _data = require('../lib/data');
var _users = require('./user');
var helpers = require('../lib/helpers');


// Define the handlers
var handlers = {};

// Define sample handler
handlers.sample = function(data, callback) {
    console.log('sample')
    callback(406, {'name': 'sample handler called'});
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

handlers.users = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        _users[data.method](data, callback);
    } else {
        callback(405);
    }
}

handlers._users = {};

// Define the router
var router = {
    'sample': handlers.sample,
    'favicon.ico': handlers.favicon,
    'default': handlers.notFound,
    'hello': handlers.hello,
    'users': handlers.users,
    'all': handlers
};

module.exports = router;
