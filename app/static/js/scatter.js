var xScale, yScale, radius;
var margin = {top: 10, right: 10, bottom: 40, left:40};
var width, height, continentMap;
var continent = ["Asia", "Europe", "North America", "South America", "Africa", "Oceania", "Antarctica"];
var color = ["#F08391", "#FCEC71", "#AEED6C", "#AEED6C", "#80DBEB", "#F08391", "#000"];
var bubble_g, hull;
var hullOffset = 10;

class ScatterPlot {

  constructor(div_id) {
    width = document.getElementById(div_id).offsetWidth - margin.left - margin.right;
    height = 760 - margin.top - margin.bottom;
    this.div_id = div_id;

    xScale = d3.scaleLog().range([0, width]).domain([250, 256000]);
    yScale = d3.scaleLinear().range([height, 0]).domain([15, 95]);
    radius = d3.scaleSqrt().range([2,15]).domain([10, 10000]);
  }

  initChart(data2d, population, continent, group) {
    var year = "1800";
    if (group.length == 0)
      group = undefined;

    this.svg = d3.select("#"+this.div_id)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
    .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    this.countries = data2d.country;
    continentMap = continent.continent;
    // console.log(data2d[year+"_x"], data2d[year+"_y"])
    // console.log(population[year]);

    var years = range(1800, 2019);
    this.data = {}
    for (var i in years) {
      var year = years[i];
      this.data[year] = [];
      for (var index in this.countries) {
        // console.log(index, this.countries[index], continentMap[index])
        this.data[year].push({
          "id": index,
          "name": this.countries[index],
          "x": data2d[year+"_x"][index],
          "y": data2d[year+"_y"][index],
          "population": population[year][index]/40000,
          "group": (group? group[this.countries[index]]["group"] : -1)
        })
      }
    }
    // console.log(this.data)

    // adding axes is also simpler now, just translate x-axis to (0,height) and it's alread defined to be a bottom axis.
    this.svg.append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .attr('class', 'x axis')
      .call(d3.axisBottom(xScale)
        .tickFormat(d3.format(".2s"))
        .tickValues([500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 128000])
      );

    this.svg.append('g')
      .attr("class", "grid")
      .call(d3.axisBottom(xScale)
        .tickSize(height)
        .tickFormat("")
        .tickValues([500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 128000])
      );

    // y-axis is translated to (0,0)
    this.svg.append('g')
      .attr('transform', 'translate(0,0)')
      .attr('class', 'y axis')
      .call(d3.axisLeft(yScale));

    this.svg.append('g')
      .attr("class", "grid")
      .call(d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat("")
        .ticks(10)
      );

    this.hull_g = this.svg.append('g');

    // adding label. For x-axis, it's at (10, 10), and for y-axis at (width, height-10).
    this.svg.append('text')
      .attr('x', 10)
      .attr('y', 10)
      .attr('class', 'label')
      .text('Life Expectancy');

    this.svg.append('text')
      .attr('x', width)
      .attr('y', height - 10)
      .attr('text-anchor', 'end')
      .attr('class', 'label')
      .text('Income');

    var legend = this.svg.selectAll('legend')
      .data(continent)
      .enter().append('g')
      .attr('class', 'legend')
      .attr('transform', function(d,i){ return 'translate(0,' + i * 20 + ')'; });

    legend.append('rect')
      .attr('x', width)
      .attr('width', 18)
      .attr('height', 18)
      .style('fill', color);

    legend.append('text')
      .attr('x', width - 6)
      .attr('y', 9)
      .attr('dy', '.35em')
      .style('text-anchor', 'end')
      .text(function(d){ return d; });

    bubble_g = this.svg.append('g');

  }

  updateChart(year, flagConvexHulls) {
    bubble_g.selectAll("*").remove();

    // console.log("updateChart", year, flagConvexHulls);
    var data = this.data[year];
    var bubble = bubble_g.selectAll('.bubble')
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
          if (d.group == -1) return color[continent.indexOf(continentMap[d.id])];
          else return gcolor(d.group);
        })
        .on("mouseover", mouseOverBubbles)
        .on("click", clickBubbles)
        .on("mouseout", mouseOutBubbles)
      // .transition()
      //   .duration(1000)
      //   .attr("cx", function(d){return xScale(d.x);})
      //   .attr("cy", function(d){ return yScale(d.y); })
      //   .attr('r', function(d){ return radius(d.population); })

    bubble_g.selectAll('.bubble-label')
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
      hull = this.hull_g.selectAll("path.hull")
          .data(convexHulls(data, getGroup, hullOffset))
        .enter().append("path")
          .attr("class", "hull")
          .attr("id", function(d) { return d.group; })
          .attr("d", drawCluster)
          .style("opacity", 0.2)
          .style("fill", function(d) { return gcolor(d.group); });
    }
  }
}

function getGroup(n) { return n.group; }

function convexHulls(nodes, index, offset) {
  // console.log("convexHulls")
  var hulls = {};

  // create point sets
  for (var k=0; k<nodes.length; ++k) {
    var n = nodes[k];
    if (n.size) continue;
    var i = getGroup(n),
        l = hulls[i] || (hulls[i] = []);
    var rOffset = radius(n.population)*1.3+1;
    l.push([xScale(n.x)-rOffset-offset, yScale(n.y)-rOffset-offset]);
    l.push([xScale(n.x)-rOffset-offset, yScale(n.y)+rOffset+offset]);
    l.push([xScale(n.x)+rOffset+offset, yScale(n.y)-rOffset-offset]);
    l.push([xScale(n.x)+rOffset+offset, yScale(n.y)+rOffset+offset]);
  }
  // console.log(hulls)
  // create convex hulls
  var hullset = [];
  for (i in hulls) {
    hullset.push({group: i, path: d3.polygonHull(hulls[i])});
  }

  return hullset;
}

function drawCluster(d) {
  if (isNaN(d.path[0][0])) return "";
  var curve = d3.line().curve(d3.curveCardinalClosed.tension(0.8));
  return curve(d.path);
}

function mouseOverBubbles(d) {
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
    if ($("path#"+d.group+".hull")[0].style) $("path#"+d.group+".hull")[0].style.opacity=0.2;
    if ($("text#"+d.id+".bubble-label")[0].style) $("text#"+d.id+".bubble-label")[0].style.visibility="visible";
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
