/**
 * Token module - Define rest api handlers for Token CRUD operations.
 */

// Dependencies
var fs = require('fs');

var _data = require('../lib/data');
var helpers = require('../lib/helpers');

// Define the handlers
var tokens = {};

// Required data: phone, password
// Optional data: none
tokens.post = function(data, callback) {
    // Check if request has a valid payload
    var payload = data ? data.payload : false;
    if (! payload) {
        callback(400, 'application/json', {'Error': 'Missing required fields.'});
        return;
    }
    // Check that all required fields are filled out
    var phone = typeof(payload.phone) == 'string' && payload.phone.trim().length > 0 ? payload.phone.trim() : false;
    var password = typeof(payload.password) == 'string' && payload.password.trim().length > 0 ? payload.password.trim() : false;

    if (phone && password) {
        // Lookup for the user specified by the phone number
        _data.read('users', phone, function(err, data) {
            if (err) {
                // User not found exists
                callback(400, 'application/json', {'Error': 'A user with that phone number was not found.'});
                return;
            }

            // Hash the password
            var hashedPassword = helpers.hash(password);

            if (!hashedPassword) {
                callback(500, 'application/json', {'Error': 'Could not hash the user\'s password.'});
                return;
            }
            // Check if submitted password is the same as stored password
            if (hashedPassword != data.hashedPassword) {
                callback(400, 'application/json', {'Error': 'Wrong password for that user.'});
                return;
            }

            // Create a token, with a time-to-live span or expiration data 1 hour in the future
            var tokenId = helpers.createRandomString(20);
            var expires = Date.now() + (1000 * 60 * 60);
            var tokeObject = {
                'phone': phone,
                'id': tokenId,
                'expires': expires,
            };

            // Store a token for that user
            _data.create('tokens', tokenId, tokeObject, function(err) {
                if (err) {
                    console.log(err);
                    callback(500, 'application/json', {'Error': 'Could not create the new token.'});
                    return;
                }
                callback(200, 'application/json', tokeObject);
            });
        });
    } else {
        callback(400, 'application/json', {'Error': 'Missing required fields.'});
    }
};

// Required data: id
// Optional data: none
tokens.get = function(data, callback) {
    var payload = data ? data.parameters : false;
    if (! payload) {
        callback(400, 'application/json', {'Error': 'Missing required fields.'});
        return;
    }
    // Check inputs
    var id = typeof(payload.id) == 'string' && payload.id.trim().length == 20 ? payload.id.trim() : '';
    if (id) {
        // Look up the token
        _data.read('tokens', id, function(err, data) {
            if (!err && data) {
                callback(200, 'application/json', data);
            } else {
                callback(404, 'application/json', {"Error": "Could not read token with id: " + id, "FsError": err});
            }
        });
    } else {
        callback(400, 'application/json', {"Error": "Missing parameter id in correct format on query string."});
    }
};
// Required field: id, extend
// Optional: none
tokens.put = function(data, callback) {
    // Check if request has a valid payload
    var payload = data ? data.payload : false;
    if (! payload) {
        callback(400, 'application/json', {'Error': 'Missing required fields.'});
        return;
    }
    // Check inputs
    var id = typeof(payload.id) == 'string' && payload.id.trim().length == 20 ? payload.id.trim() : '';
    var extend = typeof(payload.extend) == 'boolean' && payload.extend == true ? true : false;

    if (id && extend) {
        // Look up the token
        _data.read('tokens', id, function(err, data) {
            if (!err && data) {
                // Check to make sure the token isn't already expired
                if (data.expires > Date.now()) {
                    // Set the expiration an hour from now
                    data.expires = Date.now() + 1000 * 60 * 60;

                    // Store the new updates
                    _data.update('tokens', id, data, function(err) {
                        if (!err) {
                            callback(200, 'application/json');
                        } else {
                            callback(500, 'application/json', {'Error' : 'Could not update the token\'s expiration.'});
                        }
                    });
                } else {
                    callback(400, 'application/json', {'Error': 'The token has already expired, and cannot be extended.'});
                }
            } else {
                callback(404, 'application/json', {"Error": "Could not find token with id: " + id});
            }
        });
    } else {
        callback(400, 'application/json', {"Error": "Missing required field(s) or field(s) are invalid."});
    }
};
// Required field: id
tokens.delete = function(data, callback) {
    var payload = data ? data.parameters : false;
    if (! payload) {
        callback(400, 'application/json', {'Error': 'Missing required fields.'});
        return;
    }
    // Check inputs
    var id = typeof(payload.id) == 'string' && payload.id.trim().length == 20 ? payload.id.trim() : '';
    if (id) {
        // Look up the token
        _data.read('tokens', id, function(err, data) {
            if (!err && data) {
                _data.delete('tokens', id, function(err) {
                    if(!err) {
                        callback(200, 'application/json');
                    } else {
                        callback(500, 'application/json', {"Error": "Could not delete the token with id: " + id});
                    }
                });
            } else {
                callback(404, 'application/json', {"Error": "Could not read token with id: " + id, "FsError": err});
            }
        });
    } else {
        callback(400, 'application/json', {"Error": "Missing parameter id in correct format on query string."});
    }
};
// Verify if a given token id is currently valid for a given user
tokens.verifyToken = function(id,phone,callback) {
    // Lookup the token
    _data.read('tokens', id, function(err, tokenData) {
        if (!err && tokenData && tokenData.phone == phone && tokenData.expires > Date.now()) {
            callback(true);
        } else {
            callback(false);
        }
    });
}

module.exports = tokens;
