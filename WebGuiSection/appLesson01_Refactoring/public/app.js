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

CountryAPI.getByName('Italy').then(data => console.log(data));

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
class VirtualNode {
  constructor(tag, props, children) {
    this.tagName = tag; // string
    this.props = props; // object
    this.children = children; // array
  }
}
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
  constructor(value, parent, ancestral) {
    if (value !== 'app' && !(value instanceof RComponent)) {
      throw 'Argument "value" must be not null and an instance of a class that extends RComponent. Except if it is the root.';
    }
    if (value !== 'app' && (typeof parent !== 'string' || parent.trim().length <= 0)) {
      // DOM cannot be verified, since rendering usually is not finished once you mount a component.
      throw 'Argument "parent" must be a valid string with the parent HTMLElement id. Except if it is the root';
    }
    if (value === 'app' && ancestral) {
      throw 'Argument "ancestral" must be null/undefined when node or parent is the root element.';
    }
    if (!(value === 'app' || ancestral instanceof TreeNode)) {
      throw 'Argument "ancestral" must be the parent TreeNode/Component, unless node or parent is the root element. Element design id: ' + value.props.id;
    }
    this.value = value;
    this.parent = parent;
    // Any components being rendered by the value component. All should be TreeNode instances.
    this.descendants = [];
    // Component that renders the value component. Should be TreeNode instance.
    this.ancestral = ancestral; // Can be null if value is Root Component.
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

  register() {
    if (this.ancestral) {
      this.ancestral.addDescendant(this);
    }
    if (typeof this.value.props.id === 'string' && this.value.props.id.trim().length > 0) {
      // TODO: This can still generate repeated ids, change this solution for IDs.
      this.value.id = this.value.props.id + '_' + (Math.random()*100000).toFixed();
      console.log(window.application.registeredComponents)
      console.log(this)
      console.log('registering: ' + this.value.id)
      window.application.registeredComponents[this.value.id] = this;
    } else {
      throw 'Invalid RComponent: property id is missing or invalid.';
    }
  }

  unregister() {
    if (typeof this.value.id === 'string' && this.value.id.trim().length > 0) {
      if (window.application.registeredComponents[this.value.id]) {
        console.log('unregistering: ' + this.value.id)
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

  static templates = {
    simplediv: '<div class="{div.className}">{div.content}</div>',
    div: '<div id="{div.id}" class="{div.className}">{div.content}</div>',
    button: '<button id="{button.id}" type="button" class="{button.className}" onClick="window.application.callHandler(this,\'{button.id}\')">{button.content}</button>',
    simplebutton: '<button type="button" class="{button.className}" onClick="window.application.callHandler(this,\'{button.id}\')">{button.content}</button>',
    comboBox: '<div id={cb.id}><input class="{cb.className}" type="text" list="{cb.comboId}"{cb.value} onchange="window.application.callHandler(this,\'{cb.comboId}\')"><datalist id="{cb.comboId}" class="comboBox">{cb.options}</datalist></div>',
    tablePagination: '<div id="{pagination.id}" class="pagination"><span>Rows per page:&nbsp;</span>{pagination.cbRowsPerPage}{pagination.carrosel}</div>',
    container: '<div id="{container.id}" class="{container.className}">{container.content}</div>',
    th: '<th id="{cell.id}">{cell.children}</th>',
    simple_li_click: '<li onclick="{li.click}">{li.content}</li>',
    thead: '<thead id="{row.id}"><tr id="th{row.id}">{row.content}</tr></thead>',
    form: '<form id="{form.id}" class="{form.className}" onsubmit="window.application.callHandler(this,\'{form.id}\')">{form.fields}</form>',
    textField: '<div id="{text.id}" class="{text.className}"><label for="{this.inputId}">{text.name}</label><input type="text" id="{this.inputId}" onchange="window.application.callHandler(this,\'{text.id}\')" /></div>',
    simpleTextField: `<div id="{field.id}" class="container">
    <div class="textfield">
      <label for="{field.id}Input" class="field-label {filed.hideLabel}">{field.label}</label>
      <input id="{field.id}Input" type="text" maxlength="30" placeholder="{field.label}" onchange="window.application.callHandler(this,\'{field.id}Change\');" onfocus="window.application.callHandler(this,\'{field.id}Focus\');" onblur="window.application.callHandler(this,\'{field.id}Blur\');" value="{field.value}" />
      <div class="containerIcon">
        <div id="{field.id}InputErrorIcon" class="invalidIcon {field.hideError}" onmouseover="displayInvalidTooltip">!</div>
      </div>
    </div>
    <div id="{field.id}InputTooltip" class="tooltip {field.hideError}">* Invalid text</div>
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
      <input id="{field.id}Input" class="amount-input" type="number" maxlength="30" placeholder="{field.label}" onchange="handleChange(this)" onfocus="handleFocus(this)" onblur="handleBlur(this)" />
      <div class="direction-container">
        <ul class="direction">
          <li class="direction-option">
            <input type="radio" id="income" name="direction" value="income" alt="Income" {field.incomeChecked} onchange="window.application.callHandler(this, '{field.id}Dir')">
            <label for="income">
              <img class="img-swap" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABmJLR0QA/wD/AP+gvaeTAAADmElEQVR4nO2bS0hUURjHf41KYmgZBRE9QFqUPaQgohZRYJsgCCMzCtJVQdEm0iAMKloEQbSIiGhVUBG0iB6IC5WgZS1UKowIo4VZCL1MMm1xZnDOQWfuedxzRq8/ODhX7vnu//vu3O9+5zGQPNYB3cBHYG9gLd4pQTg/nm79YeX4p4UJ58eB3rBy/LIC+IkcgLqgijzzGNn552Hl+GUfsvO/gKqgijxSDnxCDkBLUEWeuYrsfA/ibZAINgB/mXB+DNgRVJFHUsBL5Lt/K6gizxxHdv4rsCioIo8sAYaQA3BkshPneBSlSyvQAJQa9C0HFmcddwE7EYGYFhxGvns2bQRY41e+HaWIkZqrAFzMdbHiODyw5CSwMuv4OyKB6TIKtAEXXIjyRSXwDfkO1gZV5JlryM4/DSvHL1XAHyacH0XM3iSGhyS4atuCqNMzzv8GlgVV5JkXyHf/fFg5fqlDdn4AqAiqyCMlwDvkABwNqsgzJ5Cdf4vn4szFxVZjlrBSwDnlf82I19+04QruavYuz9qt2Y786rJpY8BWv/LtmAu8wd3dD1b0mOaAZsSzn6EfuGdoqwe4b9jXGpMZoVWIBcbsmZo9wBMniqKxELiU1mLKEIZD5Tbkr+8jCxGm3MDNo6e9ONqgGPgBLLdyxYwO3ARgXOeiFcBnpfMpa1fMCBKA60rHbsItMakBiL3vZkSFlun0D9imeWGXOAtAKkKHIuBm+m+G24hlp2lPlDrgGLAx63gQOBPRfhmwCbPFDRBTZK8QEyS50Jk4rdQRMB/hcPbXbdIlpiku9B79pKS2PmCBYttbElR3VnQRvXiqdyhyf1wByJcDXgPD6c/DiMchatIpi3heFOY5tCWRLwd8QExY7gLaEQMgU54hXp1RWA/s1rB9WePcg4gdY7HTiPx1a3TY1+trcEaT+AAUI563VjTfjwp9wFnEEHMqTgOHItpbqnn9do1za7IPioEH2G8gqEU8U8dznFOdbnFgvIKcwt3uibici5XE5wA1AJ2ISi9q06FJw26Tpm0dzZ3ZHWe/AaEFhEYthSuJb09OtYZt3YRqNRx2NWLrUOyq5axNy1cKxzYanPEkPgBqDtBd4tL55UXBDodzPcf50MkBs8PhQiTxAVBzQA16Q0sdCnY4nE3chVBBDocHHYlQ7biyC/BFOTbZPj+l3QPpDzYVVQ+wVjFeBNxF/GLD1O4IcAd5WQ7EJupeS80DQP1/Q7c2KrewnUoAAAAASUVORK5CYII="/>
            </label>
          </li>
          <li class="direction-option">
            <input type="radio" id="expense" name="direction" value="expense" alt="Expense" {field.expenseChecked} onchange="window.application.callHandler(this, '{field.id}Dir')">
            <label for="expense">
              <img class="img-swap" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAABmJLR0QA/wD/AP+gvaeTAAABGUlEQVRIie3UPUvDUBQG4Ad161AQXfwCQTo66yIiDoqO4tw/UcRd0NH/4OBmB0HE2UkQBAdxbV0cHBShqGAdjBSKtyRtLnTICweS3JDncLk5FCkyBNnCE9oDVhObWeBmDuhfNULINk7wgPfk5agZx3mgy2hZwGOCvKCGRUxgNNDMIAWW8Zw8uMPcP43lDu+ildycoRTYkdzh7+TiECMBNAr8gWoPMAR/4hhTmMFFVnglBdoN11HpWp/NCqdNG7dYDazPx4KrwmeghMtYcCgV3GdEgyMzbXbw2ge60S84hiOdX7GOct/tp8w0rhPwC3uxQVjXGa0NLMXEyljDqc7WXmFy0A9nORgt7Os9WnOD33CDA7+jsUiR4c4PF/oFIjYEfRAAAAAASUVORK5CYII="/>
            </label>
          </li>
        </ul>
      </div>
      <div class="containerIcon">
        <div id="{field.id}InputErrorIcon" class="invalidIcon hide" onmouseover="displayInvalidTooltip">!</div>
      </div>
    </div>
    <div id="{field.id}InputTooltip" class="tooltip hide">* Invalid text</div>
  </div>`,
    dateTextField: `<div id="{field.id}" class="container container-date">
    <div class="textfield">
      <label for="{field.id}Input" class="field-label">{field.label}</label>
      <input id="{field.id}Input" type="date" maxlength="30" placeholder="{field.label}" onchange="handleChange(this)" />
    </div>
    <div id="{field.id}InputTooltip" class="tooltip hide">* Invalid text</div>
  </div>`,
    flag: '<img id="{img.id}" title={img.title} onClick="window.application.callHandler(this,\'{img.id}\')" alt="{img.title}" src="data:image/png;base64,{img.imgBase64}" />',
    countryField: `
    <div id="{field.id}" class="country-dropdown">
      {country.selected}
      <div class="country-dropdown-content">
        {country.list}
      </div>
    </div>`,
    save: `
      <button id={save.id} class="{save.className}" onclick="window.application.callHandler(this, '{save.id}')" {save.disabled}> 
      <img
      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAADt0lEQVRoge2YvWsUQRjGn9m7fBg/iJLEJo2NAbFRtPQfSCEpFOwshPSpYhMUq4CojQr+C4JRCyWNgqAgsVUkhSAYNGcgGtDkEnPvY7E7u7Ozs7O3J5tEuBfm9m5m7+b3zPsxswd0rWtd69pumsobOPNydZxUD0iMEgBArC4343FuNfH+wgigFBQAAgAJkhDzKgIRQihgdBUhRAQtEUjciImFLdQOHflJUTc+TgzfaUdAkDdgw4eEaQthjGbAkwQluoIgEfUjHgeTn6Z+JQahePvE48b1dgTU8wWk4R38EAknVUqFq48IDkjgjXb6/uvU999cORuCh6pAPQkBUera2JPv/YsTI1d9AvI9YMO7PCAShopefQ0tAjJsYngiu0g0vJJMrN8qcnpsrjHbkYAieAARtBlCOr6ZhJMkYZUvIAkpJoORCkwfn1ueKi+gAB5AnHy6UYuwhNArQIcdM/B6fgU1k8eQnwMWvBNAomlVci9jz6UTVkSyC2B7wAEfdR0uLaAIHgg9EMInChjNbMLrkpqZglFZjUPICQ9fGOQLKIAHwhW0XaXvTycoQWY9YFaqsKKVgy8UYMK7dLjCwtzQ4rKakwM6V2jc74T3aPDsA354qADL6y2M9CebuZmEjPMgaa8unzIqk8QeEApWmoxxbHifDzxl1IInEAQJrKr34OaHJr6tb2eOBa24pEqmUqXKrYbfIO59DhD07XPDd+IBGx4A+g/UsPGrBQoBpfDu9wAuvf0DcLtoHbRsADVHt0JvXx1BX28peK8AG54g6vUABweDdEix1wgde9L08SCvziddbvjOQ8iq7Slh0YcdgfdUQu9OvNfh/QL+A3ivgL0E79NRHEJ7GN4vYC/Be0QUl1EL/txQD2ZODmCkT8UPNOaJ0/fZPPfYfY2m4NanGhbWggw8PQoKd2J75f8dPtsvIhjqIaaObZeCB4pOo46wqQJevx/qsUPRjC23eZLYHfNVwacfatqD9wrIS9gq4ZPn4jR8Z2XUAR9Wm+rgRaQUvF9ATqmsFJ7l4L0C8up8lfA6hGx4epQU7sSZTapCeA3aLrxfgAseqBQ+bO3DFwjIwusfrQre/JMgBd9JFXLBo2L4JITS8D4/FJbRr4/m0Xj4NDmYVQhv5sGP+RdYe/bcKiZlBETKg9YmatubumtH4GHOW6DA99/oEoDRoxfPx/Ag0GgSw73VwK9sqXjyQ+Pj8aQkvpT2gBCT+ovmIswutrDclErg7y7ttzbQEF4UJ3Nd0LWuda1ru2p/ASsCdZ0lM904AAAAAElFTkSuQmCC"/>
      </button>
    `,
  };

  setState(newState) {
    if (newState == null || typeof newState === 'undefined'){
      return;
    }
    if (JSON.stringify(this.state) !== JSON.stringify(newState)) {
      if (typeof newState === 'object') {
        this.state = Object.assign({}, this.state, newState);
      } else if (typeof newState === 'function') {
        this.state = newState(this.state, this.props);
      }
      
      // Trigger re-render
      this.update();
    }
  }
  mount(parent, ancestral) {
    console.log('mounting: ' + this.props.id);
    // Register component in Virtual DOM Tree.
    let found = this.id ? window.application.registeredComponents[this.id] : false;
    if (! found) {
      let ancestralNode = window.application.registeredComponents[ancestral];
      const node = new TreeNode(this, parent, ancestralNode);
      node.register();
    }

    // Trigger component lifecycle method if implemented.
    if (typeof this.componentDidMount === 'function') {
      this.componentDidMount();
    }

    // Render
    return this.render();
  }
  update() {
    const tNode = window.application.registeredComponents[this.id];
    console.log(this.id, window.application.registeredComponents)
    const parent = tNode.parent;
    if (parent) {
      const child = window.document.getElementById(this.id);

      if (typeof child === 'object' && child instanceof HTMLElement) {
        const htmlParent = window.document.getElementById(parent);

        if (htmlParent) {
          tNode.releaseDescendants();
          const newNode = parseHtmlToElement(this.id, this.render());
          htmlParent.replaceChild(newNode, child);
        } else {
          throw `Parent html element not found. Child id (${this.id}). Parent id (${parent}).`;
        }
      } else {
        throw `Child to be replaced upon update is not a HTMLElement. Child id (${this.id}).`;
      }
    }
  }
  unmount() {
    // Trigger component lifecycle method
    if (typeof this.componentWillUnmount !== 'function' || this.componentWillUnmount()) {
      const tNode = window.application.registeredComponents[this.id];
      tNode.releaseDescendants();
      tNode.unregister();
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
    let mountedCb = (new ComboBox(cbProps)).mount(this.id, this.id);

    for (let i=0; i< Math.min(pageCount, 3); i++) {
      const handleClick = this.getClickHandler().bind({pageCallback: this.props.pageCallback, value: i});
      const btn = new Button({id: 'tablePaging'+i, className: 'paginationButton', content: i * rowsPerPage, handleClick});

      buttons.push(btn.mount(this.id, this.id));
    }
    if (pageCount > 3) {
      buttons.push((new Button({id: 'tablePagingNext', className: 'paginationButton', content: '...'})).mount(this.id, this.id))
    }
    return this.fill('tablePagination', {id: this.id, cbRowsPerPage: mountedCb, carrosel: buttons.join('')});
  }
}
// Page - Components - End Table Pagination
// Page - Components - Container
class Container extends RComponent {
  // props: {id: string, className: string, content: RComponent[]}
  render() {
    let c = this;
    let content = (c.props.content ?? []).map(item => item.mount(c.id, c.id)).join('');
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
    let cells = this.props.columns.map(col => (new LeafComponent('th', {children: col, id: col})).mount('th' + this.id, this.id));

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

    let header = (new HeaderRow({id: 'cfHeaderRow', columns: props.columns})).mount(this.id, this.id);
    return this.fill(Table.main, {id: this.id, className: this.props.className, rows: rows.join(''), header});
  }
}
// Page - Components - End Table
// Page - Business Components - Finance Table
class FinanceTable extends RComponent {
  constructor(props) {
    super(props);

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
      this.props.callInput(this);
    }
  }
  render() {
    // date: 30%, provider: 50%, amount: 20%
    // const data = [
    //   {
    //     "date": 1567209600000, // Required, reduceable: day/Month
    //     "provider": "City Ticket Payment", // Required, reduceable: truncate to 15 ...
    //     "description": "Bus to work", // Unnecessary, useful
    //     "amount": 3.4, // Required, FULL
    //     "currency": "PLN", // Necessary?, reduceable: icons/symbols
    //     "direction": "false", // Required, reduceable: show as text color (false: red, true: blue)
    //     "location": "Warszawa", // Unnecessary, not useful
    //     "labels": [ // Unnecessary, useful, reduceable: replace by icons
    //       "Transport",
    //       "Work"
    //     ],
    //     "book": "M Account", // Unnecessary, not useful
    //     "elementId": 432 // Necessary?, hidden?
    //   },
    // ];
    const content = this.props.data.map(this.rowToHtml.bind(this)).join('');
    const label = this.fill('simplediv', {className: 'financialLabel', content: (new Date()).toISOString().substring(0, 10)});
    const buttonId = 'AddNewCashflow';
    this.registerHandler(buttonId, this.handleAddNew.bind(this));
    const button = this.fill('button', {id: buttonId, className: 'cashflowButtonAdd', content: '<span>+</span>'});
    const header = this.fill('simplediv', {className: 'financialHeader', content: label + button});

    return this.fill('div', {id: this.id, className: 'cashflowTable', content: header + content});
  }
}
// Page - Business Components - End Finance Table
// Page - Components - Form
class Form extends RComponent {
  // props: {id, className, fields, submit}
  constructor(props) {
    super(props);
  }
  handleSubmit(e) {
    // Perform action
    if (typeof this.props.submit === 'function') {
      this.props.submit();
    }

    // Single Page Application: prevent reload on form submit
    e.preventDefault();
  }
  render() {
    const fields = this.props.fields;

    // register submit event
    this.registerHandler(this.id, this.handleSubmit.bind(this));

    return this.fill('form', {id: this.id, className: 'commonForm', fields});
  }
}
// Page - Components - End Form
// Page - Components - Form Text Field
class TextField extends RComponent {
  constructor(props) {
    super(props);

    this.state = {
      text: ''
    };
  }
  handleChange() {
    // TODO: Handle this event
    // handle? How?
  }
  render() {
    //this.registerHandler(this.id, this.handleChange.bind(this));
    console.log(this.props)
    
    return this.fill('simpleTextField', {id: this.id, label: this.props.label});
  }
}
const currencies = {
  'EUR': '&euro;', // €
  'USD': '&dollar;', // $
  'GBP': '&pound;', // £
  'PLN': 'Z&#322;', // Zł
  'BRL': 'R&dollar;', // R$
  'CZK': 'K&#269;', // Kč
};
class FinanceForm extends RComponent {
  constructor(props) {
    super(props);

    this.state = {
      country: this.props.country ?? 'Spain',
      currency: this.props.currency ?? 'EUR',
      date: this.props.date ?? new Date(),
      direction: this.props.direction ?? false,
      countries: this.props.countryImg ?? undefined,
      description: this.props.description ?? '',
      provider: this.props.provider ?? '',
      labels: this.props.labels ?? [''],
      book: this.props.book ?? '',
      saveDisabled: false,
    };
  }

  // Load data necessary for this form
  componentDidMount() {
    // Inside asynchronous methods, context of this is lost.
    let form = this;

    // Load flags only if not already loaded to avoid infinite loop
    if (!form.state.countries) {
      // Countries list in DB is huge but not necessary here in this form. Best to change source code to add countries when required.
      const uniqueCountries = ['Poland', 'Italy', 'Scotland', 'Brazil', 'Spain'];
      // Istead of getting all and then filtering, better to make multiple requests since we don't need many countries.
      Promise.all(uniqueCountries.map(c => CountryAPI.getByName(c))).then(data => {
        // Result returns one array with each object. Combine them in a single array removing undefined results.
        let countries = data.flat().filter(item => item !== undefined);

        form.setState({countries});
      });
    }
  }

  getFlagProps() {
    const found = this.state.countries ? this.state.countries.find(c => c.name === this.state.country) : undefined;
    const flag = found ? found.flag : '';

    return {id: this.state.country, imgBase64: flag};
  }

  handleCountryUpdate(e) {
    this.setState({country: e.title});
  }
  handleCurrencyUpdate(e) {
    this.setState({currency: e.title});
  }

  buildCountryProps(c) {
    let id = this.id + c.name.replace(/\s/g, '');
    this.registerHandler(id, this.handleCountryUpdate.bind(this));

    return {id, title: c.name, imgBase64: c.flag};
  }

  handleFlowChange(e) {
    console.log(e.id, e.checked);

    this.setState({direction: e.id === 'expense' ? false : true});
  }
  handleUpdateDate(e) {
    //
  }
  handleGeneralUpdate(e) {
    console.log('handling update of: ' + (e ? e.id : '??'));
    console.log(e ? 'e is defined' : 'e is undefined');
    console.log(e && e.target ? 'e has target' : 'e does not have target');
    console.log(e && e.target ? 'value: ' + e.target.value : e ? e.value : 'cannot read value with no target or event')

    let newValue = e.value;
    if (e.id.indexOf('Desc') >= 0) {
      this.setState({description: newValue});
      return;
    } else if (e.id.indexOf('Provider') >= 0) {
      this.setState({provider: newValue});
      return;
    } else if (e.id.indexOf('Label') >= 0) {
      this.setState({labels: [newValue]});
      return;
    } else if (e.id.indexOf('Book') >= 0) {
      this.setState({book: newValue});
      return;
    }
  }
  handleUpdateAmount(e) {
    // 
  }

  handleSave() {
    // TODO: Finish creating CF object
    let newCashFlow = {
      currency: this.state.currency,
      location: this.state.country,
      direction: this.state.direction,
      provider: this.state.provider,
      description: this.state.description,
      labels: this.state.labels,
      book: this.state.book,
    };

    console.log('saving', newCashFlow);

    // TODO: Call RestAPI.insert
  }

  render() {
    const strDisabled = this.state.saveDisabled ? 'disabled' : '';
    const currencyHtml = currencies[this.state.currency] ?? '?';
    const mapCountry = c => this.fill('flag', this.buildCountryProps(c));
    const currencyListKeys = Object.keys(currencies);
    const currencyList = [];
    const amountProps = {
      id: this.id + 'Amount',
      label: 'Amount', 
      currency: currencyHtml, 
      currencyList: currencyList.join(''), 
      expenseChecked: this.state.direction ? '' : 'checked', 
      incomeChecked: this.state.direction ? 'checked' : '',
    };
    this.registerHandler(this.id + 'Amount' + 'Dir', this.handleFlowChange.bind(this));

    currencyListKeys.forEach(key => {
      let id = this.id + key;
      this.registerHandler(id, this.handleCurrencyUpdate.bind(this));
      currencyList.push(`<label id="${id}" title="${key}" onclick="window.application.callHandler(this,'${id}')">${currencies[key]}</label>`)
    });

    this.registerHandler(this.id + 'save', this.handleSave.bind(this));

    let date = this.fill('dateTextField', {id: this.id + 'Date', label: 'Date'});
    let country = this.fill('countryField', {
      id: this.id + 'country', 
      selected: this.fill('flag', this.getFlagProps()),
      list: this.state.countries ? this.state.countries.map(mapCountry).join('') : '',
    });
    let provider = this.fill('simpleTextField', {id: this.id + 'Provider', label: 'Provider', value: this.state.provider});
    let description = this.fill('simpleTextField', {id: this.id + 'Desc', label: 'Description', value: this.state.description});
    let amount = this.fill('amountField', amountProps);
    let labels = this.fill('simpleTextField', {id: this.id + 'Labels', label: 'Labels', value: this.state.labels[0]});
    let book = this.fill('simpleTextField', {id: this.id + 'Book', label: 'Book', value: this.state.book});
    let save = this.fill('save', {id: this.id + 'save', disabled: strDisabled, className: 'financeSave'});

    this.registerHandler(this.id + 'Date', this.handleUpdateDate.bind(this));
    this.registerHandler(this.id + 'Desc', this.handleGeneralUpdate.bind(this));
    // TODO: call specific handlers addressing editing changes with effects, validation and state change.
    this.registerHandler(this.id + 'ProviderChange', this.handleGeneralUpdate.bind(this));
    this.registerHandler(this.id + 'ProviderFocus', this.handleGeneralUpdate.bind(this));
    this.registerHandler(this.id + 'ProviderBlur', this.handleGeneralUpdate.bind(this));
    this.registerHandler(this.id + 'Amount', this.handleUpdateAmount.bind(this));
    this.registerHandler(this.id + 'Labels', this.handleGeneralUpdate.bind(this));
    this.registerHandler(this.id + 'Book', this.handleGeneralUpdate.bind(this));

    let containerProps = {
      id: this.id, 
      className: 'page', 
      content: [save, date, country, amount, provider, description, labels, book].join(''),
    };
    return this.fill('container', containerProps);
  }
}
const props = {
  required: true,
  restricted: true,
  options: [
    'one',
    'two',
    'three',
  ],
};

function isEmpty(field) {
  let val = field.value;
  return typeof val !== 'string' || val.trim().length <= 0;
}
function getLabelFrom(field) {
  var labels = document.getElementsByTagName('label');
  for( var i = 0; i < labels.length; i++ ) {
    if (labels[i].htmlFor == field.id) {
      return labels[i];
    }
  }
}

function isValid(field) {
  let hasValue = ! isEmpty(field);
  let isInOptions = props.options.indexOf(field.value) >= 0;
  
  if (props.required && props.restricted) {
    return isInOptions;
  } else if (props.required) {
    return hasValue;
  } else if (props.restricted) {
    return isInOptions || !hasValue;
  } else {
    return true;
  }
}

function handleChange(dispatcher) {
  let divElem = dispatcher.parentElement; 
  let labelElem = getLabelFrom(dispatcher);
  let tooltip = window.
    document.
    getElementById(dispatcher.id+'Tooltip');
  let icon = window.
    document.
    getElementById(dispatcher.id+'ErrorIcon');
  
  let bContainInvInput = dispatcher
        .classList
        .contains('invalidInput');
  let bIsInvalid = ! isValid(dispatcher);
  
  if (bIsInvalid) {
    tooltip.innerHTML = isEmpty(dispatcher) ? '* Required Field' : '* Not a valid option.';
  }
  
  if ((bIsInvalid && !bContainInvInput) || (!bIsInvalid && bContainInvInput)) {
    dispatcher.
      classList.
      toggle('invalidInput');
    
    divElem.
      classList.
      toggle('invalidDiv');
    
    labelElem.
      classList.
      toggle('invalidLabel');
    
    tooltip.
      classList.
      toggle('hide');
    
    if (icon) {
      icon.
        classList.
        toggle('hide');
    }
  }
}

function handleFocus(dispatcher) {
  let label = getLabelFrom(dispatcher);
  
  label.
    classList.
    remove('hide');

  dispatcher.placeholder = '';
}

function handleBlur(dispatcher) {
  let label = getLabelFrom(dispatcher);
  
  if (isEmpty(dispatcher)) {
    label.
      classList.
      add('hide');
    dispatcher.placeholder = label.innerHTML.trim();
  } else {
    label.
      classList.
      remove('hide');

    dispatcher.placeholder = '';
  }
}
// Page - Components - End Form Text Field


var loadApp = function() {

  // Register root node
  window.application.registeredComponents['app'] = new TreeNode('app');

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
    // const props = {
    //   id: 'cfMainTable',
    //   className: 'table',
    //   columns: ['Date', 'Provider', 'Description', 'Amount', 'Location', 'Book'],
    //   data: filteredCfs,
    // };

    // let table = new Table(props);
    // const pgProps = {
    //   id: 'cfTablePaging', 
    //   rowCount: filteredCfs.length, 
    //   rowsPerPageCallback: table.getRowsPerPageHandler(), 
    //   pageCallback: table.getPageHandler()
    // };
    // let tablePagination = new TablePagination(pgProps);
    // let container = new Container({id: 'cfTableContainer', className: 'tableContainer', content: [table, tablePagination]});
    // let mountedContainer = container.mount('app');

    // window.document.getElementById('app').innerHTML = mountedContainer;

    
    //const myInput = new TextField({id: 'provider', label: 'Provider'});

    const callInput = (lastpage) => {
      lastpage.unmount();

      const myInput = new FinanceForm({id: 'fincForm'});
      const strInput = myInput.mount('app', 'app');

      
      window.document.getElementById('app').innerHTML = strInput;
    };
    const props = {
      data,
      id: 'cfMainTable',
      callInput,
    };
    const tableComp = (new FinanceTable(props));

    const strTable = tableComp.mount('app', 'app');
    window.document.getElementById('app').innerHTML = strTable;
  }).catch(err => {
    window.document.getElementById('app').innerHTML = err;
    //callback(500, 'text/html', err);
  });
}
