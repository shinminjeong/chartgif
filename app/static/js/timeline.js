class TimeLine {

  constructor(div_id, w, h) {
    this.margin = {top: 0, right: 35, bottom: 0, left:100, top_g: 25};
    this.width = w - this.margin.left - this.margin.right;
    this.height = h - this.margin.top - this.margin.bottom;
    this.div_id_background = div_id + "-background";
    this.div_id = div_id;

    this.slice_h = 30;
    this.caption_h = 20;
  }

  initChart(year_domain) {
    this.framepanel = document.getElementById(this.div_id);
    this.bgpanel = document.getElementById(this.div_id_background);
    this.svg = d3.select("#"+this.div_id_background)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
    .append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    this.background = this.svg.append("rect")
      .attr("x", 0)
      .attr("y", this.margin.top_g)
      .attr("width", this.width)
      .attr("height", this.height-this.margin.top_g)
      .style("fill", "#d3d3d3");

    this.grid = this.svg.append("g");

    this.timeScale = d3.scaleLinear()
      .domain(year_domain)
      .range([ 0, this.width ]);

    var numYears = year_domain[1]-year_domain[0]+1;
    this.grid.append("g")
      .attr("transform", "translate(0," + this.margin.top_g + ")")
      .attr('class', 'x axis')
      .call(d3.axisTop(this.timeScale)
        .tickFormat(d3.format("d"))
      );
    this.grid.append('g')
      .attr("class", "grid")
      .call(d3.axisBottom(this.timeScale)
        .tickSize(this.height)
        .tickFormat("")
      );
    this.grid.append('g')
      .attr("class", "grid")
      .call(d3.axisBottom(this.timeScale)
        .tickSize(this.margin.top_g)
        .ticks(numYears)
        .tickFormat("")
      );

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

    this.addFrame(year_domain, -1)
  }

  addFrame(yrange, gindex, name, reason) {
    var y_start = yrange[0],
        y_end = yrange[yrange.length-1];
    var s = this.timeScale(y_start),
        e = this.timeScale(y_end);
    // console.log(gindex, y_start, y_end, s, e);

    var tframe = document.createElement("div");
    tframe.className = "time-slice"
    if (gindex >= 0) {
      tframe.style = "border: 0.5px solid #333; background-color:"+gcolor(gindex);
    }
    tframe.style.top = this.margin.top_g+(this.slice_h+this.caption_h)*(1+gindex);
    tframe.style.left = this.margin.left+s;
    tframe.style.width = e-s;
    tframe.style.height = this.slice_h;
    tframe.innerHTML = name;
    this.framepanel.appendChild(tframe);
  }

  clearOuterBound() {
    $("div.time-slice-outer").remove();
  }

  addOuterBound(yrange) {
    var y_start = yrange[0],
        y_end = yrange[yrange.length-1];
    var s = this.timeScale(y_start),
        e = this.timeScale(y_end);
    var tframe = document.createElement("div");
    tframe.className = "time-slice-outer"
    tframe.style.top = this.margin.top_g;
    tframe.style.left = this.margin.left+s;
    tframe.style.width = e-s;
    tframe.style.height = this.height-this.margin.top_g;
    this.bgpanel.appendChild(tframe);
  }

  addCaption(yrange, gindex, caption) {
    // console.log("addCaption", yrange, gindex, this.margin.top_g, this.slice_h+this.caption_h)
    var y_start = yrange[0],
        y_end = yrange[yrange.length-1];
    var s = this.timeScale(y_start),
        e = this.timeScale(y_end);
    var tframe = document.createElement("div");
    tframe.className = "time-caption"
    tframe.style.top = this.margin.top_g+(this.slice_h+this.caption_h)*(+gindex+1)-this.caption_h;
    tframe.style.left = this.margin.left+s;
    tframe.style.width = e-s;
    tframe.style.height = this.caption_h;
    tframe.innerHTML = caption;

    tframe.setAttribute("data-o-width", e-s);
    tframe.setAttribute("data-o-height", this.caption_h);
    tframe.addEventListener("mouseover", function(e) {
      e.target.style.overflowX = "visible";
      e.target.style.width = 120;
      e.target.style.height = "auto";
      e.target.style.zIndex = 10;
      e.target.style.backgroundColor = "#007bff";
    });
    tframe.addEventListener("mouseout", function(e) {
      e.target.style.overflowX = "hidden";
      e.target.style.width = e.target.getAttribute("data-o-width");
      e.target.style.height = e.target.getAttribute("data-o-height");
      e.target.style.zIndex = 8;
      e.target.style.backgroundColor = "#002654";
    });
    this.framepanel.appendChild(tframe);
  }
}
