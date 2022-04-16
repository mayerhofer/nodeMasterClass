/**
 * Check module - Check if given service is up or down.
 */

// Dependencies
var config = require('../config/config');
var helpers = require('../lib/helpers');
var tokens = require('./token');
var _data = require('../lib/data');

// Define the handlers
var checks = {};

// Required data: protocol, url, method, successCodes, timeoutSeconds
// Optional data: none
checks.post = function(data, callback) {
    // Validate inputs
    var protocol = typeof(data.payload.protocol) == 'string' && ['http','https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
        // Get the token from the headers
        var token = (data.headers && typeof(data.headers.token) == 'string') ? data.headers.token : false;

        // Lookup the user by reading the token
        _data.read('tokens', token, function(err, tokenData) {
            if (!err && tokenData) {
                var userPhone = tokenData.phone;

                // Lookup the user data
                _data.read('users', userPhone, function(err, userData) {
                    if (!err && userData) {
                        var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                        // Verify that the user has less than the number of max-checks-per-user
                        if (userChecks.length < config.maxChecks) {
                            // Create a random id for the check
                            var checkId = helpers.createRandomString(20);

                            // Create the check object, and include the user's phone
                            var checkObject = {
                                'id': checkId,
                                'userPhone': userPhone,
                                'protocol': protocol,
                                'url': url,
                                'method': method,
                                'successCodes': successCodes,
                                'timeoutSeconds': timeoutSeconds
                            };

                            // Save the object
                            _data.create('checks', checkId, checkObject, function(err) {
                                if (!err) {
                                    // Add the checkId to the users object
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    // Save the new user data
                                    _data.update('users', userPhone, userData, function(err) {
                                        if(!err) {
                                            // Return the data about the new check
                                            callback(200, 'application/json', checkObject);
                                        } else {
                                            callback(500, 'application/json', {'Error': 'Could not update the user with the new check'});
                                        }
                                    });
                                } else {
                                    callback(500, 'application/json', {'Error': 'Could not create new check.'});
                                }
                            });
                        } else {
                            callback(400, 'application/json', {'Error': 'The user already has the maximum number of checks ('+ config.maxChecks +').'});
                        }
                    }
                });
            } else {
                callback(403, 'application/json', {'Error': 'Invalid token in header.'});
            }
        });
    } else {
        callback(400, 'application/json', {'Error': 'Missing required inputs, or inputs are invalid.'});
    }
};

// Required data: id
// Optional data: none
checks.get = function(data, callback) {
    if (!data || ! data.parameters) {
        callback(400, 'application/json', {'Error': 'Missing required fields.'});
        return;
    }
    // Check that the id is valid
    var id = typeof(data.parameters.id) == 'string' && data.parameters.id.trim().length == 20 ? data.parameters.id.trim() : '';

    if (id) {
        // Lookup the check
        _data.read('checks',id,function(err, checkData){
            if(!err && checkData){
                // Get the token from the headers
                var token = (data.headers && typeof(data.headers.token) == 'string') ? data.headers.token : false;
                // Verify that the given token is valid and belongs to the user who created the check
                tokens.verifyToken(token, checkData.userPhone,function(tokenIsValid){
                    if(tokenIsValid) {
                        callback(200, 'application/json', checkData);
                    } else {
                        callback(403, 'application/json', {'Error': 'Invalid token in header.'});
                    }
                });
            } else {
                callback(404,'application/json',{'Error':'Could not read check with id "'+id+'"'});
            }
        });
    } else {
        callback(400, 'application/json', {'Error': 'Missing required inputs (id), or inputs are invalid.'});
    }
};

// Checks - put
// Required fields: id
// Optional fields: (at least one of ...) protocol, url, method, successCodes, timeoutSeconds
checks.put = function(data, callback) {
    if (!data || ! data.parameters) {
        callback(400, 'application/json', {'Error': 'Missing required fields.'});
        return;
    }
    // Check that the id is valid
    var id = typeof(data.parameters.id) == 'string' && data.parameters.id.trim().length == 20 ? data.parameters.id.trim() : '';

    if (id) {
        // Lookup the check
        _data.read('checks',id,function(err, checkData){
            if(!err && checkData){
                // Get the token from the headers
                var token = (data.headers && typeof(data.headers.token) == 'string') ? data.headers.token : false;
                // Verify that the given token is valid and belongs to the user who created the check
                tokens.verifyToken(token, checkData.userPhone,function(tokenIsValid){
                    if(tokenIsValid) {
                        var protocol = typeof(data.payload.protocol) == 'string' && ['http','https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
                        var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
                        var method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
                        var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
                        var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

                        if (protocol || url || method || successCodes || timeoutSeconds) {
                            // Update the check where necessary
                            if (protocol){
                                checkData.protocol = protocol;
                            }
                            if (url) {
                                checkData.url = url;
                            }
                            if (method) {
                                checkData.method = method;
                            }
                            if (successCodes) {
                                checkData.successCodes = successCodes;
                            }
                            if (timeoutSeconds) {
                                checkData.timeoutSeconds = timeoutSeconds;
                            }

                            // Store the new updates
                            _data.update('checks',id,checkData,function(err){
                                if(!err){
                                    callback(200, 'application/json');
                                } else {
                                    callback(500,'application/json',{'Error':'Could not update the check.'});
                                }
                            });
                        } else {
                            callback(400, 'application/json', {'Error': 'Missing required inputs (parameter to update), or inputs are invalid.'});
                        }
                    } else {
                        callback(403, 'application/json', {'Error': 'Invalid token in header.'});
                    }
                });
            } else {
                callback(404,'application/json',{'Error':'Could not read check with id "'+id+'"'});
            }
        });
    } else {
        callback(400, 'application/json', {'Error': 'Missing required inputs (id), or inputs are invalid.'});
    }
};

// Checks - delete
// Required fields:
// Optional fields:
checks.delete = function(data, callback) {
    if (!data || ! data.parameters) {
        callback(400, 'application/json', {'Error': 'Missing required fields.'});
        return;
    }
    // Check that the id is valid
    var id = typeof(data.parameters.id) == 'string' && data.parameters.id.trim().length == 20 ? data.parameters.id.trim() : '';
    if (id) {
        // Lookup the check
        _data.read('checks',id,function(err, checkData){
            if(!err && checkData){
                // Get the token from the headers
                var token = (data.headers && typeof(data.headers.token) == 'string') ? data.headers.token : false;
                // Verify that the given token is valid and belongs to the user who created the check
                tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid){
                    if(tokenIsValid) {
                        // Lookup the user data
                        _data.read('users', checkData.userPhone, function(err, userData) {
                            if (!err && userData) {
                                userData.checks.splice(userData.checks.indexOf(id), 1);
                                _data.update('users', checkData.userPhone, userData, function(err) {
                                    if(!err) {
                                        _data.delete('checks', id, function(err){
                                            if(!err) {
                                                callback(200,'application/json');
                                            } else {
                                                callback(500,'application/json',{'Error':'Could not delete check with id: ' + id});
                                            }
                                        });
                                    } else {
                                        callback(500,'application/json',{'Error':'Could not update user removing check with id: ' + id});
                                    }
                                });
                            } else {
                                callback(404, 'application/json', {'Error': 'Could not find user from check with id: ' + id});
                            }
                        });
                    } else {
                        callback(403, 'application/json', {'Error': 'Invalid token in header.'});
                    }
                });
            } else {
                callback(404,'application/json',{'Error':'Could not read check with id "'+id+'"'});
            }
        });
    } else {
        callback(400, 'application/json', {'Error': 'Missing required inputs (id), or inputs are invalid.'});
    }
};

module.exports = checks;
