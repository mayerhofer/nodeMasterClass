const template = '<table class="{table.className}"><thead><tr>{table.headerColumns}</tr></thead><tbody>{table.rows}</tbody></table>';

const templateRow = '<tr>{row.cells}</tr>';

const templateCell = '<td>{cell.children}</td>';

const templateHeaderCell = '<th>{cell.children}</th>';

const buildRow = (tuple, columns) => {
  let cells = columns.map(col => templateCell.replace('{cell.children}', tuple[col]));

  return templateRow.replace('{row.cells}', cells.join(''));
}

const buildTable = function(props) {
  let result = template;

  let rows = props.data.map(row => buildRow(row, props.columns));

  let cells = props.columns.map(col => templateHeaderCell.replace('{cell.children}', col));

  result = result.replace('{table.className}', props.className);
  result = result.replace('{table.rows}', rows.join(''));
  result = result.replace('{table.headerColumns}', cells.join(''));

  console.log(result);

  return result;
}

module.exports = buildTable;
