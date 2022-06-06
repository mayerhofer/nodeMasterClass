var http = require('http');
var StringDecoder = require('string_decoder').StringDecoder;

const waitMin = 500;
var count = 0;
const fetchP = (requestOptions, payload) => {
  count++;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    const req = http.request(requestOptions, res => {
      res.on('data', d => {
        buffer += decoder.write(d);
      });

      res.on('end', () => {
        buffer += decoder.end();
	count--;

        resolve(JSON.parse(buffer));
      });
    });

    req.on('error', err => {
      reject(err);
    });

    if (['POST','PUT'].indexOf(requestOptions.method)>=0) {
      req.write(payload);
    }

    req.end();
    }, count * waitMin); 
  });
}

/**
 * class RestAPI
 */
class RestAPI {
  /**
   * constructor
   * @param route The asset in DB to work with.
   */
  constructor(route) {
    this.defaultReqArgs = {
      port: 3002,
      hostname: 'localhost',
      path: '/'+route,
      headers: {
        'Content-Type': 'application/json',
	connection: 'Close',
      },
    };
  }

  genReqArgs(method, payload, id) {
    const assign = {
      method,
      ...this.defaultReqArgs
    };
    if (['PUT', 'POST'].indexOf(method) >= 0) {
      assign.headers['Content-Length'] = Buffer.
        byteLength(payload);
    }
    if (['PUT','DELETE'].indexOf(method)>=0) {
      assign.path += `/${id}`;
    }
    return assign;
  }
	

 async delete(element) {
    const details = this.
      genReqArgs('DELETE', null, element._id);

    const response = await fetchP(details, element);
 
    return response;
  }
  async insert(element) {
    const details = this.
      genReqArgs('POST', element);

    const response = await fetchP(details, element);
 
    return response;
  }
  async update(element) {
    const data = JSON.stringify(element);
    const details = this.
      genReqArgs('PUT', data, element._id);

    const response = await fetchP(details, data);

    return response;
  }

  async get() {
    const details = this.genReqArgs('GET');

    const response = await fetchP(details);
 
    return response;
  }
}

module.exports = RestAPI;

