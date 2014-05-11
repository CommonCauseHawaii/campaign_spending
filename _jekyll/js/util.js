// General Util
var money = d3.format('$,.2f');
var sort_by_either = function(ascending, float_function) {
  var comparator = function(a, b) {
    if(float_function(a) > float_function(b)) {
      return ascending ? 1 : -1;
    } else if(float_function(a) < float_function(b)) {
      return ascending ? -1 : 1;
    } else {
      return 0;
    }
  }
  return comparator;
}
var sort_by_asc = function(float_function) { return sort_by_either(true, float_function); }
var sort_by_desc = function(float_function) { return sort_by_either(false, float_function); }

var get_attr = function(attribute) {
  var getter_function = function(data) {
    return data[attribute];
  }
  return getter_function;
}

function hash_code(s) {
    return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
}

d3.selection.prototype.move_to_front = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

function tabulate(selector, table_class, data, columns) {
  var table = d3.select(selector).append("table")
    .attr('class', table_class)
    thead = table.append("thead"),
    tbody = table.append("tbody");

  // append the header row
  thead.append("tr")
    .selectAll("th")
    .data(columns)
    .enter()
    .append("th")
      .text(function(column) { return column; });

  // create a row for each object in the data
  var rows = tbody.selectAll("tr")
    .data(data)
    .enter()
    .append("tr");

  // create a cell in each row for each column
  var cells = rows.selectAll("td")
    .data(function(row) {
      return columns.map(function(column) {
        return {column: column, value: row[column]};
      });
    })
    .enter()
    .append("td")
      .text(function(d) {
        // TODO: replace this with an extensible framework where intead of just
        // passing in 'columns' you would pass in an object with column_name,
        // column_display_name, and an optional column_func
        if(d.column == 'date') {
          return d.value.substring(0,10);
        } else if(d.column == 'amount') {
          return money(d.value);
          //return '$' + d.value;
        }
        return d.value;
      });

  return table;
}
