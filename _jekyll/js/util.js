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
