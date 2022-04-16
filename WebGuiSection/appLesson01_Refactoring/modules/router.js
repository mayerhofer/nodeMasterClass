var fs = require('fs');

var _data = require('../lib/data');
var _users = require('./user');
var _tokens = require('./token');
var _checks = require('./check');
var helpers = require('../lib/helpers');
var config = require('../config/config');


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

// Favicon
handlers.favicon = function(data, callback) {
    // Reject any request that isn't a GET
    if (data.method === 'get') {
        // Read in the favicon's data
        helpers.getStaticAsset('favicon.ico', function(err, img) {
            if (!err && img) {
                callback(200, 'image/x-icon', img);
            } else {
                callback(500);
            }
        });
    } else {
        callback(500);
    }
    // console.log('handling favico')
    // var img = fs.readFileSync('./assets/study.ico.png');
    // callback(200, 'image/x-icon', img);
}

handlers.users = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        _users[data.method](data, callback);
    } else {
        callback(405);
    }
}

handlers.tokens = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        _tokens[data.method](data, callback);
    } else {
        callback(405);
    }
}

handlers.checks = function(data, callback) {
    var acceptableMethods = ['post','get','put','delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        _checks[data.method](data, callback);
    } else {
        callback(405);
    }
}

handlers._users = {};

handlers.index = function(data, callback) {
    if ('get'.localeCompare(data.method, undefined, { sensitivity: 'accent' }) === 0) {

        let templateData = {
            'head.title': 'This is the title',
            'head.description': 'This is the meta description',
            'body.title': 'Hello templated world!',
            'body.class': 'index'
        }

        helpers.getTemplate('index', templateData, function(err, str) {
            if (!err && str) {
                //callback(200, 'text/html', '<html><body><h1>Hello World, from Ricardo++!</h1></body></html>');

                // Add the universal header and footer
                helpers.addUniversalTemplates(str, templateData, function(err, str) {
                    if (!err && str) {
                        callback(200, 'text/html', str);
                    } else {
                        callback(500, 'text/html', undefined);
                    }
                });
            } else {
                // TODO: define an error page for this scenario
                callback(500, 'text/html', undefined);
            }
        });
    } else {
        // TODO: define an error page for this scenario
        callback(405, 'text/html');
    }
}

// Public static assets
handlers.public = function(requestData, callback) {
    // Reject any request that isn't a get
    if (requestData.method === 'get') {
        // Get the file name being requested
        let trimmedAssetName = requestData.trimmedPath.replace('public/', '').trim();

        console.log(' passei aki ao menos')
        if (trimmedAssetName.length > 0) {
            // Read in the asset's data
            helpers.getStaticAsset(trimmedAssetName, function(err, data) {
                if(!err && data){
                    // Determine the content type (default to plain text)
                    let contentType = 'plain';

                    if (trimmedAssetName.indexOf('.css') > -1) {
                        contentType = 'text/css';
                    } else if (trimmedAssetName.indexOf('.png') > -1) {
                        contentType = 'png';
                    } else if (trimmedAssetName.indexOf('.jpg') > -1) {
                        contentType = 'jpg';
                    } else if (trimmedAssetName.indexOf('.ico') > -1) {
                        contentType = 'favicon';
                    } else if (trimmedAssetName.indexOf('.js') > -1) {
                        contentType = 'application/javascript';
                    }

                    // Callback the data
                    callback(200, contentType, data);
                } else {
                    console.log(err);
                    callback(404);
                }
            });
        }
    } else {
        callback(405);
    }
};

// Define the router
var router = {
    'sample': handlers.sample,
    'favicon.ico': handlers.favicon,
    'default': handlers.notFound,
    'api/hello': handlers.hello,
    'api/users': handlers.users,
    'api/tokens': handlers.tokens,
    'api/checks': handlers.checks,
    // GUI handlers
    '': handlers.index,
    'account/create': handlers.accountCreate,
    'account/delete': handlers.accountDelete,
    'account/edit': handlers.accountEdit,
    'session/create': handlers.sessionCreate,
    'session/delete': handlers.sessionDelete,
    'checks/all': handlers.checksList,
    'checks/create': handlers.checksCreate,
    'checks/edit': handlers.checksEdit,
    // GUI Static handlers
    'public/app.css' : handlers.public,
};

module.exports = router;
