const zeroPad = (num, places) => String(num).padStart(places, '0');
var timeScale, timeScale_width, xAxis_1, xAxis_2, xAxis_3, xAxis_year, xAxis_year_h;
var timeSlices, timeLabels, timeCaptions, chartExpand;

class TimeLine {

  constructor(div_id, w) {
    this.margin = {top: 25, right: 45, bottom: 25, left:leftTimelineMargin};
    this.width = timeScale_width = w - this.margin.left - this.margin.right;
    this.div_id_frames = div_id + "-background";
    this.div_id = div_id;

    this.slice_h = 40;
    this.caption_h = 20;
    this.year_h = 20;

    timeSlices = [];
    timeLabels = [];
    timeCaptions = [];
    chartExpand = false;
    this.h_years = [];

    this.s_height = this.slice_h+this.caption_h+this.year_h+this.margin.top+this.margin.bottom;
    this.l_height = this.caption_h+this.slice_h*legendCount+this.year_h+this.margin.top+this.margin.bottom;
    this.height = this.s_height;
  }

  initChart(timeframesmap, forder, fmap, gname) {
    var timeframes = Object.keys(timeframesmap);
    console.log("Timeline -- initchart", timeframes, gname);
    this.legendpanel = document.getElementById(this.div_id + "-legend");
    this.controlpanel = document.getElementById(this.div_id + "-control");
    this.captionpanel = document.getElementById(this.div_id);
    this.svg = d3.select("#"+this.div_id_frames)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height);

    this.chart_g = this.svg.append('g')
      .attr("id", "chart_g")
      .attr('transform', 'translate(' + this.margin.left + ',0)')
      .call(zoom);

    this.background = this.chart_g.append("rect")
      .attr("x", 0)
      .attr("y", this.margin.top)
      .attr("width", this.width)
      .attr("height", this.height-this.margin.top-this.margin.bottom)
      .style("fill", "#d3d3d3");

    this.grid = this.chart_g.append("g");
    this.x_1 = this.grid.append("g");
    this.x_2 = this.grid.append("g");
    this.x_3 = this.grid.append("g");
    this.x_year = this.grid.append("g");
    this.x_year_h = this.grid.append("g");
    this.framegrid = this.grid.append("g").attr("class", "grid");
    this.framegrid
      .selectAll("line")
      .data([this.caption_h, this.caption_h+this.slice_h])
    .enter().append("line")
      .attr("x1", 0)
      .attr("y1", d => d+this.margin.top)
      .attr("x2", this.width)
      .attr("y2", d => d+this.margin.top)
      .attr("stroke", "black")
      .attr("stroke-width", 1);

    this.setControlPanel();
    this.updateXaxis(timeframes);
    for (var f in forder) {
      var outerbound = forder[f[0]].outerbound;
      console.log("outerbound", outerbound, outerbound.head, outerbound.tail);
      this.addOuterBound([outerbound.head, outerbound.tail], outerbound)
      var oframes = Object.keys(outerbound.reason);
      if (outerbound.start_time != "Init")
        oframes = [outerbound.prologue, ...Object.keys(outerbound.reason), outerbound.epilogue];
      for (var i in oframes) {
        var r = oframes[i];
        console.log("fmap", r, fmap[r]);
        this.addFrame([fmap[r].head, fmap[r].tail], [fmap[r].start_time, fmap[r].end_time], fmap[r].group, fmap[r].name, fmap[r].reason, fmap[r].pattern, fmap[r].runningtime)
        if (fmap[r].group == "p" || fmap[r].group == "e") continue;
        addEventinLinechart([fmap[r].start_time, fmap[r].end_time], fmap[r].group, fmap[r].axis, fmap[r].reason);
      }
      getCaption(outerbound);
    }
    this.drawYearTicks();
  }

  setControlPanel() {
    this.legendpanel.style.width = this.margin.left;
    this.legendpanel.style.height = this.height;
    this.controlpanel.style.marginLeft = this.width+this.margin.left;
    this.controlpanel.style.width = this.margin.right;
    this.controlpanel.style.height = this.height;

    var resetBtn = document.createElement("button");
    resetBtn.className = "control-bottom control-bottom-reset";
    resetBtn.innerText = "reset";
    resetBtn.addEventListener("click", function() {
      console.log("reset button clicked!");
      refresh();
    });

    var expandBtn = document.createElement("button");
    expandBtn.className = "control-bottom control-bottom-expand";
    expandBtn.innerHTML = "<i class='fa fa-chevron-down'></i>";
    expandBtn.addEventListener("click", function(e) {
      chartExpand = !chartExpand;
      var target = e.target;
      if (e.target.tagName == "I") target = e.target.parentNode;
      console.log("expand button clicked!", chartExpand, target);
      if (chartExpand) target.innerHTML = "<i class='fa fa-chevron-up'></i>";
      else target.innerHTML = "<i class='fa fa-chevron-down'></i>";
      expandChart(chartExpand);
    });

    this.controlpanel.appendChild(resetBtn);
    this.controlpanel.appendChild(expandBtn);
  }


  updateChart(timeframesmap, forder, fmap, gname) {
    var framelines = [];
    if (chartExpand) {
      this.height = this.l_height;
      for (var i = 0; i <= legendCount; i++) framelines.push(this.caption_h+i*this.slice_h);
      this.svg.attr('height', this.height);
      this.background.attr("height", this.height-this.margin.top-this.margin.bottom);
    } else {
      this.height = this.s_height;
      framelines = [this.caption_h, this.caption_h+this.slice_h];
      this.svg.attr('height', this.height);
      this.background.attr("height", this.height-this.margin.top-this.margin.bottom);
    }
    this.legendpanel.style.height = this.height;
    this.controlpanel.style.height = this.height;

    this.framegrid.selectAll("*").remove();
    this.framegrid
      .selectAll("line")
      .data(framelines)
    .enter().append("line")
      .attr("x1", 0)
      .attr("y1", d => d+this.margin.top)
      .attr("x2", this.width)
      .attr("y2", d => d+this.margin.top)
      .attr("stroke", "black")
      .attr("stroke-width", 1);

    var timeframes = Object.keys(timeframesmap);
    this.updateXaxis(timeframes);
    for (var f in forder) {
      var outerbound = forder[f[0]].outerbound;
      // console.log("outerbound", outerbound);
      this.addOuterBound([outerbound.head, outerbound.tail], outerbound)

      var oframes = Object.keys(outerbound.reason);
      if (outerbound.start_time != "Init")
        oframes = [outerbound.prologue, ...Object.keys(outerbound.reason), outerbound.epilogue];
      for (var i in oframes) {
        var r = oframes[i];
        // console.log("fmap", r, fmap[r]);
        this.addFrame([fmap[r].head, fmap[r].tail], [fmap[r].start_time, fmap[r].end_time], fmap[r].group, fmap[r].name, fmap[r].reason, fmap[r].pattern, fmap[r].runningtime)
      }
      getCaption(outerbound);
    }
    this.drawYearTicks();
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
    // console.log("updateXaxis", timeframes.length)
    this.calculateTickValues(timeframes);

    timeScale = d3.scaleBand()
      .domain(timeframes)
      .range([ 0, this.width ])
      .paddingInner(0)
      .paddingOuter(0);

    this.x_1.selectAll("*").remove();
    this.x_2.selectAll("*").remove();
    this.x_3.selectAll("*").remove();

    xAxis_1 = d3.axisBottom(timeScale)
      .tickSize(this.margin.top)
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

    this.x_1.attr('class', 'timeline-x-axis timeline-x-axis-min').call(xAxis_1);
    this.x_2.attr("class", "timeline-x-axis timeline-x-axis-20sec").call(xAxis_2);
    this.x_3.attr("class", "timeline-x-axis timeline-x-axis-grid").call(xAxis_3);
    this.x_2.selectAll('.timeline-x-axis-20sec text')
        .attr('transform', 'translate(21,-5)');

    this.clearAllFrames();
  }

  drawYearTicks() {
    var timeframes = Object.values(testtimeframes.getTimeFrames());
    this.tickEveryYear = [];
    this.tickHighlightYears = [];
    for (var b = 1; b < timeframes.length; b++) {
      if (timeframes[b-1] != timeframes[b]) this.tickEveryYear.push(b);
    }
    for (var b = 0; b < this.h_years.length; b++) {
      if (timeframes.indexOf(this.h_years[b]) == -1) continue;
      this.tickHighlightYears.push(timeframes.indexOf(this.h_years[b]));
    }

    this.x_year.selectAll("*").remove();
    xAxis_year = d3.axisTop(timeScale)
      .tickFormat("")
      .tickValues(this.tickEveryYear);
    this.x_year
      .attr("transform", "translate(0," + this.height + ")")
      .attr("class", "timeline-x-axis timeline-x-axis-year").call(xAxis_year);

    this.x_year_h.selectAll("*").remove();
    xAxis_year_h = d3.axisTop(timeScale)
      .tickSize(this.margin.bottom)
      .tickFormat(function(d) {
        var y = testtimeframes.getTimeFrames()[d];
        return y=="init"?"":y;
      })
      .tickValues(this.tickHighlightYears);

    this.x_year_h
      .attr("transform", "translate(0," + this.height + ")")
      .attr("class", "timeline-x-axis timeline-x-axis-year-h").call(xAxis_year_h);
    this.x_year_h.selectAll('.timeline-x-axis-year-h text')
      .attr('transform', 'translate(12,+15)');

    this.h_years = [];
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
    console.log("addFrame", gindex, f_start, f_end, y_start, y_end, s, e, delay);

    var top = this.margin.top+this.caption_h,
        left = s+timeScale.bandwidth()/2;

    var frame_id = [y_start, y_end, gindex].join("-");
    var gid = gindex;
    if (gindex == "p" || gindex == "e")
      gid = 0;

    var tframe = this.chart_g.append("rect")
      .attr("class", "time-slice")
      .attr("id", frame_id)
      .attr("x", left)
      .attr("y", chartExpand?top+this.slice_h*gid:top)
      .attr("edit", "off")
      .attr("width", e-s)
      .attr("height", this.slice_h)
      .attr("data-s-time", f_start)
      .attr("data-e-time", f_end)
      .style("fill", gcolor(gid));

    if (y_start != "init") {
      tframe.on("click", function() {
        var d = $("rect#"+frame_id+".time-slice");
        if (d.attr("edit") == "on") hideOptions(frame_id);
        else if (d.attr("edit") == "off") showOptions("chart_g", frame_id);
      });
    }
    timeSlices.push(tframe);

    var tframe_text = this.chart_g.append("text")
      .attr("class", "time-slice")
      .attr("id", frame_id)
      .attr("x", left+2)
      .attr("y", chartExpand?12+top+this.slice_h*gid:12+top)
      .attr("data-s-time", f_start)
      .attr("data-e-time", f_end)
      .text(name);
    timeLabels.push(tframe_text);
    if (y_start != "init") {
      tframe_text.on("click", function() {
        var d = $("rect#"+frame_id+".time-slice");
        if (d.attr("edit") == "on") hideOptions(frame_id);
        else if (d.attr("edit") == "off") showOptions("chart_g", frame_id);
      });
    }

    if (pattern != undefined) {
      // var tframe_text_2 = this.chart_g.append("text")
      //   .attr("class", "time-slice")
      //   .attr("id", frame_id)
      //   .attr("x", left+2)
      //   .attr("y", chartExpand?24+top+this.slice_h*gid:24+top)
      //   .attr("data-s-time", f_start)
      //   .attr("data-e-time", f_end)
      //   .style("cursor", "pointer")
      //   .text(pattern);
      // timeLabels.push(tframe_text_2);
      // tframe_text_2.on("click", function() {
      //   var d = $("rect#"+frame_id+".time-slice");
      //   if (d.attr("edit") == "on") hideOptions(frame_id);
      //   else if (d.attr("edit") == "off") showOptions("chart_g", frame_id);
      // });
      // console.log(pattern);
      var tframe_text_3 = this.chart_g.append("image")
        .attr("class", "time-slice")
        .attr("id", frame_id)
        .attr("href", "static/images/icon_"+pattern+".png")
        .attr("x", left+2)
        .attr("y", chartExpand?20+top+this.slice_h*gid:20+top)
        .attr("width", 12)
        .attr("height", 12)
        .attr("data-s-time", f_start)
        .attr("data-e-time", f_end)
        .style("cursor", "pointer")
        .text([y_start, y_end].join("-"));
      timeLabels.push(tframe_text_3);
      tframe_text_3.on("click", function() {
        var d = $("rect#"+frame_id+".time-slice");
        if (d.attr("edit") == "on") hideOptions(frame_id);
        else if (d.attr("edit") == "off") showOptions("chart_g", frame_id);
      });
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
      .attr("y", this.margin.top+this.caption_h)
      .attr("width", e-s)
      .attr("height", chartExpand?this.slice_h*legendCount+this.year_h:this.slice_h+this.year_h);

    var name = obound.start_time;
    if (obound.end_time != undefined) name += "-"+obound.end_time;
    var tframe_text = this.chart_g.append("text")
      .attr("class", "time-slice-outer")
      .attr("data-s-time", y_start)
      .attr("data-e-time", y_end)
      .attr("x", s+timeScale.bandwidth()/2)
      .attr("y", this.height-this.margin.bottom-3)
      .text(name);

    this.h_years.push(obound.start_time);
    // this.h_years.push(obound.end_time);

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
      hideOptions(d.attr("id"));
    })
    timeLabels.forEach(function(d) {
      d.attr("x", 2+timeScale(d.attr("data-s-time")))
    })
    timeCaptions.forEach(function(d) {
      var e = timeScale(d.getAttribute("data-e-time")),
          s = timeScale(d.getAttribute("data-s-time"));
      d.style.left = leftTimelineMargin+s;
      d.style.width = e-s;
      d.setAttribute("data-o-width", e-s);
    })
    svg.selectAll(".timeline-x-axis-min").call(xAxis_1);
    svg.selectAll(".timeline-x-axis-20sec").call(xAxis_2);
    svg.selectAll(".timeline-x-axis-grid").call(xAxis_3);
    svg.selectAll(".timeline-x-axis-year").call(xAxis_year);
    svg.selectAll(".timeline-x-axis-year-h").call(xAxis_year_h);
  }
}

function removeTimeSlice(id) {
  console.log("removebutton clicked", id)
  $("rect#"+id+".time-slice").remove();
  $("text#"+id+".time-slice").remove();
  $("textarea#"+id+".time-caption").remove();
  removeFrame(id);
}

function showOptions(chart_id, id) {
  var target = $("rect#"+id+".time-slice");
  target.attr("edit", "on");
  target[0].style.fillOpacity = 1;
  // console.log("showOption", id, target, target.attr("x"), target.attr("width"));

  var x = +target.attr("x"),
      y = +target.attr("y"),
      width = +target.attr("width");
  var removebtn = d3.select("g#"+chart_id).append("rect")
    .attr("class", "time-slice-remove")
    .attr("id", id)
    .attr("x", x+width)
    .attr("y", y)
    .on("click", function() { hideOptions(id);removeTimeSlice(id) });
  var removebtn_x = d3.select("g#"+chart_id).append("image")
    .attr("class", "time-slice-remove")
    .attr("id", id)
    .attr("href", "/static/images/icon_delete.png")
    .attr("x", x+width)
    .attr("y", y)
    .on("click", function() { hideOptions(id);removeTimeSlice(id) });
}

function hideOptions(id) {
  // console.log("hideOptions", "#"+id+".time-slice-remove");
  var target = $("rect#"+id+".time-slice");
  target.attr("edit", "off");
  if (target[0] == undefined) return;
  target[0].style.fillOpacity = 0.7;
  $("#"+id+".time-slice-remove").remove();
}
