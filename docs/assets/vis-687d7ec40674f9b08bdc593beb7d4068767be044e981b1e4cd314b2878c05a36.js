(function() {
  var BubbleChart, CandidateUtil, campaignInit, root, show_powerballot_link,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  BubbleChart = (function() {
    function BubbleChart(data) {
      this.size_legend_init = bind(this.size_legend_init, this);
      this.update_modal_center = bind(this.update_modal_center, this);
      this.update_modal = bind(this.update_modal, this);
      this.render_modal = bind(this.render_modal, this);
      this.hide_details = bind(this.hide_details, this);
      this.show_details = bind(this.show_details, this);
      this.move_towards_year = bind(this.move_towards_year, this);
      this.estimate_circle_diameter = bind(this.estimate_circle_diameter, this);
      this.get_candidate_short_name = bind(this.get_candidate_short_name, this);
      this.get_supercategory = bind(this.get_supercategory, this);
      this.move_to_location_map = bind(this.move_to_location_map, this);
      this.move_towards_candidates = bind(this.move_towards_candidates, this);
      this.format_money_millions = bind(this.format_money_millions, this);
      this.do_split = bind(this.do_split, this);
      this.show_viz_type = bind(this.show_viz_type, this);
      this.move_towards_center = bind(this.move_towards_center, this);
      this.display_group_all = bind(this.display_group_all, this);
      this.do_create_circles = bind(this.do_create_circles, this);
      this.create_circles = bind(this.create_circles, this);
      this.create_vis = bind(this.create_vis, this);
      this.update_data = bind(this.update_data, this);
      this.kill_forces = bind(this.kill_forces, this);
      this.create_nodes = bind(this.create_nodes, this);
      var max_amount;
      this.data = data;
      this.width = 1350;
      this.height = 3500;
      window.width = this.width;
      window.height = this.height;
      this.tooltip = CustomTooltip("expenditure_tooltip", 300);
      this.damper = 0.1;
      this.vis = null;
      this.nodes = [];
      this.forces = [];
      this.circles = null;
      max_amount = 1173620 * 2.21;
      this.radius_scale = d3.scale.pow().exponent(0.5).domain([0, max_amount]).range([2, 85]);
      this.create_nodes(this.data);
      this.create_vis();
      this.initialize_candidate_autocomplete();
    }

    BubbleChart.prototype.create_nodes = function(data) {
      this.nodes = [];
      data.forEach((function(_this) {
        return function(d) {
          var node, radius, value;
          value = parseFloat(d.amount);
          node = {
            id: d.id,
            radius: _this.radius_scale(value),
            value: value,
            name: d.candidate_name,
            org: 'org',
            group: 'group',
            party: d.party,
            reg_no: d.reg_no,
            category: d.expenditure_category,
            super_category: _this.get_supercategory(d.expenditure_category),
            office: d.office,
            district: d.district,
            election_period: d.election_period,
            election_year: d.election_period.split('-')[1],
            x: Math.random() * 1,
            y: Math.random() * 800
          };
          radius = _this.radius_scale(value);
          if (radius < 0 || isNaN(radius)) {
            console.log("Problem with radius for node:" + JSON.stringify(node));
          }
          return _this.nodes.push(node);
        };
      })(this));
      this.nodes.sort(function(a, b) {
        return b.value - a.value;
      });
      return window.nodes = this.nodes;
    };

    BubbleChart.prototype.kill_forces = function() {
      return this.forces.forEach((function(_this) {
        return function(force) {
          force.stop();
          return force.nodes([]);
        };
      })(this));
    };

    BubbleChart.prototype.update_data = function(records) {
      var func;
      this.kill_forces();
      this.create_nodes(records);
      this.create_circles();
      func = $('.viz_nav.btn.selected').data('name');
      if (func == null) {
        func = 'year';
      }
      return this.show_viz_type(func);
    };

    BubbleChart.prototype.create_vis = function() {
      this.vis = d3.select("#vis").append("svg").attr("width", this.width).attr("height", this.height).attr("id", "svg_vis");
      window.viz = this.vis;
      return this.create_circles();
    };

    BubbleChart.prototype.create_circles = function() {
      this.circles = this.vis.selectAll("circle").data(this.nodes, function(d) {
        return d.id;
      });
      return this.do_create_circles(this.circles);
    };

    BubbleChart.prototype.do_create_circles = function(circles) {
      var that;
      that = this;
      circles.enter().append("circle").attr('class', (function(_this) {
        return function(d) {
          return (_this.get_supercategory(d.category)) + " " + d.reg_no;
        };
      })(this)).attr("stroke-width", 2).attr("id", function(d) {
        return "bubble_" + d.id;
      }).on("mouseover", function(d, i) {
        that.show_details(d, i, this);
        return that.circles.filter((function(_this) {
          return function(circle) {
            return circle.reg_no !== d.reg_no;
          };
        })(this)).transition().duration(1000).style('opacity', 0.3);
      }).on("mouseout", function(d, i) {
        that.hide_details(d, i, this);
        return that.circles.transition().duration(1000).style('opacity', 1);
      }).on("click", function(d, i) {
        var element, modal;
        modal = $('#candidate_modal');
        element = this;
        if (modal.is(':visible')) {
          return that.update_modal_center(d, i, element);
        } else {
          $(document).off('opened', '[data-reveal]');
          $(document).on('opened', '[data-reveal]', function() {
            var callback_modal;
            console.log('modal callback');
            callback_modal = $(this);
            if (callback_modal.attr('id') === modal.attr('id')) {
              return that.render_modal(d, i, element);
            }
          });
          $(element).data('center', true);
          return modal.foundation('reveal', 'open');
        }
      }).attr("r", function(d) {
        return d.radius;
      });
      return circles.exit().remove();
    };

    BubbleChart.prototype.charge = function(d) {
      return -(Math.pow(d.radius, 2.0) / 7) + -(d.radius * 0.1) + -.3;
    };

    BubbleChart.prototype.display_group_all = function() {
      var center_label, force, formatted_total, radius, titles, total_amount;
      this.kill_forces();
      force = d3.layout.force().nodes(this.nodes).size([this.width, this.height]);
      this.forces = [force];
      radius = this.estimate_circle_diameter(this.nodes) / 2;
      this.center = {
        x: this.width / 2,
        y: radius + 80
      };
      force.gravity(0).theta(1.1).charge(this.charge).chargeDistance(2e308).friction(0.9).on("tick", (function(_this) {
        return function(e) {
          return _this.circles.each(_this.move_towards_center(e.alpha)).attr("cx", function(d) {
            return d.x;
          }).attr("cy", function(d) {
            return d.y;
          });
        };
      })(this));
      force.start();
      total_amount = d3.sum(this.nodes, function(d) {
        return d.value;
      });
      formatted_total = this.format_money_millions(total_amount);
      center_label = [
        {
          text: 'Total Campaign Spending',
          "class": 'header',
          dx: radius + 30,
          dy: 80
        }, {
          text: formatted_total,
          "class": 'amount',
          dx: radius + 30,
          dy: 100
        }
      ];
      titles = this.vis.selectAll('text.titles').remove();
      titles = this.vis.selectAll('text.titles').data(center_label, function(d) {
        return d.text;
      });
      titles.enter().append('text').text(function(d) {
        return d.text;
      }).attr('class', (function(_this) {
        return function(d) {
          return "titles year " + d["class"];
        };
      })(this)).attr('x', (function(_this) {
        return function(d) {
          return _this.center.x + d.dx;
        };
      })(this)).attr('y', (function(_this) {
        return function(d) {
          return _this.center.y + d.dy;
        };
      })(this));
      titles.exit().remove();
      return this.show_legend(radius);
    };

    BubbleChart.prototype.move_towards_center = function(alpha) {
      return (function(_this) {
        return function(d) {
          d.x = d.x + (_this.center.x - d.x) * (_this.damper + 0.02) * alpha;
          return d.y = d.y + (_this.center.y - d.y) * (_this.damper + 0.02) * alpha;
        };
      })(this);
    };

    BubbleChart.prototype.show_viz_type = function(func) {
      var accessor, category_titles;
      this.candidate_search_input().slideUp();
      this.show_all_candidates();
      this.hide_legend();
      if (func === 'candidate') {
        this.show_by_candidate();
      }
      if (func === 'party') {
        this.do_split(function(d) {
          return d.party;
        });
      }
      if (func === 'expenditure') {
        category_titles = {
          communication: 'Communication & Outreach',
          overhead: 'Overhead',
          staff: 'Staff & Professional Services',
          contributions: 'Contributions',
          fees: 'Taxes & Fees',
          other: 'Other'
        };
        accessor = function(d) {
          return d.super_category;
        };
        this.do_split(accessor, {
          charge: (function(_this) {
            return function(d) {
              return _this.charge(d) * 1.3;
            };
          })(this),
          title_accessor: function(category) {
            return category_titles[category];
          }
        });
      }
      if (func === 'island') {
        this.do_split(function(d) {
          return candidate_utils.get_island(d);
        });
      }
      if (func === 'office') {
        this.do_split(function(d) {
          return d.office;
        });
      }
      if (func === 'year') {
        return this.display_group_all();
      }
    };

    BubbleChart.prototype.candidate_search_input = function() {
      return this._candidate_search_input || $('.candidate_search_container input.autocomplete');
    };

    BubbleChart.prototype.show_all_candidates = function() {
      this.circles.transition().duration(1000).style('opacity', 1);
      return this.candidate_search_input().val('');
    };

    BubbleChart.prototype.show_by_candidate = function(options) {
      var accessor;
      if (options == null) {
        options = {};
      }
      accessor = function(d) {
        return d.name;
      };
      this.candidate_search_input().slideDown();
      return this.do_split(accessor, options);
    };

    BubbleChart.prototype.do_split = function(accessor, options) {
      var charge, force_map, line_height, line_offset, location_map, padding, title_accessor, titles;
      if (options == null) {
        options = {};
      }
      location_map = this.move_to_location_map(this.nodes, accessor, options);
      if (options.modify_location_map != null) {
        location_map = options.modify_location_map(location_map);
      }
      charge = options.charge != null ? options.charge : this.charge;
      this.kill_forces();
      this.forces = [];
      force_map = location_map.keys().map((function(_this) {
        return function(key) {
          var force, nodes;
          nodes = _this.nodes.filter(function(d) {
            return key === accessor(d);
          });
          force = d3.layout.force().nodes(nodes).size([_this.width, _this.height]);
          _this.forces.push(force);
          return {
            force: force,
            key: key,
            nodes: nodes
          };
        };
      })(this));
      force_map.forEach((function(_this) {
        return function(force) {
          var circles;
          circles = _this.vis.selectAll("circle").filter(function(d) {
            return force.key === accessor(d);
          });
          force.force.gravity(0).theta(1.0).charge(charge).chargeDistance(2e308).friction(0.87).on("tick", function(e) {
            return circles.each(_this.move_towards_candidates(e.alpha, location_map, accessor)).attr('cx', function(d) {
              return d.x;
            }).attr('cy', function(d) {
              return d.y;
            });
          });
          return force.force.start();
        };
      })(this));
      titles = this.vis.selectAll('text.titles').remove();
      title_accessor = options.title_accessor != null ? function(d) {
        return options.title_accessor(d.key);
      } : function(d) {
        return d.key;
      };
      titles = this.vis.selectAll('text.titles').data(location_map.values(), function(d) {
        return d.key;
      });
      padding = 55;
      line_height = 20;
      line_offset = function(d, line_num) {
        return d.y + d.radius + padding + line_height * line_num;
      };
      titles.enter().append('text').attr("class", "titles header").text(title_accessor).attr("text-anchor", "middle").attr('x', function(d) {
        return d.x;
      }).attr('y', function(d) {
        return line_offset(d, 0);
      });
      titles.enter().append('text').attr('class', 'titles amount').text((function(_this) {
        return function(d) {
          return _this.format_money_millions(parseFloat(d.sum));
        };
      })(this)).attr('text-anchor', 'middle').attr('x', function(d) {
        return d.x;
      }).attr('y', function(d) {
        return line_offset(d, 1);
      });
      return titles.exit().remove();
    };

    BubbleChart.prototype.format_money_millions = function(amount_in_dollars) {
      var amount_in_millions;
      amount_in_millions = amount_in_dollars / 1e6;
      if (amount_in_millions <= 0.01) {
        return "< $0.01 million";
      } else {
        return d3.format('$,.2f')(amount_in_millions) + ' million';
      }
    };

    BubbleChart.prototype.move_towards_candidates = function(alpha, location_map, accessor) {
      return (function(_this) {
        return function(d) {
          var target;
          target = location_map.get(accessor(d));
          d.x = d.x + (target.x - d.x) * (_this.damper + 0.02) * alpha * 1.1;
          return d.y = d.y + (target.y - d.y) * (_this.damper + 0.02) * alpha * 1.1;
        };
      })(this);
    };

    BubbleChart.prototype.move_to_location_map = function(nodes, grouping_func, options) {
      var col_num, get_height, get_width, groupings_per_row, groups, label_padding, max_num_in_row, max_num_rows, min_grouping_height, min_grouping_width, num_in_row, padding, prev_radius, prev_y, sort;
      if (options == null) {
        options = {};
      }
      min_grouping_width = 300;
      groupings_per_row = Math.floor(this.width / min_grouping_width) - 1;
      min_grouping_height = 450;
      get_width = (function(_this) {
        return function(i) {
          return ((i % groupings_per_row) + 1) * min_grouping_width;
        };
      })(this);
      get_height = (function(_this) {
        return function(i) {
          var num_row;
          num_row = Math.floor(i / groupings_per_row) + 1;
          return num_row * min_grouping_height - 100;
        };
      })(this);
      groups = d3.nest().key(grouping_func).rollup((function(_this) {
        return function(leaves) {
          return {
            sum: d3.sum(leaves, function(d) {
              return parseFloat(d.value);
            }),
            candidates: d3.set(leaves.map(_this.get_candidate_short_name)).values(),
            radius: _this.estimate_circle_diameter(leaves) / 2
          };
        };
      })(this)).map(nodes, d3.map);
      max_num_rows = 5;
      padding = 30;
      label_padding = 90;
      col_num = prev_radius = 0;
      num_in_row = 1;
      max_num_in_row = 6;
      prev_y = -60;
      sort = options.sort != null ? options.sort : function(a, b) {
        return d3.descending(parseFloat(groups.get(a).sum), parseFloat(groups.get(b).sum));
      };
      groups.keys().sort(sort).forEach((function(_this) {
        return function(key, index) {
          var entry, min_width, num_left_in_layout, prev_num_in_row, x, y;
          entry = groups.get(key);
          entry['key'] = key;
          if (col_num >= num_in_row) {
            col_num = 0;
          }
          if (col_num === 0) {
            prev_num_in_row = num_in_row;
            while ((_this.width / num_in_row) > entry.radius * 2 + padding * 3) {
              num_in_row += 1;
            }
            num_in_row -= 1;
            num_left_in_layout = groups.keys().length - index;
            if (num_in_row > num_left_in_layout) {
              if (!(num_left_in_layout > groups.keys().length - 1)) {
                num_in_row = prev_num_in_row;
              }
            }
            num_in_row = Math.min(max_num_in_row, num_in_row);
          }
          min_width = _this.width / num_in_row;
          x = min_width * col_num + min_width / 2;
          if (col_num === 0) {
            y = prev_y + prev_radius + entry.radius + padding * 2 + label_padding;
            prev_y = y;
            prev_radius = entry.radius;
          }
          y = prev_y;
          entry['x'] = x;
          entry['y'] = y;
          entry['radius'] = prev_radius;
          groups.set(key, entry);
          return col_num += 1;
        };
      })(this));
      return groups;
    };

    BubbleChart.prototype.get_supercategory = function(category) {
      if (category === 'Durable Assets' || category === 'Food & Beverages' || category === 'Insurance' || category === 'Lease/Rent' || category === 'Office Supplies' || category === 'Travel & Lodging' || category === 'Utilities' || category === 'Vehicle') {
        return 'overhead';
      } else if (category === 'Contribution to Community Organization' || category === 'Contribution to Political Party' || category === 'Hawaii Election Campaign Fund') {
        return 'contributions';
      } else if (category === 'Advertising' || category === 'Candidate Fundraiser Tickets' || category === 'Postage/Mailing' || category === 'Printing' || category === 'Surveys, Polls & Voter Lists' || category === 'Advertising, Media & Collateral Materials' || category === 'Printing, Postage, Mailing & Freight' || category === 'Surveys, Polls, Research & Voter Lists') {
        return 'communication';
      } else if (category === 'Employee Services' || category === 'Professional Services' || category === 'Contract, Employee & Professional Services') {
        return 'staff';
      } else if (category === 'Bank Charges & Adjustments' || category === 'Filing Fee' || category === 'Taxes') {
        return 'fees';
      } else if (category === 'Other') {
        return 'other';
      } else {
        return 'other';
      }
    };

    BubbleChart.prototype.get_candidate_short_name = function(d) {
      return d.name.split(',')[0] + (" (" + d.party[0] + ")");
    };

    BubbleChart.prototype.estimate_circle_diameter = function(nodes) {
      var area, diameter, estimated_diameter;
      area = d3.sum(nodes, function(d) {
        return Math.PI * Math.pow(d.radius, 2);
      });
      diameter = 2 * Math.sqrt(area / Math.PI);
      estimated_diameter = (Math.log(nodes.length) / 140 + 1) * diameter;
      return estimated_diameter;
    };

    BubbleChart.prototype.move_towards_year = function(alpha) {
      return (function(_this) {
        return function(d) {
          var target;
          target = _this.year_centers[d.election_period];
          d.x = d.x + (target.x - d.x) * (_this.damper + 0.02) * alpha * 1.1;
          return d.y = d.y + (target.y - d.y) * (_this.damper + 0.02) * alpha * 1.1;
        };
      })(this);
    };

    BubbleChart.prototype.show_details = function(data, i, element) {
      var content;
      d3.select(element).attr("stroke", "black");
      content = "<div class=\"inner_tooltip\">";
      content += "<span class=\"candidate\">" + data.name + "</span><br/>";
      content += "<span class=\"office\">" + data.election_year + ", " + data.office + "</span><br/>";
      content += "<span class=\"amount\"> " + data.category + " $" + (addCommas(data.value)) + "</span><br/>";
      content += "</div>";
      return this.tooltip.showTooltip(content, d3.event);
    };

    BubbleChart.prototype.hide_details = function(data, i, element) {
      d3.select(element).attr("stroke", '');
      return this.tooltip.hideTooltip();
    };

    BubbleChart.prototype.render_modal = function(circle_data, i, element) {
      var center_loc, center_node, circles, force, largest_radius, link_distance, link_padding, links, modal_viz_height, modal_viz_padding, modal_viz_width, move_center_towards_center, nodes, non_center_nodes, records, reg_no, tick, viz;
      this.kill_forces();
      $('#candidate_vis').find('svg').remove();
      $('#candidate_modal').find('#expenditure-record-table-container').empty();
      reg_no = circle_data.reg_no;
      ga('send', 'event', 'modal', 'show', circle_data.name, 1);
      records = window.records.filter(function(d) {
        return d.reg_no === reg_no;
      });
      nodes = window.viz.selectAll('circle').filter((function(_this) {
        return function(d) {
          return d.reg_no === reg_no;
        };
      })(this)).sort(function(a, b) {
        return d3.descending(a.radius, b.radius);
      }).data();
      center_node = nodes.filter(function(d) {
        return circle_data.category === d.category;
      })[0];
      non_center_nodes = nodes.filter(function(d) {
        return circle_data.category !== d.category;
      });
      largest_radius = d3.max(non_center_nodes, function(d) {
        return d.radius;
      });
      console.log("largest radius is " + largest_radius + ", similar to 61?");
      link_padding = largest_radius > 40 ? 90 : 55;
      links = non_center_nodes.map(function(node) {
        return {
          source: center_node,
          target: node
        };
      });
      link_distance = Math.max(40, center_node.radius) + link_padding;
      modal_viz_padding = 5;
      modal_viz_height = link_distance * 2 + largest_radius * 2 + modal_viz_padding * 2;
      modal_viz_width = $('#candidate_vis').width();
      viz = d3.select('#candidate_vis').append('svg').attr('width', '100%').attr('height', modal_viz_height);
      circles = viz.selectAll('circle').data(nodes, function(d) {
        return d.id;
      });
      this.do_create_circles(circles);
      circles.filter(function(node) {
        return node.category !== circle_data.category;
      }).transition().duration(1000).style('opacity', 0.5);
      circles.attr('cx', function(d) {
        return d.x;
      }).attr('cy', function(d) {
        return d.y;
      });
      center_loc = {
        x: modal_viz_width / 2,
        y: modal_viz_height / 2
      };
      console.log("Center loc is " + JSON.stringify(center_loc));
      move_center_towards_center = (function(_this) {
        return function(alpha) {
          return function(d) {
            if (d.id === center_node.id) {
              d.x = d.x + (center_loc.x - d.x) * (_this.damper + 0.02) * alpha;
              return d.y = d.y + (center_loc.y - d.y) * (_this.damper + 0.02) * alpha;
            }
          };
        };
      })(this);
      tick = (function(_this) {
        return function(e) {
          return circles.each(move_center_towards_center(e.alpha)).attr("cx", function(d) {
            return d.x;
          }).attr("cy", function(d) {
            return d.y;
          });
        };
      })(this);
      console.log("force layout with width " + modal_viz_width + " height: " + modal_viz_height);
      force = d3.layout.force().size([modal_viz_width, modal_viz_height]).nodes(nodes).links(links).friction(0.7).theta(0.5).gravity(0.4).charge((function(_this) {
        return function(d) {
          var charge;
          charge = -300 + -200 * Math.log(d.radius);
          _this.charge(d) * 50;
          return charge;
        };
      })(this)).linkDistance(link_distance).on('tick', tick).start();
      window.force = force;
      return this.update_modal(reg_no, circle_data.category);
    };

    BubbleChart.prototype.update_modal = function(reg_no, category) {
      var candidate_info, candidate_name, candidate_office, cur_year, encoded_category, modal, url, url_params, year;
      console.log('updating modal');
      url = 'https://hicscdata.hawaii.gov/resource/3maa-4fgr.json';
      encoded_category = encodeURIComponent(category);
      year = candidate_utils.get_vis_year();
      url_params = "$limit=20&$where=reg_no='" + reg_no + ("'and expenditure_category='" + encoded_category + "' and election_period like '%25") + year + "'&$order=amount desc";
      modal = $('#candidate_modal');
      modal.find('.expenditure-error').hide();
      modal.find('.expenditure-loading').show();
      $.get(url + "?" + url_params, function(data) {
        var columns;
        columns = [
          {
            name: 'date',
            display_name: 'Date',
            func: function(d) {
              return d.substring(0, 10);
            }
          }, {
            name: 'expenditure_category',
            display_name: 'Expenditure Category'
          }, {
            name: 'vendor_name',
            display_name: 'Vendor Name'
          }, {
            name: 'purpose_of_expenditure',
            display_name: 'Purpose of Expenditure'
          }, {
            name: 'amount',
            display_name: 'Amount',
            func: function(d) {
              return money(d);
            }
          }
        ];
        return tabulate('#candidate_modal #expenditure-record-table-container', 'expenditure-record-table', data, columns);
      }).always(function() {
        return modal.find('.expenditure-loading').hide();
      }).error(function() {
        return modal.find('.expenditure-error').show();
      });
      candidate_info = window.organizational_records.filter(function(d) {
        return d.reg_no === reg_no;
      })[0];
      candidate_name = candidate_info.candidate_name;
      candidate_office = candidate_info.office;
      modal.find('.candidate_name').text(candidate_name);
      cur_year = candidate_utils.get_vis_year();
      modal.find('.current_year').text(cur_year);
      modal.find('.candidate_office').text(candidate_office);
      modal.find('.expenditure_category_title').text(category);
      return show_powerballot_link(modal.find('a.powerballot').hide(), reg_no);
    };

    BubbleChart.prototype.update_modal_center = function(circle_data, i, element) {
      return this.render_modal(circle_data, i, element);
    };

    BubbleChart.prototype.size_legend_init = function() {
      var circles, height, label_buffer, label_text_buffer, largest_legend_offset, largest_radius, legend_sizes, line_x_pos, line_y_pos, radius_range, size_legend, width, y;
      height = 200;
      legend_sizes = [
        {
          label: '$ 100,000',
          r: 100 * 1000
        }, {
          label: '$ 500,000',
          r: 500 * 1000
        }, {
          label: '$ 1 million',
          r: 1000000
        }
      ];
      $.each(legend_sizes, (function(_this) {
        return function(i, d) {
          return d.r = _this.radius_scale(d.r);
        };
      })(this));
      largest_legend_offset = 40;
      largest_radius = d3.max(legend_sizes, function(d) {
        return d.r;
      });
      radius_range = d3.extent(legend_sizes, function(d) {
        return d.r;
      });
      y = d3.scale.ordinal().domain(legend_sizes.map(function(d) {
        return d.r;
      })).range([-radius_range[0], -(radius_range[1] + largest_legend_offset + radius_range[0]) / 2, -(radius_range[1] + largest_legend_offset)]);
      y.range(y.range().map(function(d) {
        return Math.round(d);
      }));
      width = $("#size-legend-container").width();
      size_legend = d3.select("#size-legend-container").append("svg").attr("width", width).attr("height", height).append('g').attr("transform", function(d) {
        return "translate(" + (width / 2 - width / 6) + "," + (height / 2 + largest_radius) + ")";
      });
      circles = size_legend.selectAll("circle").data(legend_sizes);
      circles.enter().append('circle').attr('r', (function(_this) {
        return function(d) {
          return d.r;
        };
      })(this)).attr('cx', 0).attr('cy', function(d) {
        return -d.r;
      });
      label_buffer = 40;
      label_text_buffer = 10;
      line_y_pos = function(d) {
        return -d.r - d.r * Math.sin(d.y_ang);
      };
      line_x_pos = function(d) {
        var val;
        return val = Math.sqrt(Math.pow(d.r, 2) - Math.pow(y(d.r) + d.r, 2));
      };
      circles.enter().append('polyline').attr('points', function(d) {
        return (line_x_pos(d)) + ", " + (y(d.r)) + ", " + (largest_radius + label_buffer) + ", " + (y(d.r));
      });
      return circles.enter().append('text').attr('class', 'size_label').attr('x', largest_radius + label_buffer + label_text_buffer).attr('y', function(d) {
        return y(d.r);
      }).text(function(d) {
        return d.label;
      });
    };

    BubbleChart.prototype.show_legend = function(radius) {
      return d3.select('#vis-full-key').transition().duration(1500).style('opacity', 1).style('top', (radius * 2 + 80 + 85) + 'px');
    };

    BubbleChart.prototype.hide_legend = function() {
      return d3.select('#vis-full-key').transition().duration(1500).style('opacity', 0).style('top', '2000px');
    };

    BubbleChart.prototype.handle_anchor_link = function() {
      var candidate, reg_no;
      if (window.location.hash.length > 0) {
        reg_no = window.location.hash.substr(1);
        $('#viz_nav_container .viz_nav[data-name="candidate"]').click();
        candidate = window.organizational_records.filter(function(d) {
          return d.reg_no === reg_no;
        })[0];
        if (candidate != null) {
          return this.highlightSingleCandidate(candidate.candidate_name);
        } else {
          return console.warn("Unable to find candidate_name from reg_no " + reg_no);
        }
      }
    };

    BubbleChart.prototype.highlightSingleCandidate = function(candidate_name_to_find) {
      return this.show_by_candidate({
        modify_location_map: (function(_this) {
          return function(location_map) {
            location_map.keys().forEach(function(candidate_name) {
              if (candidate_name !== candidate_name_to_find) {
                return location_map.get(candidate_name).x = -200;
              } else {
                location_map.get(candidate_name).x = _this.width / 2;
                return location_map.get(candidate_name).y = 200;
              }
            });
            return location_map;
          };
        })(this)
      });
    };

    BubbleChart.prototype.initialize_candidate_autocomplete = function() {
      var $container, $input, candidate_lookup, reset_candidate_search;
      candidate_lookup = window.organizational_records.map(function(d) {
        return {
          value: d.candidate_name,
          data: d.reg_no
        };
      });
      $container = $('.candidate_search_container');
      $input = this.candidate_search_input();
      reset_candidate_search = (function(_this) {
        return function() {
          _this.show_all_candidates();
          return _this.show_by_candidate();
        };
      })(this);
      $input.bind('input', function() {
        if ($(this).val().length <= 0) {
          return reset_candidate_search();
        }
      });
      return $input.autocomplete({
        lookup: candidate_lookup,
        lookupLimit: 6,
        lookupFilter: function(suggestion, originalQuery, queryLowerCase) {
          var query_words;
          query_words = queryLowerCase.match(/[^ ]+/g);
          return query_words.every(function(query) {
            return suggestion.value.toLowerCase().indexOf(query) !== -1;
          });
        },
        autoSelectFirst: true,
        onSelect: (function(_this) {
          return function(suggestion) {
            ga('send', 'event', 'candidate_search', 'select', suggestion.value, 1);
            return _this.highlightSingleCandidate(suggestion.value);
          };
        })(this),
        appendTo: $container,
        showNoSuggestionNotice: true,
        noSuggestionNotice: 'No candidates match your query',
        formatResult: function(suggestion, currentValue) {
          var formatted;
          formatted = suggestion.value;
          currentValue.match(/[^ ]+/g).forEach(function(value) {
            var pattern;
            pattern = '(' + $.Autocomplete.utils.escapeRegExChars(value) + ')';
            return formatted = formatted.replace(new RegExp(pattern, 'gi'), '<strong>$1<\/strong>');
          });
          return formatted;
        },
        onSearchComplete: (function(_this) {
          return function(query, suggestions) {
            var candidates_to_show;
            ga('send', 'event', 'candidate_search', 'search', query, 1);
            candidates_to_show = suggestions.map(function(d) {
              return d.data;
            });
            if (suggestions.length <= 0) {
              return reset_candidate_search();
            } else if (suggestions.length <= 6 && suggestions.length > 0) {
              _this.circles.filter(function(circle) {
                var ref;
                return ref = circle.reg_no, indexOf.call(candidates_to_show, ref) >= 0;
              }).transition().duration(1000).style('opacity', 1);
              return _this.circles.filter(function(circle) {
                var ref;
                return ref = circle.reg_no, indexOf.call(candidates_to_show, ref) < 0;
              }).transition().duration(1000).style('opacity', 0.3);
            }
          };
        })(this)
      });
    };

    return BubbleChart;

  })();

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  CandidateUtil = (function() {
    function CandidateUtil() {
      this.get_island = bind(this.get_island, this);
      this.get_vis_year = bind(this.get_vis_year, this);
    }

    CandidateUtil.prototype.MAUI = 'Maui, Lanai, Molokai';

    CandidateUtil.prototype.KAUAI = 'Kauai, Niihau';

    CandidateUtil.prototype.get_vis_year = function() {
      var $year_el, cur_year;
      $year_el = $('.viz_nav.year');
      return cur_year = $year_el.data('year');
    };

    CandidateUtil.prototype.get_island = function(record) {
      var matches, ref, ref1, ref2, ref3, ref4, ref5, ref6;
      if ((ref = record.office) === 'Governor' || ref === 'Mayor' || ref === 'Lt. Governor' || ref === 'Prosecuting Attorney' || ref === 'OHA' || ref === 'BOE') {
        return 'All';
      } else if ((ref1 = record.office) === 'Honolulu Council') {
        return 'Oahu';
      } else if ((ref2 = record.office) === 'Maui Council') {
        return this.MAUI;
      } else if ((ref3 = record.office) === 'Kauai Council') {
        return this.KAUAI;
      } else if ((ref4 = record.office) === 'Hawaii Council') {
        return 'Hawaii';
      } else if ((ref5 = record.office) === 'Senate') {
        matches = window.precinct_records.filter(function(d) {
          return d.senate === record.district;
        });
        if (!matches[0]) {
          console.log('no matches', record);
        }
        return this.get_island_by_precinct(matches[0].precinct);
      } else if ((ref6 = record.office) === 'House') {
        matches = window.precinct_records.filter(function(d) {
          return d.house === record.district;
        });
        return this.get_island_by_precinct(matches[0].precinct);
      } else {
        return 'Other';
      }
    };

    CandidateUtil.prototype.get_island_by_precinct = function(precinct) {
      var as_number, island;
      as_number = parseInt(precinct.substring(0, 2) + precinct.substring(3, 5));
      return island = as_number <= 707 ? 'Hawaii' : as_number <= 1303 ? this.MAUI : as_number <= 1304 ? this.MAUI : as_number <= 1309 ? this.MAUI : as_number <= 1605 ? this.KAUAI : as_number <= 1606 ? this.KAUAI : as_number <= 5106 ? 'Oahu' : 'Error';
    };

    return CandidateUtil;

  })();

  root.candidate_utils = new CandidateUtil;

  show_powerballot_link = function($el, candidate_reg_no) {
    var params, powerballot_url, url;
    powerballot_url = "http://codeforhawaii.github.io/hawaii-power-ballot/allgeneral.htm";
    url = "http://services2.arcgis.com/tuFQUQg1xd48W6M5/arcgis/rest/services/HI_2014_primary_candidates/FeatureServer/1/query";
    params = {
      where: "CC_Reg_No='" + candidate_reg_no + "'",
      f: 'pjson',
      outFields: 'Candidate_ID'
    };
    return $.get(url, params, function(data) {
      var candidate_id, features;
      features = JSON.parse(data).features[0];
      if (features != null) {
        candidate_id = features.attributes.Candidate_ID;
        return $el.show().attr('href', powerballot_url + '#' + candidate_id);
      } else {
        return console.warn("Unable to find candidate id for reg no " + candidate_reg_no);
      }
    });
  };

  campaignInit = function() {
    $('.legend tr').on('mouseenter', function() {
      var category, circles;
      category = $(this).data('category');
      circles = d3.selectAll('circle');
      return circles.filter(function(circle) {
        return circle.super_category !== category;
      }).transition().duration(1000).style('opacity', 0.3);
    });
    return $('.legend tr[data-category]').on('mouseleave', function() {
      var category, circles;
      category = $(this).data('category');
      circles = d3.selectAll('circle');
      return circles.transition().duration(1000).style('opacity', 1);
    });
  };

  $(function() {
    var chart, filter_data, join_data, render_vis;
    chart = null;
    campaignInit();
    join_data = function(expend_recs, org_recs) {
      var expend_rec, full_records, i, j, org_rec;
      full_records = [];
      i = 0;
      j = 0;
      while (true) {
        expend_rec = expend_recs[i];
        org_rec = org_recs[j];
        if ((expend_rec == null) || (org_rec == null)) {
          break;
        }
        if (expend_rec.reg_no === org_rec.reg_no) {
          full_records.push($.extend({}, expend_rec, org_rec));
          i++;
        } else if (expend_rec.reg_no !== org_rec.reg_no) {
          j++;
        }
      }
      return full_records;
    };
    filter_data = function(records, year) {
      var filtered_csv, reduced, sorted;
      filtered_csv = records.filter(function(d) {
        if (parseInt(d.amount) < 0) {
          return false;
        } else if (year === 2024) {
          return d.election_period === '2022-2024' || d.election_period === '2020-2024';
        } else if (year === 2022) {
          return d.election_period === '2020-2022' || d.election_period === '2018-2022';
        } else if (year === 2020) {
          return d.election_period === '2018-2020' || d.election_period === '2016-2020';
        } else if (year === 2018) {
          return d.election_period === '2016-2018' || d.election_period === '2014-2018';
        } else if (year === 2016) {
          return d.election_period === '2014-2016' || d.election_period === '2012-2016';
        } else if (year === 2014) {
          return d.election_period === '2012-2014' || d.election_period === '2010-2014';
        } else if (year === 2012) {
          return d.election_period === '2010-2012' || d.election_period === '2008-2012';
        } else if (year === 2010) {
          return d.election_period === '2008-2010' || d.election_period === '2006-2010';
        } else if (year === 2008) {
          return d.election_period === '2006-2008' || d.election_period === '2004-2008';
        } else if (year === 'gov') {
          return d.election_period === '2012-2014' && d.office === 'Governor';
        } else if (year === 'senate') {
          return d.election_period === '2012-2014' && d.office === 'Senate';
        } else {
          return false;
        }
      });
      sorted = filtered_csv.sort(function(a, b) {
        return d3.descending(parseFloat(a.amount), parseFloat(b.amount));
      });
      reduced = _.reduce(filtered_csv, function(acc, d) {
        var curr;
        curr = acc[d.candidate_name];
        if (curr == null) {
          curr = [];
        }
        curr.push(d);
        curr = _.sortBy(curr, function(d) {
          return parseFloat(d.amount.slice(5));
        }).reverse();
        acc[d.candidate_name] = _.first(curr, 1);
        return acc;
      }, {});
      filtered_csv;
      return sorted;
    };
    root.update_year = function(next) {
      var $year_el, cur_year, direction, filtered_records, next_year, range, records;
      records = window.raw_records;
      cur_year = candidate_utils.get_vis_year();
      direction = next ? 1 : -1;
      next_year = cur_year + 2 * direction;
      if (next_year === 2008) {
        $('.viz_nav.year .left-arrow').attr('src', 'images/year_arrow_disabled.png').removeClass('clickable');
      } else {
        $('.viz_nav.year .left-arrow').attr('src', 'images/year_arrow_transparent.png').addClass('clickable');
      }
      if (next_year === 2022) {
        $('.viz_nav.year .right-arrow').attr('src', 'images/year_arrow_disabled.png').removeClass('clickable');
      } else {
        $('.viz_nav.year .right-arrow').attr('src', 'images/year_arrow_transparent.png').addClass('clickable');
      }
      range = d3.range(2008, 2022.1, 2);
      if (indexOf.call(range, next_year) < 0) {
        return;
      }
      $year_el = $('.viz_nav.year');
      $year_el.animate({
        color: 'white'
      }, {
        complete: function() {
          $year_el.find('.year-text').text(next_year);
          $year_el.data('year', next_year);
          return $year_el.animate({
            color: '#454542'
          });
        }
      });
      filtered_records = filter_data(records, next_year);
      window.debug_now = true;
      window.records = filtered_records;
      return chart.update_data(filtered_records);
    };
    render_vis = function(error, expenditure_records, organizational_records, precinct_records) {
      var filtered_records, raw_records;
      raw_records = join_data(expenditure_records, organizational_records);
      window.raw_records = raw_records;
      filtered_records = filter_data(raw_records, 2022);
      window.precinct_records = precinct_records;
      window.records = filtered_records;
      window.organizational_records = organizational_records;
      chart = new BubbleChart(filtered_records);
      chart.display_group_all();
      chart.size_legend_init();
      return chart.handle_anchor_link();
    };
    root.get_chart = (function(_this) {
      return function() {
        return chart;
      };
    })(this);
    $('#viz_nav_container .viz_nav').on('click', function(e) {
      var $viz_nav, currentFunc, func;
      e.preventDefault();
      $viz_nav = $(e.target).closest('.viz_nav');
      func = $viz_nav.data('name');
      currentFunc = $('.viz_nav.btn.selected').data('name');
      ga('send', 'event', 'click', 'navigation', func, 1);
      $viz_nav.animate({
        backgroundColor: '#73884f'
      });
      $viz_nav.animate({
        backgroundColor: '#FFFFFF'
      });
      if (func !== currentFunc) {
        $viz_nav.siblings('.btn').removeClass('selected');
        $viz_nav.addClass('selected');
        return window.get_chart().show_viz_type(func);
      } else {
        $viz_nav.removeClass('selected');
        return window.get_chart().show_viz_type('year');
      }
    });
    $('.viz_nav .right-arrow').on('click', function(e) {
      e.stopPropagation();
      ga('send', 'event', 'click', 'navigation', 'next_year', 1);
      if ($(this).hasClass('clickable')) {
        return window.update_year(true);
      }
    });
    $('.viz_nav .left-arrow').on('click', function(e) {
      e.stopPropagation();
      ga('send', 'event', 'click', 'navigation', 'previous_year', 1);
      if ($(this).hasClass('clickable')) {
        return window.update_year(false);
      }
    });
    $('#nav #mini-legend').on('click', function(e) {
      var pos;
      e.preventDefault();
      ga('send', 'event', 'click', 'navigation', 'toggle_mini_legend', 1);
      pos = $(this).offset();
      pos.top = 50;
      return $('#mini-legend-body').slideToggle().offset(pos);
    });
    return queue().defer(d3.csv, "data/campaign_spending_summary.csv").defer(d3.csv, "data/organizational_report.csv").defer(d3.csv, "data/precinct.csv").await(render_vis);
  });

}).call(this);
