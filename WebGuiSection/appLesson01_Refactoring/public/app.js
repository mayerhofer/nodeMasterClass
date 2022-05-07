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
  const filter = { entity: route, _id: item._id, userId: item.userId };
  const obj = route === 'errorLog' ?
      buildLogObj(item) :
      item.data;

  return Object.assign(obj, filter);
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
const endpoint = "http://localhost:3002/entities";

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
    const _path = this.path + '?entity=' + filter;
    const fetchOptions = {method: 'GET'};

    let response = new ResponseHelper(await fetch(_path, fetchOptions), filter);
    if (response.hasOkStatus()) {
      let res = (filter === 'errorLog' ? await response.textToArray() : await response.jsonToArray());
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
    if (!(value instanceof RComponent)) {
      throw 'Argument "value" must be not null and an instance of a class that extends RComponent.';
    }
    if (typeof parent !== 'string' || parent.trim().length <= 0) {
      // DOM cannot be verified, since rendering usually is not finished once you mount a component.
      throw 'Argument "parent" must be a valid string with the parent HTMLElement id.';
    }
    if (parent === 'app' && ancestral) {
      throw 'Argument "ancestral" must be null/undefined when node is the root element.';
    }
    if (!(parent === 'app' || ancestral instanceof TreeNode)) {
      throw 'Argument "ancestral" must be the parent TreeNode/Component, unless node is the root element. Element design id: ' + value.props.id;
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
      window.application.registeredComponents[this.value.id] = this;
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

  static templates = {
    simplediv: '<div class="{div.className}">{div.content}</div>',
    div: '<div id="{div.id}" class="{div.className}">{div.content}</div>',
    button: '<button id="{button.id}" type="button" class="{button.className}" onClick="window.application.callHandler(this,\'{button.id}\')">{button.content}</button>',
    simplebutton: '<button type="button" class="{button.className}" onClick="window.application.callHandler(this,\'{button.id}\')">{button.content}</button>',
    comboBox: '<div id={cb.id}><input class="{cb.className}" type="text" list="{cb.comboId}"{cb.value} onchange="window.application.callHandler(this,\'{cb.comboId}\')"><datalist id="{cb.comboId}" class="comboBox">{cb.options}</datalist></div>',
    tablePagination: '<div id="{pagination.id}" class="pagination"><span>Rows per page:&nbsp;</span>{pagination.cbRowsPerPage}{pagination.carrosel}</div>',
    container: '<div id="{container.id}" class="{container.className}">{container.content}</div>',
    th: '<th id="{cell.id}">{cell.children}</th>',
    thead: '<thead id="{row.id}"><tr id="th{row.id}">{row.content}</tr></thead>',
    form: '<form id="{form.id}" class="{form.className}" onsubmit="window.application.callHandler(this,\'{form.id}\')">{form.fields}</form>',
    textField: '<div id="{text.id}" class="{text.className}"><label for="{this.inputId}">{text.name}</label><input type="text" id="{this.inputId}" onchange="window.application.callHandler(this,\'{text.id}\')" /></div>',
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
    // TODO: Implement call form for new cashflow
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
    //
    const textField = '<div id="{text.id}" class="{text.className}"><label for="{this.inputId}">{text.name}</label><input type="text" id="{this.inputId}" onchange="window.application.callHandler(this,\'{text.id}\')" /></div>';

    const inputId = this.id + 'input';
    const name = this.props.name;

    this.registerHandler(this.id, this.handleChange.bind(this));
    
    this.fill('textField', {id: this.id, inputId, name, className});
  }
}
// Page - Components - End Form Text Field


var loadApp = function() {
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

    const props = {
      data,
      id: 'cfMainTable',
      
    };
    window.document.getElementById('app').innerHTML = (new FinanceTable(props)).mount('app');

  }).catch(err => {
    window.document.getElementById('app').innerHTML = err;
    //callback(500, 'text/html', err);
  });
}
