let constants = {
  'CONTENT_TYPE': {
    'favicon': 'image/x-icon',
    'jpg': 'image/jpeg',
    'png': 'image/png',
    'json': 'application/json',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript'
  },
  'HTTP_STATUS': {
    // Success in processing
    'success': 200,
    'created': 201,
    'accepted': 202,
    'noContent': 204, // No content to send for this request, but headers may be useful

    // Something known is missing
    'badRequest': 400,
    'forbidden': 403,
    'notFound': 404,
    'methodNotAllowed': 405,

    // Server error or exception
    'exception': 500
  }

};


module.exports = constants;
