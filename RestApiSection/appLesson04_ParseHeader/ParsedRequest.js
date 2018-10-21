'use strict';

/**
 * ParsedRequest class.
 * 
 *  Parses a request creating a simplified object for a ResponseBuilder to apply current service logic.
 *  Version: 1.0
 *  Author: Ricardo Mayerhofer
 * 
 */

// Dependencies
// var http = require('http');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;

/**
 * @constructor
 * @param {object} request - The HTTP request received by this service.
 * 
 */
function ParsedRequest(request) {
    // Get the URL and parse it
    var returnQuery = true;
    var parsedUrl = url.parse(request.url, returnQuery);

    // Get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    var queryStringObject = parsedUrl.query;

    // Get the HTTP method
    var method = request.method.toLowerCase();

    // Get the payload, if any
    var decoder = new StringDecoder('utf-8');
    var result = {};
    var self = this;
    //var eventsToRun = this.callbackEvents;
    result.buffer = '';

    /// TODO: Redesing => events managed inside parsing are a "code smell" (forces to deal with 'favicon.ico' request here)
    request.on('data', function(data) {
        result.buffer += decoder.write(data);
    });
    request.on('end', function() {
        // Event 'end' is always called in each request, so here we should also deal with favicon.ico
        if (self.elements.trimmedPath === 'favicon.ico') {
            return;
        }
            
        // "this" object is the HTTP "request" object.
        result.buffer += decoder.end();

        if (self.callbackEvents) {
            for (var i=0; i<self.callbackEvents.length; i++) {
                self.callbackEvents[i]();
            }
        }
    });

    // Build request elements object
    this.elements = result;
    this.elements.trimmedPath = trimmedPath;
    this.elements.method = method;
    this.elements.headers = Object.assign({}, request.headers);
    this.elements.parameters = Object.assign({}, queryStringObject);

    this.callbackEvents = [];
}

/**
 * getElements Method
 * 
 *  Return object with all necessary parsed request fields.
 */
ParsedRequest.prototype.getElements = function() {
    return Object.assign({}, this.elements);
}

ParsedRequest.prototype.addCallbackEvent = function(callbackEvent) {
    this.callbackEvents.push(callbackEvent);
}

// Export class ParsedRequest
module.exports = ParsedRequest;
