var fs = require('fs');

var _data = require('../lib/data');
var _users = require('./user');
var _tokens = require('./token');
var _checks = require('./check');
var helpers = require('../lib/helpers');
var config = require('../config/config');

var builder = require('../templates/components/table');
const RestAPI = require('../services/jsonApi');


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
    if (data.httpMethod === 'get') {
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
    if (acceptableMethods.indexOf(data.httpMethod) > -1) {
        _users[data.httpMethod](data, callback);
    } else {
        callback(405);
    }
}

handlers.tokens = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.httpMethod) > -1) {
        _tokens[data.httpMethod](data, callback);
    } else {
        callback(405);
    }
}

handlers.checks = function(data, callback) {
    var acceptableMethods = ['post','get','put','delete'];
    if (acceptableMethods.indexOf(data.httpMethod) > -1) {
        _checks[data.httpMethod](data, callback);
    } else {
        callback(405);
    }
}

handlers._users = {};

handlers.index = function(data, callback) {
    if ('get'.localeCompare(data.httpMethod, undefined, { sensitivity: 'accent' }) === 0) {
        // let api = new RestAPI('cashflow');

        // api.get().then(data => {
        //     const props = {
        //         className: 'table',
        //         columns: ['Date', 'Provider', 'Description', 'Amount', 'Location', 'Book'],
        //         data: data.filter(cf => (new Date(cf.date)).getFullYear() > 2020).map(cf => {
        //             const currencyFormatter = new Intl.NumberFormat('en-US', {
        //                 style: 'currency',
        //                 currency: cf.currency,
        //                 minimumFractionDigits: 2,
        //             });

        //             return {
        //                 Date: (new Date(cf.date)).toISOString().substring(0, 10),
        //                 Provider: cf.provider,
        //                 Description: cf.description,
        //                 Amount: currencyFormatter.format(cf.amount),
        //                 Location: cf.location,
        //                 Book: cf.book,
        //             };
        //             // "direction": "false",
        //             // "labels": [
        //             //     "Transport",
        //             //     "Work"
        //             // ],
        //             // "elementId": 432
        //         }),
        //     };

        //     let table = builder(props);

            let templateData = {
                'head.title': 'This is the title',// + table,
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
                    callback(500, 'text/html', err);
                }
            });
        // }).catch(err => {
        //     callback(500, 'text/html', err);
        // });
    } else {
        // TODO: define an error page for this scenario
        callback(405, 'text/html');
    }
}

// Public static assets
handlers.public = function(requestData, callback) {
  // Reject any request that isn't a get
  if (requestData.httpMethod === 'get') {
    // Get the file name being requested
    let trimmedAssetName = requestData.trimmedPath.replace('public/', '').trim();

    if (trimmedAssetName.length > 0) {
      // Read in the asset's data
      helpers.getStaticAsset(trimmedAssetName, function(err, data) {
        if(!err && data){
          // Determine the content type (default to plain text)
          let contentType = 'plain';

          if (trimmedAssetName.indexOf('.css') > -1) {
            contentType = 'text/css';
	    data = data.replace('/*{ADDED_STYLE}*/', compStyles);
          } else if (trimmedAssetName.indexOf('.png') > -1) {
            contentType = 'png';
          } else if (trimmedAssetName.indexOf('.jpg') > -1) {
            contentType = 'jpg';
          } else if (trimmedAssetName.indexOf('.ico') > -1) {
            contentType = 'favicon';
          } else if (trimmedAssetName.indexOf('.js') > -1) {
            contentType = 'application/javascript';
	    data = data.replace('/*{ADDED_CODE}*/', compCode);
	    data = data.replace('/*{TEMPLATES}*/', compHtml);
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
    'public/app.js' : handlers.public,
    'public/skyspace.jpg' : handlers.public,
};

module.exports = router;
