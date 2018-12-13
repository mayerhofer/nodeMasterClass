/**
 * User module - Define rest api handlers for User CRUD operations.
 */

// Dependencies
var fs = require('fs');

var _data = require('../lib/data');
var helpers = require('../lib/helpers');

// Define the handlers
var users = {};

// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
users.post = function(data, callback) {
    // Check if request has a valid payload
    var payload = data ? data.payload : false;
    if (! payload) {
        callback(400, 'application/json', {'Error': 'Missing required fields.'});
        return;
    }
    // Check that all required fields are filled out
    var firstName = typeof(payload.firstName) == 'string' && payload.firstName.trim().length > 0 ? payload.firstName.trim() : false;
    var lastName = typeof(payload.lastName) == 'string' && payload.lastName.trim().length > 0 ? payload.lastName.trim() : false;
    var phone = typeof(payload.phone) == 'string' && payload.phone.trim().length > 0 ? payload.phone.trim() : false;
    var password = typeof(payload.password) == 'string' && payload.password.trim().length > 0 ? payload.password.trim() : false;
    var tosAgreement = typeof(payload.tosAgreement) == 'boolean' && payload.tosAgreement == true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        // Make sure the user does not already exist
        _data.read('users', phone, function(err, data) {
            if (!err) {
                // User already exists
                callback(400, 'application/json', {'Error': 'A user with that phone number already exists.'});
                return;
            }

            // Hash the password
            var hashedPassword = helpers.hash(password);

            if (!hashedPassword) {
                callback(500, 'application/json', {'Error': 'Could not hash the user\'s password.'});
                return;
            }

            // Create user object
            var userObject = {
                'firstName': firstName,
                'lastName': lastName,
                'phone': phone,
                'hashedPassword': hashedPassword,
                'tosAgreement': true
            };

            // Store the user
            _data.create('users', phone, userObject, function(err) {
                if (err) {
                    console.log(err);
                    callback(500, 'application/json', {'Error': 'Could not create the new user.'});
                    return;
                }
                callback(200);
            });
        });
    } else {
        callback(400, 'application/json', {'Error': 'Missing required fields.'});
    }
};
users.get = function(data, callback) {
    var payload = data ? data.parameters : false;
    // Check that phone number is valid
    var phone = typeof(payload.phone) == 'string' && payload.phone.trim().length > 0 ? payload.phone : false;
    if (phone) {
        // Look up the user
        _data.read('users', phone, function(err, data) {
            if (!err && data) {
                // Remove the hashed password from the user object before returning it to the request
                delete data.hashedPassword;
                callback(200, 'application/json', data);
            } else {
                callback(404, 'application/json', {"Error": "Could not read user with phone: " + phone, "FsError": err});
            }
        });
    } else {
        callback(400, 'application/json', {"Error": "Missing phone in correct format on query string."});
    }
};
// Required field: phone
// Optional: firstName, lastName, password (at least one must be specified)
// @TODO Only let an authenticated user update their own object.
users.put = function(data, callback) {
    // Check if request has a valid payload
    var payload = data ? data.payload : false;
    if (! payload) {
        callback(400, 'application/json', {'Error': 'Missing required fields.'});
        return;
    }
    // Check that phone number is valid
    var phone = typeof(payload.phone) == 'string' && payload.phone.trim().length > 0 ? payload.phone : false;

    // Check for the optional fields
    var firstName = typeof(payload.firstName) == 'string' && payload.firstName.trim().length > 0 ? payload.firstName.trim() : false;
    var lastName = typeof(payload.lastName) == 'string' && payload.lastName.trim().length > 0 ? payload.lastName.trim() : false;
    var password = typeof(payload.password) == 'string' && payload.password.trim().length > 0 ? payload.password.trim() : false;

    if (phone) {
        if (firstName || lastName || password) {
            // Look up the user
            _data.read('users', phone, function(err, data) {
                if (!err && data) {
                    if (firstName) {
                        data.firstName = firstName;
                    }
                    if (lastName) {
                        data.lastName = lastName;
                    }
                    if (password) {
                        data.hashedPassword = helpers.hash(password);
                    }
                    // Store the new updates
                    _data.update('users', phone, data, function(err) {
                        if (err) {
                            callback(500, 'application/json', {"Error": "Could not update the user."});
                        } else {
                            callback(200, 'application/json');
                        }
                    });
                } else {
                    callback(404, 'application/json', {"Error": "Could not find user with phone: " + phone});
                }
            });
        } else {
            callback(400, 'application/json', {"Error": "Missing fields to update."});
        }
    } else {
        callback(400, 'application/json', {"Error": "Missing phone in correct format on query string."});
    }
};
// Required field: phone
// @TODO Only let an authenticated user delete their user.
// @TODO Cleaning (delete) any other data files associated with this user.
users.delete = function(data, callback) {
    var payload = data ? data.parameters : false;
    // Check that phone number is valid
    var phone = typeof(payload.phone) == 'string' && payload.phone.trim().length > 0 ? payload.phone : false;
    if (phone) {
        // Look up the user
        _data.read('users', phone, function(err, data) {
            if (!err && data) {
                _data.delete('users', phone, function(err) {
                    if(!err) {
                        callback(200, 'application/json');
                    } else {
                        callback(500, 'application/json', {"Error": "Could not delete the user with phone: " + phone});
                    }
                });
            } else {
                callback(404, 'application/json', {"Error": "Could not read user with phone: " + phone, "FsError": err});
            }
        });
    } else {
        callback(400, 'application/json', {"Error": "Missing phone in correct format on query string."});
    }
};

module.exports = users;
