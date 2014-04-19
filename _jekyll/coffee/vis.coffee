---
---
class BubbleChart
  constructor: (data) ->
    @data = data
    @width = 1350
    @height = 3500

    @tooltip = CustomTooltip("expenditure_tooltip", 300)

    # locations the nodes will move towards
    # depending on which view is currently being
    # used
    @center = {x: @width / 2, y: Math.min(@height / 2, 500)}

    # used when setting up force and
    # moving around nodes
    @damper = 0.1

    # these will be set in create_nodes and create_vis
    @vis = null
    @nodes = []
    @forces = []
    @circles = null

    # use the max total_amount in the data as the max in the scale's domain
    max_amount = d3.max(@data, (d) -> parseInt(d.amount))
    @radius_scale = d3.scale.pow().exponent(0.5).domain([0, max_amount]).range([2, 85])

    this.create_nodes(@data)
    this.create_vis()

  # create node objects from original data
  # that will serve as the data behind each
  # bubble in the vis, then add each node
  # to @nodes to be used later
  create_nodes: (data) =>
    @nodes = []
    data.forEach (d) =>
      node = {
        id: d.id
        radius: @radius_scale(parseInt(d.amount))
        value: parseFloat(d.amount)
        name: d.candidate_name
        org: 'org'
        group: 'group'
        party: d.party
        category: d.expenditure_category
        super_category: this.get_supercategory(d.expenditure_category)
        office: d.office
        election_period: d.election_period
        election_year: d.election_period.split('-')[1]
        x: Math.random() * 1
        y: Math.random() * 800
      }
      radius = @radius_scale(parseInt(d.amount))
      if radius < 0
        console.log("Radius less than 0 for node! " + JSON.stringify(node))
      @nodes.push node

    @nodes.sort (a,b) -> b.value - a.value
    window.nodes = @nodes

  # Stop forces and remove nodes
  kill_forces: () =>
    @forces.forEach (force) =>
      force.stop()
      force.nodes([])

  update_data: (records) =>
    this.kill_forces()
    this.create_nodes(records)
    this.create_circles()

    func = $('.viz_nav.btn.selected').data('name')
    console.log("func is #{func}")
    this.show_viz_type(func)
    #callback = () => @force.stop()
    #setTimeout( callback, 1000)


  # create svg at #vis and then
  # create circle representation for each node
  create_vis: () =>
    @vis = d3.select("#vis").append("svg")
      .attr("width", @width)
      .attr("height", @height)
      .attr("id", "svg_vis")

    this.create_circles()

  create_circles: () =>
    @circles = @vis.selectAll("circle")
      .data(@nodes, (d) -> d.id)

    # used because we need 'this' in the 
    # mouse callbacks
    that = this

    # radius will be set to 0 initially.
    # see transition below
    @circles.enter().append("circle")
      .attr("r", 0)
      .attr('class', (d) => this.get_supercategory(d.category))
      .attr("stroke-width", 2)
      .attr('x', 1000)
      .attr('y', 1000)
      #.attr('x', Math.random() * 900)
      #.attr('y', Math.random() * 800)
      .attr("id", (d) -> "bubble_#{d.id}")
      .on("mouseover", (d,i) -> that.show_details(d,i,this))
      .on("mouseout", (d,i) -> that.hide_details(d,i,this))
      # Fancy transition to make bubbles appear, ending with the
      # correct radius
      .transition().duration(3000).attr("r", (d) -> d.radius)

    @circles.exit().remove()


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
    -(Math.pow(d.radius, 2.0) / 7) + -(d.radius * 0.1) + -(.3)

  # Display all nodes in one circle.
  display_group_all: () =>
    this.kill_forces()

    force = d3.layout.force()
      .nodes(@nodes)
      .size([@width, @height])
    @forces = [force]

    force.gravity(0)
      .theta(1.1)
      .charge(this.charge)
      .chargeDistance(Infinity)
      .friction(0.9)
      .on "tick", (e) =>
        @circles.each(this.move_towards_center(e.alpha))
          .attr("cx", (d) -> d.x)
          .attr("cy", (d) -> d.y)
    force.start()

    total_amount = d3.sum(@nodes, (d) -> d.value)
    formatted_total = this.format_money_millions(total_amount)

    center_label = [
      {text: 'Total Campaign Spending', class: 'header', dx: 420, dy: 80}
      {text: formatted_total, class: 'amount', dx: 420, dy: 100},
    ]

    titles = @vis.selectAll('text.titles')
      .data(center_label, (d) -> d.text)

    titles.enter().append('text')
      .text( (d) -> d.text)
      .attr('class', (d) => "titles year #{d.class}")
      # TODO: maybe add a small fudge factor based on the sum
      .attr('x', (d) => @center.x + d.dx)
      .attr('y', (d) => @center.y + d.dy)

    titles.exit().remove()

  # Moves all circles towards the @center
  # of the visualization
  move_towards_center: (alpha) =>
    (d) =>
      d.x = d.x + (@center.x - d.x) * (@damper + 0.02) * alpha
      d.y = d.y + (@center.y - d.y) * (@damper + 0.02) * alpha

  split_amount: () =>
    # Need a way to tell it to move to what location
    # Need a way to render it at that location
    # Need a way to display the labels at the correct locations

  show_viz_type: (func) =>
    if(func == 'candidate')
      this.do_split (d) -> d.name
    if(func == 'party')
      this.do_split (d) -> d.party
    if(func == 'expenditure')
      accessor = (d) -> d.super_category
      this.do_split accessor, {charge: (d) => this.charge(d) * 1.3}
    if(func == 'office')
      this.do_split (d) -> d.office
    if(func == 'amount')
      console.log('do nothing')
      #this.split_amount()
      #window.do_render(window.raw_records)
    if(func == 'year')
      this.display_group_all()

  do_split: (accessor, options={}) =>
    location_map = this.move_to_location_map @nodes, accessor
    console.log("location map is #{JSON.stringify(location_map.keys())}")
    charge = if options.charge?
      options.charge
    else
      this.charge

    this.kill_forces()
    @forces = []
    force_map = location_map.keys().map (key) =>
      nodes = @nodes.filter( (d) => key == accessor(d) )
      force = d3.layout.force()
        .nodes(nodes)
        .size([@width, @height])
      @forces.push force
      { force: force, key: key, nodes: nodes }

    force_map.forEach (force) =>
      circles = @vis.selectAll("circle")
        .filter( (d) => force.key == accessor(d) )
      force.force.gravity(0)
        .theta(1.0)
        .charge(charge)
        .chargeDistance(Infinity)
        .friction(0.87)
        .on "tick", (e) =>
          circles.each(this.move_towards_candidates(e.alpha, location_map, accessor))
            .attr('cx', (d) -> d.x)
            .attr('cy', (d) -> d.y)
      force.force.start()

    titles = @vis.selectAll('text.titles')
      .data(location_map.values(), (d) -> d.key)

    titles.enter().append('text')
      .text('CENTERS')
      .attr('text-anchor', 'middle')
      .attr('x', (d) -> d.x)
      .attr('y', (d) -> d.y)

    titles.enter().append('text')
      .attr("class", "titles header")
      .text (d) -> d.key
      .attr("text-anchor", "middle")
      .attr('x', (d) -> d.x)
      .attr('y', (d) -> d.y + 200)

    titles.enter().append('text')
      .attr('class', 'titles amount')
      .text (d) => this.format_money_millions(parseFloat(d.sum))
      .attr('text-anchor', 'middle')
      .attr('x', (d) -> d.x)
      .attr('y', (d) -> d.y + 220)

    #titles.enter().append('text')
    #  .attr('class', 'titles candidate_names')
    #  .text (d) =>
    #    #d.candidates.slice(0, 3).join(', ')
    #    d.candidates.length
    #  .attr('text-anchor', 'middle')
    #  .attr('x', (d) -> d.x)
    #  .attr('y', (d) -> d.y + 260)

    titles.exit().remove()

  format_money_millions: (amount_in_dollars) =>
    amount_in_millions = amount_in_dollars/1e6
    if amount_in_millions <= 0.01
      "< $0.01 million"
    else
      d3.format('$,.2f')(amount_in_millions) + ' million'

  # move all circles to be grouped by candidate
  # Move by alpha amount each time called
  move_towards_candidates: (alpha, location_map, accessor) =>
    (d) =>
      target = location_map.get(accessor(d))
      d.x = d.x + (target.x - d.x) * (@damper + 0.02) * alpha * 1.1
      d.y = d.y + (target.y - d.y) * (@damper + 0.02) * alpha * 1.1


  # Creates grouping based on the grouping_func parameter and uses that to
  # compute groups and lay them out in a grid-based manner
  # AKA: Here lies black magic
  move_to_location_map: (nodes, grouping_func) =>
    min_grouping_width = 300
    groupings_per_row = Math.floor(@width / min_grouping_width) - 1
    min_grouping_height = 450
    get_width = (i) =>
      ((i % groupings_per_row) + 1) * min_grouping_width
    get_height = (i) =>
      num_row = Math.floor(i / groupings_per_row) + 1
      num_row * min_grouping_height - 100
    groups = d3.nest()
      .key( grouping_func )
      .rollup( (leaves) =>
        {
          sum: d3.sum(leaves, (d) -> parseFloat(d.value))
          candidates: d3.set(leaves.map(this.get_candidate_short_name)).values()
          radius: this.estimate_circle_radius(leaves)
        })
      .map(nodes, d3.map)
    i = 0
    groups.keys().sort((a, b) ->
      d3.descending(
        parseFloat(groups.get(a).sum),
        parseFloat(groups.get(b).sum)
      )
    ).forEach (key) ->
      entry = groups.get(key)
      entry['key'] = key
      entry['x'] = get_width(i)
      entry['y'] = get_height(i)
      groups.set(key, entry)
      i += 1
    groups

  # Calculates class for data
  get_supercategory: (category) =>
    if category in ['Durable Assets', 'Food & Beverages', 'Insurance', 'Lease/Rent', 'Office Supplies', 'Travel & Lodging', 'Utilities', 'Vehicle']
      'overhead'
    else if category in ['Contribution to Community Organization', 'Contribution to Political Party', 'Hawaii Election Campaign Fund']
      'contributions'
    else if category in ['Advertising', 'Candidate Fundraiser Tickets', 'Postage/Mailing', 'Printing', 'Surveys, Polls & Voter Lists']
      'communication'
    else if category in ['Employee Services', 'Professional Services']
      'staff'
    else if category in ['Bank Charges & Adjustments', 'Filing Fee', 'Taxes']
      'fees'
    else if category in ['Other']
      'other'

  # Turn "Abercrombie, Neil" to "Abercrombie (D)"
  get_candidate_short_name: (d) =>
    d.name.split(',')[0] + " (#{d.party[0]})"

  estimate_circle_radius: (nodes) =>
    area = d3.sum(nodes, (d) -> Math.PI * Math.pow(d.radius, 2))
    diameter = 2 * Math.sqrt(area/Math.PI)
    estimated_diameter = (Math.log(nodes.length)/140 + 1) * diameter
    estimated_diameter

  # move all circles to their associated @year_centers 
  move_towards_year: (alpha) =>
    (d) =>
      target = @year_centers[d.election_period]
      d.x = d.x + (target.x - d.x) * (@damper + 0.02) * alpha * 1.1
      d.y = d.y + (target.y - d.y) * (@damper + 0.02) * alpha * 1.1

  show_details: (data, i, element) =>
    d3.select(element).attr("stroke", "black")
    #console.log("charge is #{this.charge(data)} radius is: " + data.radius)
    content = "<div class=\"inner_tooltip\">"
    content += "<span class=\"candidate\">#{data.name}</span><br/>"
    content += "<span class=\"office\">#{data.election_year}, #{data.office}</span><br/>"
    content +="<span class=\"amount\"> #{data.category} $#{addCommas(data.value)}</span><br/>"
    #content +="<span class=\"amount\"> charge #{this.charge(data)} </span><br/>"
    #content +="<span class=\"name\">Amount:</span><span class=\"value\"> $#{addCommas(data.value)}</span><br/>"
    #content +="<span class=\"name\">Category:</span><span class=\"value\"> #{data.category}</span><br/>"
    #content +="<span class=\"name\">Super Category:</span><span class=\"value\"> #{data.super_category}</span><br/>"
    #content +="<span class=\"name\">Office:</span><span class=\"value\"> #{data.office}</span><br/>"
    #content +="<span class=\"name\">Party:</span><span class=\"value\"> #{data.party}</span><br/>"
    #content +="<span class=\"name\">Election Period:</span><span class=\"value\"> #{data.election_period}</span>"
    content +="</div>"
    @tooltip.showTooltip(content,d3.event)
    d3.select(element)
      .move_to_front()


  hide_details: (data, i, element) =>
    d3.select(element).attr("stroke", '')
    @tooltip.hideTooltip()

root = exports ? this

campaignInit = () ->
  #$('.viz_nav.year').addClass('selected')

$ ->
  chart = null

  campaignInit()

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
  filter_data = (records, year) ->
    filtered_csv = records.filter( (d) ->
      #d.election_period == '2008-2010' || d.election_period == '2010-2012' || d.election_period == '2012-2014'

      # Only a handful of records have negative amounts
      if parseInt(d.amount) < 0
        false
      else if year == 2014
        d.election_period == '2012-2014'
      else if year == 2012
        d.election_period == '2010-2012'
      else if year == 2010
        d.election_period == '2008-2010'
      else if year == 2008
        d.election_period == '2006-2008'
      else if year == 'gov'
        d.election_period == '2010-2012' && d.office == 'Governor'
      else if year == 'gov2'
        d.election_period == '2010-2012' && d.office == 'House'

      #d.election_period == '2010-2012' && d.office == 'Governor'
      #d.election_period == '2010-2012' && d.office == 'Senate'
    )
    sorted = filtered_csv.sort( (a,b) -> d3.descending(parseFloat(a.amount), parseFloat(b.amount)) )
    #sorted = sorted.slice(0, 800)
    reduced = _.reduce(filtered_csv, (acc, d) ->
      curr = acc[d.candidate_name]
      curr = [] unless curr?
      curr.push(d)
      curr = _.sortBy(curr, (d) ->
        # Why the 5 here?
        return parseFloat(d.amount.slice(5)))
          .reverse()
      acc[d.candidate_name] = _.first(curr, 1)
      return acc
    , {})
    #filtered_csv = _.reduce(_.values(reduced), (acc, d) ->
    #  return acc.concat(d)
    #, [])
    filtered_csv
    sorted

  root.do_render = (records) ->
    console.log(records[0])
    filtered_records = filter_data(records, 'gov2')
    window.debug_now = true

    window.records = filtered_records
    chart.update_data(filtered_records)

  render_vis = (error, expenditure_records, organizational_records) ->
    raw_records = join_data(expenditure_records, organizational_records)
    window.raw_records = raw_records
    filtered_records = filter_data(raw_records, 2014)

    window.records = filtered_records
    chart = new BubbleChart filtered_records
    chart.display_group_all()
  root.get_chart = () =>
    chart

  $('#viz_nav_container .viz_nav').on 'click', (e) ->
    e.preventDefault()
    $viz_nav = $(e.target).closest('.viz_nav')
    func = $viz_nav.data('name')
    currentFunc = $('.viz_nav.btn.selected').data('name')

    $viz_nav.animate({backgroundColor: '#73884f'})
    $viz_nav.animate({backgroundColor: '#FFFFFF'})

    if func != currentFunc
      $viz_nav.siblings('.btn').removeClass('selected')
      $viz_nav.addClass('selected')

      window.get_chart().show_viz_type(func)
    else
      $viz_nav.removeClass('selected')
      window.get_chart().show_viz_type('year')

  $('.time_nav').on 'click', (e) ->
    window.do_render(window.raw_records)

  queue()
    .defer(d3.csv, "data/campaign_spending_summary.csv")
    .defer(d3.csv, "data/organizational_report.csv")
    .await(render_vis);
