// Index
// 1 - Server - APIs
//     . Base/Util
//     . JSON API
// 2 - Global
// 3 - Framework
//     . Virtual DOM
//     . React Like Components
// 4 - Page - Single Page

// Main JS file

// Server - APIs

// Server - APIs - Base/Util
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
  const obj = route === 'errorLog' ?
      buildLogObj(item) :
      item;

  return obj;
}

class ResponseHelper {
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

// Server - APIs - End Base/Util
// Server - APIs - JSON API
const endpoint = "http://localhost:3002/";
const endpointCountries = "http://localhost:3004/countries";

class CountryAPI {
  static async getAll() {
    let response = new ResponseHelper(await fetch(endpointCountries, {method: 'GET'}));

    if (response.hasOkStatus()) {
      return await response.jsonToArray();
    } else {
      return [];
    }
  }
  static async getByName(name) {
    let response = new ResponseHelper(await fetch(endpointCountries + '/name/' + name, {method: 'GET'}));

    if (response.hasOkStatus()) {
      return await response.json();
    } else {
      return [];
    }
  }
}

async function apiOperation(path, element, method) {
  let fetchOptions = {method};
  if (['POST', 'PUT'].includes(method)) {
    fetchOptions = Object.assign({}, {body: JSON.stringify(element), headers: {'Content-Type': 'application/json'}}, fetchOptions);
  }
  let response = new ResponseHelper(await fetch(path, fetchOptions));

  if (response.hasOkStatus()) {
    return element.elementId || await response.json();
  }

  throw response.buildError(response);
}

class RestAPI {
  constructor(route, profile) {
    this.route = route.trim();
    this.path = endpoint + this.route;
    this.profile = profile
  }

 async delete(element) {
    const _path = `${this.path}/${element._id}`;

    apiOperation(_path, element, 'DELETE');
  }
 async insert(element) {
    apiOperation(this.path, element, 'POST');
  }
  async update(element) {
    const _path = `${this.path}/${element._id}`;

    apiOperation(_path, element, 'PUT');
  }

  async get() {
    const _path = this.path;
    const fetchOptions = {method: 'GET'};

    let response = new ResponseHelper(await fetch(_path, fetchOptions), this.route);
    if (response.hasOkStatus()) {
      let res = (this.route === 'errorLog' ? await response.textToArray() : await response.jsonToArray());
      return res;
    }
    
    throw response.buildError(response);
  }
}

// Server - APIs - End JSON API
// End Server - APIs

// Global
window.application = {
  state: {},
  registeredComponents: {},
  handlers: {},
  virtualDom: undefined,
  callHandler: function(event, id) {
    let handler = window.application.handlers[id];
    if (typeof handler === 'function') {
      handler(event);
    }
  },
};
// End Global

// Framework
// Framework - Virtual DOM
// Function "Secret Sauce" to replace page elements instead of asking browser to rewrite the page.
// It transform render HTML text into HTMLElements for a call to child replace.
// Avoids overuse of the innerHTML property and/or the need to re-render siblings.
const parseHtmlToElement = function(id, str) {
  let start = str.substring(str.indexOf('<') + 1);
  let tag = start.substring(0, start.indexOf(' '));
  let element = window.document.createElement(tag);
  let endInx = Math.min(start.indexOf('>'), start.indexOf('/>') < 0 ? start.indexOf('>') : start.indexOf('/>'));
  let propsStartInx = start.indexOf(' ') + 1;
  let childrenEnd = str.lastIndexOf(`</${tag}>`);
  let childrenStart = str.indexOf('>') + 1;

  // Mandatory uppon updating (re-rendering)
  element.setAttribute('id', id);

  // Read main tag properties
  if (propsStartInx < endInx) {
    // TODO: Fix a bug -> some property values could have spaces inside them breaking the parsed result
    // For now I removed empty space from params in handler call from Button, but please fix the split below.
    let props = start.substring(propsStartInx, endInx).split(' ').reduce((previous, kvp) => {
      let propName = kvp.substring(0, kvp.indexOf('='));
      let propValue = kvp.substring(kvp.indexOf('=') + 1);
      let result = {};
      result[propName] = propValue;
      return Object.assign(previous, result);
    }, {});

    let keys = Object.keys(props);
    keys.forEach(key => {
      if (key === 'class') {
        element.className = props[key].split('"')[1];
      } else if (key != 'id') {
        element.setAttribute(key, props[key].split('"')[1]);
      }
    });
  }

  // Read children if any
  if (childrenEnd > 0 && childrenStart < childrenEnd) {
    element.innerHTML = str.substring(childrenStart, childrenEnd);
  }

  return element;
}
class TreeNode {
  constructor(value, ancestral) {
    if (typeof value !== 'object' || !(value instanceof RComponent)) {
      console.log(value)
      throw 'Argument "value" must be an instance of a class that extends RComponent.';
    }
    if (value.id === 'app' && ancestral) {
      throw 'Argument "ancestral" must be null/undefined when node is the root element.';
    }
    if (value.id !== 'app' && !(ancestral instanceof TreeNode)) {
      throw 'Argument "ancestral" must be instance of TreeNode/Component. Element id: ' + value.props.id;
    }
    this.value = value;
    // Any components being rendered by the value component. All should be TreeNode instances.
    this.descendants = [];
    // Component that renders the value component. Should be TreeNode instance.
    this.ancestral = ancestral; // Can be null if value is Root Component.
    // Property to store virtual DOM.
    this.virtualDom = '';
  }

  static initialized() {
    let root = window.application.registeredComponents['app'];
    if (! root) {
      // Build And Register Root
      root = window.application.registeredComponents['app'] = new TreeNode(new App({id: 'app'}));
    }

    return root;
  }

  static getRegistered(id) {
    return window.application.registeredComponents[id] ?? false;
  }

  addDescendant(node) {
    if (node instanceof TreeNode) {
      this.descendants.push(node);
    } else {
      throw 'Argument "node" (descendant) must be of type TreeNode.';
    }
  }

  releaseDescendants() {
    let item = this.descendants.pop();
    while (item) {
      item.value.unmount();

      item = this.descendants.pop();
    }
  }

  hasDescendant() {
    return this.descendants.length > 0;
  }

  findDescendant(id) {
    let found = null;
    if (Array.isArray(this.descendants)) {
      for (let i=0; i<this.descendants.length; i++) {
        if (this.descendants[i].value.id.startsWith(id, 0)) {
          found = this.descendants[i];
          break;
        }
      }
    }

    return found;
  }

  register() {
    if (this.ancestral) {
      this.ancestral.addDescendant(this);
    }

    let obj = window.application.registeredComponents;
    console.log('inside register. Props.id = ' + this.value.props.id)
    Object.keys(obj).forEach(key => console.log(key))

    if (typeof this.value.props.id === 'string' && this.value.props.id.trim().length > 0) {
      // TODO: This can still generate repeated ids, change this solution for IDs.
      this.value.id = this.value.props.id + '_' + (Math.random()*100000).toFixed();
      console.log('registering: ' + this.value.id)
      window.application.registeredComponents[this.value.id] = this;
      console.log('new node registered')
      console.log('node id: ' + this.value.id)
      Object.keys(window.application.registeredComponents).forEach(key => console.log(key))
    } else {
      throw 'Invalid RComponent: property id is missing or invalid.';
    }
  }

  unregister() {
    if (typeof this.value.id === 'string' && this.value.id.trim().length > 0) {
      if (window.application.registeredComponents[this.value.id]) {
        delete window.application.registeredComponents[this.value.id];
      }
    } else {
      throw 'Invalid RComponent: property id is missing or invalid.';
    }
  }
}
// End Framework - Virtual DOM
// Framework - React Like Components (BASE Component Class)
class RComponent {
  constructor(props) {
    this.props = props;
  }

  //static icons

  static templates = {
    labelField: `
      <li class="direction-option">
        <input type="radio" id="{field.alias}" name="label" value="{field.label}" alt="{field.label}" {field.checked} onchange="window.application.callHandler(this, '{field.id}')">
        <label for="{field.alias}">
          <img class="img-swap icon-big" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABmJLR0QA/wD/AP+gvaeTAAA{field.img}"/>
        </label>
      </li>`,
    radioField: `
    <label class="rad-label">
      <input type="radio" class="rad-input" name="{radio.id}" value="{radio.value}" onchange="window.application.callHandler(this,\'{radio.id}\')">
      <div class="rad-design"></div>
      <div class="rad-text">{radio.label}</div>
    </label>
    `,
    labelsField: `<div id="{field.id}" class="container"><ul class="direction">{field.content}</ul></div>`,
    simplediv: '<div class="{div.className}">{div.content}</div>',
    div: '<div id="{div.id}" class="{div.className}">{div.content}</div>',
    scrollDiv: '<div id="{div.id}" class="scrollable" onscroll="window.application.callHandler(this,\'{div.id}\')">{div.content}</div>',
    button: '<button id="{button.id}" type="button" class="{button.className}" onClick="window.application.callHandler(this,\'{button.id}\')">{button.content}</button>',
    simplebutton: '<button type="button" class="{button.className}" onClick="window.application.callHandler(this,\'{button.id}\')">{button.content}</button>',
    comboBox: '<div id={cb.id}><input class="{cb.className}" type="text" list="{cb.comboId}"{cb.value} onchange="window.application.callHandler(this,\'{cb.comboId}\')"><datalist id="{cb.comboId}" class="comboBox">{cb.options}</datalist></div>',
    tablePagination: '<div id="{pagination.id}" class="pagination"><span>Rows per page:&nbsp;</span>{pagination.cbRowsPerPage}{pagination.carrosel}</div>',
    container: '<div id="{container.id}" class="{container.className}">{container.content}</div>',
    th: '<th id="{cell.id}">{cell.children}</th>',
    simple_li_click: '<li onclick="{li.click}">{li.content}</li>',
    thead: '<thead id="{row.id}"><tr id="th{row.id}">{row.content}</tr></thead>',
    form: '<form id="{form.id}" class="{form.className}" onsubmit="window.application.callHandler(this,\'{form.id}\')">{form.fields}</form>',
    //textField: '<div id="{text.id}" class="{text.className}"><label for="{this.inputId}">{text.name}</label><input type="text" id="{this.inputId}" onchange="window.application.callHandler(this,\'{text.id}\')" /></div>',
    textField: `
    <div id="{field.id}" class="container">
      <div class="textfield {field.invalidDiv}">
        <input id="{field.id}Input" required class="{field.invalid}" type="text" maxlength="30" placeholder="{field.label}" onchange="window.application.callHandler(this,\'{field.id}Change\');" value="{field.value}" />
        <label for="{field.id}Input" class="field-label {field.invalid}">{field.label}</label>
        <div class="containerIcon">
          <div id="{field.id}InputErrorIcon" class="invalidIcon {field.hideError}" onmouseover="displayInvalidTooltip">!</div>
        </div>
      </div>
      <div id="{field.id}InputTooltip" class="tooltip {field.hideError}">{field.validationMessage}</div>
    </div>`,
    bookField: `
    <div id="{field.id}" class="book-dropdown">
      {field.input}
      <div class="book-dropdown-content">
        {field.list}
      </div>
    </div>`,
    simpleTextField: `<div id="{field.id}" class="container">
    <div class="textfield {field.invalidDiv}">
      <label for="{field.id}Input" class="field-label {filed.hideLabel} {field.invalid}">{field.label}</label>
      <input id="{field.id}Input" class="{field.invalid}" type="text" maxlength="30" placeholder="{field.label}" onchange="window.application.callHandler(this,\'{field.id}Change\');" onfocus="window.application.callHandler(this,\'{field.id}Focus\');" onblur="window.application.callHandler(this,\'{field.id}Blur\');" value="{field.value}" />
      <div class="containerIcon">
        <div id="{field.id}InputErrorIcon" class="invalidIcon {field.hideError}" onmouseover="displayInvalidTooltip">!</div>
      </div>
    </div>
    <div id="{field.id}InputTooltip" class="tooltip {field.hideError}">{field.validationMessage}</div>
  </div>`,
    amountField: `<div id="{field.id}" class="container">
    <div class="textfield">
      <div class="amount-currency-container">
        <div class="currency-dropdown">
          <label>{field.currency}</label>
          <div class="currency-dropdown-content">
            {field.currencyList}
          </div>
        </div>
      </div>
      <label for="{field.id}Input" class="field-label hide">{field.label}</label>
      <input id="{field.id}Input" class="amount-input" type="number" maxlength="30" min=0 step=0.01 value={field.value} placeholder="{field.label}" onchange="window.application.callHandler(this, '{field.id}')" />
      <div class="direction-container">
        <ul class="direction">
          <li class="direction-option">
            <input type="radio" id="income" name="{field.id}Direction" value="income" alt="Income" {field.incomeChecked} onchange="window.application.callHandler(this, '{field.id}Dir')">
            <label for="income">
              <img class="img-swap icon-small" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABmJLR0QA/wD/AP+gvaeTAAADmElEQVR4nO2bS0hUURjHf41KYmgZBRE9QFqUPaQgohZRYJsgCCMzCtJVQdEm0iAMKloEQbSIiGhVUBG0iB6IC5WgZS1UKowIo4VZCL1MMm1xZnDOQWfuedxzRq8/ODhX7vnu//vu3O9+5zGQPNYB3cBHYG9gLd4pQTg/nm79YeX4p4UJ58eB3rBy/LIC+IkcgLqgijzzGNn552Hl+GUfsvO/gKqgijxSDnxCDkBLUEWeuYrsfA/ibZAINgB/mXB+DNgRVJFHUsBL5Lt/K6gizxxHdv4rsCioIo8sAYaQA3BkshPneBSlSyvQAJQa9C0HFmcddwE7EYGYFhxGvns2bQRY41e+HaWIkZqrAFzMdbHiODyw5CSwMuv4OyKB6TIKtAEXXIjyRSXwDfkO1gZV5JlryM4/DSvHL1XAHyacH0XM3iSGhyS4atuCqNMzzv8GlgVV5JkXyHf/fFg5fqlDdn4AqAiqyCMlwDvkABwNqsgzJ5Cdf4vn4szFxVZjlrBSwDnlf82I19+04QruavYuz9qt2Y786rJpY8BWv/LtmAu8wd3dD1b0mOaAZsSzn6EfuGdoqwe4b9jXGpMZoVWIBcbsmZo9wBMniqKxELiU1mLKEIZD5Tbkr+8jCxGm3MDNo6e9ONqgGPgBLLdyxYwO3ARgXOeiFcBnpfMpa1fMCBKA60rHbsItMakBiL3vZkSFlun0D9imeWGXOAtAKkKHIuBm+m+G24hlp2lPlDrgGLAx63gQOBPRfhmwCbPFDRBTZK8QEyS50Jk4rdQRMB/hcPbXbdIlpiku9B79pKS2PmCBYttbElR3VnQRvXiqdyhyf1wByJcDXgPD6c/DiMchatIpi3heFOY5tCWRLwd8QExY7gLaEQMgU54hXp1RWA/s1rB9WePcg4gdY7HTiPx1a3TY1+trcEaT+AAUI563VjTfjwp9wFnEEHMqTgOHItpbqnn9do1za7IPioEH2G8gqEU8U8dznFOdbnFgvIKcwt3uibici5XE5wA1AJ2ISi9q06FJw26Tpm0dzZ3ZHWe/AaEFhEYthSuJb09OtYZt3YRqNRx2NWLrUOyq5axNy1cKxzYanPEkPgBqDtBd4tL55UXBDodzPcf50MkBs8PhQiTxAVBzQA16Q0sdCnY4nE3chVBBDocHHYlQ7biyC/BFOTbZPj+l3QPpDzYVVQ+wVjFeBNxF/GLD1O4IcAd5WQ7EJupeS80DQP1/Q7c2KrewnUoAAAAASUVORK5CYII="/>
            </label>
          </li>
          <li class="direction-option">
            <input type="radio" id="expense" name="{field.id}Direction" value="expense" alt="Expense" {field.expenseChecked} onchange="window.application.callHandler(this, '{field.id}Dir')">
            <label for="expense">
              <img class="img-swap icon-small" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAABmJLR0QA/wD/AP+gvaeTAAABGUlEQVRIie3UPUvDUBQG4Ad161AQXfwCQTo66yIiDoqO4tw/UcRd0NH/4OBmB0HE2UkQBAdxbV0cHBShqGAdjBSKtyRtLnTICweS3JDncLk5FCkyBNnCE9oDVhObWeBmDuhfNULINk7wgPfk5agZx3mgy2hZwGOCvKCGRUxgNNDMIAWW8Zw8uMPcP43lDu+ildycoRTYkdzh7+TiECMBNAr8gWoPMAR/4hhTmMFFVnglBdoN11HpWp/NCqdNG7dYDazPx4KrwmeghMtYcCgV3GdEgyMzbXbw2ge60S84hiOdX7GOct/tp8w0rhPwC3uxQVjXGa0NLMXEyljDqc7WXmFy0A9nORgt7Os9WnOD33CDA7+jsUiR4c4PF/oFIjYEfRAAAAAASUVORK5CYII="/>
            </label>
          </li>
        </ul>
      </div>
    </div>
  </div>`,
    dateTextField: `<div id="{field.id}" class="container container-date">
    <div class="datefield">
      <label for="{field.id}Input" class="field-label">{field.label}</label>
      <input id="{field.id}Input" type="date" maxlength="30" value="{field.value}" onchange="window.application.callHandler(this, '{field.id}')" />
    </div>
  </div>`,
    flag: '<img id="{img.id}" class="{img.className}" title={img.title} onClick="window.application.callHandler(this,\'{img.id}\')" alt="{img.title}" src="data:image/png;base64,{img.imgBase64}" />',
    countryField: `
    <div id="{field.id}" class="country-dropdown">
      {country.selected}
      <div class="country-dropdown-content">
        {country.list}
      </div>
    </div>`,
    imgButton: `
    <button id={btn.id} class="{btn.className}" onclick="window.application.callHandler(this, '{btn.id}')" {btn.disabled}>
      <img src="data:image/png;base64,{btn.img}"/>
    </button>`,
    liabilityButton: `
    <div id={btn.id} class="{btn.className}">
      <input class="m-modal__toggle" type="checkbox">
      <div class="m-modal__backdrop"></div>
      <div class="m-modal__content">{btn.content}</div>
      <img src="data:image/png;base64,{btn.img}"/>
    </div>`,
    save: `
      <button id={save.id} class="{save.className}" onclick="window.application.callHandler(this, '{save.id}')" {save.disabled}> 
      <img
      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAADt0lEQVRoge2YvWsUQRjGn9m7fBg/iJLEJo2NAbFRtPQfSCEpFOwshPSpYhMUq4CojQr+C4JRCyWNgqAgsVUkhSAYNGcgGtDkEnPvY7E7u7Ozs7O3J5tEuBfm9m5m7+b3zPsxswd0rWtd69pumsobOPNydZxUD0iMEgBArC4343FuNfH+wgigFBQAAgAJkhDzKgIRQihgdBUhRAQtEUjciImFLdQOHflJUTc+TgzfaUdAkDdgw4eEaQthjGbAkwQluoIgEfUjHgeTn6Z+JQahePvE48b1dgTU8wWk4R38EAknVUqFq48IDkjgjXb6/uvU999cORuCh6pAPQkBUera2JPv/YsTI1d9AvI9YMO7PCAShopefQ0tAjJsYngiu0g0vJJMrN8qcnpsrjHbkYAieAARtBlCOr6ZhJMkYZUvIAkpJoORCkwfn1ueKi+gAB5AnHy6UYuwhNArQIcdM/B6fgU1k8eQnwMWvBNAomlVci9jz6UTVkSyC2B7wAEfdR0uLaAIHgg9EMInChjNbMLrkpqZglFZjUPICQ9fGOQLKIAHwhW0XaXvTycoQWY9YFaqsKKVgy8UYMK7dLjCwtzQ4rKakwM6V2jc74T3aPDsA354qADL6y2M9CebuZmEjPMgaa8unzIqk8QeEApWmoxxbHifDzxl1IInEAQJrKr34OaHJr6tb2eOBa24pEqmUqXKrYbfIO59DhD07XPDd+IBGx4A+g/UsPGrBQoBpfDu9wAuvf0DcLtoHbRsADVHt0JvXx1BX28peK8AG54g6vUABweDdEix1wgde9L08SCvziddbvjOQ8iq7Slh0YcdgfdUQu9OvNfh/QL+A3ivgL0E79NRHEJ7GN4vYC/Be0QUl1EL/txQD2ZODmCkT8UPNOaJ0/fZPPfYfY2m4NanGhbWggw8PQoKd2J75f8dPtsvIhjqIaaObZeCB4pOo46wqQJevx/qsUPRjC23eZLYHfNVwacfatqD9wrIS9gq4ZPn4jR8Z2XUAR9Wm+rgRaQUvF9ATqmsFJ7l4L0C8up8lfA6hGx4epQU7sSZTapCeA3aLrxfgAseqBQ+bO3DFwjIwusfrQre/JMgBd9JFXLBo2L4JITS8D4/FJbRr4/m0Xj4NDmYVQhv5sGP+RdYe/bcKiZlBETKg9YmatubumtH4GHOW6DA99/oEoDRoxfPx/Ag0GgSw73VwK9sqXjyQ+Pj8aQkvpT2gBCT+ovmIswutrDclErg7y7ttzbQEF4UJ3Nd0LWuda1ru2p/ASsCdZ0lM904AAAAAElFTkSuQmCC"/>
      </button>
    `,
  };

  static compare(prevState, nextState) {
    if (prevState === nextState) {
      return true;
    } else if (typeof prevState !== typeof nextState || Array.isArray(nextState) !== Array.isArray(prevState)) {
      return false;
    } else if (Array.isArray(nextState)) {
      if (nextState.length !== prevState.length) {
        return false;
      } else if (nextState.length <= 0) {
        return true;
      }
      for (let i=0; i<nextState.length; i++) {
        if (! RComponent.compare(prevState[i], nextState[i])) {
          return false;
        }
      }
    } else if (typeof nextState === 'object') {
      const keys = Object.keys(nextState);

      for (let i=0; i<keys.length; i++) {
        if (! RComponent.compare(prevState[keys[i]], nextState[keys[i]])) {
          return false;
        }
      }
    } else if (nextState !== prevState) {
      return false;
    }
    return true;
  }

  static build(treeParent, props, buildFunc) {
    if (typeof treeParent !== 'object' || !(treeParent instanceof TreeNode)) {
      throw 'Method "build", argument "treeParent" missing. Id: ' + (props ? props.id : '');
    }
    if (typeof props !== 'object') {
      throw 'Method "build", argument "props" missing. ParentId: ' + (treeParent ? treeParent.value.id : '');
    }
    if (typeof buildFunc !== 'function') {
      throw 'Method "build", argument "buildFunc" missing. Id: ' + props.id;
    }
    // Find current node to add future child/descendant component in Tree.
    const found = treeParent.findDescendant(props.id);
    if (found) {
      // Check client rule for if should update
      if (typeof found.value.shouldComponentUpdate !== 'function' ||
          found.value.shouldComponentUpdate(props, found.value.state)) {

        // If rule exist or if there a real difference, re-render.
        if (!RComponent.compare(found.value.props, props)) {
          found.virtualDom = found.value.render();
        }
      }
      // return previously rendered from Tree.
      return found.virtualDom;
    } else {
      // New instance: build and mount component.
      const comp = buildFunc(props);
      const rendered = comp.mount(treeParent);

      // After mounting, return rendered HTML.
      return rendered;
    }
  }

  static buildRoot(props, buildFunc) {
    const tNode = TreeNode.initialized();
    const htmlRoot = window.document.getElementById('app');

    if (tNode.hasDescendant()) {
      let leafToFall = tNode.descendants.pop();
      leafToFall.value.unmount();
    }

    htmlRoot.innerHTML = RComponent.build(tNode, props, buildFunc);
  }

  buildRComponent(props, buildFunc) {
    const tNode = TreeNode.getRegistered(this.id);

    return RComponent.build(tNode, props, buildFunc);
  }

  setState(nextState) {
    if (nextState == null || typeof nextState === 'undefined'){
      return;
    }
    // TODO: Check how to use shouldComponentUpdate when props change
    if (! RComponent.compare(this.state, nextState)) {

      let newState;
      
      console.log('setState will call update for: ' + this.id)
      if (typeof nextState === 'object') {
        newState = Object.assign({}, this.state, nextState);
      } else if (typeof nextState === 'function') {
        newState = nextState(this.state, this.props);
      } else {
        throw 'Argumento (nextState) invalido.';
      }
      if (typeof this.shouldComponentUpdate !== 'function' ||
          this.shouldComponentUpdate(this.props, newState)) {
        // Trigger re-render
        this.state = newState;
        this.update();
      } else {
        // State object needs to be updated even if rerendering does not happen.
        this.state = newState;
        console.log('THOU SHALL NOT PASS')
      }
    } else {
      console.log('THOU SHALL NOT PASS')
    }
  }
  mount(ancestral) {
    // Register component in Tree.
    let node = TreeNode.getRegistered(this.id);
    if (! node) {
      node = new TreeNode(this, ancestral);
      node.register();
    }

    // Trigger component lifecycle method if implemented.
    if (typeof this.componentDidMount === 'function') {
      this.componentDidMount();
    }

    // Render through Virtual DOM
    node.virtualDom = this.render()
    return node.virtualDom;
  }
  update() {
    const child = window.document.getElementById(this.id);

    if (typeof child === 'object' && child instanceof HTMLElement) {
      const htmlParent = child.parentElement;

      if (htmlParent) {
        //tNode.releaseDescendants();
        const newNode = parseHtmlToElement(this.id, this.render());
        htmlParent.replaceChild(newNode, child);
      } else {
        throw `Parent html element not found for child (${this.id}).`;
      }
    } else {
      throw `Child to be replaced upon update is not a HTMLElement. Child id (${this.id}).`;
    }
  }
  unmount() {
    // Trigger component lifecycle method
    if (typeof this.componentWillUnmount !== 'function' || this.componentWillUnmount()) {
      console.log('unmounting. Nodes registered')
      Object.keys(window.application.registeredComponents).forEach(key => console.log(key));
      const tNode = TreeNode.getRegistered(this.id);
      if (tNode instanceof TreeNode) {
        tNode.releaseDescendants();
        tNode.unregister();
      } else {
        console.log(tNode, this.id, window.application.registeredComponents)
        throw 'Found an item not a TreeNode in Tree';
      }
    }
  }
  registerHandler(id, callback) {
    window.application.handlers[id] = callback;
  }
  fill(itemTemplate, data) {
    let temp = RComponent.templates[itemTemplate] ?? itemTemplate;
    let inx = temp.indexOf('{');
    while(inx>=0) {
      let end = temp.indexOf('}');
      let prop = temp.substring(inx + 1, end);

      temp = temp.replace('{' + prop + '}', data[prop.substring(prop.indexOf('.') +1)]);

      inx = temp.indexOf('{');
    }
    return temp;
  }
}
class App extends RComponent {
  constructor(props) {
    super(props);

    // App should not mount, nor render.
    // Id should stay as 'app'.
    // Class was made in order to reuse UPDATE and BUILDRCOMPONENT methods.
    this.id = 'app';
  }
}
// End Framework - React Like Components
// End Framework

// Page - Single Page - App

// Page - Single Page - End App

// Page - Single Page - State
// Page - Single Page - End State

// Page - Components
// Page - Components - Button
class Button extends RComponent {
  // props: {id, className, content, clickHandler}
  handleClick(e) {
    if (typeof this.props.handleClick === 'function') {
      this.props.handleClick();
    }
  }

  render() {
    this.registerHandler(this.id, this.handleClick.bind(this));

    return this.fill('button', Object.assign({}, this.props, {id: this.id}));
  }
}
// Page - Components - End Button
// Page - Components - ComboBox
class ComboBox extends RComponent {
  // props: {id: string, className: string, data: string[], selected: string, handleChange: function}
  constructor(props) {
    super(props);

    this.state = {
      selected: props.selected,
    }
  }

  handleChange(elem) {
    this.setState({selected: elem.value});
    if (typeof this.props.handleChange === 'function') {
      this.props.handleChange(elem.value);
    }
  }

  render() {
    let props = this.props;
    let state = this.state;
    let comboId = 'cb' + this.id;
    let options = props.data.map(item => `<option${item == state.selected ? " selected" : ""}>${item}</option$>`);

    this.registerHandler(comboId, this.handleChange.bind(this));

    return this.fill('comboBox', {id: this.id, className: props.className, comboId, value: state.selected ? ` value="${state.selected}"` : '', options: options.join('')});
  }
}
// Page - Components - End ComboBox
// Page - Components - Table Pagination
class TablePagination extends RComponent {
  // props: {id, rowCount, rowsPerPageCallback, pageCallback}
  constructor(props) {
    super(props);

    this.state = {
      id: 'cfMainTablePaging',
      rowsPerPage: 5,
      currentPage: 0,
    };
  }

  handleChange(event) {
    let value = event.value;
    this.setState({rowsPerPage: parseInt(value)});
  }
  getClickHandler = () => function() {
    this.pageCallback(this.value);
  };

  render() {
    const buttons = [];
    const props = this.props;
    const rowsPerPage = this.state.rowsPerPage;
    const pageCount = props.rowCount / rowsPerPage;

    const cbProps = {
      id: 'paginationCb',
      className: 'paginationCb',
      data: ['5', '10', '25'],
      selected: rowsPerPage.toString(),
      handleChange: props.rowsPerPageCallback, 
    };
    const mountedCb = this.buildRComponent(cbProps, p => new ComboBox(p));

    const buildBtn = p => new Button(p);
    for (let i=0; i< Math.min(pageCount, 3); i++) {
      const handleClick = this.getClickHandler().bind({pageCallback: this.props.pageCallback, value: i});
      const btnProps = {id: 'tablePaging'+i, className: 'paginationButton', content: i * rowsPerPage, handleClick};

      buttons.push(this.buildRComponent(btnProps, buildBtn));
    }
    if (pageCount > 3) {
      const btnProps = {id: 'tablePagingNext', className: 'paginationButton', content: '...'};

      buttons.push(this.buildRComponent(btnProps, buildBtn));
    }
    return this.fill('tablePagination', {id: this.id, cbRowsPerPage: mountedCb, carrosel: buttons.join('')});
  }
}
// Page - Components - End Table Pagination
// Page - Components - Container
class Container extends RComponent {
  // props: {id: string, className: string, content: <props, buildFunc>[]}
  render() {
    let c = this;
    let content = (c.props.content ?? []).map(item => c.buildRComponent(item.props, item.buildFunc)).join('');
    let cProps = Object.assign({}, c.props, {content, id: this.id});

    return this.fill('container', cProps);
  }
}
// Page - Components - End Container
// Page - Components - Generic Component
class LeafComponent extends RComponent {
  constructor(tagName, props) {
    super(props);
    this.tagName = tagName;
  }
  render() {
    return this.fill(this.tagName, this.props);
  }
}
// Page - Components - End Generic Component
// Page - Components - Header Row
class HeaderRow extends RComponent {
  // props: {id, columns}
  render() {
    const mapFunc = col => this.buildRComponent({children: col, id: col}, p => new LeafComponent('th', p));
    let cells = this.props.columns.map(mapFunc);

    return this.fill('thead', {id: this.id, content: cells.join('')});
  }
}
// Page - Components - End Header Row
// Page - Components - Table
class Table extends RComponent {
  // props: {id, className, columns, data}
  constructor(props) {
    super(props);

    this.state = {
      rowsPerPage: 5,
      page: 0,
    }
  }

  getRowsPerPageHandler() {
    let handler = function(value) {
      this.setState({rowsPerPage: value});
    };

    return handler.bind(this);
  }
  getPageHandler() {
    let handler = function(value) {
      this.setState({page: value});
    };

    return handler.bind(this);
  }

  static main = '<table id="{table.id}" class="{table.className}">{table.header}<tbody>{table.rows}</tbody></table>';
  static row = '<tr>{row.content}</tr>';
  static cell = '<td>{cell.content}</td>';

  render() {
    let props = this.props;
    let filteredRows = this.props.data.slice(this.state.page * this.state.rowsPerPage, (this.state.page + 1) * this.state.rowsPerPage);

    let table = this;

    let colToCell = (row, col) => {
      return table.fill(Table.cell, {content: row[col]});
    }
    let rowToStr = (row) => {
      return table.fill(Table.row, {content: props.columns.map(col => colToCell(row, col)).join('')});
    }

    let rows = filteredRows.map(rowToStr);

    let header = this.buildRComponent({id: 'cfHeaderRow', columns: props.columns}, p => new HeaderRow(p));
    return this.fill(Table.main, {id: this.id, className: this.props.className, rows: rows.join(''), header});
  }
}
// Page - Components - End Table
// Page - Business Components - Finance Table
class FinanceTable extends RComponent {
  constructor(props) {
    super(props);

    this.state = {
      data: this.props.data,
      last: 30,
    }

    this.util = {
      formatter: {
        date: (date) => {
          let obj = new Date(date);
          let day = obj.getDate();
          let month = obj.getMonth();
          let strDay = day < 10 ? '0' + day.toString() : day.toString();
          let strMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month];
  
          return `${strDay}/${strMonth}`;
        },
        provider: (str) => {
          if (typeof str === 'string') {
            return str.length > 17 ? str.substring(0, 15) + '...' : str;
          } else {
            return 'error: invalid provider';
          }
        },
        amount: (num) => {
          if (typeof num === 'number') {
            return num.toFixed(2);
          } else {
            return '--';
          }
        },
        currency: (cur) => {
          // TODO: replace by ASCII currency symbols inside badge component
          return cur;
        }
      },
    };
  }
  rowToHtml(row) {
    const formatter = this.util.formatter;
    const date = this.fill('simplediv', {className: 'cashflowDate', content: formatter.date(row.date)});
    const provider = this.fill('simplediv', {className: 'cashflowProvider', content: formatter.provider(row.provider)});
    const amount = this.fill('simplediv', {className: 'cashflowAmount' + (row.direction ? ' income' : ' expense'), content: formatter.amount(row.amount)});

    return this.fill('simplediv', {className: 'cashflowRow', content: date + provider + amount});
  }
  handleAddNew() {
    if (typeof this.props.callInput === 'function') {
      this.props.callInput();
    }
  }
  handleScroll() {
    this.setState({last: this.state.last + 20});
  }
  render() {
    const content = this.fill('scrollDiv', {
      id: this.id + 'content', 
      content: this.state.data.slice(0, this.state.last).map(this.rowToHtml.bind(this)).join('')
    });
    const label = this.fill('simplediv', {className: 'financialLabel', content: (new Date()).toISOString().substring(0, 10)});
    const buttonId = 'AddNewCashflow';
    const button = this.fill('button', {id: buttonId, className: 'cashflowButtonAdd', content: '<span>+</span>'});
    const header = this.fill('simplediv', {className: 'financialHeader', content: label + button});

    this.registerHandler(this.id + 'content', this.handleScroll.bind(this));
    this.registerHandler(buttonId, this.handleAddNew.bind(this));

    return this.fill('div', {id: this.id, className: 'cashflowTable', content: header + content});
  }
}
/////////////////////////////////////////////
// Page - Components - Form Text Field
class TextField extends RComponent {
  // props = {label: 'Provider', value: provider.value, validDef: {restricted: false, required: true, options: []}}
  constructor(props) {
    super(props);

    this.state = {
      hideError: ' hide',
      invalidDiv: '',
      invalid: '',
      validationMessage: '',
      placeholder: this.props.label,
      value: this.props.value,
    };
  }
  handleValidation(val) {
    const props = this.props.validDef;
    const isFieldEmpty = typeof val !== 'string' || val.trim().length <= 0;
    const hasValue = ! isFieldEmpty;
    const isInOptions = props.options ? props.options.indexOf(val) >= 0 : false;
    const bIsValid = props.restricted ? isInOptions : (props.required ? hasValue : true);
    const newState = {...this.state};
    
    newState.hideError = bIsValid ? ' hide' : '';
    newState.invalid = bIsValid ? '' : 'text-red';
    newState.invalidDiv = bIsValid ? '' : 'border-red';
    newState.validationMessage = bIsValid ? '' : (isFieldEmpty ? '* Required Field' : '* Not a valid option.');
    newState.value = val;

    console.log(newState)
    
    this.setState(newState);
  }
  handleUpdate(e) {
    let newValue = e.value;

    this.props.update(newValue);
    this.handleValidation(newValue);
  }
  render() {
    const prefix = this.id;
    const fieldProps = {
      id: prefix,
      label: this.props.label,
      ...this.state,
    };

    this.registerHandler(prefix + 'Change', this.handleUpdate.bind(this));
    
    return this.fill('textField', fieldProps);
  }
}
// Page - Components - End Form Text Field
/////////////////////////////////////////////
const currencies = {
  'EUR': '&euro;', // €
  'USD': '&dollar;', // $
  'GBP': '&pound;', // £
  'PLN': 'Z&#322;', // Zł
  'BRL': 'R&dollar;', // R$
  'CZK': 'K&#269;', // Kč
}
/////////////////////////////////////////////
// Page - Components - Labels
class Labels extends RComponent {
  constructor(props) {
    super(props);

    this.state = {
      selected: this.props.selected ?? [],
      labels: this.props.labels ?? [],
    };
  }
  // Load flag images
  componentDidMount() {
    // Inside asynchronous methods, context of this is lost.
    let field = this;

    // Load flags only if not already loaded to avoid infinite loop
    if (!Array.isArray(field.state.labels) || field.state.labels.length <= 0) {
      // Countries list in DB is huge but not necessary here in this form. Best to change source code to add countries when required.
      const uniqueCountries = ['Poland', 'Italy', 'Scotland', 'Brazil', 'Spain'];
      // Istead of getting all and then filtering, better to make multiple requests since we don't need many countries.
      Promise.all(uniqueCountries.map(c => CountryAPI.getByName(c))).then(data => {
        setTimeout(() => {
          // Result returns one array with each object. Combine them in a single array removing undefined results.
          let countries = data.flat().filter(item => item !== undefined);

          field.setState({countries});
        }, 1000);
      });
    }
  }
  handleChange(e) {
    this.setState({country: e.title});

    this.props.handleChange(e.title);
  }
  buildCountryProps(c) {
    let id = this.id + c.name.replace(/\s/g, '');
    this.registerHandler(id, this.handleChange.bind(this));

    return {id, title: c.name, imgBase64: c.flag};
  }
  getFlagProps() {
    const found = this.state.countries ? this.state.countries.find(c => c.name === this.state.country) : undefined;
    const flag = found ? found.flag : '';

    return {id: this.state.country, imgBase64: flag, className: this.state.countries.length > 0 ? '': 'country-hide'};
  }
  render() {
    const mapCountry = c => this.fill('flag', this.buildCountryProps(c));
    return this.fill('countryField', {
      id: this.id, 
      selected: this.fill('flag', this.getFlagProps()),
      list: this.state.countries ? this.state.countries.map(mapCountry).join('') : '',
    });
  }
}
// Page - Components - End Labels
/////////////////////////////////////////////;
/////////////////////////////////////////////
// Page - Components - Flag Combo
class FlagCombo extends RComponent {
  constructor(props) {
    super(props);

    this.state = {
      country: this.props.country ?? 'Spain',
      countries: this.props.countryImg ?? [],
    };
  }
  // Load flag images
  componentDidMount() {
    // Inside asynchronous methods, context of this is lost.
    let field = this;

    // Load flags only if not already loaded to avoid infinite loop
    if (!Array.isArray(field.state.countries) || field.state.countries.length <= 0) {
      // Countries list in DB is huge but not necessary here in this form. Best to change source code to add countries when required.
      const uniqueCountries = ['Poland', 'Italy', 'Scotland', 'Brazil', 'Spain'];
      // Istead of getting all and then filtering, better to make multiple requests since we don't need many countries.
      Promise.all(uniqueCountries.map(c => CountryAPI.getByName(c))).then(data => {
        setTimeout(() => {
          // Result returns one array with each object. Combine them in a single array removing undefined results.
          let countries = data.flat().filter(item => item !== undefined);

          field.setState({countries});
        }, 1000);
      });
    }
  }
  handleChange(e) {
    this.setState({country: e.title});

    this.props.handleChange(e.title);
  }
  buildCountryProps(c) {
    let id = this.id + c.name.replace(/\s/g, '');
    this.registerHandler(id, this.handleChange.bind(this));

    return {id, title: c.name, imgBase64: c.flag};
  }
  getFlagProps() {
    const found = this.state.countries ? this.state.countries.find(c => c.name === this.state.country) : undefined;
    const flag = found ? found.flag : '';

    return {id: this.state.country, imgBase64: flag, className: this.state.countries.length > 0 ? '': 'country-hide'};
  }
  render() {
    const mapCountry = c => this.fill('flag', this.buildCountryProps(c));
    return this.fill('countryField', {
      id: this.id, 
      selected: this.fill('flag', this.getFlagProps()),
      list: this.state.countries ? this.state.countries.map(mapCountry).join('') : '',
    });
  }
}
// Page - Components - End Flag Combo
/////////////////////////////////////////////
/////////////////////////////////////////////
// Page - Components - FinaceForm
class FinanceForm extends RComponent {
  constructor(props) {
    super(props);

    this.state = {
      amount: 10,
      country: this.props.country ?? 'Spain',
      currency: this.props.currency ?? 'EUR',
      date: this.props.date ?? new Date(),
      direction: this.props.direction ?? false,
      description: this.props.description ?? '',
      provider: this.props.provider ?? '',
      labels: this.props.labels ?? [''],
      book: this.props.book ?? '',
      saveDisabled: false,
      validationState: {
        provider: {
          validDef: {
            required: true,
            restricted: false,
          },
        },
        description: {
          validDef: {
            required: true,
            restricted: false,
          },
        },
        labels: {
          validDef: {
            required: true,
            restricted: true,
            options: props.labelOptions,
          },
        },
        book: {
          validDef: {
            required: true,
            restricted: true,
            options: props.bookOptions.filter(o => o.currency === (this.props.currency ?? 'EUR')).map(o => o.description),
          },
        },
      },
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.state.currency !== nextState.currency ||
      this.state.date !== nextState.date ||
      this.state.amount !== nextState.amount ||
      this.state.direction !== nextState.direction ||
      this.state.book !== nextState.book;
  }

  handleCountryUpdate(e) {
    this.setState({country: e.title});
  }
  handleBookUpdate(e) {
    let newValue = e.innerHTML;
    this.setState({book: newValue});
  }
  handleCurrencyUpdate(e) {
    const newOptions = this.props.bookOptions.filter(o => o.currency === e.value).map(o => o.description);
    const validationState = JSON.parse(JSON.stringify(this.state.validationState));
    validationState.book.validDef.options = newOptions;

    this.setState({currency: e.value, validationState});
  }
  handleFlowChange(e) {
    this.setState({direction: e.id === 'expense' ? false : true});
  }
  handleLabelChange(e) {
    console.log('##')
    this.setState({labels: [e.value]});
  }
  handleUpdateDate(e) {
    this.setState({date: new Date(e.value)});
  }
  handleUpdateAmount(e) {
    this.setState({amount: e.value});
  }

  handleSave() {
    let dt = this.state.date;
    let newCashFlow = {
      date: Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()),
      currency: this.state.currency,
      location: this.state.country,
      direction: this.state.direction,
      provider: this.state.provider,
      description: this.state.description,
      labels: this.state.labels,
      book: this.state.book,
      amount: Number.parseFloat(this.state.amount),
    };

    this.props.saveAction(newCashFlow);
  }
  handleProviderChange(provider) {
    this.setState({provider});
  }
  handleDescriptionChange(description) {
    this.setState({description});
  }
  handleBookChange(book) {
    this.setState({book});
  }
  handleAddLiability() {
    console.log('Display Modal Liability');
    this.setState({showLiability: !this.state.showLiability});
  }

  render() {
    // Util Functions
    const buildTb = props => this.buildRComponent(props, p => new TextField(p));
    const buildProps = label => {
      return {
        id: this.id + label,
        label,
        value: this.state[label.toLowerCase()],
        validDef: this.state.validationState[label.toLowerCase()].validDef,
        update: this[`handle${label}Change`].bind(this),
      };
    };

    const isSaveDisabled = this.state.saveDisabled || this.state.amount <= 0 || this.state.provider.length <= 0 ||
      this.state.description.length <= 0 || this.state.book.length <= 0 || this.state.labels.length <= 0;
    const strDisabled = isSaveDisabled ? 'disabled' : '';
    const currencyHtml = currencies[this.state.currency] ?? '?';
    const amountProps = {
      id: this.id + 'Amount',
      label: 'Amount', 
      currency: currencyHtml, 
      currencyList: Object.keys(currencies)
        .map(key => this.fill('radioField', {id: this.id + 'Currency', value: key, label: currencies[key]}))
        .join(''), 
      expenseChecked: this.state.direction ? '' : 'checked', 
      incomeChecked: this.state.direction ? 'checked' : '',
      value: this.state.amount,
    };
    const labelImages = [
      {
        label: 'Work',
        alias: 'work',
        img: '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',
      },
      {
        label: 'Health',
        alias: 'health',
        img: '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',
      },
      {
        label: 'Investments',
        alias: 'investment',
        img: 'B8UlEQVR4nO2avU7DMBRGDwh17UTFs/AzMQAvRstztZ1ggoEXoN2ZwgQMdUVUYvvaSWM7uUeyUjmOfe8X53PUGBRFURSlzgR4ArbAz0DKBliY3LwsMgj4WGUuEWBjGl9KGhfCNX8zwcteraHRmNep8OI1sBpAnYgmpYZQ12oGDJYzYbsV/9UrsU6EmuCYcAmQ+qVFUuouv/acDxagBL4tv111XtQDxoQKkDqA1PQlwAPwhd3NlwF9Nbm92PUlHMME74EK95IWGl9oP+Jx+lgFzoFX2gkgrZeeD28YyQx4M2Psj6MRoH7n34GLiPGKFaAp+ZjxihTgcNrPBOO53L4oAVzJw251qBxxFC2AL3mAO1OkcRQjgO2Zl1K0AG2Td8WRvQBdJO+KI2sBJM/8IV25fXIBYu98V26fVIA2076rRJMJkIvbJxEgJ7dPIsALYYYXMl4RAiyBZ/Jw+94EmLLbcBDKsd2+FwHq6/yVpDNBv0UJUH/mp5LOBP0mFSD0X+GKnQi3wGfgtcUQ8yJUJ5XZRc2AE0tD2zkJPvEO+7WN11W987x0h0gMtgCzIubLkHSKp6wXfyGKESDqm3vPtIqxrQnmingZ3JpjzNtertyYo2ir7Bz/a2up5VEiwMSIsN80PYTyYZIXbZdXFEVRFEVRxsAv0e/sKHzSU0gAAAAASUVORK5CYII=',
      },
      {
        label: 'Dinner',
        alias: 'dinner',
        img: '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',
      },
      {
        label: 'Grosseries',
        alias: 'market',
        img: 'E+ElEQVR4nO2bW4hVVRjHf2fMyWmm21CmaWXpgA8iRRcciXK0oGmQ8KEb0UMU9BJIUqRWKN3sJYskgp4qeikjKozCskKdmkC6WmRoUuN0k4bQaVKcOaeH71usfXb77OPea63dOXL+sFn7rMt//de319prrW/tAy200EILLTQErgeGgUrOaxjoL1y1R7g03lw/F67aI0wjCi3f5lDhCYFGMsCIhnm7P8CBAvV6xwBihLwG+AN5kTY1XkAa81yGMrdrmW+AUghRReFsYBwoA/MzlGsHfkWMcFUAXYVhHdKIN3OUXa9lN3tVVCBOxu0pzgSOAhPAHI+6CsNdSON3OXC8ohwbvCgqECVgNyL+VgeeS5VjFDjFg67C0I9dy0915BpSrjtdRRWJ9xHR93nguo0mmxIXINPeIeAMD3xTkdVgBbjaA19wvIiI3eiR00ynr3vkDIJzgH+Qqesij7zTI7wXeuT1jkeQJ/VaAO6XaYIp8UtE5JIA3EuU++sA3N7wN9l3fDsi5QdT0rv193g9EaH9AW1AL3BFQlqexUrU41NOSR/VsCNHHV4wBbgb+AkRNQFcEsvj6gKrh9D8NXEm8G5EwGENn47lawgDnJSRdBpwrV7zkbE2iozHzcAPwBZgMbK7uwc4ArwDzM1YV0PiK2q/oCaBT/X+R2CGlrmZ5IVJU/YA8xSfAbYDB5Fe0A/cASzS9PuB3/S+V8PdGetqSOxCrHpjQtp1WKufFonfr3HfAvcCnRrfED0gK1Yp6e/AcqArlr4D6RlRbKd6qOwDFoYSGEEQ/nZgL9UN+o76+/hu4BZkZWYM2HQG6AbeorrxpmsfryOjE9gaKx8KXvlnIw2NCt+AuLJrYSawFlhK9arvcprMAKdjfXbmejuWZyHwGfBxJG51JP8x5GW4X++jXJ2EgTcDvIp1M32h9wOadhbwGLL/NhWer2lXRuImIvdl4CPlqwDP+xCZAC8GGFCSP4ELkHnfdP8t2B1dGTmbqwAPatk2LWeMMgdxfEzT9LnAX1q2z1VoArwYwMz7q/T3Uaq7bxlZ5i7GPvEx4BrNb2aMnhr8KzX9Q1ehCXA2wGVKMIKc3IAcQb0BbEJcz7NjZTZiDTOELI/Hqb0t7cCeCF3sIjYBzgZ4QgmynNS2IU7JsYiAp+qU2aT51ubQmAZnA2xTgjxn7qciw+AG6q8Rlms9H+SoJw3OBviF9PHrC/OwS2SfcDbAESWIr/d9owvrOPGJ4zJAmk+wFAtDwYj8X75XSqvUOBbjb3rfMI6Tg4HrSUSaAfZoOC+whvM0HEnNFQhpBtiq4YrAGpZpOBi4nszoQcbnKGH965+Tf7pNg5elsDl9We8sJxl9yu/j44g4vBigF1nWjuP/XVACPkFEPqBxg1Qff7nEedsOv6RE3yPbX194SHn3Yh0mSaLzxnkzQBd2VziEnL+74iZko1Sh+kuOhjQAyFy9D7s7zPv5SQl4GNv4CnBuJD3Jq5wnbpZyH8qpMxHTsRukSeQobEGG8kuxJ0fHkD83VBDXmW+sUe5tvomnINtd4wmaRIbFOqRX9CA+vk7kpdkHPI79GMJsehZp/griZFlNdU/Ii1lI443jZiA9e37MQE57s3zkMIx4gKIe4jUZyme9Hg3Q7v+gAzkSexYZg3sQZ8gY8qR3Ak8ivoH2GhzLgPew/kaX6zDS7YM9+RZaaKGFEwr/AgVHGjLidJ8gAAAAAElFTkSuQmCC',
      },
      {
        label: 'Transport',
        alias: 'transport',
        img: 'EgElEQVR4nO2aXWgVRxSAP5NeQ5NYrG1EsLU2QUFKrSBtpX1oS1D7ILYpxSi0r0KsiLQJQsAfhEIK6qPFIpj+0CI+KCnWWgOFpBEioqhg2/jzUqporW2sMWpMtg/nbHa9d++9+zN7d8H9YLjLuTPnnDk7c3ZmdiEjIyMjIyMjpcwHLgOXgHkJ+5IIuwBLy644DFTFodQgS1zXrybmRUj6ce5elDKhxYQuS/2aJO0jAOB3LaawDOqKlY8QZ7uBL/V6nWkjaR4B9pwf1OKWGeMx0woN4g7AFL1+JW6j04BPgF+Av4E7wFlgL/BS3MZdTEcS3yiQ0zKqsulxGW0GrlE6g+5RZ+JmmdobcMkGVLbUpCE7BywHjgAzgT7gHeBp4HHgReBTZDSsBXqIP3fYQ/2ES2ZfG88DM5DhbgFdOPMtnwXAFa33sWkn8vhe7ax2yVarrMe0sa2q+Eeczk8BNgBDmF2EBC2NLj8bVXYPGQ3fAm3AnKgBOK2Km12yDQl22i7HPHzt9ag3DhwF3ggbgFuqaJpLNqSy9yk+JZKiFnge8e0LYBgnGD3AM0EVegXAVhpYWQLUAR3ATcTnf4AVQRSconAKHFTZr0A78DpQY8DZsLwMHEfmv5/pMw5s9Kt8izY6ijPcnwMu5Cm9izyLdwAtwKxoffJNA/Av/jqeXzr8GHgSuKENPsMJQg3QCnwOnAEeeBi4CHyFZOOFQHWEjhZjvdrqBep9tmnD2UZ/4KfBUuC+GuoDVgJPIfNrMbATGNH/B4GfcHKHuwwjI2kbspp7wqfDpfhada8N2G6TthsFFvlp8BZwleLDaQLYh5MLqpG73qZOXvJo8wAZPbuBD4GmgJ0A54nkqxN57NG2vyGr2rLUI6u8fuAvJHoXkcfNkhLtbGYh+WEHki/u4u/5XowZSOBHCLdzrUUSuYUs5ytODfIEacd5slgB2i/X+v3lKpbgNSSI95D1Q6IEDcBmrb8zot39qqc7op7IBA2AvSlqjWi3CclH94HZEXVFImgA7PMJE0O3R3VtN6ArNEECMFfrXjdk+23Vd8GQvlAECcB7WvcHQ7ZzyD7BQh7fQLpPhcf1t4GHN2phGUPOPEDWPIkQZATUAX9QuI7wU9yPTa83VN/Zf6Z5BIwgS/SfkewdhHJBnh/KIwN4nT1UktnkJdZKj4Cr+vtshe3a3NTfyU1apQNwUn+9zvYHKFzympbZ/R0r62lMrEKG4FkKg++VIE3LFuKcdCXCVGR3aSHbaDeVCECnynb7d9k8LThHbG+65P3IYQwxyWYiyW+CFHxt0oUThHXEc5TmpgE5VH1oDZAkVThBsIBzyCnuC/g/9ytHHTLnO5E7byEvgZJ6BHvyLoWnz3GUCeTOp6rzNjnkLc83SHb+DzOdvg2cR061E5/zYQiybwh6zjBJmvcCFSELQNIOJEx1mr8Si5O5wGHkoDS1xJUEm4E/tf5AmbqJYioAOeRt9xrkrtt1j2Hm3aVvTH08HbXcQl6b5yDdX4qaYgz5um0IOAQcQN57ZmRkZGRkPOr8D0nlKB2DwxZMAAAAAElFTkSuQmCC',
      },
      {
        label: 'Leisure',
        alias: 'leisure',
        img: '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',
      },
      {
        label: 'Service',
        alias: 'service',
        img: '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',
      },
      {
        label: 'House',
        alias: 'house',
        img: 'DU0lEQVR4nO2aT0gVQRjAf5aEYBTSITp4iUA6eLFLPiWkQ1JpdOjQIaJLdYqOegySyGN/bh3rVoegUghUKAMzsGNEEJVGREXk64+VuR3mW3Zdd58zu/N239P5weC+2e/ffLv7zey44HA4HA5H3uwEngMzcryu6AY+Ap60L8D+QiMyZBQYSal7FviDGvg9aZ70nbESXQ74V86ERuBaSHcY2CBtONR/VWRrGtMEbAHui84CcCpG5jjwU2QeAi0ZY6wqJgnYBbwQ+U/Avgqye4EPIvsK2J0hxqoSTcAI8CBGrhf4KrIzQKuG7VaR9UT3QKZIq0Q0AXF3xHlgUfpvA80G9ptFxwP+iq2aolICGoHr8nsJuIwqdKY0AAPAP7F1A9iUMl7rJCVgGzAux7+AExZ8HQN+iM1JYLsFm5lJSsBr+TsLdFj01yE2fR/tFm2nIikBJsXOlB3AlPgoA0er4EObcAIGQr9vAk0a+v3ABPBd2jjQp6HXJD48VG0YNIraIv6Ab6UI5lJIf06a/3tI08YgQXHUTbpVwrf8PHBEU69fdN4AnaH+EvBWzuncCYjPedGZQj0iubCHYH43LUgTotcZc64k58YM7LVTvcIbS9YpqYwKNIk51FU1oRpT7wpsLUrKqEEm8R74lsKurcVXLM3AHTG+SLZlqX+lumLOdWP+CETJsvyOJfpi0pvRXh9BESyF+rsIiuDhjD7SvIDF0knwavoSaMsYmM8QydPgRUs+2lAxe6gxxBXdipxEbVz4gdnenOhD3eplaWNkv/JRWgjiX0CNaVUagAssn+dNt75qieg4rgAbk4Q3A3cJ3sHPsXYScBr4LcejwNY44Wci8BnoiRioV8Lx96DG5gFP44QfA9Ms/yfFWkoAqLFNA4/SGqg3tOK3tmKqV/JIwCGCHR2dNgsczCGuVbH1CJgM3m/vLPjNHL+tBJjaydWvqwFFB1A0LgFFB1A0LgFFB1A0tZCAJ6hN1kJoqHDO9ntAki8vcj4vv0Bt3AGFovNBUsUMarDaFZ1MkKm2Xy0DbikcIq5Y6fZloSi/id8BVJLR1asZv64IGsjGFSvdviwU5Xd9FME8v8ut6c9fQVVR062remsrZolwEVwyz1ndsR7G6HA4HA6HQ5P/UWiebq8FGd8AAAAASUVORK5CYII=',
      },
      {
        label: 'Tourism',
        alias: 'tourism',
        img: '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',
      },
      {
        label: 'Sweets',
        alias: 'sweet',
        img: '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',
      },
      {
        label: 'Gift',
        alias: 'gift',
        img: 'ClUlEQVR4nO2aO2sUURiGH+NtVYhYBSSVGOyCjcZCsVgrwcLKH2Cr+BtsQkDXQLTy0ihYCVFI5a1JsWYtxEJjIUEUd01KES+Fl+I7w0yGmZ3s7pzzzZrvgcNZznc48553zm1nBqrFFuAsMA+8BV4Bt4AjmqJCsRt4BPzNSH+A68A2NXUBuIt0dgU4B+wFdgF1oOliN9XUDcAO4ALSiVVgGZgFxhJ1DiMd/JQqT7bx3NU56VNs2ewjvnvp9BmYcPXmXNnFLm0dcnXu+RLrg3lE9CIwBexx+aIrf+LqvUHm+XhBeyvAOy9KPTCJdPI9ssAlGQXWXPwU0vnXG2hzGZkmpTFSZmMporl6H/iein0FHrjfDWT7e1nQ3hgyZT6UJRD8GhDd9Z858acun3R50QiYBrYCCwPqCsYZZIg3yTb6IOsXxXpOOweAh8QL52jpSj1RAz4iwueQPT3JCPCN2ICJRGwcOA88A367+BqygA4VdeAH0oFV4AZwmtiMJWIDLgG3kR0hOTJ+AXeA/aFE15CDSofs/XuYUxu45vqYy2wFhPpOjW4GRHc+1D+wSFQIpohHQi4hBalfz+c5YCgwA7QFaGMGaAvQJsuALy4/HlJIIE64vOs2OI3O4SSilRF7URDvNV3uZsB2YEbRgKWMWLMg3kuaYYNPl0MdUFSvY4ugtgBtzABtAdqYAdoCtDEDtAVoYwZoC9DGDNAWoI0ZoC1AGzNAW4A2ZoC2AG3MAG0B2lTh29vHyPeDlSP0a2vf2FPhLPoxoMX6NzXDUNYXeVMgq7zqZbnlm34K9LMLtJCPm4eprC82/S7QcflRL3LCcszlna61UjQI/4rcd7rSiwE1Z0K7AsIHTW3gKrCzFwMMwzAMw/i/+Qd9C+63mU20PgAAAABJRU5ErkJggg==',
      },
      {
        label: 'Education',
        alias: 'study',
        img: 'C7UlEQVR4nO2bO2sVQRSAv6viW7Cx8gZEA5YWKoqaUizsBB8/wUKw8ydo1CaWNnaCj2gajWBhkUTUxtJClIBcsQhBExUs1FjMWe/evTvZ2ZnZzewyHwy7c2bmzJnDzLm7ZxOIRCKRYkaASWAZWAm4fAbGgY2+F78YwOLKlGs+HTApSp8CXZ+KK+AE/Z3gjWTbh774hGQXVKbwZUo2l5Gn62tFKQdssJjgr+b+mIWuRmDqUe9bz5JSdqyr0JBGEB1gMUYXBOeAWR9G1YnPIDjmaEuwhBLcTFmzIBjKc4B34s9gBl0QbCQ2DtAFwdbi+whcBJaAIy5GebDDu0LTfu+k3x0XozzY4V2hSb8DqX5fgU1uplnb8Z+6g+DZ1P1O4KTF/F6pOwiek+vzTD1ofB2Bg9L+BRhFOW8Z2OxqYEk7BqjzbTDZ/o+AD8BbYAdwStM/m4leBO4DU6KjNnzsgA7wUdqTl6YrUr+b098kE+1qrzGmOcHVJj4sbT36u24P/WOwJdM/LxPdBaYL5imyw4qswtmUbMZw4pvSNpGRvxH5mYxcl4keKZinyA4rXI9AB5hPteeVeyXmbJwDjor8N8ML/4M6Bj+ArYZzenVAHb8C5+U6gdoN6bIeeA1sA07XYIsVLkGwA3wSue7l57K0PyzQZdJm0l4alyB4XGTzKGfksRt1FH4C20VmEgR1n+qCigG3RHajYOyM9Lsg9cdSn0YtGrk+S82TbrOx1xgXB/REdqhg7CUGj8F+9A9CC1LyjmEZe41xccAL4InB2F3Aewa/63eBB6jkyQrwTep7gX0oZy0x/C0iyCfBOqn8ZzDmBB37VU1wD0JBEx1gMSZ+GNHct5YYBNtMdIDFmBgENfetJQbBBpF8c1jwqTTx6G0G38NDLtercEBTyjh2f/5X6IBXqExNqFQWgxLFo1Uo94iVA0yC4He5/iqrvC3kZWhDYwxlY68K5atlaEMrV6twAAxnaEMrPVm813+Xi0Qi7ecffQJYk5h00ekAAAAASUVORK5CYII=',
      },
      {
        label: 'Tax',
        alias: 'tax',
        img: 'GtElEQVR4nO2ba2wVRRTHf+VR5VHCQ1tAqmACqFVJFKwSML4jNYgkfkElEoyCJsYY1ACJkigPNaKC+EGR+IFEo0EgGIQoEVQKqDFAK/iASBCqoUIKVZSC7fXDOdOZrnv37uPeLVD+yaQ7Z8+cPed/Z87Mzmyhg6MoT3Y6ASOAgUBnYB+wG2jOk32AIcAl+qwDwJ482o6NfsB84DCQ8ZTfgQVArwT2zwdmAnt97B8E5gC9E9hPhErklzAO7QE+BtbotZHXAdfGsD8M+Jm2hG4CPvM8dz8wKkEcsXAlcFQd+AL/AEcBX6lOI3B1BPuDgUPadgdwG9L1XYwGqlXnKFARwX4idAZq9MHvAV1UXgrcpaVUZV2A91W3VtvmQhE2sPVAN5WXADcCt2C7fVfgg4j2E2OSPnAvcJ7KZgNN2G7ZBMzSe92wQ2JSCPtV2KFjAp0O/OnY/wfJDSB5wgyVyTFjioTV+rBpWn9Q6y3AOi0tHoemaX11CPvLVfcZrY937G1B8oCpT1GdqVpfGzOmSDAJaLDWt9GWEIBHVLZN60O0fiCE/R9U9yqtf6r1mY7OwyrbrvUBWq+PEEdsmK5erPVGrbvTXQk2+YHkgibkl5saYHsC8K/qlajsN7VV5ugVI2uMJiQ5FgGntF0XCox6j0O1Wr/D0bkdm5gMnlRZM/4k3I0ld64j/0Zl4xzZdSrbp3VD+F+Ro4mBjfqwe7U+R+sNwDwtDSp7ztN2Bv4kuMG/6GkzS+VH9HoGtle8qjp3av3bRJGFxBP6sM1I1+uKTYxuWaX3vPCSMJ7swaM21vjY3wR0V51PVPZs0uDCoAeyKssg0x8IEVXAQi3j/Ju2wiXhpF6/FKBfhBD1MvAa0vvMnG9mmAagb7RQ4qMKSVYZdainj04P4AXgI+BCn/uGhAzyC3rRE3gLGUbdfe4XI794s9q4P1IEecAU7K93GFiGDI/HgXeQMWsCrCGYhGbgIUfeE/jSaX8IeBN4DHgUWISdjpuxa4bUMRLJBd7xacpm4EeikeAG/yvwdYD9WuDWJAHkaz+gArgZeV/vCvwCfA58D/TX68uxDv/haT8DeAWZx39S3QPATWprJPJCdDEy9vcjSXArQsRpj/5IIBlgJ3CBj46bE+qBS1PzLgVUASewAe5GSPHCLJZakLF+VmACdp5fgl3r5+oJ2VaMZxTc4M0835/TjIRidc4sL9MuO8m9Tsh3qUNWncXoRXsE3t4kZJBNW+q0MtrHgUKjDEmIGcKtE/I1HMZge0IrG+2FUuwrdZqzQ2vc7U0AtA8JeSOgGlnyJpW5wyGN2SEnAdX4Jw5vEH7t48rKHNkOopMQ1ufWZ3sPG7wKUeRhUQEsRpKeQY3K3IBHABv4PwkLgaeRvcCltCUhls9Jh8Bm5AQol8xspZktbb9i7m3FDodsPeEpbE+YGMPvVJPgIOTNMINsXC5CNjZ7a6lEesBx1akFriE3CWa/sJG2u8ZhkBoBvbAZ/jtgaIDuMGSv36wLhpKbBLNfuCCiX6kR8C42s/cJod8Xe/a4DJkSg2aHsXpvV0S/UiGgUm3/jfy6YTEcOf9rQU6Zg0goVr0mom3wpEKA2S5/Pkbbudp2ldazkdANSYSniHY6XHACytSpJvxXdrkwQNuewr4j+JFgTon2RrSfk4ByYAWSYRuBlUjXDIvJanddRMdcrFcb9zkyLwmml70R0e9AAsppu61tyhFkSguDxdpmVi7FAMxWG6975C4JGWS7bUhEvwMJWKGytdpwEPb46cOQzhv9e0Lq+2Gi44cXLgnTVRbF70ACzJG3y1q5yo6FdH6L6o8Nqe8HM8VVZ7nfG7jBqUfxO+e7QDYUetUYBUeRZXMY+PqdjYAN+vdthMFyvXbvhXEO/FdvYWHaNoTUj+W33xAYTvZkErSUdVHIJJgNUfzOOQ0OQhLHMS0rfIwE4QHyNw2G+brMIKzfBV8IlZJ8IXRSS5JhlA2pLIVXEX8pPE/brsyrRxapEDASeVE5gZz4hsUw7MtQZQH8ghRfh5dh3+/DfMLSD7t/sLSAfqVGQAn2/X47we8TlyHre7MBUhKgmxSpEQBwEXZL7DgyRV6PbJD0QVZzS5B9gwzSAwYW2Ke8ERD2DCDKpujGmM+IgpwEFOpcoALZFK1xZDUquyKGvTg+t7YP+q42W69IOlx2IV+Tubai/DNFECL7HETAmJAPNayfDrKwPreiyDGSry/GzhRkIPvbYIdBJ+TTGIjRfc5gmE2aOpATlWzT0tle5oMcLCzAfirTEcpBDd7818s5nMM5dFD8B4Bl6gJ6Ud9eAAAAAElFTkSuQmCC',
      },
    ];
    const labelImgArray = labelImages.map(label => 
      this.fill('labelField', {id: this.id + 'Labels', checked: this.state.labels.indexOf(label.label) >= 0 ? 'checked' : '', ...label}));
      
    const labelProps = {
      id: this.id + 'Labels',
      content: labelImgArray.slice(0, 7).join('') + '</ul><ul class="direction">' + labelImgArray.slice(7).join(''),
    };
    
    let date = this.fill('dateTextField', {id: this.id + 'Date', label: 'Date', value: this.state.date.toISOString().split('T')[0]});
    let country = this.buildRComponent({id: this.id + 'Country', country: this.state.country, handleChange: this.handleCountryUpdate.bind(this)}, p => new FlagCombo(p));
    
    const providerProps = buildProps('Provider');
    const descProps = buildProps('Description');
    const bookFieldProps = buildProps('Book');

    let amount = this.fill('amountField', amountProps);

    let labels = this.fill('labelsField', labelProps);
    const bookProps = {
      id: this.id + 'BookContainer',
      input: buildTb(bookFieldProps),
      list: '<ul>' + this.state.validationState.book.validDef.options.map(b => `<li onclick="window.application.callHandler(this,\'${this.id}Book\')">${b}</li>`).join('') + '</ul>',
    };
    let book = this.fill('bookField', bookProps);

    const lProps = { id: this.id + 'LiabilityView' };
    const liabilityView = this.buildRComponent(lProps, p => new LiabilityModal(p));

    // Nao deletei abaixo, porque o codigo e da mesma imagem em tamanho 100x100
    //// // let liability = this.fill('imgButton', {id: this.id + 'Liability', disabled: strDisabled, className: 'financeSave', img: "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"});
    let liability = this.fill('liabilityButton', {id: this.id + 'Liability', content: liabilityView, className: 'financeSave', img: "iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAABmJLR0QA/wD/AP+gvaeTAAAElUlEQVRoge2a329URRTHPxK6hECh8qCh8qOrsWIkBuiLiT6YmGiMP4o1QZTwDyC1UR80PBKC+mjUaOPvh2Il0Woi+GCM8UHrDxQToQUCiiIYMUbZKi1pl/XhnGE2lzN35+5ud1fiN5nc7cw5c8/3zjkzZ2YKYcwD+oEvgL+1jAJbgVyKXkvhKuA7oBQo3wKdTbMuEvPwJA4CvUC7lvXAuLZ9Q4uPzCOIoWPAYqN9MZ7Mww20KzO+RIzsTZG5T2VGG2JRlZhAjGxPkVmkMoWGWBSBOUZdKULvsnobUissImP6vC1Fz7UdqK859cVWZFTGsYO9AzisMlsaaFdm5JB1ogQcQgJ7kZY+PIl9QFuTbIxGJ56MVfYBS5tmXUbkkHXic2QmmwA+Q9yp5UfikkAeGAROADOE3cqVGZV9SXVbAnfgF8JqSgG4veFWJ5DHk3gX6CEuGcyp7AiezMpZsjEKg3gS1eI97ePFulhUJU6oEetq6KNH+/ipLhZVCRfYtewtcvgJoGlwAdsq/VQFK2n8FPg6Qvc54Gck92oJJL9k7Jfdr3JrMurNCqwR+U/ifyKthkuGyNxmG6BYgZza3AV0Acu0/hfgOPAB8D6yeAfRzFlrGZIixWTbRWA3QtREs4j0IefJJWASGAI2AN3AAi3dwAPALmBKZScInLk1g8ijwHmVH0JcqxJWAm/hR2cgKdBoIn1qyDThI9cR7d9Cv+oWSYxMtUSOkZ3Icrw7hUisQw7Ix5EDdQvufLpA2a3ASa28E7glYNDVwLWJulMqt75M72QFIq/h3SmJhcA7Ze8vAX8Bjwf6GlaZl13FjoSyReQ34I9E3X5DZ3sKiRXI7DSJHRPPax8vIPub64GntO5+Q74LmQBm0Om6DdiJfOFfA0SsOkekoLo7SV+X+gmPBsBp4HujfgQ5krLggt9006xE1hCHD1V+Q6B9Evua4grCu9eN2udeq3G2iLij1mSsOXyEzESPEb9b7dY+D1mN9SByI/AqMrNNal1B5RcGjMoDX6nMaeB1ZDGcH+ZBO969L0KtRDYB58p0nF4lIiD3LjcjE9AosmieAu5tNJFV+FRiCFiNXwsquZaF65A7mLPITXMSF1yr3mn8NsTwYWRkDiCjA/CDPq3AXQ08wcX7/8NIzMwHbjX0evR5rJ5EupBZZBp40mjfo08r4esAnsa+JTuvz3NGm+trj9FWtWu9rX+/aXWKpCcziOslj1bnICnJcWBtWf2VwCdIDCxJ6OS1r2n8/iWaiFU2A2/o7ynEb0N4ReV2GW03AEe0/Sjwoxr5J7LhSmK3yg6GXpaViCtngYdSSIAErDsw7zfa25CrvoPA7ypzuSE3oH2cIeXmLCuRMeBZ4JoKJBx68Wm8RQbS0/gBxEWLwD1pL5qtlT1pTFH1h0nZvpYhj3enIuGPcAFu6N2QdeCJ3KR1C/Dpf+xIJNGLXySnkARwI7IWua3uKuBBhKxbZM8Ad8e8wGWUMWWM2v4LohPZT8QcPkwjgR19m7xEybiv9Q/yRZ5BArCEfJ2PSZ+hsmA5korvRaZhd4s8jqwRWwhMsQ7/AvFI7LQ18IE+AAAAAElFTkSuQmCC"});
    let save = this.fill('imgButton', {id: this.id + 'Save', disabled: strDisabled, className: 'financeSave', img: "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAADt0lEQVRoge2YvWsUQRjGn9m7fBg/iJLEJo2NAbFRtPQfSCEpFOwshPSpYhMUq4CojQr+C4JRCyWNgqAgsVUkhSAYNGcgGtDkEnPvY7E7u7Ozs7O3J5tEuBfm9m5m7+b3zPsxswd0rWtd69pumsobOPNydZxUD0iMEgBArC4343FuNfH+wgigFBQAAgAJkhDzKgIRQihgdBUhRAQtEUjciImFLdQOHflJUTc+TgzfaUdAkDdgw4eEaQthjGbAkwQluoIgEfUjHgeTn6Z+JQahePvE48b1dgTU8wWk4R38EAknVUqFq48IDkjgjXb6/uvU999cORuCh6pAPQkBUera2JPv/YsTI1d9AvI9YMO7PCAShopefQ0tAjJsYngiu0g0vJJMrN8qcnpsrjHbkYAieAARtBlCOr6ZhJMkYZUvIAkpJoORCkwfn1ueKi+gAB5AnHy6UYuwhNArQIcdM/B6fgU1k8eQnwMWvBNAomlVci9jz6UTVkSyC2B7wAEfdR0uLaAIHgg9EMInChjNbMLrkpqZglFZjUPICQ9fGOQLKIAHwhW0XaXvTycoQWY9YFaqsKKVgy8UYMK7dLjCwtzQ4rKakwM6V2jc74T3aPDsA354qADL6y2M9CebuZmEjPMgaa8unzIqk8QeEApWmoxxbHifDzxl1IInEAQJrKr34OaHJr6tb2eOBa24pEqmUqXKrYbfIO59DhD07XPDd+IBGx4A+g/UsPGrBQoBpfDu9wAuvf0DcLtoHbRsADVHt0JvXx1BX28peK8AG54g6vUABweDdEix1wgde9L08SCvziddbvjOQ8iq7Slh0YcdgfdUQu9OvNfh/QL+A3ivgL0E79NRHEJ7GN4vYC/Be0QUl1EL/txQD2ZODmCkT8UPNOaJ0/fZPPfYfY2m4NanGhbWggw8PQoKd2J75f8dPtsvIhjqIaaObZeCB4pOo46wqQJevx/qsUPRjC23eZLYHfNVwacfatqD9wrIS9gq4ZPn4jR8Z2XUAR9Wm+rgRaQUvF9ATqmsFJ7l4L0C8up8lfA6hGx4epQU7sSZTapCeA3aLrxfgAseqBQ+bO3DFwjIwusfrQre/JMgBd9JFXLBo2L4JITS8D4/FJbRr4/m0Xj4NDmYVQhv5sGP+RdYe/bcKiZlBETKg9YmatubumtH4GHOW6DA99/oEoDRoxfPx/Ag0GgSw73VwK9sqXjyQ+Pj8aQkvpT2gBCT+ovmIswutrDclErg7y7ttzbQEF4UJ3Nd0LWuda1ru2p/ASsCdZ0lM904AAAAAElFTkSuQmCC"});
    let actionButtonProps = {id: this.id + 'ActionButtons', className: 'buttons', content: [liability, save].join('')};
    let actionButtons = this.fill('simplediv', actionButtonProps);

    this.registerHandler(this.id + 'Amount' + 'Dir', this.handleFlowChange.bind(this));
    this.registerHandler(this.id + 'Labels', this.handleLabelChange.bind(this));
    this.registerHandler(this.id + 'Save', this.handleSave.bind(this));
    this.registerHandler(this.id + 'Liability', this.handleAddLiability.bind(this));
    this.registerHandler(this.id + 'Date', this.handleUpdateDate.bind(this));
    this.registerHandler(this.id + 'Amount', this.handleUpdateAmount.bind(this));
    this.registerHandler(this.id + 'Book', this.handleBookUpdate.bind(this));
    this.registerHandler(this.id + 'LiabiView', this.handleAddLiability.bind(this));
    this.registerHandler(this.id + 'Currency', this.handleCurrencyUpdate.bind(this));

    let containerProps = {
      id: this.id, 
      className: 'page', 
      content: [actionButtons, date, country, amount, buildTb(providerProps), buildTb(descProps), book, labels].join(''),
    };
    return this.fill('container', containerProps);
  }
}

// Page - Components - End FinaceForm
/////////////////////////////////////////////
/////////////////////////////////////////////
// Page - Components - Modal
class LiabilityModal extends RComponent {
  constructor(props) {
    super(props);

    this.state = {
      direction: false,
      amount: 10,
      currency: 'EUR',
    };
  }
  handleCurrencyUpdate(e) {
    this.setState({currency: e.value});
  }
  handleSave() {
    let dt = new Date();
    const obj = {
      date: Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()),
      dueIn: Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()),
      source: "Cris Carnaval",
      amount: Number.parseFloat(this.state.amount),
      cashflowId: -1,
      elementId: -1,
      payed: false,
      updated: dt.getTime()
    };
    this.props.addLiability(obj);
  }
  render() {
    const currencyList = 
      Object.keys(currencies)
      .map(key => this.fill('radioField', {id: this.id + 'Currency', value: key, label: currencies[key]}))
      .join('');
    const amountProps = {
      id: this.id + 'Amount',
      incomeChecked: this.state.direction,
      expenseChecked: !this.state.direction,
      currency: currencies[this.state.currency] ?? '?',
      value: this.state.amount,
      label: 'Amount',
      currencyList,
    };
    const amount = this.fill('amountField', amountProps);
    const content = `
    <h1>Liability</h1><br />
    <label>Cris</label><br />${amount}<br />
    <button>Save</button>
    `;
    this.registerHandler(this.id + 'Currency', this.handleCurrencyUpdate.bind(this));
    return this.fill('div', {id: this.id, content});
  }
}
/////////////////////////////////////////////
// Page - Menu Loaders

var loadFinance = function() {

  // Register root node
  let api = new RestAPI('cashflow');

  api.get().then(data => {
    const filteredCfs = data.filter(cf => (new Date(cf.date)).getFullYear() > 2019).map(cf => {
      const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: cf.currency,
        minimumFractionDigits: 2,
      });

      return {
        Date: cf.date, //(new Date(cf.date)).toISOString().substring(0, 10),
        Provider: cf.provider,
        Description: cf.description,
        Amount: currencyFormatter.format(cf.amount),
        Location: cf.location,
        Book: cf.book,
      };
    }); 

    const callInput = () => {
      const optionApi = new RestAPI('option');
      optionApi.get().then(options => {
        //
        const labelOptions = options.filter(option => option.combo === 'labels').map(o => o.description);
        const bookOptions = options.filter(option => option.combo === 'books');
        const saveAction = (cf) => {
          cf.elementId = data.map(d => d.elementId).filter(id => id > 0).sort((a,b)=>a-b).pop() + 1;
          api.insert(cf);
        }

        RComponent.buildRoot({id: 'fincForm', labelOptions, bookOptions, saveAction}, p=>new FinanceForm(p));
      });

      
    };
    const props = {
      data: data.sort((a,b) => {
        return ((new Date(b.date)).getTime() - (new Date(a.date)).getTime())
      }),
      id: 'cfMainTable',
      callInput,
    };

    RComponent.buildRoot(props, p=>new FinanceTable(p));
  }).catch(err => {
    window.document.getElementById('app').innerHTML = err;
    //callback(500, 'text/html', err);
  });
}
