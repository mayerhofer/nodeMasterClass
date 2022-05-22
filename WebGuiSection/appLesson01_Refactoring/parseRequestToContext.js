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
const url = require('url');
const addEventHandlers = require('./addEventHandlers');

const getBaseRoute = path => {
    return path.indexOf("/") >= 0 ? path.substring(0, path.indexOf("/")) : path;
};
const getTrimmedPath = parsedUrl => {
    const path = parsedUrl.pathname;

    return path.replace(/^\/+|\/+$/g, '');
}

/**
 * @function parseRequestToContext Parse an HTTP request building a context object with the necessary data for the service to manage this request.
 * @param {object} request The HTTP request received by this service.
 * @returns {object} The request context to be handled and managed.
 * 
 */
function parseRequestToContext(request) {
    const parsedUrl = url.parse(request.url, true);
    const context = {
        callbacks: [],
        elements: [],
        headers: {...request.headers},
        httpMethod: request.method.toLowerCase(),
        moduleRoute: '',
        parameters: {...parsedUrl.query},
        payload: null,
        trimmedPath: getTrimmedPath(parsedUrl),
    };

    context.moduleRoute = getBaseRoute(context.trimmedPath).toLowerCase();

    addEventHandlers(request, context);

    return context;
}

module.exports = parseRequestToContext;
