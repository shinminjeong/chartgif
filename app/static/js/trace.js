var t_xScale, t_yScale;
var trace_width, trace_height;
var tracehull = {};

class TraceChart {

  constructor(div_form, g_id) {
    this.div_id = div_form + g_id;
    this.g_id = g_id;
    trace_width = document.getElementById(this.div_id).offsetWidth;
    trace_height = trace_width*0.8;

    t_xScale = d3.scaleLog().range([0, trace_width]).domain([250, 256000]);
    t_yScale = d3.scaleLinear().range([trace_height, 0]).domain([15, 95]);
  }

  draw(data2d, population, continent, group) {
    var year = "1800";
    if (group.length == 0)
      group = undefined;

    this.svg = d3.select("#"+this.div_id)
      .append('svg')
      .attr('width', trace_width)
      .attr('height', trace_height)
    .append('g')
      .attr('transform', 'translate(0,0)');

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
        if (group)
        if (group[this.countries[index]]["group"] == this.g_id) {
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
    }

    this.trace_g = this.svg.append('g');
    var allyears = [];
    for (var i in years) {
      var data = this.data[years[i]];
      allyears = allyears.concat(traceHulls(data, getGroup, 2))
    }

    tracehull[this.g_id] = this.trace_g.selectAll("path.trace")
        .data(allyears)
      .enter().append("path")
        .attr("class", "trace")
        .attr("d", drawCluster)
        .style("opacity", 0.01)
        .style("fill", function(d) { return gcolor(d.group); });
  }
}

function traceHulls(nodes, index, offset) {
  // console.log("convexHulls")
  var hulls = {};

  // create point sets
  for (var k=0; k<nodes.length; ++k) {
    var n = nodes[k];
    if (n.size) continue;
    var i = getGroup(n),
        l = hulls[i] || (hulls[i] = []);
    var rOffset = 0;
    l.push([t_xScale(n.x)-rOffset-offset, t_yScale(n.y)-rOffset-offset]);
    l.push([t_xScale(n.x)-rOffset-offset, t_yScale(n.y)+rOffset+offset]);
    l.push([t_xScale(n.x)+rOffset+offset, t_yScale(n.y)-rOffset-offset]);
    l.push([t_xScale(n.x)+rOffset+offset, t_yScale(n.y)+rOffset+offset]);
  }
  // console.log(hulls)
  // create convex hulls
  var hullset = [];
  for (i in hulls) {
    hullset.push({group: i, path: d3.polygonHull(hulls[i])});
  }

  return hullset;
}
