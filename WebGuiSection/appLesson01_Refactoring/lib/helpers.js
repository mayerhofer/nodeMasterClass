/**
 * Helpers for various tasks
 */

// Dependencies
var crypto = require('crypto');
var https = require('https');
var fs = require('fs');
var queryString = require('querystring');
var path = require('path');

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

helpers.sendSms = function(phone, msg, callback) {
    // Validate input parameters
    phone = typeof(phone) == 'string' && phone.trim().length >= 10 ? phone.trim() : false;
    msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;

    if (phone && msg) {
        // Configure the  service request payload
        let payload = {
            'From': config.sms.fromPhone,
            'To': phone,
            'Body': msg
        };

        // Payload should be stringified to be sent as URL parameter
        let payloadText = queryString.stringify(payload);

        // Configure request details
        let requestDetails = {
            'protocol': 'https:',
            'hostname': process.env.SMS_HOSTNAME,
            'method': 'POST',
            'path': '/2010-04-01/Accounts/' + config.sms.accountSId + '/Messages.json',
            'auth': config.sms.accountSId + ':' + config.sms.authToken,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(payloadText)
            }
        };
        console.log({requestDetails, payload})

        // Create request object instance
        let request = https.request(requestDetails, function(res) {
            // Grab status of the response
            var status = res.statusCode;

            // Callback successfully if the request went through
            if (status === 200 || status === 201) {
                callback(false);
            } else {
                callback(`Send SMS: Sms service replyed with status ${status} and message ${res.statusMessage}.`);
            }
        });

        // Bind to the error event so it doesn't get thrown
        request.on('error', function(e) {
            callback(e);
        });

        // Attach the payload to the request
        request.write(payloadText);

        // Fire the request
        request.end();
    } else {
        callback('Send SMS: Given parameters were missing or invalid.')
    }
}

// Get the string content of a template
helpers.getTemplate = function(templateName, data, callback) {
    templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
    data = typeof(data) === 'object' && data !== null ? data : {};

    if (templateName) {
        var templatesDir = path.join(__dirname, '/../templates/');
        fs.readFile(templatesDir+templateName+'.html', 'utf8', function(err,str) {
            if (!err && str && str.length > 0){
                // Do interpolation on the string
                let finalString = helpers.interpolate(str, data);
                callback(false, finalString);
            } else {
                callback('No template could be found');
            }
        });
    } else {
        callback('A valid template name was not specified.');
    }
}

// Get the contents of a static public asset
helpers.getStaticAsset = function(fileName, callback) {
    fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false;
    data = typeof(data) === 'object' && data !== null ? data : {};

    if (fileName) {
        var publicDir = path.join(__dirname, '/../public/');
        fs.readFile(publicDir+fileName, function(err,str) {
            if (!err && str){
                callback(false, str);
            } else {
                callback('No file could be found');
            }
        });
    } else {
        callback('A valid file name was not specified.');
    }
}

// Add the universal header and footer to a string, and pass provided data object to
helpers.addUniversalTemplates = function(str, data, callback) {
    str = typeof(str) === 'string' && str.length > 0 ? str : '';
    data = typeof(data) === 'object' && data !== null ? data : {};

    // Get the header
    helpers.getTemplate('_header', data, function(err, headerString) {
        if (!err && headerString) {

            // Get the footer
            helpers.getTemplate('_footer', data, function(err, footerString) {
                if (!err && footerString) {
                    // Add them all together
                    let fullString = headerString + str + footerString;
                    callback(undefined, fullString);
                } else {
                    callback('Could not find the footer template.');
                }
            });
        } else {
            callback('Could not find the header template.');
        }
    });
}

// Take a given string and a data object and find/replace all the keys within it
helpers.interpolate = function(str, data) {
    str = typeof(str) === 'string' && str.length > 0 ? str : '';
    data = typeof(data) === 'object' && data !== null ? data : {};

    // Add the templateGlobals do the data object, prepending their key name with "global"
    for (let keyName in config.templateGlobals) {
        if (config.templateGlobals.hasOwnProperty(keyName)) {
            data['global.'+keyName] = config.templateGlobals[keyName];
        }
    }

    // For each key in the data object, insert its value into the string at the correspond
    for (let key in data) {
        if (data.hasOwnProperty(key) && typeof(data[key]) === 'string') {
            let replace = data[key];
            let find = '{' + key + '}';
            str = str.replace(find, replace);
        }
    }

    return str;
}

// Export the module
module.exports = helpers;
