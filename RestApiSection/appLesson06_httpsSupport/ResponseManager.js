'use strict';

/**
 * ResponseManger class.
 * 
 *  Using the httpResponse, set up the response message that should be sent back from service request given its parsed details.
 *  Version: 1.0
 *  Author: Ricardo Mayerhofer
 * 
 */

// Dependencies
var select = require('./modules/moduleSelector');

/**
 * Currently modern browsers keep making more than one request:
 * * One normal request
 * * Another for the favicon.ico regardless of if your page provides one
 *  That usually gives 404 errors
 *  Removing favicon requests to avoid 404 errors
 * 
 * @function manageFaviconRequest
 * @param {object} httpResponse - HTTP response where service's response will be set up. 
 */
var manageFaviconRequest = function(httpResponse) {
    httpResponse.writeHead(200, {'Content-Type': 'image/x-icon'} );
    httpResponse.end();
    return true;
}

/**
 * Standard service request logic starting point.
 * Defines all logic to be executed in order to generate any standard response upon client's request.
 * 
 * @function manageBaseRequest
 * @param {object} httpResponse - HTTP response where service's response will be set up.
 */
var manageBaseRequest = function(responseManager) {
    // Send the response
    responseManager.response.writeHead(200, {'Content-Type': 'text/html'});
    select(responseManager, endService);
}

var endService = function(svcManager, body) {
    svcManager.response.end(body);
}

var doNothing = function(httpResponse) {
    this.response = httpResponse;
}

/**
 * @constructor
 * @param {object} parsedRequest - The parsed important elements from HTTP request received by this service.
 * 
 */
function ResponseManager(parsedRequest) {
    // Get elements from parsed request.
    this.elements = parsedRequest.getElements();

    // Define execution strategy.
    if (parsedRequest.trimmedPath === 'favicon.ico') {
        ResponseManager.prototype.execute = manageFaviconRequest;
    } else {
        var self = this;
        ResponseManager.prototype.execute = doNothing;
        parsedRequest.addCallbackEvent(function() {
            manageBaseRequest(self);
        });
    }
}

module.exports = ResponseManager;
