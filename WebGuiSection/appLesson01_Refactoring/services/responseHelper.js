const buildLogObj = (logText) => {
  if (typeof (logText) === 'object') {
      let res = logText.obj;
      res.time = (new Date(res.time)).getTime();
      res.hour = res.time;

      return res;
  }
  let timeInx = logText.indexOf("time\":\"") + 7;
  let timeTxt = logText.substring(timeInx, timeInx + 24);
  let typeInx = logText.indexOf("type\":\"") + 7;
  let typeTxt = logText.substring(typeInx, typeInx + 5);
  let msgeInx = logText.indexOf("message\":\"") + 10;
  let stkTInx = logText.indexOf("stackTrace\":\"") + 13;
  let srceInx = logText.indexOf("source\":\"") + 9;
  let msgeTxt = logText.substring(msgeInx, msgeInx + logText.substring(msgeInx).indexOf("\""));
  let stkTTxt = logText.substring(stkTInx, stkTInx + logText.substring(stkTInx).indexOf("\""));
  let srceTxt = logText.substring(srceInx, srceInx + logText.substring(srceInx).indexOf("\""));
  typeTxt = typeTxt.indexOf("\"") > 0 ? typeTxt.substring(0, 4) : typeTxt;

  return {
      time: (new Date(timeTxt)).getTime(),
      hour: (new Date(timeTxt)).getTime(),
      type: ['info', 'warn', 'error'].indexOf(typeTxt.trim()) >= 0 ? typeTxt.trim() : false,
      message: msgeTxt,
      stackTrace: stkTTxt,
      source: srceTxt
  };
}

const convert = (item, route) => {
  const filter = { entity: route, _id: item._id, userId: item.userId };
  const obj = route === 'errorLog' ?
      buildLogObj(item) :
      item.data;

  return Object.assign(obj, filter);
}

module.exports = class ResponseHelper {
  constructor(response, route) {
      this.response = response;
      this.route = route;
  }

  hasOkStatus() {
      return [200,201,304]
.indexOf(this.response.status)
>= 0;
  }

  buildError() {
      const status = this.response.status;
      const text = this.response.statusText;
      const message = `API returned status ${status} and message '${text}'.`;

      return new Error(message);
  }

  async json() {
      return await this.response.json();
  }

  async text() {
      return await this.response.text();
  }

  async textToArray() {
      let array = JSON.parse(await this.response.text());
      return array.map(convert);
  }

  async jsonToArray() {
      let array = await this.response.json();
      return array.map(o => convert(o, this.route));
  }
}
