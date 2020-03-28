const zeroPad = (num, places) => String(num).padStart(places, '0');
var timeScale, timeScale_width, xAxis_1, xAxis_2, xAxis_3;
var timeSlices, timeLabels, timeCaptions;

class TimeLine {

  constructor(div_id, w) {
    this.margin = {top: 0, right: 35, bottom: 0, left:leftTimelineMargin, top_g: 25};
    this.width = timeScale_width = w - this.margin.left - this.margin.right;
    this.div_id_frames = div_id + "-background";
    this.div_id = div_id;

    this.slice_h = 50;
    this.caption_h = 20;
    this.year_h = 20;
    this.height = this.slice_h+this.caption_h+this.year_h+this.margin.top_g-this.margin.top-this.margin.bottom;

    timeSlices = [];
    timeLabels = [];
    timeCaptions = [];
  }

  initChart(timeframesmap, forder, fmap, gname) {
    var timeframes = Object.keys(timeframesmap);
    console.log("Timeline -- initchart", timeframes, gname);
    this.legendpanel = document.getElementById(this.div_id + "-legend");
    this.captionpanel = document.getElementById(this.div_id);
    this.svg = d3.select("#"+this.div_id_frames)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom);

    this.chart_g = this.svg.append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
      .call(zoom);

    this.background = this.chart_g.append("rect")
      .attr("x", 0)
      .attr("y", this.margin.top_g)
      .attr("width", this.width)
      .attr("height", this.height-this.margin.top_g)
      .style("fill", "#d3d3d3");

    this.grid = this.chart_g.append("g");
    this.x_1 = this.grid.append("g");
    this.x_2 = this.grid.append("g");
    this.x_3 = this.grid.append("g");

    this.legendpanel.style.width = leftTimelineMargin;
    this.legendpanel.style.height = this.height;

    var framelines = [];
    framelines.push(this.caption_h, this.caption_h+this.slice_h);

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

    this.updateXaxis(timeframes);
    for (var f in forder) {
      var outerbound = forder[f[0]].outerbound;
      console.log("outerbound", outerbound);
      this.addOuterBound([outerbound.head, outerbound.tail], outerbound)
      for (var r in outerbound.reason) {
        console.log("fmap", r, fmap[r]);
        this.addFrame([fmap[r].head, fmap[r].tail], [fmap[r].start_time, fmap[r].end_time], fmap[r].group, fmap[r].name, fmap[r].reason, fmap[r].pattern, fmap[r].runningtime)
        addEventinLinechart([fmap[r].start_time, fmap[r].end_time], fmap[r].group, fmap[r].axis, fmap[r].reason);
      }
      getCaption(outerbound);
    }
  }

  updateChart(timeframesmap, forder, fmap, gname) {
    var timeframes = Object.keys(timeframesmap);
    this.updateXaxis(timeframes);
    for (var f in forder) {
      var outerbound = forder[f[0]].outerbound;
      console.log("outerbound", outerbound);
      this.addOuterBound([outerbound.head, outerbound.tail], outerbound)
      for (var r in outerbound.reason) {
        console.log("fmap", r, fmap[r]);
        this.addFrame([fmap[r].head, fmap[r].tail], [fmap[r].start_time, fmap[r].end_time], fmap[r].group, fmap[r].name, fmap[r].reason, fmap[r].pattern, fmap[r].runningtime)
      }
      getCaption(outerbound);
    }
  }

  calculateTickValues(timeframes) {
    this.tickEveryMinute = [];
    this.tickEvery20Secs = [];
    this.tickEverySecond = [];
    for (var y = 0; y < timeframes.length; y++) {
      if ((y * timeunit)%(60*1000) == 0) this.tickEveryMinute.push(timeframes[y]);
      if ((y * timeunit)%(20*1000) == 0) this.tickEvery20Secs.push(timeframes[y]);
      if ((y * timeunit)%(1000) == 0) this.tickEverySecond.push(timeframes[y]);
    }
  }

  updateXaxis(timeframes) {
    console.log("updateXaxis", timeframes.length)
    this.calculateTickValues(timeframes);

    timeScale = d3.scaleBand()
      .domain(timeframes)
      .range([ 0, this.width ])
      .paddingInner(0)
      .paddingOuter(0);

    this.x_1.selectAll("*").remove();
    this.x_2.selectAll("*").remove();
    this.x_3.selectAll("*").remove();

    xAxis_1 = d3.axisTop(timeScale)
      .tickSize(this.height)
      .tickValues(this.tickEveryMinute)
      .tickFormat("");
    xAxis_2 = d3.axisBottom(timeScale)
      .tickSize(15)
      .tickFormat(function(d) {
        var totalsec = d*timeunit/1000;
        var min = parseInt(totalsec/60), sec = totalsec%60;
        return zeroPad(min, 2)+":"+zeroPad(sec, 2)+":00";
      })
      .tickValues(this.tickEvery20Secs);
    xAxis_3 = d3.axisBottom(timeScale)
      .tickFormat("")
      .tickValues(this.tickEverySecond);

    this.x_1
      .attr("transform", "translate(0," + this.height + ")")
      .attr('class', 'timeline-x-axis timeline-x-axis-min')
      .call(xAxis_1);
    this.x_2
      .attr("class", "timeline-x-axis timeline-x-axis-20sec")
      .call(xAxis_2);
    this.x_3
      .attr("class", "timeline-x-axis timeline-x-axis-grid")
      .call(xAxis_3);
    this.x_2.selectAll('.timeline-x-axis-20sec text')
        .attr('transform', 'translate(21,-5)');

    this.clearAllFrames();
  }

  clearAllFrames() {
    for (var i = 0; i < timeSlices.length; i++) {
        var f = timeSlices[i];
        f.remove();
    }
    for (var i = 0; i < timeCaptions.length; i++) {
        var f = timeCaptions[i];
        f.remove();
    }
    for (var i = 0; i < timeLabels.length; i++) {
        var f = timeLabels[i];
        f.remove();
    }
    timeLabels = [];
    timeSlices = [];
    timeCaptions = [];
  }

  addFrame(frange, yrange, gindex, name, reason, pattern, delay) {
    var f_start = frange[0],
        f_end = frange[frange.length-1];
    var y_start = yrange[0],
        y_end = yrange[yrange.length-1];
    var s = timeScale(f_start),
        e = timeScale(f_end);
    // console.log("addFrame", gindex, f_start, f_end, y_start, y_end, s, e, delay);

    var top = this.margin.top_g+this.caption_h,
        left = s+timeScale.bandwidth()/2;

    var tframe = this.chart_g.append("rect")
      .attr("class", "time-slice")
      .attr("id", [y_start, y_end, gindex].join("-"))
      .attr("x", left)
      .attr("y", top)
      .attr("width", e-s)
      .attr("height", this.slice_h)
      .attr("data-s-time", f_start)
      .attr("data-e-time", f_end)
      .style("fill", gcolor(gindex));

    if (y_start != "init") {
      tframe.on("mouseenter", showOptions);
      tframe.on("mouseleave", hideOptions);
    }
    timeSlices.push(tframe);

    var tframe_text = this.chart_g.append("text")
      .attr("class", "time-slice")
      .attr("id", [y_start, y_end, gindex].join("-"))
      .attr("x", left+2)
      .attr("y", top+15)
      .attr("data-s-time", f_start)
      .attr("data-e-time", f_end)
      .text(name);
    timeLabels.push(tframe_text);

    if (pattern != undefined) {
      var tframe_text_2 = this.chart_g.append("text")
        .attr("class", "time-slice")
        .attr("id", [y_start, y_end, gindex].join("-"))
        .attr("x", left+2)
        .attr("y", top+15+12)
        .attr("data-s-time", f_start)
        .attr("data-e-time", f_end)
        .text(pattern);
      timeLabels.push(tframe_text_2);
    }
  }

  clearOuterBound() {
    $("div.time-slice-outer").remove();
  }

  addOuterBound(yrange, obound) {
    var y_start = yrange[0],
        y_end = yrange[yrange.length-1];
    var s = timeScale(y_start),
        e = timeScale(y_end);

    console.log("addOuterBound", y_start, y_end, s, e)
    var tframe = this.chart_g.append("rect")
      .attr("class", "time-slice-outer")
      .attr("data-s-time", y_start)
      .attr("data-e-time", y_end)
      .attr("x", s+timeScale.bandwidth()/2)
      .attr("y", this.margin.top_g+this.caption_h)
      .attr("width", e-s)
      .attr("height", this.slice_h+this.year_h);

    var name = obound.start_time;
    if (obound.end_time != undefined) name += "-"+obound.end_time;
    var tframe_text = this.chart_g.append("text")
      .attr("class", "time-slice-outer")
      .attr("data-s-time", y_start)
      .attr("data-e-time", y_end)
      .attr("x", s+timeScale.bandwidth()/2)
      .attr("y", this.height-3)
      .text(name);

    timeSlices.push(tframe);
    timeLabels.push(tframe_text);
  }

  addCaption(gid, caption) {
    // console.log("addCaption", gid, caption)
    var corrFrame = $("rect#"+gid+".time-slice")[0];
    var f_start = corrFrame.getAttribute("data-s-time"),
        f_end = corrFrame.getAttribute("data-e-time");
    var s = timeScale(f_start),
        e = timeScale(f_end);
    var tframe = document.createElement("textarea");
    tframe.className = "time-caption"
    tframe.id = gid;
    tframe.style.top = 0;
    tframe.style.left = this.margin.left+s;
    tframe.style.width = e-s;
    tframe.style.height = this.caption_h;
    tframe.value = caption;

    tframe.setAttribute("data-s-time", f_start);
    tframe.setAttribute("data-e-time", f_end);
    tframe.setAttribute("data-o-width", e-s);
    tframe.setAttribute("data-o-height", this.caption_h);
    tframe.addEventListener("mouseover", function(e) {
      e.target.style.overflowX = "visible";
      e.target.style.whiteSpace = "normal";
      e.target.style.width = Math.max(150, e.target.getAttribute("data-o-width"));
      e.target.style.height = "auto";
      e.target.style.zIndex = 10;
      e.target.style.backgroundColor = "#007bff";
    });
    tframe.addEventListener("mouseout", function(e) {
      e.target.style.overflowX = "hidden";
      e.target.style.whiteSpace = "nowrap";
      e.target.style.width = e.target.getAttribute("data-o-width");
      e.target.style.height = e.target.getAttribute("data-o-height");
      e.target.style.zIndex = 8;
      e.target.style.backgroundColor = "#002654";
    });
    tframe.addEventListener("change", function(e) {
      // console.log("caption changed", e.target, e.target.value);
      updateCaption(e.target.id, e.target.value);
    })

    timeCaptions.push(tframe);
    this.captionpanel.appendChild(tframe);
  }
}

function zoom(svg) {
  const extent = [[0,0], [timeScale_width, 0]];
  svg.call(d3.zoom()
      .scaleExtent([1, 8])
      .translateExtent(extent)
      .extent(extent)
      .on("zoom", zoomed));

  function zoomed() {
    timeScale.range([0, timeScale_width].map(d => d3.event.transform.applyX(d)));
    timeSlices.forEach(function(d) {
      d.attr("x", timeScale(d.attr("data-s-time")))
      d.attr("width", timeScale(d.attr("data-e-time"))-timeScale(d.attr("data-s-time")))
    })
    timeLabels.forEach(function(d) {
      d.attr("x", 2+timeScale(d.attr("data-s-time")))
    })
    timeCaptions.forEach(function(d) {
      d.style.left = leftTimelineMargin+timeScale(d.getAttribute("data-s-time"));
      d.style.width = timeScale(d.getAttribute("data-e-time"))-timeScale(d.getAttribute("data-s-time"));
    })
    svg.selectAll(".timeline-x-axis-min").call(xAxis_1);
    svg.selectAll(".timeline-x-axis-20sec").call(xAxis_2);
    svg.selectAll(".timeline-x-axis-grid").call(xAxis_3);
  }
}

function removeTimeSlice(e) {
  var id = e.target.parentElement.id;
  // console.log("removebutton clicked", id)
  $("div#"+id+".time-slice").remove();
  $("textarea#"+id+".time-caption").remove();
  removeFrame(id);
}

function showOptions(e) {
  var target;
  if (e.target.className == "time-slice") target = e.target;
  else if (e.target.className == "time-slice-order") target = e.target.parentNode;
  else return;
  // console.log("showOption", target, target.style.width);

  target.style.opacity = 1;
  var removebtn = document.createElement("div");
  removebtn.className = "time-slice-remove"
  removebtn.id = target.id;
  removebtn.style.left = parseFloat(target.style.width.replace('px',''))-2;
  removebtn.innerHTML = "<i class='fa fa-times'></i>"
  removebtn.addEventListener("click", removeTimeSlice);
  target.appendChild(removebtn);
}

function hideOptions(e) {
  e.target.style.opacity = 0.6;
  // console.log("div#"+e.target.id+".time-slice-remove");
  $("div#"+e.target.id+".time-slice-remove").remove();
}
