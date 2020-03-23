class PlayTime {

  constructor(div_id, w, h) {
    this.margin = {top: 0, right: 35, bottom: 0, left:100, top_g: 25};
    this.width = w - this.margin.left - this.margin.right;
    this.height = h - this.margin.top - this.margin.bottom;
    this.div_id_background = div_id + "-background";
    this.div_id = div_id;

    this.slice_h = 30;
    this.frames = [];
  }

  initChart(timeframes, minYear, maxYear, gname) {
    this.framepanel = document.getElementById(this.div_id);
    this.bgpanel = document.getElementById(this.div_id_background);
    this.svg = d3.select("#"+this.div_id_background)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom);

    this.chart_g = this.svg.append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    this.background = this.chart_g.append("rect")
      .attr("x", 0)
      .attr("y", this.margin.top_g)
      .attr("width", this.width)
      .attr("height", this.height-this.margin.top_g)
      .style("fill", "#d3d3d3");

    this.grid = this.chart_g.append("g");
    this.x_1 = this.grid.append("g");
    this.x_2 = this.grid.append("g");

    this.timeScale = d3.scaleLinear()
      .domain([0, timeframes.length])
      .range([ 0, this.width ]);

    var framelines = [], hh = this.caption_h+this.slice_h;
    for (var l = hh; l < this.width; l += hh) {
      framelines.push(l);
    }
    this.grid.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(framelines)
    .enter().append("line")
      .attr("x1", 0)
      .attr("y1", d => d+this.margin.top_g)
      .attr("x2", this.width)
      .attr("y2", d => d+this.margin.top_g)
      .attr("stroke", "black")
      .attr("stroke-width", 1);

  }

  updateXaxis(timeframes) {
    console.log("@@ playtime updateXaxis", timeframes.length)
    this.timeScale = d3.scaleLinear()
      .domain([0, timeframes.length])
      .range([ 0, timeframes.length*2 ]);

    this.x_1.selectAll("*").remove();
    this.x_2.selectAll("*").remove();

    this.x_1
      .attr("transform", "translate(0," + this.margin.top_g + ")")
      .attr('class', 'timeline-x-axis')
      .call(d3.axisTop(this.timeScale)
        .tickFormat(d3.format("d"))
      );
    this.x_2
      .attr("class", "grid")
      .call(d3.axisBottom(this.timeScale)
        .tickSize(this.height)
        .tickFormat("")
      );

    // move time slices according to the new x-axis
    for (var i = 0; i < this.frames.length; i++) {
      var f = this.frames[i];
      var y_start = f.getAttribute("data-s-year"),
          y_end = f.getAttribute("data-e-year");
      var s = this.timeScale(y_start),
          e = this.timeScale(y_end);
      var newleft = this.margin.left+s,
          newwidth = e-s;
      f.style.left = newleft;
      f.style.width = newwidth;
    }
  }

  addFrame(yrange, gindex, name, reason, pattern, delay) {
    var y_start = [yrange[0],gindex,0].join("_"),
        y_end = [yrange[yrange.length-1]-1,gindex,delay-1].join("_");
    var s = this.timeScale(playTime.indexOf(y_start)),
        e = this.timeScale(playTime.indexOf(y_end));
    // console.log("@@ playtime - addFrame", gindex, yrange, y_start, y_end, s, e);

    var tframe = document.createElement("div");
    tframe.className = "playtime-slice"
    tframe.id = [y_start, y_end, gindex].join("-");
    tframe.setAttribute("data-s-year", y_start);
    tframe.setAttribute("data-e-year", y_end);

    var top = this.margin.top_g+this.caption_h+(this.slice_h+this.caption_h)*(gindex),
        left = this.margin.left+s;
    tframe.style.top = top;
    tframe.style.left = left;
    tframe.style.width = e-s;
    tframe.style.height = this.slice_h;
    tframe.style.backgroundColor = gcolor(gindex);
    tframe.innerHTML = name + " " + pattern;


    tframe.addEventListener("mouseenter", showOptions);
    tframe.addEventListener("mouseleave", hideOptions);
    this.frames.push(tframe);
    this.framepanel.appendChild(tframe);
  }
}
