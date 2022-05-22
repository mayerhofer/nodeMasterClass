'use strict';

// Dependencies
const { StringDecoder } = require('string_decoder');

/**
 * RequestEventHandler class.
 * 
 *  Adds to a request apropriate handlers for each relevant event for this service in the request.
 *  Version: 1.0
 *  Author: Ricardo Mayerhofer
 * 
 */
function tryParseObject(buffer) {
  // if (/^[\],:{}\s]*$/.test(buffer.replace(/\\["\\\/bfnrtu]/g, '@').
  //   replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
  //   replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

  //   return JSON.parse(buffer);
  // } else {
  //   return null;
  // }
  try {
    return JSON.parse(buffer);
  } catch (e) {
    return null;
  }
}
function dataHandler(mem) {
  return function(data) {
    mem.buffer += mem.decoder.write(data);
  };
}
function endHandler(mem, context) {
  return function() {
    mem.buffer += mem.decoder.end();
    context.payload = tryParseObject(mem.buffer);

    context.callbacks.forEach(c => {
      c(context);
    });
  };
}

/**
 * @function addEventHandlers Add handlers for events 'data' (to add payload to context) and 'end' for callbacks when request ends.
 * @param {object} request  The HTTP request received by this service.
 * 
 */
function addEventHandlers(request, context) {
  const mem = {
    buffer: '',
    decoder: new StringDecoder('utf-8'),
  };
  
  request.on('data', dataHandler(mem));
  request.on('end', endHandler(mem, context));
}

module.exports = addEventHandlers;
