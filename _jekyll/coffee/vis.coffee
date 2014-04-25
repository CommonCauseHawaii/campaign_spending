---
---
class BubbleChart
  constructor: (data) ->
    @data = data
    @width = 1350
    @height = 3500

    @tooltip = CustomTooltip("expenditure_tooltip", 300)

    # used when setting up force and
    # moving around nodes
    @damper = 0.1

    # these will be set in create_nodes and create_vis
    @vis = null
    @nodes = []
    @forces = []
    @circles = null

    # use the max total_amount in the data as the max in the scale's domain
    #max_amount = d3.max(@data, (d) -> parseInt(d.amount))
    max_amount = 1173620 * 1.21
    @radius_scale = d3.scale.pow().exponent(0.5).domain([0, max_amount]).range([2, 85])
    console.log('max_amount ' + max_amount)
    console.log(@radius_scale)

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
        reg_no: d.reg_no
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
    func = 'year' unless func?
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
      .attr('class', (d) => "#{this.get_supercategory(d.category)} #{d.reg_no}")
      .attr("stroke-width", 2)
      .attr('x', 1000)
      .attr('y', 1000)
      #.attr('x', Math.random() * 900)
      #.attr('y', Math.random() * 800)
      .attr("id", (d) -> "bubble_#{d.id}")
      .on "mouseover", (d,i) ->
        that.show_details(d,i,this)
        that.circles
          .filter( (circle) => circle.reg_no != d.reg_no )
          .transition().duration(1000)
          .style('opacity', 0.3)
      .on "mouseout", (d,i) ->
        that.hide_details(d,i,this)
        that.circles
          .transition().duration(1000)
          .style('opacity', 1)
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
    radius = this.estimate_circle_diameter(@nodes)/2
    @center = {x: @width / 2, y: radius + 80}

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
      {text: 'Total Campaign Spending', class: 'header', dx: radius + 30, dy: 80}
      {text: formatted_total, class: 'amount', dx: radius + 30, dy: 100},
    ]

    # Remove old titles
    titles = @vis.selectAll('text.titles').remove()

    titles = @vis.selectAll('text.titles')
      .data(center_label, (d) -> d.text)

    titles.enter().append('text')
      .text( (d) -> d.text)
      .attr('class', (d) => "titles year #{d.class}")
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
      accessor = (d) ->
        if d.value > 1e6
          "Over a million"
        else if d.value > 500000
           "$500,000 to 1 million"
        else if d.value > 250000
           "$250,000 to 500,000"
        else if d.value > 200000
           "$200,000 to $250,000"
        else if d.value > 150000
           "$150,000 to 200,000"
        else if d.value > 100000
           "$100,000 to 150,000"
        else if d.value > 50000
           "$50,000 to 100,000"
        else if d.value > 25000
           "$25,000 to 50,000"
        else if d.value > 20000
           "$20,000 to 25,000"
        else if d.value > 15000
           "$15,000 to 20,000"
        else if d.value > 10000
           "$10,000 to 15,000"
        else if d.value > 5000
           "$5,000 to 10,000"
        else if d.value > 1000
           "$1,000 to 5,000"
         else
           "< $1,000"
      sort_func = (a,b) ->
        get_amount = (d) ->
          $_pos = d.indexOf('$') + 1
          end_pos = d.indexOf(' ', $_pos)
          amount_str = d.substring($_pos, end_pos)
          parseInt(amount_str.replace(/,/g, ''))
        if a == "Over a million"
          return -1
        if b == "Over a million"
          return 1
        if a == "< $1,000"
          return 1
        if b == "< $1,000"
          return -1
        console.log("a #{a}\tb #{b}")
        console.log("a #{get_amount(a)}\tb #{get_amount(b)}")
        console.log("")
        d3.descending(get_amount(a), get_amount(b))
        #console.log('doing sort')
        #"$5,000 to 10,000"
        #"< $1,000"
        #$_pos = d.indexOf('$') + 1
        #end_pos = d.indexOf(' ', $_pos)
        #amount_str = d.substring($_pos, end_pos)
        #console.log(d)
        #console.log(amount_str)
        ##debugger;
        #return -1
      this.do_split(accessor, {sort: sort_func, view_by_amount: true})
    if(func == 'year')
      this.display_group_all()

  do_split: (accessor, options={}) =>
    location_map = this.move_to_location_map @nodes, accessor, options
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

    # Remove old titles
    titles = @vis.selectAll('text.titles').remove()

    titles = @vis.selectAll('text.titles')
      .data(location_map.values(), (d) -> d.key)

    #titles.enter().append('text')
    #  .text('CENTERS')
    #  .attr('text-anchor', 'middle')
    #  .attr('x', (d) -> d.x)
    #  .attr('y', (d) -> d.y)

    padding = if options.view_by_amount?
      padding = 90
    else
      padding = 55

    line_height = 20
    line_offset = (d, line_num) -> d.y + d.radius + padding + line_height*line_num
    titles.enter().append('text')
      .attr("class", "titles header")
      .text (d) -> d.key
      .attr("text-anchor", "middle")
      .attr('x', (d) -> d.x)
      .attr('y', (d) -> line_offset(d,0))

    titles.enter().append('text')
      .attr('class', 'titles amount')
      .text (d) => this.format_money_millions(parseFloat(d.sum))
      .attr('text-anchor', 'middle')
      .attr('x', (d) -> d.x)
      .attr('y', (d) -> line_offset(d,1))

    ## Debug info
    #titles.enter().append('text')
    #  .attr('class', 'titles amount')
    #  .text (d) => d.radius
    #  .attr('text-anchor', 'middle')
    #  .attr('x', (d) -> d.x)
    #  .attr('y', (d) -> line_offset(d,2))

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
  move_to_location_map: (nodes, grouping_func, options={}) =>
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
          radius: this.estimate_circle_diameter(leaves)/2
        })
      .map(nodes, d3.map)

    max_num_rows = 5
    padding = if options.view_by_amount?
      80
    else
      30
    label_padding = 90
    col_num = prev_radius = 0
    num_in_row = 1
    max_num_in_row = 6
    # Push first row up
    prev_y = if options.view_by_amount? then -90 else -60

    sort = if options.sort?
      options.sort
    else
      (a, b) ->
        d3.descending(
          parseFloat(groups.get(a).sum),
          parseFloat(groups.get(b).sum)
        )

    groups.keys().sort(sort).forEach (key, index) =>
      entry = groups.get(key)
      entry['key'] = key

      col_num = 0 if col_num >= num_in_row
      if col_num == 0
        prev_num_in_row = num_in_row
        while (@width/num_in_row) > entry.radius*2 + padding*3
          num_in_row += 1
        num_in_row -= 1

        # Last row should be same num_in_row as the previous
        num_left_in_layout = groups.keys().length - index
        if num_in_row > num_left_in_layout
          num_in_row = prev_num_in_row unless num_left_in_layout > groups.keys().length - 1

        num_in_row = Math.min(max_num_in_row, num_in_row)

      min_width = (@width/num_in_row)
      x = min_width * col_num + min_width/2

      # Only calculate y for first column in row
      if col_num == 0
        y = prev_y + prev_radius + entry.radius + padding*2 + label_padding
        prev_y = y
        prev_radius = entry.radius

      y = prev_y

      entry['x'] = x
      entry['y'] = y
      entry['radius'] = prev_radius  #prev_radius is our radius for this row
      groups.set(key, entry)

      col_num += 1
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

  estimate_circle_diameter: (nodes) =>
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
  # End class BubbleChart

# Show rich information about candidate
# Maybe move to another file
# This class will have its own set of data that it copies from the general records
# Ideally it could all be passed in to the initializer
# Maybe should create class for record or circle elements
class CandidateModal
  constructor: (data, i, element) ->
    # Filter records based on the candidate reg_no
    reg_no = data.reg_no
    matched = window.records.filter( (d) -> d.reg_no == reg_no )
    debugger
    # Create a viz with just the candidates circles (balls)
    # Create the force centered on the current node with the others hovering around it
    # Maybe need to play with damper?
    #
    # Set modal using modal.html()
    # Display modal

  # maybe remove
  render: () ->
    modal = $('#candidate_modal')
    modal.foundation('reveal', 'open')


root = exports ? this

campaignInit = () ->
  #$('.viz_nav.year').addClass('selected')
  $('.legend_hover_area').on 'mouseenter', () ->
    $('.legend').animate({right: 0})
  $('.legend').on 'mouseleave', () ->
    $('.legend').animate({right: '-225px'})

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
      else
        return false
      #else if year == 'gov'
      #  d.election_period == '2010-2012' && d.office == 'Governor'
      #else if year == 'gov2'
      #  d.election_period == '2010-2012' && d.office == 'House'

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

  root.update_year = (next) ->
    records = window.raw_records

    # get current year
    $year_el = $('.viz_nav.year')
    cur_year = $year_el.data('year')
    direction = if next then 1 else -1
    next_year = cur_year + 2*direction

    if next_year == 2008
      $('.time_nav.left').animate({color: '#bcbbb4'})
        .removeClass('clickable')
    else
      $('.time_nav.left').animate({color: '#454542'})
        .addClass('clickable')

    if next_year == 2014
      $('.time_nav.right').animate({color: '#bcbbb4'})
        .removeClass('clickable')
    else
      $('.time_nav.right').animate({color: '#454542'})
        .addClass('clickable')

    range = d3.range(2008, 2014.1, 2)
    unless next_year in range
      return

    # update year element
    $year_el.animate({color: 'white'}, {complete: () ->
      # Not black, dark grey
      $year_el.text(next_year)
      $year_el.data('year', next_year)
      $year_el.animate({color: '#454542'})
    })

    #return

    filtered_records = filter_data(records, next_year)
    window.debug_now = true

    window.records = filtered_records
    chart.update_data(filtered_records)

  render_vis = (error, expenditure_records, organizational_records) ->
    raw_records = join_data(expenditure_records, organizational_records)
    window.raw_records = raw_records
    filtered_records = filter_data(raw_records, 2014)
    #filtered_records = filter_data(raw_records, 'gov')

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

  $('.time_nav.right').on 'click', (e) ->
    if $(this).hasClass('clickable')
      window.update_year(true)
  $('.time_nav.left').on 'click', (e) ->
    #$this = $(this)
    #$this.animate({backgroundColor: '#73884f'})
    #$this.animate({backgroundColor: '#dfded6'})
    if $(this).hasClass('clickable')
      window.update_year(false)

  queue()
    .defer(d3.csv, "data/campaign_spending_summary.csv")
    .defer(d3.csv, "data/organizational_report.csv")
    .await(render_vis);
