/**
 * Helpers for various tasks
 */

// Dependencies
var crypto = require('crypto');
var config = require('../config/config');

// Container for all the helpers
var helpers = {};

// Create a SHA256 hash
helpers.hash = function(str) {
    if (typeof(str) == 'string' && str.length > 0) {
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    }
    return false;
};

// Parse a JSON string to an object in all cases, without throwing.
helpers.parseJsonToObject = function(str) {
    try {
        var obj = JSON.parse(str);
        return obj;
    } catch (e) {
        console.log('Unable to parse to object (parseJsonToObject).');
        return {};
    }
}

// Create a string with "number" amount random characters to be used as token
helpers.createRandomString = function(number) {
    var strLength = typeof(number) == 'number' && number > 0 ? number : false;
    if (strLength) {
        // Define characters that can be used to create a random string (in this case: token)
        var possibleCaracters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';

        // Start the string
        var str = '';

        // Loop to build the string
        for (var i=0; i<strLength; i++) {
            var charToAppend = possibleCaracters.charAt(Math.floor(possibleCaracters.length * Math.random()));
            str += charToAppend;
        }

        return str;
    } else {
        return false;
    }
}

// Export the module
module.exports = helpers;
