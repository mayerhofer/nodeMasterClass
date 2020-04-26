'use strict';

/**
 * ResponseHandler class.
 * 
 *  Using the httpResponse, set up the response message that should be sent back from service request given its parsed details.
 *  Version: 1.0
 *  Author: Ricardo Mayerhofer
 * 
 */

// Dependencies
var router = require('./modules/router');

function isEmpty(obj) {
    if (! obj) {
        return true;
    }
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }

    return JSON.stringify(obj) === JSON.stringify({});
}

/**
 * After handling request, this method builds the response with results given as parameters.
 * 
 * @function buildBasicResponse
 * @param {number} httpStatus - HTTP status code that should be returned.
 * @param {string} contentType - Description of HTTP message type to set on response head.
 * @param {object} data - String, object or nothing: payload for response.
 */
ResponseHandler.prototype.buildBasicResponse = function(httpStatus, contentType, data) {
    console.log('chegou ate aqui')

    // Use status from handler, or default to 200
    var statusCode = typeof(httpStatus) == 'number' ? httpStatus : 200;

    // Use content type from handler, or default to 'text/html'
    var type = typeof(contentType) == 'string' ? contentType : 'text/html';

    console.log({type})

    // Use payload from handler, or default to empty object
    var payload;
    switch(type) {
        case 'application/json':
            payload = typeof(data) == 'object' ? data : {};
            this.response.writeHead(statusCode, {'Content-Type': type});
            if (isEmpty(payload)) {
                this.response.end();
            } else {
                this.response.end(JSON.stringify(payload));
            }
            break;
        case 'text/html':
            payload = typeof(data) == 'string' ? data : '';
            this.response.writeHead(statusCode, {'Content-Type': type});
            this.response.end(payload);
            break;
        case 'image/x-icon':
            this.response.writeHead(statusCode, {'Content-Type': type});
            this.response.end(data, 'binary');
            break;
        default:
            payload = null;
            break;
    }
}

/**
 * @constructor
 * @param {object} parsedRequest - The parsed important elements from HTTP request received by this service.
 * 
 */
function ResponseHandler(parsedRequest, res) {
    // Save context to variable
    var self = this;

    // Get elements from parsed request.
    this.elements = parsedRequest.getElements();
    // Get response object from Request
    this.response = res;

    // If route not found, choose default handler (404 - Not Found)
    console.log('handler: ' + this.elements.moduleRoute);
    var handler = typeof(router[this.elements.moduleRoute]) == 'function' ? router[this.elements.moduleRoute] : router['default'];
    parsedRequest.addCallbackEvent(function(data) {
        handler(data, self.buildBasicResponse.bind(self));
    });
}

module.exports = ResponseHandler;
