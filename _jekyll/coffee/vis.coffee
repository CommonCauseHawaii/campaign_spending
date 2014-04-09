---
---
class BubbleChart
  constructor: (data) ->
    @data = data
    @width = 1250
    @height = 900

    @tooltip = CustomTooltip("gates_tooltip", 240)

    # locations the nodes will move towards
    # depending on which view is currently being
    # used
    @center = {x: @width / 2, y: @height / 2}

    # used when setting up force and
    # moving around nodes
    @layout_gravity = -0.01
    @damper = 0.1

    # these will be set in create_nodes and create_vis
    @vis = null
    @nodes = []
    @force = null
    @circles = null

    # nice looking colors - no reason to buck the trend
    @fill_color = (d) ->
      #debugger
      #console.log 'hash is ' + hash_code(d.name)
      d3.scale.linear()
        .domain([-1000, 1000])
#        .range(['red', 'green'])(hash_code(d.name) % 1000)
        .range(['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6', '#ffffcc', '#e5d8bd'])(hash_code(d.name) % 1000)

    # use the max total_amount in the data as the max in the scale's domain
    max_amount = d3.max(@data, (d) -> parseInt(d.amount))
    @radius_scale = d3.scale.pow().exponent(0.5).domain([0, max_amount]).range([2, 85])

    this.create_nodes()
    this.create_vis()

  # create node objects from original data
  # that will serve as the data behind each
  # bubble in the vis, then add each node
  # to @nodes to be used later
  create_nodes: () =>
    @data.forEach (d) =>
      node = {
        id: d.id
        radius: @radius_scale(parseInt(d.amount))
        value: d.amount
        name: d.candidate_name
        org: 'org'
        group: 'group'
        category: d.expenditure_category
        office: d.office
        election_period: d.election_period
        x: Math.random() * 900
        y: Math.random() * 800
      }
      @nodes.push node

    @nodes.sort (a,b) -> b.value - a.value
    window.nodes = @nodes

  bind_data: () =>
    obj = {category: 'fun', election_period: '2010-2012', group: 'gr', id: 999, name: 'jason', office: 'gov', org: 'org', value: '$110322.21', radius: 100, x: 500, y:244}
    @nodes.push(obj)
    @circles = @vis.selectAll("circle")
      .data(@nodes, (d) -> d.id)
      #.data(@nodes, (d) -> 1)
    that = this
    @circles.enter().append("circle")
      #.attr("r", 0)
      .attr("fill", (d) => @fill_color(d))
      .attr("stroke-width", 2)
      .attr("stroke", (d) => d3.rgb(@fill_color(d)).darker())
      .attr("id", (d) -> "bubble_#{d.id}")
      .on("mouseover", (d,i) -> that.show_details(d,i,this))
      .on("mouseout", (d,i) -> that.hide_details(d,i,this))

    @circles.exit().remove()

    # Fancy transition to make bubbles appear, ending with the
    # correct radius
    @circles.transition().duration(1000).attr("r", (d) -> d.radius)
    this.display_group_all()

  # Need a way to arbitrarily have many sets of bubbles displayed at once
  # side-by-side with labels underneath. Should only have to pass in the data
  # to be displayed, how to separate the data, and what the labels should be.
  # Example: set of bubbles on the left are for Abercrombie and the right are
  # for Schatz. Others are hidden.
  #
  # Need a way for entering nodes to fly in from the right and exiting nodes to
  # fly out from the left.

  # create svg at #vis and then 
  # create circle representation for each node
  create_vis: () =>
    @vis = d3.select("#vis").append("svg")
      .attr("width", @width)
      .attr("height", @height)
      .attr("id", "svg_vis")

    @circles = @vis.selectAll("circle")
      .data(@nodes, (d) -> d.id)
      #.data(@nodes, (d) -> 1)

    # used because we need 'this' in the 
    # mouse callbacks
    that = this

    # radius will be set to 0 initially.
    # see transition below
    @circles.enter().append("circle")
      .attr("r", 0)
      .attr("fill", (d) => @fill_color(d))
      .attr("stroke-width", 2)
      .attr("stroke", (d) => d3.rgb(@fill_color(d)).darker())
      .attr("id", (d) -> "bubble_#{d.id}")
      .on("mouseover", (d,i) -> that.show_details(d,i,this))
      .on("mouseout", (d,i) -> that.hide_details(d,i,this))

    # Fancy transition to make bubbles appear, ending with the
    # correct radius
    @circles.transition().duration(2000).attr("r", (d) -> d.radius)


  # Charge function that is called for each node.
  # Charge is proportional to the diameter of the
  # circle (which is stored in the radius attribute
  # of the circle's associated data.
  # This is done to allow for accurate collision 
  # detection with nodes of different sizes.
  # Charge is negative because we want nodes to 
  # repel.
  # Dividing by 8 scales down the charge to be
  # appropriate for the visualization dimensions.
  charge: (d) ->
    -Math.pow(d.radius, 2.0) / 8

  # Starts up the force layout with
  # the default values
  start: () =>
    @force = d3.layout.force()
      .nodes(@nodes)
      .size([@width, @height])

  # Sets up force layout to display
  # all nodes in one circle.
  display_group_all: () =>
    @force.gravity(@layout_gravity)
      .charge(this.charge)
      .friction(0.9)
      .on "tick", (e) =>
        @circles.each(this.move_towards_center(e.alpha))
          .attr("cx", (d) -> d.x)
          .attr("cy", (d) -> d.y)
    @force.start()

    this.hide_years()

  # Moves all circles towards the @center
  # of the visualization
  move_towards_center: (alpha) =>
    (d) =>
      d.x = d.x + (@center.x - d.x) * (@damper + 0.02) * alpha
      d.y = d.y + (@center.y - d.y) * (@damper + 0.02) * alpha

  # sets the display of bubbles to be separated
  # into each year. Does this by calling move_towards_year
  display_by_year: () =>
    @force.gravity(@layout_gravity)
      .charge(this.charge)
      .friction(0.9)
      .on "tick", (e) =>
        @circles.each(this.move_towards_year(e.alpha))
          .attr("cx", (d) -> d.x)
          .attr("cy", (d) -> d.y)
    @force.start()

    this.display_years()

  split_party: () =>
    location_func = this.move_to_location_func @nodes, (d) -> d.party
  split_candidates: () =>
    location_func = this.move_to_location_func @nodes, (d) -> d.name
    @force.gravity(@layout_gravity)
      .charge(this.charge)
      .chargeDistance(200)
      .friction(0.9)
      .on "tick", (e) =>
        @circles.each(this.move_towards_candidates(e.alpha, location_func))
          .attr('cx', (d) -> d.x)
          .attr('cy', (d) -> d.y)
    @force.start()

    # TODO: change .years to .titles or something (might need to modify the CSS)
    titles = @vis.selectAll('.years')
      .data(location_func.values())

    # TODO: figure out how to change text node to div and still have it displayed. Maybe need to set x and y differently
    titles.enter().append('text')
      .text (d) ->
        #(d.name + '<br/> sum')
        d.name
        #(d.name + ' <div id="jason">content</div>')
      .attr("text-anchor", "middle")
      .attr('x', (d) -> d.x)
      .attr('y', (d) -> d.y + 200)

  # move all circles to be grouped by candidate
  # Move by alpha amount each time called
  move_towards_candidates: (alpha, location_func) =>
    (d) =>
      target = location_func.get(d.name)
      d.x = d.x + (target.x - d.x) * (@damper + 0.02) * alpha * 1.1
      d.y = d.y + (target.y - d.y) * (@damper + 0.02) * alpha * 1.1


  # computes move to location based upon what is passed in
  # grouping will be determined by function
  # will need to compute the number of groupings
  # then based on the number of groupings it will determine the x and y location of each grouping
  move_to_location_func: (nodes, grouping_func) =>
    min_grouping_width = 300
    groupings_per_row = Math.floor(@width / min_grouping_width) - 1
    min_grouping_height = 300
    get_width = (i) =>
      ((i % groupings_per_row) + 1) * min_grouping_width
    get_height = (i) =>
      num_row = Math.floor(i / groupings_per_row) + 1
      num_row * min_grouping_height
    groups = d3.nest()
      .key( grouping_func )
      .rollup( (leaves) -> {sum: d3.sum(leaves, (d) -> parseFloat(d.value))} )
      .map(nodes, d3.map)
    i = 0
    groups.keys().sort(d3.ascending).forEach (key) ->
      entry = groups.get(key)
      entry['name'] = key
      entry['x'] = get_width(i)
      entry['y'] = get_height(i)
      groups.set(key, entry)
      i += 1
    groups

  # move all circles to their associated @year_centers 
  move_towards_year: (alpha) =>
    (d) =>
      target = @year_centers[d.election_period]
      d.x = d.x + (target.x - d.x) * (@damper + 0.02) * alpha * 1.1
      d.y = d.y + (target.y - d.y) * (@damper + 0.02) * alpha * 1.1

  # Method to display year titles
  display_years: () =>
    years_x = {"2008-2010": 160, "2010-2012": @width / 2, "2012-2014": @width - 160}
    years_data = d3.keys(years_x)
    years = @vis.selectAll(".years")
      .data(years_data)

    years.enter().append("text")
      .attr("class", "years")
      .attr("text-anchor", "middle")
      .attr("x", (d) => years_x[d] )
      .attr("y", 40)
      .text((d) -> 'af')

  # Method to hide year titiles
  hide_years: () =>
    years = @vis.selectAll(".years").remove()

  show_details: (data, i, element) =>
    d3.select(element).attr("stroke", "black")
    content = "<span class=\"name\">Candidate:</span><span class=\"value\"> #{data.name}</span><br/>"
    content +="<span class=\"name\">Amount:</span><span class=\"value\"> $#{addCommas(data.value)}</span><br/>"
    content +="<span class=\"name\">Category:</span><span class=\"value\"> #{data.category}</span><br/>"
    content +="<span class=\"name\">Office:</span><span class=\"value\"> #{data.office}</span><br/>"
    content +="<span class=\"name\">Election Period:</span><span class=\"value\"> #{data.election_period}</span>"
    @tooltip.showTooltip(content,d3.event)


  hide_details: (data, i, element) =>
    d3.select(element).attr("stroke", (d) => d3.rgb(@fill_color(d)).darker())
    @tooltip.hideTooltip()

root = exports ? this

$ ->
  $('.filter-buttons .button').on('click', (e) ->
    e.preventDefault()
    console.log('clicked filter button!')
    #display_year()
    #window.get_chart().bind_data()
    window.get_chart().split_candidates()
  )
  console.log('begin vis.coffee')
  window.counter = 0
  chart = null

  # Join records on reg_no
  join_data = (expend_recs, org_recs) ->
    full_records = []
    i=0; j=0
    while (true)
      expend_rec = expend_recs[i]
      org_rec = org_recs[j]
      if (!expend_rec? || !org_rec?)
          break

      if (expend_rec.reg_no == org_rec.reg_no)
        full_records.push($.extend({}, expend_rec, org_rec))
        i++
      else if (expend_rec.reg_no != org_rec.reg_no)
        j++
    return full_records

  # Filter data down to what we want
  filter_data = (records) ->
    debugger
    filtered_csv = records.filter( (d) ->
      #d.election_period == '2008-2010' || d.election_period == '2010-2012' || d.election_period == '2012-2014'
      #d.election_period == '2012-2014'
      d.election_period == '2010-2012' && d.office == 'Governor'
      #d.election_period == '2012-2014' && d.candidate_name == 'Schatz, Brian'
      #d.candidate_name == 'Schatz, Brian' || d.candidate_name == 'Abercrombie, Neil'
    )
    reduced = _.reduce(filtered_csv, (acc, d) ->
      curr = acc[d.candidate_name]
      curr = [] unless curr?
      curr.push(d)
      curr = _.sortBy(curr, (d) ->
        # Why the 5 here?
        return parseInt(d.amount.slice(5)))
          .reverse()
      acc[d.candidate_name] = _.first(curr, 1)
      return acc
    , {})
    #filtered_csv = _.reduce(_.values(reduced), (acc, d) ->
    #  return acc.concat(d)
    #, [])
    filtered_csv

  render_vis = (error, expenditure_records, organizational_records) ->
    raw_records = join_data(expenditure_records, organizational_records)
    filtered_records = filter_data(raw_records)
    debugger

    chart = new BubbleChart filtered_records
    chart.start()
    root.display_all()
    mygroups = chart.move_to_location_func(window.nodes, (d) => d.name)
    _.each mygroups.values(), (d) ->
      console.log(JSON.stringify(d))
    console.log mygroups
    window.mygroups = mygroups
  root.display_all = () =>
    chart.display_group_all()
  root.get_chart = () =>
    chart
  root.display_year = () =>
    chart.display_by_year()
  root.toggle_view = (view_type) =>
    if view_type == 'year'
      root.display_year()
    else
      root.display_all()

  $('#viz_nav_container .viz_nav').on 'click', (e) ->
    e.preventDefault()
    func = $(e.target).data('name')
    if(func == 'candidate')
      window.get_chart().split_candidates()
    if(func == 'candidate')
      window.get_chart().split_party()

  queue()
    .defer(d3.csv, "data/campaign_spending_summary.csv")
    .defer(d3.csv, "data/organizational_report.csv")
    .await(render_vis);
