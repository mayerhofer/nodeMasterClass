var http = require('http');
var StringDecoder = require('string_decoder').StringDecoder;
var ResponseHelper = require('../responseHelper');

const endpoint = "http://localhost:3002/entities";

const fetchPromise = (details) => {
  return new Promise((resolve, reject) => {
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    const req = http.request('http://localhost:3002/entities?entity=cashflow', res => {
      res.on('data', d => {
        buffer += decoder.write(d);
      });

      res.on('end', () => {
        buffer += decoder.end();

        resolve(JSON.parse(buffer));
      });
    });

    req.on('error', err => {
      reject(err);
    });

    req.end();
  });
}

async function apiOperation(path, element, method, data) {
  let fetchOptions = {method};
  if (['POST', 'PUT'].includes(method)) {
    fetchOptions = Object.assign({}, {body: JSON.stringify(data), headers: {'Content-Type': 'application/json'}}, fetchOptions);
  }
  let response = new ResponseHelper(await fetch(path, fetchOptions));

  if (response.hasOkStatus()) {
    return element.elementId || await response.json();
  }

  throw response.buildError(response);
}

let operationData = (element, route) => {
  let data = element;
  let res = {_id: element._id, entity: route, data: data, userId: element.userId};

  delete data._id;
  delete data.entity;

  return res;
}

class RestAPI {
  constructor(route, profile) {
    this.route = route.trim();
    this.path = endpoint;
    this.profile = profile
  }

 async delete(element) {
    const _path = `${this.path}/${element._id}`;

    apiOperation(_path, element, 'DELETE');
  }
 async insert(element) {
    let data = operationData(element, this.route);

    apiOperation(this.path, element, 'POST', data);
  }
  async update(element) {
    const _path = `${this.path}/${element._id}`;
    let data = operationData(element, this.route);

    apiOperation(_path, element, 'PUT', data);
  }

  async get() {
    const filter = this.route;
    const requestDetails = {
      hostname: 'localhost',
      port: 3002,
      path: '/entities',
      method: 'GET',
    };
    const convert = (item, route) => {
      const filter = { entity: route, _id: item._id, userId: item.userId };
      const obj = route === 'errorLog' ?
          buildLogObj(item) :
          item.data;
    
      return Object.assign(obj, filter);
    }

    console.log('before fetch')
    const response = await fetchPromise(requestDetails);
    console.log('after fetch')
    console.log(JSON.stringify(response));

    return response.map(o => convert(o, this.route));

    return await fetchPromise(requestDetails);
    //let response = new ResponseHelper(await fetchPromise(requestDetails), filter);
    console.log('Before ok status')
    if (response.hasOkStatus()) {
      console.log('status OK')
      let res = (filter === 'errorLog' ? await response.textToArray() : await response.jsonToArray());
      return res;
    }
    
    throw response.buildError(response);
  }
}

module.exports = RestAPI;
