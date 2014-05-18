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
      .text(function(column) { return column.display_name; });

  // create a row for each object in the data
  var rows = tbody.selectAll("tr")
    .data(data)
    .enter()
    .append("tr");

  // create a cell in each row for each column
  var cells = rows.selectAll("td")
    .data(function(row) {
      return columns.map(function(column) {
        return {column: column, value: row[column.name]};
      });
    })
    .enter()
    .append("td")
      .attr('class', function(d) { return d.column.name;})
      .text(function(d) {
        if(d.column.func) {
          return d.column.func(d.value);
        } else {
          return d.value;
        }
      });

  return table;
}
