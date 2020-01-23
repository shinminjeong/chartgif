var xScale, yScale, radius;
var margin = {top: 30, right: 50, bottom: 40, left:40};
var width, height, continentMap;
var continent = ["Asia", "Europe", "North America", "South America", "Africa", "Oceania", "Antarctica"];
var color = ["#F08391", "#FCEC71", "#AEED6C", "#AEED6C", "#80DBEB", "#F08391", "#000"];
var bubble_g;

class ScatterPlot {

  constructor(div_id) {
    width = document.getElementById(div_id).offsetWidth - margin.left - margin.right;
    height = 800 - margin.top - margin.bottom;
    this.div_id = div_id;

    xScale = d3.scaleLog().range([0, width]).domain([250, 256000]);
    yScale = d3.scaleLinear().range([height, 0]).domain([15, 95]);
    radius = d3.scaleSqrt().range([2,15]).domain([10, 10000]);
  }

  initChart(data2d, population, continent, group) {
    var year = "1800";

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
          "population": population[year][index]/50000,
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

  updateChart(year) {
    bubble_g.selectAll("*").remove();

    // console.log("updateChart", year);
    var data = this.data[year];
    var bubble = bubble_g.selectAll('.bubble')
        .data(data)
      .enter().append('circle')
        .attr('id', function(d){return d.id;})
        .attr('class', 'bubble')
        .attr('cx', function(d){return xScale(d.x);})
        .attr('cy', function(d){ return yScale(d.y); })
        .attr('r', function(d){ return radius(d.population)*1.3+1; })
        .style('stroke', 'black')
        .style('stroke-width', 0.5)
        .style('fill', function(d){
          if (d.group == -1) return color[continent.indexOf(continentMap[d.id])];
          else return gcolor(d.group);
        })
        .on("mouseover", function(d) {
          console.log("mouseover", d, d.group)
          if (d.group == -1) {
            $("text#"+d.id+".bubble-label")[0].style="visibility: visible";
          } else {
            var labels = $("text.bubble-label.g"+d.group);
            for (var l in labels) {
              labels[l].style ="visibility: visible"
            }
          }
        })
        .on("mouseout", function(d) {
          if (d.group == -1) {
            $("text#"+d.id+".bubble-label")[0].style="visibility: hidden";
          } else {
            var labels = $("text.bubble-label.g"+d.group);
            for (var l in labels) {
              labels[l].style ="visibility: hidden"
            }
          }
        })
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
        .attr('x', function(d){return xScale(d.x);})
        .attr('y', function(d){ return yScale(d.y); })
        .text(function(d){ return d.name; })
        .style('visibility', 'hidden');
  }
}

function range(start, end) {
    var foo = [];
    for (var i = start; i < end; i++) {
        foo.push(i);
    }
    return foo;
}
