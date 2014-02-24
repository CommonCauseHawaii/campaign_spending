function barChart(data) {
  var margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

  var x = d3.scale.ordinal()
      .rangeRoundBands([0, width], .1);

  var y = d3.scale.linear()
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickSize(0);

  var svg = d3.select("#bar-chart").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  //d3.tsv("data.tsv", type, function(error, data) {
    x.domain(data.map(function(d) { console.log("data " + JSON.stringify(d)); return d.contributor_name; }));
    y.domain([0, d3.max(data, function(d) { return +d.amount; })]);
    console.log('found max as ' + d3.max(data, function(d) { return +d.amount; }));
    //y.domain([0, 400]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Amount ($)");

    svg.selectAll(".bar")
        .data(data)
      .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.contributor_name); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.amount); })
        .attr("height", function(d) { return height - y(d.amount); });


  function type(d) {
    console.log('in type');
    d.frequency = +d.frequency;
    return d;
  }
}
