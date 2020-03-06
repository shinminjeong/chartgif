var xScale, yScale, radius;
var continent = ["Asia", "Europe", "North America", "South America", "Africa", "Oceania", "Antarctica"];
var color = ["#F08391", "#FCEC71", "#AEED6C", "#AEED6C", "#80DBEB", "#F08391", "#000"];
var hullOffset = 10;

class ScatterPlot {

  constructor(div_id, w, h) {
    this.margin = {top: 5, right: 10, bottom: 25, left:25};
    this.width = w - this.margin.left - this.margin.right;
    this.height = h - this.margin.top - this.margin.bottom;
    this.div_id = div_id;
    this.bubble = {};
  }

  initChart(data2d, data_options, population, continent, group) {
    var year = "1800";
    if (group.length == 0)
      group = undefined;

    this.svg = d3.select("#"+this.div_id)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
    .append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    this.countries = data2d.country;
    this.continentMap = continent.continent;
    // console.log(data2d[year+"_x"], data2d[year+"_y"])
    // console.log(population[year]);

    this.years = range(1800, 2019);
    this.data = {}
    this.xrange = [10000000, 0];
    this.yrange = [10000000, 0];
    this.srange = [10000000, 0];
    for (var i in this.years) {
      var year = this.years[i];
      var pre_year = this.years[i > 0? i-1:0];
      this.data[year] = [];
      for (var index in this.countries) {
        // console.log(index, this.countries[index], this.continentMap[index])
        var d = {
          "id": index,
          "name": this.countries[index],
          "x": data2d[year+"_x"][index],
          "y": data2d[year+"_y"][index],
          "population": population[year][index]/40000,
          "pre_x": data2d[pre_year+"_x"][index],
          "pre_y": data2d[pre_year+"_y"][index],
          "pre_population": population[pre_year][index]/40000,
          "group": (group? group[this.countries[index]]["group"] : -1)
        }
        this.xrange[0] = Math.min(this.xrange[0], d.x);
        this.xrange[1] = Math.max(this.xrange[1], d.x);
        this.yrange[0] = Math.min(this.yrange[0], d.y);
        this.yrange[1] = Math.max(this.yrange[1], d.y);
        this.srange[0] = Math.min(this.srange[0], d.population);
        this.srange[1] = Math.max(this.srange[1], d.population);
        this.data[year].push(d)
      }
    }

    var x_tickvalues, y_tickvalues;
    // if (data_options["x"]["id"] == "income") {this.xrange[0] = Math.max(250, this.xrange[0]);}
    // if (data_options["y"]["id"] == "income") {this.yrange[0] = Math.max(250, this.yrange[0]);}

    if (data_options["xScale"]["id"] == "log") {
      this.xrange[0] = Math.max(1, this.xrange[0]);
      x_tickvalues = getTickValues(this.xrange, true);
      xScale = d3.scaleLog().range([0, this.width]).domain(this.xrange);
    } else {
      x_tickvalues = getTickValues(this.xrange, false);
      xScale = d3.scaleLinear().range([0, this.width]).domain(this.xrange).nice();
    }
    if (data_options["yScale"]["id"] == "log") {
      this.yrange[0] = Math.max(1, this.yrange[0]);
      y_tickvalues = getTickValues(this.yrange, true);
      yScale = d3.scaleLog().range([this.height, 0]).domain(this.yrange);
    } else {
      y_tickvalues = getTickValues(this.yrange, false);
      yScale = d3.scaleLinear().range([this.height, 0]).domain(this.yrange).nice();
    }
    radius = d3.scaleSqrt().range([2,15]).domain(this.srange).nice();

    this.svg.append('g')
      .attr('transform', 'translate(0,' + this.height + ')')
      .attr('class', 'x axis')
      .call(d3.axisBottom(xScale)
        .tickFormat(d3.format(".2s"))
        .tickValues(x_tickvalues)
      );

    this.svg.append('g')
      .attr("class", "grid")
      .call(d3.axisBottom(xScale)
        .tickSize(this.height)
        .tickFormat("")
        .tickValues(x_tickvalues)
      );

    // y-axis is translated to (0,0)
    this.svg.append('g')
      .attr('transform', 'translate(0,0)')
      .attr('class', 'y axis')
      .call(d3.axisLeft(yScale)
        .tickFormat(d3.format(".2s"))
        .tickValues(y_tickvalues)
      );

    this.svg.append('g')
      .attr("class", "grid")
      .call(d3.axisLeft(yScale)
        .tickSize(-this.width)
        .tickFormat("")
        .tickValues(y_tickvalues)
      );

    this.trace_path_g = this.svg.append('g');
    this.hull_g = this.svg.append('g');

    // adding label. For x-axis, it's at (10, 10), and for y-axis at (width, height-10).
    // this.svg.append('text')
    //   .attr('x', 10)
    //   .attr('y', 10)
    //   .attr('class', 'label')
    //   .text('Life Expectancy');
    //
    // this.svg.append('text')
    //   .attr('x', this.width)
    //   .attr('y', this.height - 10)
    //   .attr('text-anchor', 'end')
    //   .attr('class', 'label')
    //   .text('Income');

    var legend = this.svg.selectAll('legend')
      .data(continent)
      .enter().append('g')
      .attr('class', 'legend')
      .attr('transform', function(d,i){ return 'translate(0,' + i * 20 + ')'; });

    legend.append('rect')
      .attr('x', this.width)
      .attr('width', 18)
      .attr('height', 18)
      .style('fill', color);

    legend.append('text')
      .attr('x', this.width - 6)
      .attr('y', 9)
      .attr('dy', '.35em')
      .style('text-anchor', 'end')
      .text(function(d){ return d; });

    this.bubble_trace_g = this.svg.append('g');
    this.bubble_shadow_g = this.svg.append('g');
    this.bubble_g = this.svg.append('g');
    this.hull_label_g = this.svg.append('g');
  }

  updateChart(year, swtvalues) {
    console.log("updateChart", year);
    this.clearFocus();
    var data = this.data[year];

    var flagTrace = swtvalues["trace"],
        flagConvexHulls = swtvalues["hull"];

    // console.log("updateChart", year, flagConvexHulls);
    var bubble = this.bubble_g.selectAll('.bubble')
        .data(data)
      .enter().append('circle')
        .attr('id', function(d){return d.id;})
        .attr('class', function(d){ return 'bubble g'+d.group; })
        .attr('cx', function(d){return xScale(d.x);})
        .attr('cy', function(d){ return yScale(d.y); })
        .attr('r', function(d){ return radius(d.population)*1.3+1; })
        .style('stroke', 'black')
        .style('stroke-width', 0.5)
        .style('fill', function(d){
          // console.log(d.group);
          if (d.group == -1) return color[continent.indexOf(this.continentMap[d.id])];
          else return gcolor(d.group);
        })
        .style('visibility', function(d) {
          // console.log(d.group, swtvalues["groups"]);
          if (swtvalues["groups"][d.group]) return 'visible';
          else return 'hidden';
        })
        .on("mouseover", mouseOverBubbles)
        .on("click", clickBubbles)
        .on("mouseout", mouseOutBubbles)
      // .transition()
      //   .duration(100)
      //   .attr("cx", function(d){return xScale(d.x);})
      //   .attr("cy", function(d){ return yScale(d.y); })
      //   .attr('r', function(d){ return radius(d.population); })

    this.bubble_g.selectAll('.bubble-label')
        .data(data)
      .enter().append('text')
        .attr('id', function(d){return d.id;})
        .attr('class', function(d){ return 'bubble-label g'+d.group; })
        .attr('x', function(d){return xScale(d.x)-20;})
        .attr('y', function(d){ return yScale(d.y); })
        .text(function(d){ return d.name; })
        .style('visibility', 'hidden')
        .on("mouseover", mouseOverBubbles)
        .on("click", clickBubbles)
        .on("mouseout", mouseOutBubbles);

    this.hull_g.selectAll("path.hull").remove();
    if (flagConvexHulls) {
      this.hull_g.selectAll("path.hull")
          .data(convexHulls(data, getGroup, hullOffset, false))
        .enter().append("path")
          .attr("class", "hull")
          .attr("id", function(d) { return d.group; })
          .attr("d", drawCluster)
          .style("opacity", 0.2)
          .style("fill", function(d) { return gcolor(d.group); })
          .style('visibility', function(d) {
            if (swtvalues["groups"][d.group]) return 'visible';
            else return 'hidden';
          });
    }

    this.trace_path_g.selectAll("circle.tbubble").remove();
    if (flagTrace) {
      var allyearmeans = [];
      for (var i in this.years) {
        var data = this.data[this.years[i]];
        allyearmeans = allyearmeans.concat(traceMean(this.years[i], data, getGroup))
      }

      this.trace_path_g.selectAll(".tbubble")
          .data(allyearmeans)
        .enter().append("circle")
          .attr("class", "tbubble")
          .attr("year", d => d.year)
          .attr('cx', d => xScale(d.x))
          .attr('cy', d => yScale(d.y))
          .attr('r', 1)
          .style("opacity", 1)
          .style("fill", function(d) { return gcolor(d.group); })
          .style('visibility', function(d) {
            if (swtvalues["groups"][d.group]) return 'visible';
            else return 'hidden';
          });
    }
  }

  clearFocus() {
    this.bubble_g.selectAll("*").remove();
    this.bubble_shadow_g.selectAll("*").remove();
    this.bubble_trace_g.selectAll("*").remove();
    this.hull_g.selectAll("path.hull").remove();
    this.hull_label_g.selectAll("text.hull-label").remove();
  }

  updateFocus(year, swtvalues, innergrp) {
    console.log("updateFocus", swtvalues, innergrp[year]["group"])
    this.bubble_g.selectAll("*").remove();
    this.trace_path_g.selectAll("circle.tbubble").remove();

    var data = this.data[year];
    var flag_world = swtvalues["groups"][0];
    for (var d in data) {
      var group = flag_world?0:data[d].group;
      if (swtvalues["groups"][group] && group in innergrp[year]["group"]) {
        data[d].ingroup = innergrp[year]["group"][group][data[d].id];
        data[d].ingdesc = innergrp[year]["desc"][group][data[d].ingroup];
      } else {
        data[d].ingroup = -1;
      }
    }

    var dataCvxHulls = convexHulls(data, getInnerGroup, hullOffset, true);

    this.bubble_trace_g.append("g").selectAll('.bubble_trace')
        .data(data)
      .enter().append("line")
        .attr("x1", d => xScale(d.pre_x))
        .attr("y1", d => yScale(d.pre_y))
        .attr("x2", d => xScale(d.pre_x))
        .attr("y2", d => yScale(d.pre_y))
        .attr("stroke", d => gcolor(d.group))
        .attr("stroke-width", d => radius(d.pre_population)*2.6+2)
        .style('opacity', 0.2)
        .style('visibility', function(d) {
          if (swtvalues["groups"][d.group]) return 'visible';
          else return 'hidden';
        })
      .transition()
        .duration(1000)
        .attr("x2", d => xScale(d.x))
        .attr("y2", d => yScale(d.y))

    this.bubble_shadow_g.append("g").selectAll('.bubble_shadow')
        .data(data)
      .enter().append('circle')
        .attr('class', function(d){ return 'bubble_shadow g'+d.group; })
        .attr('cx', function(d){return xScale(d.pre_x);})
        .attr('cy', function(d){ return yScale(d.pre_y); })
        .attr('r', function(d){ return radius(d.pre_population)*1.3+1; })
        .style('stroke', 'black')
        .style('stroke-width', 0.5)
        .style('opacity', 0.2)
        .style('fill', d => gcolor(d.group))
        .style('visibility', function(d) {
          if (swtvalues["groups"][d.group]) return 'visible';
          else return 'hidden';
        })

    var moving_bubble = this.bubble_g.selectAll('.bubble')
        .data(data)
      .enter().append('circle')
        .attr('class', function(d){ return 'bubble g'+d.group; })
        .attr('cx', function(d){return xScale(d.pre_x);})
        .attr('cy', function(d){ return yScale(d.pre_y); })
        .attr('r', function(d){ return radius(d.pre_population)*1.3+1; })
        .style('stroke', 'black')
        .style('stroke-width', 0.5)
        .style('fill', function(d){
          if (swtvalues["groups"][d.group]) return gcolor(d.group);
          else return "#ddd";
        })
        .style('opacity', function(d){
          if (swtvalues["groups"][d.group]) return 1;
          else return 0.3;
        })
        .style('visibility', function(d) {
          return 'visible';
          // if (swtvalues["groups"][d.group]) return 'visible';
          // else return 'hidden';
        })
      .transition()
        .duration(1000)
        .attr("cx", function(d){return xScale(d.x);})
        .attr("cy", function(d){ return yScale(d.y); })
        .attr('r', function(d){ return radius(d.population)*1.3+1; })

    this.bubble_g.selectAll('.bubble-label')
        .data(data)
      .enter().append('text')
        .attr('id', function(d){return d.id;})
        .attr('class', function(d){ return 'bubble-label g'+d.group; })
        .attr('x', function(d){return xScale(d.x)-20;})
        .attr('y', function(d){ return yScale(d.y); })
        .text(function(d){ return d.name; })
        .style('visibility', 'hidden')
        .on("mouseover", mouseOverBubbles)
        .on("click", clickBubbles)
        .on("mouseout", mouseOutBubbles);

    this.hull_g.selectAll("path.hull").remove();
    this.hull_g.selectAll("path.hull")
        .data(dataCvxHulls)
      .enter().append("path")
        .attr("class", "hull")
        .attr("id", function(d) { return d.group; })
        .attr("d", drawPreCluster)
        .style("opacity", 0.5)
        .style("fill", function(d) { return "#666"; })
        .style('visibility', function(d) {
          if (d.group >= 0 && d.items < 1000) return 'visible';
          else return 'hidden';
        })
      .transition()
        .duration(1000)
        .attr("d", drawCluster);


    this.hull_label_g.selectAll("text.hull-label").remove();
    this.hull_label_g.selectAll('.hull-label')
        .data(dataCvxHulls)
      .enter().append('text')
        .attr('id', d => d.group)
        .attr('class', function(d){ return 'hull-label g'+d.group; })
        .attr('x', d => d.pre_x)
        .attr('y', d => d.pre_y)
        .text(function(d){
          return d.desc;
        })
        .style('visibility', function(d) {
          if (d.group >= 0 && d.items < 10) return 'visible';
          else return 'hidden';
        })
      .transition()
        .duration(1000)
        .attr('x', d => d.x)
        .attr('y', d => d.y);

    }
}

function getTickValues(r, logflag) {
  var tickvalues = [];
  var scale;
  if (logflag) {
    if (r[1]-r[0] < 10) scale = 1;
    else if (r[1]-r[0] < 100) scale = 5;
    else if (r[1]-r[0] < 10000) scale = 125;
    else scale = 250;
    for (var i = Math.max(scale, parseInt(r[0]/scale)*scale); i < r[1]; i*=2) {
      tickvalues.push(i)
    }
  } else {
    if (r[1]-r[0] < 10) scale = 1;
    else if (r[1]-r[0] < 100) scale = 10;
    else scale = Math.pow(10, parseInt(Math.log10(r[1]))-1);
    for (var i = Math.max(0, parseInt(r[0]/scale)*(scale)); i < r[1]; i+=scale) {
      tickvalues.push(i)
    }
  }
  tickvalues.shift();
  return tickvalues
}

function getInnerGroup(n) { return n.ingroup; }
function getGroup(n) { return n.group; }

function convexHulls(nodes, index, offset, pre) {
  // console.log("convexHulls")
  var hulls = {};
  var phulls = {};
  var desc = {};
  // create point sets
  for (var k=0; k<nodes.length; ++k) {
    var n = nodes[k];
    if (n.size) continue;
    var i = index(n),
        l = hulls[i] || (hulls[i] = []),
        p = phulls[i] || (phulls[i] = []);
    var rOffset = radius(n.population)*1.3+1;
    if (pre) {
      p.push([xScale(n.pre_x)-rOffset-offset, yScale(n.pre_y)-rOffset-offset]);
      p.push([xScale(n.pre_x)-rOffset-offset, yScale(n.pre_y)+rOffset+offset]);
      p.push([xScale(n.pre_x)+rOffset+offset, yScale(n.pre_y)-rOffset-offset]);
      p.push([xScale(n.pre_x)+rOffset+offset, yScale(n.pre_y)+rOffset+offset]);
    }
    l.push([xScale(n.x)-rOffset-offset, yScale(n.y)-rOffset-offset]);
    l.push([xScale(n.x)-rOffset-offset, yScale(n.y)+rOffset+offset]);
    l.push([xScale(n.x)+rOffset+offset, yScale(n.y)-rOffset-offset]);
    l.push([xScale(n.x)+rOffset+offset, yScale(n.y)+rOffset+offset]);
    desc[i] = n.ingdesc?n.ingdesc:"";
  }
  // console.log(hulls)
  // create convex hulls
  var hullset = [];
  for (i in hulls) {
    if (pre) {
      hullset.push({
        group: i,
        desc: desc[i],
        items: hulls[i].length,
        x: hulls[i][0][0],
        y: hulls[i][0][1],
        path: d3.polygonHull(hulls[i]),
        pre_x: phulls[i][0][0],
        pre_y: phulls[i][0][1],
        pre_path: d3.polygonHull(phulls[i]),
      });
    } else {
      hullset.push({
        group: i,
        desc: desc[i],
        items: hulls[i].length,
        x: hulls[i][0][0],
        y: hulls[i][0][1],
        path: d3.polygonHull(hulls[i]),
      });
    }
  }

  return hullset;
}

function drawCluster(d) {
  if (isNaN(d.path[0][0])) return "";
  var curve = d3.line().curve(d3.curveCardinalClosed.tension(0.8));
  return curve(d.path);
}
function drawPreCluster(d) {
  if (isNaN(d.pre_path[0][0])) return "";
  var curve = d3.line().curve(d3.curveCardinalClosed.tension(0.8));
  return curve(d.pre_path);
}

function mouseOverBubbles(d) {
  d3.select(this).style("cursor", "pointer");
  if (d.group == -1) {
    $("text#"+d.id+".bubble-label")[0].style.visibility="visible";
  } else {
    console.log("mouseOverBubbles", d.id)
    dimAllBubbles(0.1);
    dimAllCvxHulls(0.01);
    var circles = $("circle.bubble.g"+d.group);
    for (var l in circles) {
      if (circles[l].style) circles[l].style.opacity = 1;
    }
    if ($("path#"+d.group+".hull")[0]) $("path#"+d.group+".hull")[0].style.opacity=0.2;
    if ($("text#"+d.id+".bubble-label")[0]) $("text#"+d.id+".bubble-label")[0].style.visibility="visible";
  }
}

function mouseOutBubbles(d) {
  d3.select(this).style("cursor", "");
  if (d.group == -1) {
    $("text#"+d.id+".bubble-label")[0].style.visibility="hidden";
  } else {
    dimAllBubbles(1);
    dimAllCvxHulls(0.2);
    var labels = $("text.bubble-label.g"+d.group);
    for (var l in labels) {
      if (labels[l].style) labels[l].style.visibility = "hidden"
    }
  }
}

function clickBubbles(d){
  d3.select(this).style("cursor", "pointer");
  if (d.group == -1) {
    $("text#"+d.id+".bubble-label")[0].style.visibility="visible";
  } else {
    dimAllBubbles(0.1);
    dimAllCvxHulls(0.01);
    var circles = $("circle.bubble.g"+d.group);
    for (var l in circles) {
      if (circles[l].style) circles[l].style.opacity = 1;
    }
    var labels = $("text.bubble-label.g"+d.group);
    for (var l in labels) {
      if (labels[l].style) labels[l].style.visibility = "visible";
    }
  }
}

function dimAllBubbles(dimlevel) {
  var bubbles = $("circle.bubble");
  for (var l in bubbles) {
    if (bubbles[l].style) bubbles[l].style.opacity = ""+dimlevel;
  }
}
function dimAllCvxHulls(dimlevel) {
  var cvxhulls = $("path.hull");
  for (var l in cvxhulls) {
    if (cvxhulls[l].style) cvxhulls[l].style.opacity = ""+dimlevel;
  }
}

function range(start, end) {
    var foo = [];
    for (var i = start; i < end; i++) {
        foo.push(i);
    }
    return foo;
}
