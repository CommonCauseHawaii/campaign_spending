var gui = new dat.GUI();

var dat_gui_ranges = {
  scale                 : [0.01, 3],
  w                     : [0, 1200],
  h                     : [0, 1200],
  t_margin              : [0, 100],
  r_margin              : [0, 100],
  b_margin              : [0, 100],
  l_margin              : [0, 100],
  tick_length           : [0, 20],
  h_shift               : [0, 20],
  y_axis_fontsize       : [0, 20],
  x_axis_font_rotation  : [0, 360],
  max_bubble_rad        : [1,100],
  bubble_alpha          : [0,1],
}

//put all hard coded values in this object
var params = {
  scale: 1.7,
  w: 400,
  h: 400,
  t_margin: 50,
  r_margin: 50,
  b_margin: 50,
  l_margin: 50,

  bar_width: 50,
  tick_length: 7,

  x_axis_color: "gray",
  x_axis_fontcolor: "gray",
  x_axis_fontsize: 10,
  x_axis_font_rotation: 320,

  y_axis_color: "gray",
  y_axis_fontcolor: "gray",
  y_axis_fontsize: 10,
  max_bubble_rad: 16,
  bubble_alpha: 0.85,
  bubble_color: "black",
  h_shift: 0,
  //just to store for redraw
  viz_data: [],
};

function left_boundary() { return params.l_margin; }
function right_boundary() { return params.w * params.scale - params.r_margin; }
function top_boundary() { return params.t_margin; }
function bottom_boundary() { return params.h * params.scale - params.b_margin; }
function h_shift(s_type) {return s_type.indexOf("Undergraduate") === -1 ? params.h_shift : params.h_shift * -1 }

function pf(num) {
  if(typeof(num) === 'number') {
    return num;
  } else {
    return parseFloat(num.replace(",", ""));
  }
}

function init_viz_element(svg, elem_with_class, data) {
  var elem_parts = elem_with_class.split(".");
  var elem = elem_parts[0];
  var elem_class = elem_parts[1];

  var viz_element = svg.selectAll(elem_with_class).data(data);
  viz_element.enter().append(elem).attr("class", elem_class);
  viz_element.exit().remove();

  return viz_element;
}

function draw(data) {
  data = filter_assets_list(data);

  //store things for next draw iteration
  params.viz_data = data;
  //"#486135", "#2C6E3E", "#89AC6E", "#B5C8A0"
  var color_list = ["#224970", "#6BA2DB", "#A0C3E8", "#E3EBF5",  "#B99F69", "#D9955E", "#E3AD65", "#EFD299"]
  var headers = d3.keys(data[0]);

  var getX = get_attr('days_held');
  //var getY = get_attr('percentage_lost');
  var getY = get_attr('depreciation_per_day');
  //var getY = get_attr('days_till_zero_value');
  var getR = get_attr('acquisition_amount');
  var getColor = function(d) {
    if(d.party === 'Republican') {
      return d3.rgb(255, 0, 0);
    } else if(d.party === 'Democrat') {
      return d3.rgb(0, 0, 255);
    } else {
      return d3.rgb(0, 255, 0);
    }
  };
  var splitLongLines = function(text) {
    var length_limit = 30;
    var lines = []
    for( var i=0; i<text.length; i+=length_limit ) {
      console.log('on i ' + i + ' < ' + text.length);
      lines.push(text.substring(i, length_limit+i))
    }
    return lines.join('<br/>');
  }
  var getTitle = function(d) {
    // TODO: make tabular. Foundation?
    var str = "Candidate: " + d.candidate_name;
    str += "<br/>Description: " + splitLongLines(d.durable_asset_description);
    str += "<br/>Bought for: $" + d.acquisition_amount;
    str += "<br/>Sold for: $" + d.disposition_amount;
    str += "<br/>Sold To: " + splitLongLines(d.sold_to);
    str += "<br/>Days held: " + d.days_held;
    str += "<br/>Depreciation per day: $" + d.depreciation_per_day.toFixed(2);
    str += "<br/>Days till $0: " + d.days_till_zero_value.toFixed(0);
    str += "<br/>Rate: " + d.rate.toFixed(2);
    return str;
  };

  var max_x_val = d3.max(data, getX);
  var max_y_val = d3.max(data, function(d) { return getY(d) == Infinity ? 1000 : getY(d); });
  console.log('max y val ' + max_y_val);
  var max_r_val = d3.max(data, getR);

  //preparing SVG Area
  var svg = d3.selectAll("svg");
  svg.
    attr("height", function(d,i) {return params.h * params.scale}).
    attr("width", function(d) {return params.w * params.scale}).
    attr("fill", 'green');

  var x = d3.scale.linear().domain([0, max_x_val]).range([left_boundary(), right_boundary() ]);
  var y = d3.scale.linear().domain([0, max_y_val]).range([bottom_boundary(), top_boundary() ]);
  var r = d3.scale.linear().domain([0, Math.sqrt(max_r_val)]).range([0, params.max_bubble_rad]);
  //var color = d3.scale.linear().domain([0,50,100]).range(["#C4592D","#919496", "#0F5577"]);
  //var color = d3.scale.linear().domain([0,50,100]).range(["#EA7F2F","#919496", "#41BADC"]);
  var color = d3.scale.linear().domain([0,50,100]).range(["#EA7F2F","#EEE", "#41BADC"]);

  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) { return getTitle(d); })
  svg.call(tip);
  //------ data Bubbles -------------------------------------------------------------------
  var data_bubbles = init_viz_element(svg, "circle.asset", data)
  .attr("r", function(d) { return r(Math.sqrt(pf(getR(d)))); })
  .attr("cx", function(d) { return x(pf(getX(d))); })
  .attr("cy", function(d) { return y(pf(getY(d))); })
  .attr("fill", function(d) { return getColor(d); })
  .attr("occ", function(d) { return "type"; })
  .sort(function(a,b) { return a.acquisition_amount < b.acquisition_amount; })
  .on('mouseover', tip.show)
  .on('mouseout', tip.hide)
  .attr('data-link', get_attr('link'))
  .on('click', function(e) { window.open($(this).data('link'), '_blank'); })

  //.attr("stroke", function(d) { return "#BBB"; })
  //.attr("fill-opacity", params.bubble_alpha);
  //------ data Bubbles end -------------------------------------------------------------------

  //------ x Axis -------------------------------------------------------------------
  var xaxis = init_viz_element(svg, "line.xaxis", ["dummy_data"])
  .attr("y1", bottom_boundary())
  .attr("y2", bottom_boundary())
  .attr("x1", function(d) {return left_boundary()})
  .attr("x2", function(d) {return right_boundary()})
  .attr("stroke", params.x_axis_color);

  var xticks = init_viz_element(svg, "line.xtick", x.ticks(10))
  .attr("y1", bottom_boundary())
  .attr("y2", bottom_boundary() + params.tick_length )
  .attr("x1", function(d) {return x(d)})
  .attr("x2", function(d) {return x(d)})
  .attr("stroke", params.x_axis_color);

  var xtick_labels = init_viz_element(svg, "text.xtick_label", x.ticks(10))
  .attr("x", function(d) { return x(d)})
  .attr("y", bottom_boundary())
  .attr("fill", params.x_axis_fontcolor)
  .attr("font-size", params.x_axis_fontsize+"px")
  .attr("transform", function(d) {return "rotate("+params.x_axis_font_rotation +" "+ (x(d)+params.tick_length*4).toString() + "," + bottom_boundary() + ")"; })
  .attr("text-anchor", "end")
  .text(function(d) {return d; });

  //------ x Axis End -------------------------------------------------------------------


  //------ y Axis -------------------------------------------------------------------
  var yaxis = init_viz_element(svg, "line.yaxis", ["dummy_data"])
  .attr("x1", left_boundary())
  .attr("x2", left_boundary())
  .attr("y1", function(d) {return top_boundary()})
  .attr("y2", function(d) {return bottom_boundary()})
  .attr("stroke", params.y_axis_color);

  var yticks = init_viz_element(svg, "line.ytick", y.ticks(10))
  .attr("y1", function(d) {return y(d)})
  .attr("y2", function(d) {return y(d)})		
  .attr("x1", left_boundary() - params.tick_length)
  .attr("x2", left_boundary() )
  .attr("stroke", params.y_axis_color);

  var ytick_labels = init_viz_element(svg, "text.ytick_label", y.ticks(10))
  .attr("y", function(d) { return y(d) + (params.y_axis_fontsize / 3.5)})
  .attr("x", left_boundary() - params.tick_length * 1.5)
  .attr("fill", params.y_axis_fontcolor)
  .attr("font-size", params.y_axis_fontsize+"px")
  .attr("text-anchor", "end")
  .text(function(d) {return d; });

  //------ y Axis End -------------------------------------------------------------------
}

var create_candidate_list = function(data) {
  var candidates = d3.nest()
    .key(get_attr('candidate_name'))
    .rollup(function(leaves)
            { return {candidate_name:leaves[0].candidate_name,
              num_assets: d3.sum(leaves, function(d) {return 1;}),
              sum_days_held: d3.sum(leaves, get_attr('days_held')),
              sum_acquisitions: d3.sum(leaves, get_attr('acquisition_amount')),
              sum_dispositions: d3.sum(leaves, get_attr('disposition_amount'))
            };})
    .entries(data);

  // Flatten candidates object
  candidates.map(function(candidate) {
    $.each(candidate.values, function(key, value) {
      candidate[key] = value;
    });
    delete candidate.values
    delete candidate.key
  });

  candidates.map(function(candidate) {
    var average_depreciation = (candidate.sum_acquisitions - candidate.sum_dispositions)/candidate.sum_days_held;
    candidate.average_depreciation_per_day = average_depreciation;
    candidate.average_depreciation_per_day_pretty = money(average_depreciation);
  });

  // Sort candidates by depreciation rate
  var sorted_candidates = candidates.sort(sort_by_desc(get_attr('average_depreciation_per_day')));

  var headers = [['candidate_name', 'Candidate Name'],
    ['num_assets', '# assets'],
    ['average_depreciation_per_day_pretty', 'Average depreciation']];
  var table = d3.select('#candidate-container').append('table'),
    thead = table.append('thead'),
    tbody = table.append('tbody');

  thead.append('tr')
    .selectAll('th')
    .data(headers)
    .enter()
    .append('th')
      .text(function(header) { return header[1]; });

  var rows = tbody.selectAll('tr')
    .data(sorted_candidates)
    .enter()
    .append('tr')
      .attr('data-candidate-name', get_attr('candidate_name'))
      .on('mouseover', function(e) {
        var candidate_name = $(this).data('candidate-name');
        d3.select('#chart-container').selectAll('.asset')
        .attr('fill', function(d) {
          if(candidate_name === d.candidate_name) {
            return d3.rgb(255, 50, 50);
          } else {
            return d3.rgb(0, 0, 0);
          }
        })
      })

  var cells = rows.selectAll('td')
  .data(function(row) {
    return headers.map(function(column) {
      return {column: column[0], value: row[column[0]]};
    });
  })
  .enter()
  .append('td')
    .text(get_attr('value'));
}

var clean_candidate_list = function(data) {
  // TODO: move data fixing to named function
  // TODO: add categorization
  // * printer/scanner
  // * computer
  // * camera
  // * other
  // * phone
  // ** iPad/tablet
  // * software
  // * tables
  // * computer peripheral (monitor)
  // * projector
  // * car?
  // * power tools (chain saw)
  // Fix data records
  // Add fields: date_acquired, date_disposed (from the two dates)
  // Keep fields: Candidate Name, Vender Name, method (as disposition_method)

  // Do calculations on data
  // days_held: number of days between date_acquired and date_disposed
  // percentage_lost: (acquisition_amount-disposition_amount)/acquisition_amount


  // Combine rows with matching 'durable_asset_id' (throw out records without matching buy and sell)
  var buy_records = data.filter(function(d) { return d.amount !== undefined });
  // Note: disposition spelled as diposition
  var sell_records = data.filter(function(d) { return d.diposition_amount !== undefined });
  window.buy_records = buy_records;
  window.sell_records = sell_records;
  var full_records_with_empty = buy_records.map(function(buy_record) {
    var sell_record = sell_records.filter(function(d) { return d.durable_asset_id === buy_record.durable_asset_id })[0];
    if(sell_record === undefined) {
      return undefined;
    }
    // TODO: move into function
    // TODO: do advanced calculation based on fixed data
    var millisInDay = 86400000;
    var start_millis = Date.parse(buy_record.date);
    var end_millis = Date.parse(sell_record.date);
    var days_held = (end_millis - start_millis) / millisInDay;
    var depreciation_per_day = (buy_record.amount - sell_record.diposition_amount) / days_held;
    var depreciation_rate_per_day = depreciation_per_day/buy_record.amount;
    return {
      durable_asset_id: buy_record.durable_asset_id,
      candidate_name: buy_record.candidate_name,
      party: buy_record.party,
      acquisition_amount: buy_record.amount,
      disposition_amount: sell_record.diposition_amount,
      durable_asset_description: buy_record.durable_asset_description,
      // TODO: Learn how to link to html view on socrata
      link: "https://data.hawaii.gov/resource/fmfj-bac2.json?$where=durable_asset_id='" + buy_record.durable_asset_id + "'",
      sold_to: sell_record.to_whom,
      amount_difference: buy_record.amount - sell_record.diposition_amount,
      percentage_lost: (buy_record.amount - sell_record.diposition_amount)/buy_record.amount,
      depreciation_per_day: depreciation_per_day,
      depreciation_rate_per_day: depreciation_rate_per_day,
      rate: depreciation_rate_per_day * 1000,
      days_till_zero_value: 1 / depreciation_rate_per_day,
      days_held: days_held
    };
  });
  var full_records = full_records_with_empty.filter(function(d) { return d !== undefined });

  // Store full_records so it can be used in the console
  window.full_records = full_records;
  return full_records;
}

var filter_assets_list = function(data) {
  var filter = $('.filter-buttons .button.selected').data('filter');

  if(filter === "all") {
    return data;
  } else {
    // Expect "> 500" or "< 500". Generally "(<|>) \d+"
    var filter_func = function(d) { return eval('d.days_till_zero_value ' + filter ); };
    return data.filter(filter_func);
  }
}

//read data once and start to do initial draw
d3.json("data/short_candidate_spending.json", function(data) {
  //var full_records = clean_candidate_list(data);
  var full_records = data;
  //draw(full_records);
  //create_candidate_list(full_records);
  var columns = ['candidate_name', 'party', 'vendor_name', 'amount', 'expenditure_category', 'purpose_of_expenditure'];
  tabulate(full_records, columns, '#table-container');
});


//all dat.gui changes should trigger a redraw
// generate the dat.gui control for any numerical ranges
d3.entries(dat_gui_ranges).forEach(function(elem) {
  var attr = elem.key;
  var range = elem.value;
  gui.add(params, attr, range[0], range[1]).onChange(function() { draw(params.viz_data); });
} );

$('.dg.ac').find('ul').toggleClass('closed');
$('.dg.ac').hide();

//$('.filter-buttons').on('click', '.button', function(e) {
//  e.preventDefault();
//  var $this = $(this);
//  $this.closest('.button-group').find('.button').removeClass('selected');
//  $this.addClass('selected');
//
//  draw(window.full_records);
//});

// Show data as table on the page
function tabulate(data, columns, container) {
  var table = d3.select(container).append("table"),
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
      .text(get_attr('value'));

  return table;
}
