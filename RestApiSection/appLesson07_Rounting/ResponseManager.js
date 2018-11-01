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
ResponseHandler.prototype.buildBasicResponse = function(httpStatus, contentType, data) {

    // Use status from handler, or default to 200
    var statusCode = typeof(httpStatus) == 'number' ? httpStatus : 200;

    // Use payload from handler, or default to empty object
    var payload = typeof(data) == 'object' ? data : {};

    // Use content type from handler, or default to 'text/html'
    var type = typeof(contentType) == 'string' ? contentType : 'text/html';

    // Send the response
    this.response.writeHead(statusCode, {'Content-Type': type});
    this.response.end(payload);
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
function ResponseHandler(parsedRequest) {
    // Get elements from parsed request.
    this.elements = parsedRequest.getElements();

    // If route not found, choose default handler (404 - Not Found)
    var handler = typeof(router[this.elements.moduleRoute]) == 'object' ? router[this.elements.moduleRoute] : router['default'];
    handler.handleRequest(this.elements, );
    responseData = handler.getResponse
    ResponseManager.prototype.execute = function(res) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        handler()
    }
}

module.exports = ResponseManager;
