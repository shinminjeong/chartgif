

class TimeLine {

  constructor(div_id, w, h) {
    this.margin = {top: 0, right: 35, bottom: 0, left:100, top_g: 20};
    this.width = w - this.margin.left - this.margin.right;
    this.height = h - this.margin.top - this.margin.bottom;
    this.div_id_background = div_id + "-background";
    this.div_id = div_id;
  }

  initChart(year_domain) {
    this.framepanel = document.getElementById(this.div_id);
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

    this.addFrame(year_domain, -1)
  }

  addFrame(yrange, gindex) {
    var y_start = yrange[0],
        y_end = yrange[yrange.length-1];
    var s = this.timeScale(y_start),
        e = this.timeScale(y_end);
    var slice_h = 30;
    // console.log(gindex, y_start, y_end, s, e);

    var tframe = document.createElement("div");
    tframe.className = "time-slice"
    if (gindex >= 0) {
      tframe.style = "border: 0.5px solid #333; background-color:"+gcolor(gindex);
    }
    tframe.style.top = this.margin.top_g+slice_h*(1+gindex);
    tframe.style.left = this.margin.left+s;
    tframe.style.width = e-s;
    tframe.style.height = slice_h;
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
    var slice_h = this.height-this.margin.top_g;
    var tframe = document.createElement("div");
    tframe.className = "time-slice-outer"
    tframe.style.top = this.margin.top_g;
    tframe.style.left = this.margin.left+s;
    tframe.style.width = e-s;
    tframe.style.height = slice_h;
    this.framepanel.appendChild(tframe);
  }
}
